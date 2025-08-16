// Phase 1 Test Runner - Isolated Core Component Tests
// Bypasses API calls to focus on MILESTONE 3 functionality validation

/**
 * Run Phase 1 tests with proper mocking to avoid API issues
 */
function runPhase1Tests() {
  Logger.log('🚀 Starting Phase 1 Core Component Tests');
  
  var results = {
    totalTests: 4,
    passedTests: 0,
    failedTests: 0,
    details: []
  };
  
  // Test 1: ExportManager initialization
  try {
    testExportManagerInitialization();
    results.passedTests++;
    results.details.push({ test: 'ExportManager Initialization', status: 'PASSED' });
    Logger.log('✅ Test 1: ExportManager Initialization - PASSED');
  } catch (error) {
    results.failedTests++;
    results.details.push({ test: 'ExportManager Initialization', status: 'FAILED', error: error.message });
    Logger.log('❌ Test 1: ExportManager Initialization - FAILED: ' + error.message);
  }
  
  // Test 2: Priority Queue Management
  try {
    testPriorityQueueCore();
    results.passedTests++;
    results.details.push({ test: 'Priority Queue Management', status: 'PASSED' });
    Logger.log('✅ Test 2: Priority Queue Management - PASSED');
  } catch (error) {
    results.failedTests++;
    results.details.push({ test: 'Priority Queue Management', status: 'FAILED', error: error.message });
    Logger.log('❌ Test 2: Priority Queue Management - FAILED: ' + error.message);
  }
  
  // Test 3: Bulk Operations Logic (without API calls)
  try {
    testBulkOperationsLogic();
    results.passedTests++;
    results.details.push({ test: 'Bulk Operations Logic', status: 'PASSED' });
    Logger.log('✅ Test 3: Bulk Operations Logic - PASSED');
  } catch (error) {
    results.failedTests++;
    results.details.push({ test: 'Bulk Operations Logic', status: 'FAILED', error: error.message });
    Logger.log('❌ Test 3: Bulk Operations Logic - FAILED: ' + error.message);
  }
  
  // Test 4: Performance Monitoring Core
  try {
    testPerformanceMonitoringCore();
    results.passedTests++;
    results.details.push({ test: 'Performance Monitoring Core', status: 'PASSED' });
    Logger.log('✅ Test 4: Performance Monitoring Core - PASSED');
  } catch (error) {
    results.failedTests++;
    results.details.push({ test: 'Performance Monitoring Core', status: 'FAILED', error: error.message });
    Logger.log('❌ Test 4: Performance Monitoring Core - FAILED: ' + error.message);
  }
  
  // Summary
  var successRate = Math.round((results.passedTests / results.totalTests) * 100);
  Logger.log('📊 Phase 1 Test Results:');
  Logger.log(`✅ Passed: ${results.passedTests}/${results.totalTests} (${successRate}%)`);
  Logger.log(`❌ Failed: ${results.failedTests}`);
  
  if (results.failedTests > 0) {
    Logger.log('❌ Failed Tests Details:');
    results.details.forEach(function(detail) {
      if (detail.status === 'FAILED') {
        Logger.log(`  - ${detail.test}: ${detail.error}`);
      }
    });
  }
  
  return results;
}

/**
 * Test 1: ExportManager core initialization and components
 */
function testExportManagerInitialization() {
  var exportManager = new ExportManager();
  
  // Verify core components are initialized
  if (!exportManager.bulkApiClient) {
    throw new Error('BulkApiClient not initialized');
  }
  
  if (!exportManager.performanceMonitor) {
    throw new Error('Performance monitor not initialized');
  }
  
  if (typeof exportManager.initiateBulkExport !== 'function') {
    throw new Error('initiateBulkExport method not available');
  }
  
  if (typeof exportManager.processBulkExportQueue !== 'function') {
    throw new Error('processBulkExportQueue method not available');
  }
  
  if (typeof exportManager.getPerformanceMetrics !== 'function') {
    throw new Error('getPerformanceMetrics method not available');
  }
  
  if (typeof exportManager.calculateBulkPerformanceImprovement !== 'function') {
    throw new Error('calculateBulkPerformanceImprovement method not available');
  }
  
  Logger.log('[Test1] ExportManager has all required MILESTONE 3 components');
  return true;
}

/**
 * Test 2: Priority Queue core functionality
 */
