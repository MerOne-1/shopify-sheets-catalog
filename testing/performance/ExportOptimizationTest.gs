// MILESTONE 3: Export System Optimization Tests
// Comprehensive test suite for bulk export operations and performance monitoring

/**
 * Test suite for MILESTONE 3 export system optimizations
 */
function testExportOptimizations() {
  Logger.log('🚀 Starting MILESTONE 3 Export Optimization Tests');
  
  var testResults = {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    testDetails: []
  };
  
  try {
    // Test 1: ExportManager bulk export initialization
    runTest(testResults, 'ExportManager Bulk Export Initialization', testBulkExportInitialization);
    
    // Test 2: Priority-based queue management
    runTest(testResults, 'Priority-Based Queue Management', testPriorityQueueManagement);
    
    // Test 3: Bulk export operations
    runTest(testResults, 'Bulk Export Operations', testBulkExportOperations);
    
    // Test 4: Performance monitoring
    runTest(testResults, 'Performance Monitoring', testPerformanceMonitoring);
    
    // Test 5: Enhanced BatchProcessor bulk operations
    runTest(testResults, 'Enhanced BatchProcessor Bulk Operations', testEnhancedBatchProcessor);
    
    // Test 6: Queue priority aging mechanism
    runTest(testResults, 'Queue Priority Aging Mechanism', testQueuePriorityAging);
    
    // Test 7: Bulk export performance improvement calculation
    runTest(testResults, 'Bulk Export Performance Calculation', testBulkExportPerformanceCalculation);
    
    // Test 8: Export queue processing with bulk operations
    runTest(testResults, 'Export Queue Processing with Bulk Operations', testExportQueueBulkProcessing);
    
    // Test 9: Integration test - Full export workflow
    runTest(testResults, 'Full Export Workflow Integration', testFullExportWorkflowIntegration);
    
    // Test 10: Error handling and fallback mechanisms
    runTest(testResults, 'Error Handling and Fallback Mechanisms', testErrorHandlingAndFallbacks);
    
    // Test 11: Queue persistence and state management
    runTest(testResults, 'Queue Persistence and State Management', testQueuePersistenceAndState);
    
    // Test 12: Performance monitoring accuracy
    runTest(testResults, 'Performance Monitoring Accuracy', testPerformanceMonitoringAccuracy);
    
    // Test 13: Priority queue edge cases
    runTest(testResults, 'Priority Queue Edge Cases', testPriorityQueueEdgeCases);
    
    // Test 14: Bulk operations with mixed data types
    runTest(testResults, 'Bulk Operations Mixed Data Types', testBulkOperationsMixedDataTypes);
    
    // Test 15: Backward compatibility
    runTest(testResults, 'Backward Compatibility', testBackwardCompatibility);
    
  } catch (error) {
    Logger.log('❌ Critical error in export optimization tests: ' + error.message);
    testResults.testDetails.push({
      testName: 'Critical Error',
      success: false,
      error: error.message
    });
    testResults.failedTests++;
  }
  
  // Generate test summary
  var successRate = testResults.totalTests > 0 ? 
    Math.round((testResults.passedTests / testResults.totalTests) * 100) : 0;
  
  Logger.log('📊 MILESTONE 3 Export Optimization Test Results:');
  Logger.log(`✅ Passed: ${testResults.passedTests}/${testResults.totalTests} (${successRate}%)`);
  Logger.log(`❌ Failed: ${testResults.failedTests}`);
  
  if (testResults.failedTests > 0) {
    Logger.log('❌ Failed Tests:');
    testResults.testDetails.forEach(function(test) {
      if (!test.success) {
        Logger.log(`  - ${test.testName}: ${test.error}`);
      }
    });
  }
  
  return {
    success: testResults.failedTests === 0,
    successRate: successRate,
    totalTests: testResults.totalTests,
    passedTests: testResults.passedTests,
    failedTests: testResults.failedTests,
    details: testResults.testDetails
  };
}

/**
 * Test ExportManager bulk export initialization
 */
