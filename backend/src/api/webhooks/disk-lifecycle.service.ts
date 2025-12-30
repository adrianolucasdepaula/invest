import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs/promises';

const execAsync = promisify(exec);

/**
 * FASE 146: Disk Lifecycle Management - Service Layer
 *
 * Orquestra a execução de scripts PowerShell de limpeza de disco baseado em
 * alertas do Prometheus. Mantém logs estruturados e histórico de execuções.
 */

interface CleanupContext {
  alertName: string;
  severity: string;
  summary: string;
  description: string;
  startsAt: string;
  fingerprint: string;
}

interface CleanupResult {
  tier: string;
  success: boolean;
  spaceFreed?: string;
  duration: number;
  error?: string;
  logPath?: string;
}

@Injectable()
export class DiskLifecycleService {
  private readonly logger = new Logger(DiskLifecycleService.name);

  // Path to PowerShell scripts (absolute path for Docker environment)
  private readonly scriptsBasePath = path.resolve(
    __dirname,
    '../../../..',
    'backend/src/scripts',
  );

  // Track last execution to prevent duplicate runs
  private lastExecutions = new Map<string, number>();

  // Minimum time between executions of same tier (5 minutes)
  private readonly COOLDOWN_MS = 5 * 60 * 1000;

  /**
   * Execute cleanup script based on tier
   *
   * @param tier - Cleanup tier (tier1, tier2, tier3)
   * @param context - Alert context information
   * @returns Cleanup result
   */
  async executeCleanup(
    tier: string,
    context: CleanupContext,
  ): Promise<CleanupResult> {
    const startTime = Date.now();

    try {
      // Validate tier
      if (!['tier1', 'tier2', 'tier3'].includes(tier)) {
        throw new Error(`Invalid tier: ${tier}`);
      }

      // Check cooldown to prevent duplicate executions
      if (this.isInCooldown(tier)) {
        const lastExecution = this.lastExecutions.get(tier);
        const timeSince = Date.now() - (lastExecution || 0);
        const timeUntilReady = this.COOLDOWN_MS - timeSince;

        this.logger.warn(
          `Skipping ${tier} - Still in cooldown (${Math.round(timeUntilReady / 1000)}s remaining)`,
        );

        return {
          tier,
          success: false,
          duration: Date.now() - startTime,
          error: `Cooldown active - ${Math.round(timeUntilReady / 1000)}s remaining`,
        };
      }

      // Log alert context
      this.logger.log(
        `Executing ${tier} cleanup triggered by alert: ${context.alertName}`,
      );
      this.logger.log(`  Severity: ${context.severity}`);
      this.logger.log(`  Summary: ${context.summary}`);
      this.logger.log(`  Started at: ${context.startsAt}`);

      // Build script path
      const scriptPath = path.join(
        this.scriptsBasePath,
        `disk-cleanup-${tier}.ps1`,
      );

      // Verify script exists
      try {
        await fs.access(scriptPath);
      } catch {
        throw new Error(`Script not found: ${scriptPath}`);
      }

      this.logger.log(`Executing script: ${scriptPath}`);

      // Execute PowerShell script
      const { stdout, stderr } = await execAsync(
        `powershell.exe -ExecutionPolicy Bypass -File "${scriptPath}"`,
        {
          timeout: this.getTimeout(tier),
          maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large logs
        },
      );

      // Update last execution timestamp
      this.lastExecutions.set(tier, Date.now());

      // Parse output to extract space freed
      const spaceFreed = this.extractSpaceFreed(stdout);

      // Log structured output
      this.logger.log(`${tier} cleanup completed successfully`);
      this.logger.log(`  Duration: ${Date.now() - startTime}ms`);
      if (spaceFreed) {
        this.logger.log(`  Space freed: ${spaceFreed}`);
      }

      // Log full stdout/stderr at debug level
      if (stdout) {
        this.logger.debug(`${tier} stdout:\n${stdout}`);
      }
      if (stderr) {
        this.logger.warn(`${tier} stderr:\n${stderr}`);
      }

      return {
        tier,
        success: true,
        spaceFreed,
        duration: Date.now() - startTime,
        logPath: this.findLogPath(stdout),
      };
    } catch (error) {
      this.logger.error(
        `Failed to execute ${tier} cleanup: ${error.message}`,
        error.stack,
      );

      return {
        tier,
        success: false,
        duration: Date.now() - startTime,
        error: error.message,
      };
    }
  }

  /**
   * Check if tier is in cooldown period
   *
   * @param tier - Cleanup tier
   * @returns True if in cooldown
   */
  private isInCooldown(tier: string): boolean {
    const lastExecution = this.lastExecutions.get(tier);
    if (!lastExecution) {
      return false;
    }

    const timeSince = Date.now() - lastExecution;
    return timeSince < this.COOLDOWN_MS;
  }

  /**
   * Get timeout based on tier severity
   *
   * @param tier - Cleanup tier
   * @returns Timeout in milliseconds
   */
  private getTimeout(tier: string): number {
    switch (tier) {
      case 'tier1':
        return 5 * 60 * 1000; // 5 minutes
      case 'tier2':
        return 15 * 60 * 1000; // 15 minutes
      case 'tier3':
        return 30 * 60 * 1000; // 30 minutes
      default:
        return 5 * 60 * 1000;
    }
  }

  /**
   * Extract space freed from script output
   *
   * @param output - Script stdout
   * @returns Space freed string (e.g., "10.5 GB") or undefined
   */
  private extractSpaceFreed(output: string): string | undefined {
    // Look for patterns like "Total space freed: 10.5 GB"
    const match = output.match(/Total (?:space )?freed:?\s*([\d.]+\s*GB)/i);
    return match ? match[1] : undefined;
  }

  /**
   * Find log file path from script output
   *
   * @param output - Script stdout
   * @returns Log file path or undefined
   */
  private findLogPath(output: string): string | undefined {
    // Look for patterns like "Log saved to: C:\path\to\log.txt"
    const match = output.match(/Log saved to:?\s*([^\r\n]+)/i);
    return match ? match[1].trim() : undefined;
  }

  /**
   * Get cleanup history (last executions)
   *
   * @returns Map of tier -> last execution timestamp
   */
  getCleanupHistory(): Map<string, number> {
    return new Map(this.lastExecutions);
  }

  /**
   * Reset cooldown for a tier (for testing/manual override)
   *
   * @param tier - Cleanup tier
   */
  resetCooldown(tier: string): void {
    this.lastExecutions.delete(tier);
    this.logger.log(`Cooldown reset for ${tier}`);
  }
}