function testPriorityQueueCore() {
  var exportQueue = new ExportQueue('test_priority_core');
  
  // Test priority assignment and scoring
  var testItems = [
    { operation: 'update', record: { id: '1' }, priority: 'low' },
    { operation: 'create', record: { id: '' }, priority: 'high' },
    { operation: 'update', record: { id: '3' }, priority: 'critical' },
    { operation: 'update', record: { id: '4' }, priority: 'normal' }
  ];
  
  exportQueue.addItems(testItems);
  var queue = exportQueue.getQueue();
  
  // Verify priority scores are calculated
  for (var i = 0; i < queue.length; i++) {
    if (!queue[i].priorityScore || queue[i].priorityScore === 0) {
      throw new Error('Priority score not calculated for item ' + i);
    }
  }
  
  // Verify critical item has highest score
  var criticalItem = queue.find(function(item) { return item.priority === 'critical'; });
  if (!criticalItem || criticalItem.priorityScore < 1000) {
    throw new Error('Critical priority not properly scored');
  }
  
  // Test priority-based retrieval
  var nextItem = exportQueue.getNextItem();
  if (!nextItem || nextItem.item.priority !== 'critical') {
    throw new Error('Priority-based retrieval not working - expected critical item first');
  }
  
  // Test priority statistics
  var stats = exportQueue.getPriorityStats();
  if (!stats.critical || stats.critical.total !== 1) {
    throw new Error('Priority statistics incorrect');
  }
  
  // Test priority update functionality
  if (typeof exportQueue.setItemPriority !== 'function') {
    throw new Error('setItemPriority method not available');
  }
  
  if (typeof exportQueue.promoteAgedItems !== 'function') {
    throw new Error('promoteAgedItems method not available');
  }
  
  Logger.log('[Test2] Priority queue management working correctly');
  return true;
}

/**
 * Test 3: Bulk operations logic (without actual API calls)
 */
function testBulkOperationsLogic() {
  var batchProcessor = new BatchProcessor();
  
  // Verify bulk export methods exist
  if (typeof batchProcessor.processBulkExportOperations !== 'function') {
    throw new Error('processBulkExportOperations method not available');
  }
  
  if (typeof batchProcessor.groupDataByOperation !== 'function') {
    throw new Error('groupDataByOperation method not available');
  }
  
  if (typeof batchProcessor.processBulkOperationGroup !== 'function') {
    throw new Error('processBulkOperationGroup method not available');
  }
  
  // Test operation grouping logic
  var mixedData = [
    { operation: 'create', record: { title: 'New Product' } },
    { operation: 'update', record: { id: '1', title: 'Updated' } },
    { operation: 'delete', record: { id: '2' } },
    { operation: 'update', record: { id: '3', title: 'Another Update' } }
  ];
  
  var grouped = batchProcessor.groupDataByOperation(mixedData, 'mixed');
  
  if (!grouped.create || grouped.create.length !== 1) {
    throw new Error('Create operations not properly grouped');
  }
  
  if (!grouped.update || grouped.update.length !== 2) {
    throw new Error('Update operations not properly grouped');
  }
  
  if (!grouped.delete || grouped.delete.length !== 1) {
    throw new Error('Delete operations not properly grouped');
  }
  
  Logger.log('[Test3] Bulk operations logic working correctly');
  return true;
}

/**
 * Test 4: Performance monitoring core functionality
 */
function testPerformanceMonitoringCore() {
  var exportManager = new ExportManager();
  
  // Set session ID
  exportManager.sessionId = 'test_performance_core';
  
  // Initialize performance monitoring
  exportManager.performanceMonitor.startTime = new Date(Date.now() - 1000);
  exportManager.performanceMonitor.apiCallCount = 15;
  exportManager.performanceMonitor.bulkOperationsUsed = 3;
  exportManager.performanceMonitor.endTime = new Date();
  
  // Test performance metrics retrieval
  var metrics = exportManager.getPerformanceMetrics();
  
  if (!metrics.sessionId) {
    throw new Error('Performance metrics missing session ID');
  }
  
  if (!metrics.startTime) {
    throw new Error('Performance metrics missing start time');
  }
  
  if (metrics.apiCallCount !== 15) {
    throw new Error('API call count not tracked correctly');
  }
  
  if (metrics.bulkOperationsUsed !== 3) {
    throw new Error('Bulk operations count not tracked correctly');
  }
  
  if (!metrics.elapsedTimeMs || metrics.elapsedTimeMs <= 0) {
    throw new Error('Elapsed time not calculated correctly');
  }
  
  // Test performance improvement calculation
  var mockResult = {
    summary: { stats: { completed: 50 } }
  };
  
  var improvement = exportManager.calculateBulkPerformanceImprovement(mockResult);
  
  if (!improvement.itemsProcessed || improvement.itemsProcessed !== 50) {
    throw new Error('Items processed count incorrect');
  }
  
  if (improvement.percentageImprovement === undefined) {
    throw new Error('Performance improvement percentage not calculated');
  }
  
  if (!improvement.itemsPerSecond || improvement.itemsPerSecond <= 0) {
    throw new Error('Items per second calculation invalid');
  }
  
  // Test reset functionality
  if (typeof exportManager.resetPerformanceMonitoring !== 'function') {
    throw new Error('resetPerformanceMonitoring method not available');
  }
  
  exportManager.resetPerformanceMonitoring();
  var resetMetrics = exportManager.getPerformanceMetrics();
  
  if (resetMetrics.apiCallCount !== 0) {
    throw new Error('Performance monitoring reset not working');
  }
  
  Logger.log('[Test4] Performance monitoring core functionality working correctly');
  return true;
}