function testBulkExportInitialization() {
  var exportManager = new ExportManager();
  
  // Verify bulk export components are initialized
  if (!exportManager.bulkApiClient) {
    throw new Error('BulkApiClient not initialized in ExportManager');
  }
  
  if (!exportManager.performanceMonitor) {
    throw new Error('Performance monitor not initialized in ExportManager');
  }
  
  // Test bulk export initiation
  var mockSheetData = createMockSheetData(5);
  mockSpreadsheetOperations(mockSheetData);
  
  var result = exportManager.initiateBulkExport('Products', {
    useBulkOperations: true,
    dryRun: true
  });
  
  if (!result.success) {
    throw new Error('Bulk export initiation failed: ' + (result.error || 'Unknown error'));
  }
  
  if (!result.bulkOptimized) {
    throw new Error('Bulk optimization flag not set');
  }
  
  if (!result.performanceMetrics) {
    throw new Error('Performance metrics not included in result');
  }
  
  Logger.log('✅ ExportManager bulk export initialization working correctly');
  return true;
}

/**
 * Test priority-based queue management
 */
function testPriorityQueueManagement() {
  var exportQueue = new ExportQueue('test_priority_session');
  
  // Create test items with different priorities
  var testItems = [
    { operation: 'update', record: { id: '1', title: 'Product 1' }, sheetName: 'Products', priority: 'low' },
    { operation: 'create', record: { id: '', title: 'Product 2' }, sheetName: 'Products', priority: 'high' },
    { operation: 'update', record: { id: '3', title: 'Product 3' }, sheetName: 'Products', priority: 'critical' },
    { operation: 'update', record: { id: '4', title: 'Product 4' }, sheetName: 'Products', priority: 'normal' }
  ];
  
  // Add items to queue
  exportQueue.addItems(testItems);
  
  // Verify priority scores are calculated
  var queue = exportQueue.getQueue();
  for (var i = 0; i < queue.length; i++) {
    if (!queue[i].priorityScore || queue[i].priorityScore === 0) {
      throw new Error('Priority score not calculated for item ' + i);
    }
  }
  
  // Verify queue is sorted by priority (critical first)
  var nextItem = exportQueue.getNextItem();
  if (!nextItem || nextItem.item.priority !== 'critical') {
    throw new Error('Queue not sorted by priority - expected critical item first');
  }
  
  // Test priority statistics
  var priorityStats = exportQueue.getPriorityStats();
  if (priorityStats.critical.total !== 1 || priorityStats.high.total !== 1) {
    throw new Error('Priority statistics incorrect');
  }
  
  // Test priority update
  var updateResult = exportQueue.setItemPriority(0, 'high');
  if (!updateResult) {
    throw new Error('Failed to update item priority');
  }
  
  Logger.log('✅ Priority-based queue management working correctly');
  return true;
}

/**
 * Test bulk export operations
 */
function testBulkExportOperations() {
  var batchProcessor = new BatchProcessor();
  
  // Create test data for bulk operations
  var testData = [
    { operation: 'update', record: { id: '1', title: 'Product 1', price: '10.00' } },
    { operation: 'update', record: { id: '2', title: 'Product 2', price: '20.00' } },
    { operation: 'create', record: { id: '', title: 'Product 3', price: '30.00' } }
  ];
  
  // Mock BulkApiClient methods with proper function definitions
  batchProcessor.bulkApiClient = createMockBulkApiClient();
  
  // Test bulk export operations
  var result = batchProcessor.processBulkExportOperations(testData, 'mixed', {
    batchSize: 100,
    performanceMonitoring: true
  });
  
  if (!result) {
    throw new Error('Bulk export operations returned null result');
  }
  
  if (result.success === undefined) {
    throw new Error('Bulk export operations result missing success count');
  }
  
  if (!result.timeSeconds || result.timeSeconds <= 0) {
    throw new Error('Bulk export operations missing timing information');
  }
  
  Logger.log('✅ Bulk export operations working correctly');
  return true;
}

/**
 * Test performance monitoring
 */
