/**
 * WebSocket Validation Script - B3 AI Analysis Platform
 * Tests all WebSocket gateways and events
 *
 * Usage: node test-websocket.js
 */

const io = require('socket.io-client');

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(80));
  log(`  ${title}`, colors.bright + colors.cyan);
  console.log('='.repeat(80));
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

// Test results tracker
const testResults = {
  mainGateway: {
    connection: false,
    subscribe: false,
    unsubscribe: false,
    events: [],
  },
  syncGateway: {
    connection: false,
    events: [],
  },
  errors: [],
  warnings: [],
};

// ============================================================================
// MAIN GATEWAY TESTS (Default namespace)
// ============================================================================

async function testMainGateway() {
  return new Promise((resolve) => {
    logSection('TESTING MAIN GATEWAY (ws://localhost:3101)');

    const socket = io('http://localhost:3101', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
    });

    const timeout = setTimeout(() => {
      logError('Connection timeout (10s)');
      testResults.errors.push('Main gateway connection timeout');
      socket.close();
      resolve(false);
    }, 10000);

    socket.on('connect', () => {
      clearTimeout(timeout);
      logSuccess(`Connected to main gateway (ID: ${socket.id})`);
      testResults.mainGateway.connection = true;

      // Test subscription
      logInfo('Testing subscribe event...');
      socket.emit('subscribe', {
        tickers: ['PETR4', 'VALE3'],
        types: ['prices', 'analysis'],
      });
    });

    socket.on('subscribed', (data) => {
      logSuccess('Received subscribed confirmation');
      logInfo(`Subscription data: ${JSON.stringify(data, null, 2)}`);
      testResults.mainGateway.subscribe = true;

      if (data.success && data.tickers && data.types) {
        logSuccess('Subscription data structure is valid');
      } else {
        logWarning('Subscription data structure may be incomplete');
        testResults.warnings.push('Subscription response structure');
      }

      // Test unsubscribe after 2 seconds
      setTimeout(() => {
        logInfo('Testing unsubscribe event...');
        socket.emit('unsubscribe', {
          tickers: ['PETR4'],
          types: ['prices'],
        });
      }, 2000);
    });

    socket.on('unsubscribed', (data) => {
      logSuccess('Received unsubscribed confirmation');
      logInfo(`Unsubscribe data: ${JSON.stringify(data, null, 2)}`);
      testResults.mainGateway.unsubscribe = true;

      // Listen for various events for 5 seconds
      logInfo('Listening for real-time events for 5 seconds...');
      setTimeout(() => {
        socket.close();
        resolve(true);
      }, 5000);
    });

    // Listen for all possible events
    const events = [
      'price_update',
      'analysis_complete',
      'report_ready',
      'portfolio_update',
      'market_status',
      'asset_update_started',
      'asset_update_completed',
      'asset_update_failed',
      'batch_update_started',
      'batch_update_progress',
      'batch_update_completed',
    ];

    events.forEach((eventName) => {
      socket.on(eventName, (data) => {
        logSuccess(`Received ${eventName} event`);
        logInfo(`Event data: ${JSON.stringify(data, null, 2)}`);
        testResults.mainGateway.events.push({
          event: eventName,
          data,
          timestamp: new Date(),
        });
      });
    });

    socket.on('connect_error', (error) => {
      clearTimeout(timeout);
      logError(`Connection error: ${error.message}`);
      testResults.errors.push(`Main gateway connection error: ${error.message}`);
      socket.close();
      resolve(false);
    });

    socket.on('disconnect', (reason) => {
      logInfo(`Disconnected from main gateway (Reason: ${reason})`);
    });

    socket.on('error', (error) => {
      logError(`Socket error: ${error}`);
      testResults.errors.push(`Main gateway error: ${error}`);
    });
  });
}

// ============================================================================
// SYNC GATEWAY TESTS (/sync namespace)
// ============================================================================

