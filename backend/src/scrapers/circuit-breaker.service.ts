import { Injectable, Logger } from '@nestjs/common';

/**
 * Circuit Breaker State
 */
export enum CircuitState {
  CLOSED = 'CLOSED', // Normal operation
  OPEN = 'OPEN', // Failing, rejecting requests
  HALF_OPEN = 'HALF_OPEN', // Testing if service recovered
}

interface CircuitInfo {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailure: number;
  lastAttempt: number;
}

/**
 * Circuit Breaker Service - FASE 117
 *
 * Implements the circuit breaker pattern to prevent cascading failures
 * when external scrapers fail repeatedly.
 *
 * States:
 * - CLOSED: Normal operation, all requests pass through
 * - OPEN: Service failing, requests rejected immediately
 * - HALF_OPEN: Testing recovery, limited requests allowed
 *
 * Configuration:
 * - failureThreshold: Number of failures before opening circuit (default: 3)
 * - successThreshold: Successes needed in HALF_OPEN to close (default: 2)
 * - timeout: Time in ms before OPEN → HALF_OPEN (default: 30000ms)
 */
@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);

  // Map: scraper/domain → circuit info
  private circuits: Map<string, CircuitInfo> = new Map();

  // Configuration
  private readonly FAILURE_THRESHOLD = 3; // Open after 3 consecutive failures
  private readonly SUCCESS_THRESHOLD = 2; // Close after 2 consecutive successes in half-open
  private readonly TIMEOUT_MS = 30000; // 30 seconds before trying again

  /**
   * Check if request can proceed through circuit
   *
   * @param key - Identifier for the circuit (scraper name or domain)
   * @returns true if request can proceed, false if circuit is open
   */
  canProceed(key: string): boolean {
    const circuit = this.getOrCreateCircuit(key);

    switch (circuit.state) {
      case CircuitState.CLOSED:
        return true;

      case CircuitState.OPEN:
        // Check if timeout has passed
        const elapsed = Date.now() - circuit.lastFailure;
        if (elapsed >= this.TIMEOUT_MS) {
          this.transitionTo(key, CircuitState.HALF_OPEN);
          this.logger.log(`[CIRCUIT] ${key}: OPEN → HALF_OPEN (timeout elapsed)`);
          return true;
        }
        this.logger.warn(`[CIRCUIT] ${key}: Request blocked (OPEN state, ${Math.round((this.TIMEOUT_MS - elapsed) / 1000)}s remaining)`);
        return false;

      case CircuitState.HALF_OPEN:
        // Allow limited requests to test recovery
        return true;

      default:
        return true;
    }
  }

  /**
   * Record a successful request
   *
   * @param key - Identifier for the circuit
   */
  recordSuccess(key: string): void {
    const circuit = this.getOrCreateCircuit(key);
    circuit.successes++;
    circuit.failures = 0; // Reset failure count on success
    circuit.lastAttempt = Date.now();

    if (circuit.state === CircuitState.HALF_OPEN) {
      if (circuit.successes >= this.SUCCESS_THRESHOLD) {
        this.transitionTo(key, CircuitState.CLOSED);
        this.logger.log(`[CIRCUIT] ${key}: HALF_OPEN → CLOSED (${circuit.successes} consecutive successes)`);
      }
    }
  }

  /**
   * Record a failed request
   *
   * @param key - Identifier for the circuit
   * @param error - Optional error message
   */
  recordFailure(key: string, error?: string): void {
    const circuit = this.getOrCreateCircuit(key);
    circuit.failures++;
    circuit.successes = 0; // Reset success count on failure
    circuit.lastFailure = Date.now();
    circuit.lastAttempt = Date.now();

    this.logger.warn(`[CIRCUIT] ${key}: Failure recorded (${circuit.failures}/${this.FAILURE_THRESHOLD}) ${error ? `- ${error}` : ''}`);

    if (circuit.state === CircuitState.CLOSED && circuit.failures >= this.FAILURE_THRESHOLD) {
      this.transitionTo(key, CircuitState.OPEN);
      this.logger.error(`[CIRCUIT] ${key}: CLOSED → OPEN (${circuit.failures} consecutive failures)`);
    }

    if (circuit.state === CircuitState.HALF_OPEN) {
      this.transitionTo(key, CircuitState.OPEN);
      this.logger.warn(`[CIRCUIT] ${key}: HALF_OPEN → OPEN (failure during recovery test)`);
    }
  }

  /**
   * Get circuit state for a key
   *
   * @param key - Identifier for the circuit
   * @returns Current circuit state
   */
  getState(key: string): CircuitState {
    return this.getOrCreateCircuit(key).state;
  }

  /**
   * Get all circuit states (for monitoring/debugging)
   */
  getAllStates(): { key: string; state: CircuitState; failures: number; lastFailure: number }[] {
    return Array.from(this.circuits.entries()).map(([key, info]) => ({
      key,
      state: info.state,
      failures: info.failures,
      lastFailure: info.lastFailure,
    }));
  }

  /**
   * Force reset a circuit (useful for manual recovery)
   *
   * @param key - Identifier for the circuit
   */
  reset(key: string): void {
    this.circuits.delete(key);
    this.logger.log(`[CIRCUIT] ${key}: Manually reset to CLOSED`);
  }

  /**
   * Reset all circuits
   */
  resetAll(): void {
    this.circuits.clear();
    this.logger.log(`[CIRCUIT] All circuits reset`);
  }

  /**
   * Execute a function with circuit breaker protection
   *
   * @param key - Identifier for the circuit
   * @param fn - Function to execute
   * @returns Result of function or throws CircuitOpenError
   */
  async execute<T>(key: string, fn: () => Promise<T>): Promise<T> {
    if (!this.canProceed(key)) {
      throw new CircuitOpenError(`Circuit breaker open for ${key}`);
    }

    try {
      const result = await fn();
      this.recordSuccess(key);
      return result;
    } catch (error) {
      this.recordFailure(key, error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  // Private helpers

  private getOrCreateCircuit(key: string): CircuitInfo {
    if (!this.circuits.has(key)) {
      this.circuits.set(key, {
        state: CircuitState.CLOSED,
        failures: 0,
        successes: 0,
        lastFailure: 0,
        lastAttempt: 0,
      });
    }
    return this.circuits.get(key)!;
  }

  private transitionTo(key: string, newState: CircuitState): void {
    const circuit = this.getOrCreateCircuit(key);
    circuit.state = newState;
    if (newState === CircuitState.CLOSED || newState === CircuitState.HALF_OPEN) {
      circuit.failures = 0;
      circuit.successes = 0;
    }
  }
}

/**
 * Error thrown when circuit breaker is open
 */
export class CircuitOpenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CircuitOpenError';
  }
}