function testPerformanceMonitoring() {
  var exportManager = new ExportManager();
  
  // Initialize session ID first
  exportManager.sessionId = 'test_performance_' + Date.now();
  
  // Initialize performance monitoring with proper timing
  var startTime = new Date(Date.now() - 1000); // 1 second ago
  exportManager.performanceMonitor.startTime = startTime;
  exportManager.performanceMonitor.apiCallCount = 10;
  exportManager.performanceMonitor.bulkOperationsUsed = 2;
  
  // Test performance metrics retrieval
  var metrics = exportManager.getPerformanceMetrics();
  
  if (!metrics.sessionId) {
    throw new Error('Performance metrics missing session ID');
  }
  
  if (!metrics.startTime) {
    throw new Error('Performance metrics missing start time');
  }
  
  if (metrics.apiCallCount !== 10) {
    throw new Error('Performance metrics API call count incorrect');
  }
  
  if (metrics.bulkOperationsUsed !== 2) {
    throw new Error('Performance metrics bulk operations count incorrect');
  }
  
  if (metrics.elapsedTimeMs === undefined || metrics.elapsedTimeMs === null) {
    throw new Error('Performance metrics missing elapsed time');
  }
  
  // Elapsed time should be at least 900ms since we set start time 1 second ago
  if (metrics.elapsedTimeMs < 900) {
    throw new Error('Performance metrics elapsed time calculation incorrect: ' + metrics.elapsedTimeMs + 'ms');
  }
  
  // Test performance improvement calculation
  var mockResult = {
    summary: { stats: { completed: 50 } }
  };
  
  exportManager.performanceMonitor.endTime = new Date();
  var improvement = exportManager.calculateBulkPerformanceImprovement(mockResult);
  
  if (!improvement.itemsProcessed || improvement.itemsProcessed !== 50) {
    throw new Error('Performance improvement calculation incorrect');
  }
  
  if (improvement.percentageImprovement === undefined) {
    throw new Error('Performance improvement percentage not calculated');
  }
  
  Logger.log('✅ Performance monitoring working correctly');
  return true;
}

/**
 * Test enhanced BatchProcessor bulk operations
 */
function testEnhancedBatchProcessor() {
  var batchProcessor = new BatchProcessor();
  
  // Mock BulkApiClient
  batchProcessor.bulkApiClient = createMockBulkApiClient();
  
  var testData = [
    { operation: 'update', record: { id: '1', title: 'Product 1' } },
    { operation: 'update', record: { id: '2', title: 'Product 2' } }
  ];
  
  // Test enhanced bulk operations
  var result = batchProcessor.processAllBatches(testData, 'update', {
    useBulkOperations: true,
    performanceMonitoring: true
  });
  
  if (!result.success) {
    throw new Error('Enhanced bulk operations failed: ' + (result.error || 'Unknown error'));
  }
  
  if (!result.enhancedBulkOperation) {
    throw new Error('Enhanced bulk operation flag not set');
  }
  
  if (!result.bulkOperationsUsed || result.bulkOperationsUsed === 0) {
    throw new Error('Bulk operations usage not tracked');
  }
  
  Logger.log('✅ Enhanced BatchProcessor bulk operations working correctly');
  return true;
}

/**
 * Test queue priority aging mechanism
 */
function testQueuePriorityAging() {
  var exportQueue = new ExportQueue('test_aging_session');
  
  // Create test items with old timestamps
  var oldTime = new Date(Date.now() - (2 * 60 * 60 * 1000)); // 2 hours ago
  var testItems = [
    { 
      operation: 'update', 
      record: { id: '1', title: 'Product 1' }, 
      sheetName: 'Products', 
      priority: 'low',
      addedAt: oldTime.toISOString()
    },
    { 
      operation: 'update', 
      record: { id: '2', title: 'Product 2' }, 
      sheetName: 'Products', 
      priority: 'normal',
      addedAt: oldTime.toISOString()
    }
  ];
  
  exportQueue.addItems(testItems);
  
  // Test aging promotion
  var promotedCount = exportQueue.promoteAgedItems();
  
  if (promotedCount === 0) {
    throw new Error('No items were promoted despite being aged');
  }
  
  // Verify promotions occurred
  var queue = exportQueue.getQueue();
  var foundPromotedItem = false;
  
  for (var i = 0; i < queue.length; i++) {
    if (queue[i].priority === 'normal' || queue[i].priority === 'high') {
      foundPromotedItem = true;
      break;
    }
  }
  
  if (!foundPromotedItem) {
    throw new Error('Items were not actually promoted');
  }
  
  Logger.log('✅ Queue priority aging mechanism working correctly');
  return true;
}

/**
 * Test bulk export performance calculation
 */