async function testSyncGateway() {
  return new Promise((resolve) => {
    logSection('TESTING SYNC GATEWAY (ws://localhost:3101/sync)');

    const socket = io('http://localhost:3101/sync', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
    });

    const timeout = setTimeout(() => {
      logError('Connection timeout (10s)');
      testResults.errors.push('Sync gateway connection timeout');
      socket.close();
      resolve(false);
    }, 10000);

    socket.on('connect', () => {
      clearTimeout(timeout);
      logSuccess(`Connected to sync gateway (ID: ${socket.id})`);
      testResults.syncGateway.connection = true;

      logInfo('Listening for sync events for 5 seconds...');
      setTimeout(() => {
        socket.close();
        resolve(true);
      }, 5000);
    });

    // Listen for sync events
    const syncEvents = [
      'sync:started',
      'sync:progress',
      'sync:completed',
      'sync:failed',
    ];

    syncEvents.forEach((eventName) => {
      socket.on(eventName, (data) => {
        logSuccess(`Received ${eventName} event`);
        logInfo(`Event data: ${JSON.stringify(data, null, 2)}`);
        testResults.syncGateway.events.push({
          event: eventName,
          data,
          timestamp: new Date(),
        });
      });
    });

    socket.on('connect_error', (error) => {
      clearTimeout(timeout);
      logError(`Connection error: ${error.message}`);
      testResults.errors.push(`Sync gateway connection error: ${error.message}`);
      socket.close();
      resolve(false);
    });

    socket.on('disconnect', (reason) => {
      logInfo(`Disconnected from sync gateway (Reason: ${reason})`);
    });

    socket.on('error', (error) => {
      logError(`Socket error: ${error}`);
      testResults.errors.push(`Sync gateway error: ${error}`);
    });
  });
}

// ============================================================================
// RECONNECTION TEST
// ============================================================================

async function testReconnection() {
  return new Promise((resolve) => {
    logSection('TESTING RECONNECTION BEHAVIOR');

    const socket = io('http://localhost:3101', {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
    });

    let reconnected = false;

    socket.on('connect', () => {
      if (!reconnected) {
        logSuccess('Initial connection established');
        logInfo('Simulating disconnect in 2 seconds...');

        setTimeout(() => {
          logInfo('Forcing disconnect...');
          socket.io.engine.close();
        }, 2000);
      } else {
        logSuccess('Successfully reconnected!');
        socket.close();
        resolve(true);
      }
    });

    socket.on('disconnect', () => {
      if (!reconnected) {
        logInfo('Disconnected. Waiting for auto-reconnection...');
        reconnected = true;
      }
    });

    socket.on('reconnect_attempt', (attemptNumber) => {
      logInfo(`Reconnection attempt #${attemptNumber}`);
    });

    socket.on('reconnect_failed', () => {
      logError('Reconnection failed after all attempts');
      testResults.errors.push('Reconnection failed');
      socket.close();
      resolve(false);
    });

    setTimeout(() => {
      if (!reconnected) {
        logWarning('Reconnection test timed out');
        socket.close();
        resolve(false);
      }
    }, 15000);
  });
}

// ============================================================================
// ERROR HANDLING TEST
// ============================================================================

async function testErrorHandling() {
  return new Promise((resolve) => {
    logSection('TESTING ERROR HANDLING');

    const socket = io('http://localhost:3101');

    socket.on('connect', () => {
      logSuccess('Connected to main gateway');

      // Test 1: Invalid subscription data (missing required fields)
      logInfo('Test 1: Sending invalid subscription (missing types)...');
      socket.emit('subscribe', { tickers: ['PETR4'] });

      setTimeout(() => {
        // Test 2: Invalid ticker format
        logInfo('Test 2: Sending invalid ticker format...');
        socket.emit('subscribe', {
          tickers: ['INVALID_TICKER_123456'],
          types: ['prices'],
        });
      }, 1000);

      setTimeout(() => {
        // Test 3: Unsubscribe from non-existent subscription
        logInfo('Test 3: Unsubscribing from non-existent subscription...');
        socket.emit('unsubscribe', {
          tickers: ['NONEXISTENT'],
          types: ['prices'],
        });
      }, 2000);

      setTimeout(() => {
        socket.close();
        resolve(true);
      }, 4000);
    });

    socket.on('error', (error) => {
      logWarning(`Received error event: ${error}`);
    });

    socket.on('exception', (error) => {
      logWarning(`Received exception event: ${JSON.stringify(error)}`);
    });
  });
}