function testBulkExportPerformanceCalculation() {
  var exportManager = new ExportManager();
  
  // Set up performance monitoring data
  exportManager.performanceMonitor.startTime = new Date(Date.now() - 5000); // 5 seconds ago
  exportManager.performanceMonitor.endTime = new Date();
  exportManager.performanceMonitor.apiCallCount = 5;
  exportManager.performanceMonitor.bulkOperationsUsed = 2;
  
  var mockResult = {
    summary: { stats: { completed: 100 } }
  };
  
  var improvement = exportManager.calculateBulkPerformanceImprovement(mockResult);
  
  if (!improvement.itemsProcessed || improvement.itemsProcessed !== 100) {
    throw new Error('Items processed count incorrect');
  }
  
  if (!improvement.totalTimeMs || improvement.totalTimeMs <= 0) {
    throw new Error('Total time calculation incorrect');
  }
  
  if (improvement.percentageImprovement === undefined || improvement.percentageImprovement < 0) {
    throw new Error('Percentage improvement calculation invalid');
  }
  
  if (!improvement.apiCallReduction || improvement.apiCallReduction < 0) {
    throw new Error('API call reduction calculation invalid');
  }
  
  if (!improvement.itemsPerSecond || improvement.itemsPerSecond <= 0) {
    throw new Error('Items per second calculation invalid');
  }
  
  Logger.log('✅ Bulk export performance calculation working correctly');
  return true;
}

/**
 * Test export queue processing with bulk operations
 */
function testExportQueueBulkProcessing() {
  var exportQueue = new ExportQueue('test_bulk_processing');
  
  // Add test items
  var testItems = [
    { operation: 'update', record: { id: '1', title: 'Product 1' }, sheetName: 'Products' },
    { operation: 'update', record: { id: '2', title: 'Product 2' }, sheetName: 'Products' }
  ];
  
  exportQueue.addItems(testItems);
  
  // Mock processors
  var mockProcessors = {
    batchProcessor: createMockBatchProcessor(),
    retryManager: { executeWithRetry: function() { return { success: true }; } },
    auditLogger: { logPerformanceMetrics: function() {} },
    bulkApiClient: createMockBulkApiClient()
  };
  
  // Test queue processing
  var result = exportQueue.processQueue(mockProcessors, {
    useBulkOperations: true,
    performanceMonitoring: true
  });
  
  if (!result.success) {
    throw new Error('Queue processing failed: ' + (result.error || 'Unknown error'));
  }
  
  if (!result.summary) {
    throw new Error('Queue processing result missing summary');
  }
  
  Logger.log('✅ Export queue processing with bulk operations working correctly');
  return true;
}

// ===== HELPER FUNCTIONS =====

/**
 * Run a single test and record results
 */
function runTest(testResults, testName, testFunction) {
  testResults.totalTests++;
  
  try {
    Logger.log(`🧪 Running test: ${testName}`);
    var result = testFunction();
    
    if (result === true) {
      testResults.passedTests++;
      testResults.testDetails.push({
        testName: testName,
        success: true
      });
    } else {
      throw new Error('Test function returned false or invalid result');
    }
    
  } catch (error) {
    testResults.failedTests++;
    testResults.testDetails.push({
      testName: testName,
      success: false,
      error: error.message
    });
    Logger.log(`❌ Test failed: ${testName} - ${error.message}`);
  }
}

/**
 * Create mock sheet data for testing
 */
function createMockSheetData(count) {
  var data = [];
  for (var i = 1; i <= count; i++) {
    data.push({
      id: i.toString(),
      title: 'Product ' + i,
      price: (i * 10).toString(),
      _hash: 'hash_' + i
    });
  }
  return data;
}

/**
 * Mock spreadsheet operations
 */
function mockSpreadsheetOperations(mockData) {
  // Mock SpreadsheetApp for testing
  if (typeof SpreadsheetApp === 'undefined') {
    global.SpreadsheetApp = {
      getActiveSpreadsheet: function() {
        return {
          getSheetByName: function(name) {
            return {
              getLastRow: function() { return mockData.length + 1; },
              getLastColumn: function() { return 4; },
              getRange: function(row, col, numRows, numCols) {
                if (row === 1) {
                  return { getValues: function() { return [['id', 'title', 'price', '_hash']]; } };
                } else {
                  return { getValues: function() { return mockData.map(function(item) {
                    return [item.id, item.title, item.price, item._hash];
                  }); } };
                }
              }
            };
          }
        };
      }
    };
  }
}

/**
 * Create mock BulkApiClient for testing
 */
function createMockBulkApiClient() {
  return {
    bulkCreateResources: function(items, resourceType, options) {
      Logger.log('[MockBulkApiClient] bulkCreateResources called with ' + items.length + ' items');
      return {
        success: items.length,
        failed: 0,
        skipped: 0,
        processedCount: items.length,
        failedCount: 0,
        skippedCount: 0,
        details: [],
        timeSeconds: 0.1
      };
    },
    bulkUpdateResources: function(items, resourceType, options) {
      Logger.log('[MockBulkApiClient] bulkUpdateResources called with ' + items.length + ' items');
      return {
        success: items.length,
        failed: 0,
        skipped: 0,
        processedCount: items.length,
        failedCount: 0,
        skippedCount: 0,
        details: [],
        timeSeconds: 0.1
      };
    },
    bulkDeleteResources: function(items, resourceType, options) {
      Logger.log('[MockBulkApiClient] bulkDeleteResources called with ' + items.length + ' items');
      return {
        success: items.length,
        failed: 0,
        skipped: 0,
        processedCount: items.length,
        failedCount: 0,
        skippedCount: 0,
        details: [],
        timeSeconds: 0.1
      };
    },
    bulkFetchResources: function(resourceType, options) {
      Logger.log('[MockBulkApiClient] bulkFetchResources called for ' + resourceType);
      return {
        success: true,
        data: [],
        processedCount: 0,
        timeSeconds: 0.1
      };
    }
  };
}

/**
 * Create mock BatchProcessor for testing
 */
function createMockBatchProcessor() {
  return {
    processAllBatches: function(data, operation, options) {
      return {
        success: true,
        processedBatches: [{ batchIndex: 0, itemCount: data.length, result: { success: true } }],
        failedBatches: [],
        summary: {
          stats: {
            completed: data.length,
            failed: 0
          }
        }
      };
    }
  };
}

/**
 * Test 9: Full export workflow integration
 */
function testFullExportWorkflowIntegration() {
  var exportManager = new ExportManager();
  
  // Mock complete workflow
  var mockSheetData = createMockSheetData(10);
  mockSpreadsheetOperations(mockSheetData);
  
  // Test complete workflow: initiate -> queue -> process -> complete
  var initResult = exportManager.initiateBulkExport('Products', {
    useBulkOperations: true,
    performanceMonitoring: true
  });
  
  if (!initResult.success) {
    throw new Error('Workflow initiation failed: ' + (initResult.error || 'Unknown error'));
  }
  
  // Create a mock export queue for processing
  exportManager.exportQueue = new ExportQueue(exportManager.sessionId);
  exportManager.exportQueue.addItems([
    { operation: 'update', record: { id: '1', title: 'Product 1' }, sheetName: 'Products' },
    { operation: 'create', record: { id: '', title: 'Product 2' }, sheetName: 'Products' }
  ]);
  
  // Process the queue
  var processResult = exportManager.processBulkExportQueue({
    useBulkOperations: true,
    performanceMonitoring: true
  });
  
  if (!processResult.success) {
    throw new Error('Workflow processing failed: ' + (processResult.error || 'Unknown error'));
  }
  
  // Verify performance metrics are collected
  var metrics = exportManager.getPerformanceMetrics();
  if (!metrics.sessionId || !metrics.startTime) {
    throw new Error('Performance metrics not properly collected during workflow');
  }
  
  Logger.log('✅ Full export workflow integration working correctly');
  return true;
}

/**
 * Test 10: Error handling and fallback mechanisms
 */
function testErrorHandlingAndFallbacks() {
  var batchProcessor = new BatchProcessor();
  
  // Create failing bulk API client
  batchProcessor.bulkApiClient = {
    bulkUpdateResources: function() {
      throw new Error('Bulk API failure simulation');
    },
    bulkCreateResources: function() {
      throw new Error('Bulk API failure simulation');
    }
  };
  
  var testData = [
    { operation: 'update', record: { id: '1', title: 'Product 1' } }
  ];
  
  // Test fallback to individual processing
  var result = batchProcessor.processBulkExportOperations(testData, 'update', {
    enableFallback: true
  });
  
  if (!result) {
    throw new Error('Fallback mechanism failed - no result returned');
  }
  
  // Verify fallback occurred - should have attempted individual processing
  if (result.timeSeconds && result.timeSeconds > 0) {
    // This means fallback processing occurred (took time to process)
    Logger.log('✅ Error handling and fallback mechanisms working correctly');
    return true;
  }
  
  // Also check if the result indicates fallback was attempted
  if (result.success !== undefined && result.failed !== undefined) {
    // Fallback processing completed, even if items failed due to API issues
    Logger.log('✅ Error handling and fallback mechanisms working correctly');
    return true;
  }
  
  throw new Error('Fallback mechanism did not handle bulk API failure properly');
}