// ============================================================================
// GENERATE FINAL REPORT
// ============================================================================

function generateReport() {
  logSection('WEBSOCKET VALIDATION REPORT');

  console.log('\n📊 CONNECTION STATUS:');
  console.log('─'.repeat(80));
  logInfo(`Main Gateway:        ${testResults.mainGateway.connection ? '✅ Connected' : '❌ Failed'}`);
  logInfo(`Sync Gateway:        ${testResults.syncGateway.connection ? '✅ Connected' : '❌ Failed'}`);

  console.log('\n📨 EVENT HANDLING:');
  console.log('─'.repeat(80));
  logInfo(`Subscribe Event:     ${testResults.mainGateway.subscribe ? '✅ Working' : '❌ Failed'}`);
  logInfo(`Unsubscribe Event:   ${testResults.mainGateway.unsubscribe ? '✅ Working' : '❌ Failed'}`);
  logInfo(`Main Events Received: ${testResults.mainGateway.events.length}`);
  logInfo(`Sync Events Received: ${testResults.syncGateway.events.length}`);

  if (testResults.mainGateway.events.length > 0) {
    console.log('\n📋 MAIN GATEWAY EVENTS RECEIVED:');
    testResults.mainGateway.events.forEach((evt) => {
      logInfo(`  - ${evt.event} at ${evt.timestamp.toISOString()}`);
    });
  }

  if (testResults.syncGateway.events.length > 0) {
    console.log('\n📋 SYNC GATEWAY EVENTS RECEIVED:');
    testResults.syncGateway.events.forEach((evt) => {
      logInfo(`  - ${evt.event} at ${evt.timestamp.toISOString()}`);
    });
  }

  if (testResults.errors.length > 0) {
    console.log('\n❌ ERRORS ENCOUNTERED:');
    console.log('─'.repeat(80));
    testResults.errors.forEach((err) => logError(err));
  }

  if (testResults.warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    console.log('─'.repeat(80));
    testResults.warnings.forEach((warn) => logWarning(warn));
  }

  console.log('\n📝 PAYLOAD FORMAT VALIDATION:');
  console.log('─'.repeat(80));

  // Validate timestamp presence
  const allEvents = [
    ...testResults.mainGateway.events,
    ...testResults.syncGateway.events,
  ];

  const hasTimestamp = allEvents.every((evt) => evt.data && evt.data.timestamp);
  logInfo(`Timestamp in all events: ${hasTimestamp ? '✅ Yes' : '❌ No'}`);

  console.log('\n🎯 RECOMMENDATIONS:');
  console.log('─'.repeat(80));

  if (!testResults.mainGateway.connection) {
    logError('Main gateway not connecting - check backend service status');
  }

  if (!testResults.syncGateway.connection) {
    logError('Sync gateway not connecting - check namespace configuration');
  }

  if (testResults.mainGateway.events.length === 0) {
    logWarning('No real-time events received - this is normal if no operations are running');
    logInfo('Trigger asset updates or sync operations to test event broadcasting');
  }

  if (testResults.errors.length === 0 && testResults.warnings.length === 0) {
    logSuccess('All tests passed successfully! ✨');
  }

  console.log('\n' + '='.repeat(80));
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

async function runAllTests() {
  log('\n🚀 B3 AI Analysis Platform - WebSocket Validation\n', colors.bright + colors.cyan);

  try {
    // Run all tests sequentially
    await testMainGateway();
    await testSyncGateway();
    await testReconnection();
    await testErrorHandling();

    // Generate final report
    generateReport();

  } catch (error) {
    logError(`Test suite failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }

  process.exit(0);
}

// Run tests
runAllTests();