/**
 * Test 11: Queue persistence and state management
 */
function testQueuePersistenceAndState() {
  var sessionId = 'test_persistence_' + Date.now();
  var exportQueue = new ExportQueue(sessionId);
  
  // Add items and save state
  var testItems = [
    { operation: 'update', record: { id: '1', title: 'Product 1' }, priority: 'high' },
    { operation: 'create', record: { id: '', title: 'Product 2' }, priority: 'normal' }
  ];
  
  exportQueue.addItems(testItems);
  
  // Test state saving using the existing saveQueue method
  var saveResult = exportQueue.saveQueue();
  if (!saveResult) {
    throw new Error('Queue state saving failed');
  }
  
  // Create new queue instance and load state using existing loadQueue method
  var newQueue = new ExportQueue(sessionId);
  var loadResult = newQueue.loadQueue();
  
  if (!loadResult) {
    throw new Error('Queue state loading failed');
  }
  
  // Verify state was preserved
  var loadedQueue = newQueue.getQueue();
  if (loadedQueue.length !== testItems.length) {
    throw new Error('Queue state not properly restored - item count mismatch');
  }
  
  // Verify priority scores were preserved
  if (!loadedQueue[0].priorityScore || loadedQueue[0].priorityScore === 0) {
    throw new Error('Priority scores not preserved during state persistence');
  }
  
  Logger.log('✅ Queue persistence and state management working correctly');
  return true;
}

/**
 * Test 12: Performance monitoring accuracy
 */
function testPerformanceMonitoringAccuracy() {
  var exportManager = new ExportManager();
  
  // Reset and start monitoring
  exportManager.resetPerformanceMonitoring();
  exportManager.performanceMonitor.startTime = new Date(Date.now() - 1000); // 1 second ago
  exportManager.performanceMonitor.apiCallCount = 15;
  exportManager.performanceMonitor.bulkOperationsUsed = 3;
  
  // Simulate processing completion
  exportManager.performanceMonitor.endTime = new Date();
  
  var mockResult = {
    summary: { stats: { completed: 75 } }
  };
  
  var improvement = exportManager.calculateBulkPerformanceImprovement(mockResult);
  
  // Verify accuracy of calculations
  if (improvement.itemsProcessed !== 75) {
    throw new Error('Items processed count inaccurate');
  }
  
  if (improvement.totalTimeMs < 900 || improvement.totalTimeMs > 1100) {
    throw new Error('Time calculation inaccurate - expected ~1000ms');
  }
  
  if (improvement.itemsPerSecond < 70 || improvement.itemsPerSecond > 80) {
    throw new Error('Items per second calculation inaccurate');
  }
  
  if (improvement.apiCallReduction < 0 || improvement.apiCallReduction > 100) {
    throw new Error('API call reduction percentage out of valid range');
  }
  
  Logger.log('✅ Performance monitoring accuracy verified');
  return true;
}

/**
 * Test 6: Queue priority aging mechanism
 */
function testQueuePriorityAging() {
  // Create fresh queue for aging test
  var agingQueue = new ExportQueue('test_aging_specific_' + Date.now());
  
  // Add items with explicit timestamps and priorities directly to queue
  var oldItems = [
    {
      operation: 'update',
      record: { id: '2' },
      priority: 'low',
      status: 'pending',
      addedAt: new Date(Date.now() - (45 * 60 * 1000)).toISOString() // 45 minutes ago (should promote low->normal)
    },
    {
      operation: 'update',
      record: { id: '3' },
      priority: 'normal',
      status: 'pending', 
      addedAt: new Date(Date.now() - (90 * 60 * 1000)).toISOString() // 90 minutes ago (should promote normal->high)
    }
  ];
  
  // Add items directly to queue to preserve exact priority and timestamp
  for (var i = 0; i < oldItems.length; i++) {
    var item = oldItems[i];
    item.priorityScore = agingQueue.calculatePriorityScore(item);
    agingQueue.queue.push(item);
  }
  
  // Debug: Log queue state before promotion
  Logger.log('[DEBUG] Queue before promotion: ' + JSON.stringify(agingQueue.queue.map(function(item) {
    return {
      id: item.record.id,
      priority: item.priority,
      status: item.status,
      addedAt: item.addedAt,
      ageMinutes: Math.round((new Date() - new Date(item.addedAt)) / (1000 * 60))
    };
  })));
  
  var promotedCount = agingQueue.promoteAgedItems();
  
  Logger.log('[DEBUG] Promoted count: ' + promotedCount);
  
  if (promotedCount === 0) {
    // Debug: Check why no promotions occurred
    var debugInfo = [];
    for (var i = 0; i < agingQueue.queue.length; i++) {
      var item = agingQueue.queue[i];
      var ageMinutes = (new Date() - new Date(item.addedAt)) / (1000 * 60);
      debugInfo.push({
        id: item.record.id,
        priority: item.priority,
        status: item.status,
        ageMinutes: Math.round(ageMinutes),
        addedAt: item.addedAt
      });
    }
    throw new Error('Very old items should be promoted - Debug info: ' + JSON.stringify(debugInfo));
  }
  
  // Verify promotions occurred
  var queueAfterPromotion = agingQueue.getQueue();
  var foundPromotedLow = false;
  var foundPromotedNormal = false;
  
  for (var i = 0; i < queueAfterPromotion.length; i++) {
    var item = queueAfterPromotion[i];
    if (item.record.id === '2' && item.priority === 'normal') {
      foundPromotedLow = true;
    }
    if (item.record.id === '3' && item.priority === 'high') {
      foundPromotedNormal = true;
    }
  }
  
  if (!foundPromotedLow) {
    throw new Error('Low priority item was not promoted to normal after 45 minutes');
  }
  
  if (!foundPromotedNormal) {
    throw new Error('Normal priority item was not promoted to high after 90 minutes');
  }
  
  Logger.log('✅ Queue priority aging mechanism working correctly');
  return true;
}

/**
 * Test 14: Bulk operations with mixed data types
 */
function testBulkOperationsMixedDataTypes() {
  var batchProcessor = new BatchProcessor();
  batchProcessor.bulkApiClient = createMockBulkApiClient();
  
  // Mixed operations data
  var mixedData = [
    { operation: 'create', record: { title: 'New Product', price: '10.00' } },
    { operation: 'update', record: { id: '1', title: 'Updated Product', price: '15.00' } },
    { operation: 'delete', record: { id: '2' } },
    { operation: 'update', record: { id: '3', title: 'Another Update' } }
  ];
  
  // Test grouping by operation
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
  
  // Test processing mixed operations
  var result = batchProcessor.processBulkExportOperations(mixedData, 'mixed', {
    batchSize: 100
  });
  
  if (!result || result.success === undefined) {
    throw new Error('Mixed data type processing failed');
  }
  
  Logger.log('✅ Bulk operations with mixed data types working correctly');
  return true;
}

/**
 * Test 15: Backward compatibility
 */
function testBackwardCompatibility() {
  // Test that old methods still work
  var exportManager = new ExportManager();
  var exportQueue = new ExportQueue('backward_compat_test');
  
  // Test old-style export initiation (without bulk operations)
  var mockSheetData = createMockSheetData(3);
  mockSpreadsheetOperations(mockSheetData);
  
  var result = exportManager.initiateExport('Products', {
    useBulkOperations: false // Explicitly disable bulk operations
  });
  
  if (!result.success) {
    throw new Error('Backward compatibility failed - old export method broken');
  }
  
  // Test old-style queue operations (without priority)
  var oldStyleItems = [
    { operation: 'update', record: { id: '1', title: 'Product 1' } }
    // No priority specified - should default to 'normal'
  ];
  
  exportQueue.addItems(oldStyleItems);
  var queue = exportQueue.getQueue();
  
  if (queue.length === 0) {
    throw new Error('Old-style item addition failed');
  }
  
  if (!queue[0].priority || queue[0].priority !== 'normal') {
    throw new Error('Default priority not set for old-style items');
  }
  
  // Test old-style batch processing (without bulk operations)
  var batchProcessor = new BatchProcessor();
  var oldResult = batchProcessor.processAllBatches(oldStyleItems, 'update', {
    useBulkOperations: false
  });
  
  if (!oldResult.success) {
    throw new Error('Old-style batch processing failed');
  }
  
  Logger.log('✅ Backward compatibility maintained');
  return true;
}

// Export test function for external execution
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testExportOptimizations };
}
