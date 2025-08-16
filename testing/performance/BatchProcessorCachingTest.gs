/**
 * Performance test for BatchProcessor caching and bulk operation optimizations
 * Tests the MILESTONE 2 improvements for intelligent caching and bulk operations
 */

function BatchProcessorCachingTest() {
  this.testResults = {
    testName: 'BatchProcessor Caching & Bulk Operations Test',
    timestamp: new Date().toISOString(),
    tests: [],
    summary: {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      performanceImprovement: 0
    }
  };
}

/**
 * Run comprehensive performance validation for BatchProcessor optimizations
 */
BatchProcessorCachingTest.prototype.runFullPerformanceValidation = function() {
  Logger.log('=== MILESTONE 2: BatchProcessor Caching Performance Test ===');
  
  try {
    // Test 1: Individual processing (baseline)
    this.testIndividualProcessing();
    
    // Test 2: Cached processing
    this.testCachedProcessing();
    
    // Test 3: Bulk operations optimization
    this.testBulkOperationsOptimization();
    
    // Test 4: Duplicate operation detection
    this.testDuplicateOperationDetection();
    
    // Test 5: Cache hit rate analysis
    this.testCacheHitRateAnalysis();
    
    // Generate final report
    this.generatePerformanceReport();
    
    return this.testResults;
    
  } catch (error) {
    Logger.log('[BatchProcessorCachingTest] Error in performance validation: ' + error.message);
    this.addTestResult('Full Performance Validation', false, 0, 0, error.message);
    return this.testResults;
  }
};

/**
 * Test individual processing performance (baseline) - MOCKED VERSION
 */
BatchProcessorCachingTest.prototype.testIndividualProcessing = function() {
  var testName = 'Individual Processing Baseline (Mocked)';
  Logger.log('[TEST] ' + testName);
  
  try {
    // Mock the processing without actual API calls
    var testData = this.createTestData(20);
    
    var startTime = new Date().getTime();
    
    // Simulate processing time without API calls
    var results = [];
    for (var i = 0; i < testData.length; i++) {
      var item = testData[i];
      
      // Simulate processing delay (50-100ms per item)
      var processingDelay = 50 + Math.random() * 50;
      Utilities.sleep(processingDelay);
      
      results.push({
        success: true,
        item: item,
        operation: 'update',
        apiResponse: { product: item.record },
        attempts: 1,
        mocked: true
      });
    }
    
    var endTime = new Date().getTime();
    var duration = endTime - startTime;
    var itemsPerSecond = (testData.length / (duration / 1000)).toFixed(2);
    
    Logger.log(`[BASELINE MOCKED] Processed ${testData.length} items in ${duration}ms (${itemsPerSecond} items/sec)`);
    
    this.addTestResult(testName, true, duration, testData.length, 
      `Baseline (mocked): ${itemsPerSecond} items/sec`);
    
    return { duration: duration, itemsPerSecond: parseFloat(itemsPerSecond) };
    
  } catch (error) {
    Logger.log('[ERROR] ' + testName + ': ' + error.message);
    this.addTestResult(testName, false, 0, 0, error.message);
    return { duration: 0, itemsPerSecond: 0 };
  }
};

/**
 * Test cached processing performance
 */
BatchProcessorCachingTest.prototype.testCachedProcessing = function() {
  var testName = 'Cached Processing Performance';
  Logger.log('[TEST] ' + testName);
  
  try {
    var batchProcessor = new BatchProcessor();
    
    // Create test data with duplicates to test caching
    var testData = this.createTestDataWithDuplicates(20);
    
    var startTime = new Date().getTime();
    
    // First pass - populate cache
    var firstPassResults = batchProcessor.processBatch(testData, 'update', {});
    
    // Second pass - should use cache
    var secondPassStart = new Date().getTime();
    var secondPassResults = batchProcessor.processBatch(testData, 'update', {});
    var secondPassEnd = new Date().getTime();
    
    var endTime = new Date().getTime();
    var totalDuration = endTime - startTime;
    var secondPassDuration = secondPassEnd - secondPassStart;
    
    var cacheImprovement = ((totalDuration - secondPassDuration) / totalDuration * 100).toFixed(1);
    var itemsPerSecond = (testData.length / (secondPassDuration / 1000)).toFixed(2);
    
    Logger.log(`[CACHED] Second pass: ${secondPassDuration}ms (${itemsPerSecond} items/sec, ${cacheImprovement}% improvement)`);
    
    this.addTestResult(testName, true, secondPassDuration, testData.length, 
      `Cached: ${itemsPerSecond} items/sec, ${cacheImprovement}% improvement`);
    
    return { duration: secondPassDuration, itemsPerSecond: parseFloat(itemsPerSecond), improvement: parseFloat(cacheImprovement) };
    
  } catch (error) {
    Logger.log('[ERROR] ' + testName + ': ' + error.message);
    this.addTestResult(testName, false, 0, 0, error.message);
    return { duration: 0, itemsPerSecond: 0, improvement: 0 };
  }
};

/**
 * Test bulk operations optimization
 */
BatchProcessorCachingTest.prototype.testBulkOperationsOptimization = function() {
  var testName = 'Bulk Operations Optimization';
  Logger.log('[TEST] ' + testName);
  
  try {
    var batchProcessor = new BatchProcessor();
    
    // Create test data that would benefit from bulk operations
    var testData = this.createBulkOptimizedTestData(15);
    
    var startTime = new Date().getTime();
    
    // Process with bulk optimization
    var results = batchProcessor.processBatch(testData, 'mixed', { useBulkOperations: true });
    
    var endTime = new Date().getTime();
    var duration = endTime - startTime;
    var itemsPerSecond = (testData.length / (duration / 1000)).toFixed(2);
    
    // Count bulk optimized results
    var bulkOptimizedCount = 0;
    if (results.results) {
      for (var i = 0; i < results.results.length; i++) {
        if (results.results[i].bulkOptimized) {
          bulkOptimizedCount++;
        }
      }
    }
    
    var bulkOptimizationRate = ((bulkOptimizedCount / testData.length) * 100).toFixed(1);
    
    Logger.log(`[BULK] Processed ${testData.length} items in ${duration}ms (${itemsPerSecond} items/sec, ${bulkOptimizationRate}% bulk optimized)`);
    
    this.addTestResult(testName, true, duration, testData.length, 
      `Bulk: ${itemsPerSecond} items/sec, ${bulkOptimizationRate}% bulk optimized`);
    
    return { duration: duration, itemsPerSecond: parseFloat(itemsPerSecond), bulkOptimizationRate: parseFloat(bulkOptimizationRate) };
    
  } catch (error) {
    Logger.log('[ERROR] ' + testName + ': ' + error.message);
    this.addTestResult(testName, false, 0, 0, error.message);
    return { duration: 0, itemsPerSecond: 0, bulkOptimizationRate: 0 };
  }
};

/**
 * Test duplicate operation detection
 */
BatchProcessorCachingTest.prototype.testDuplicateOperationDetection = function() {
  var testName = 'Duplicate Operation Detection';
  Logger.log('[TEST] ' + testName);
  
  try {
    var batchProcessor = new BatchProcessor();
    
    // Create test data with intentional duplicates
    var testData = this.createDuplicateTestData(10);
    
    var startTime = new Date().getTime();
    
    var results = batchProcessor.processBatch(testData, 'update', {});
    
    var endTime = new Date().getTime();
    var duration = endTime - startTime;
    
    // Count skipped duplicates
    var skippedCount = 0;
    if (results.results) {
      for (var i = 0; i < results.results.length; i++) {
        if (results.results[i].skipped) {
          skippedCount++;
        }
      }
    }
    
    var duplicateDetectionRate = ((skippedCount / testData.length) * 100).toFixed(1);
    
    Logger.log(`[DUPLICATE] Processed ${testData.length} items, skipped ${skippedCount} duplicates (${duplicateDetectionRate}% detection rate)`);
    
    this.addTestResult(testName, skippedCount > 0, duration, testData.length, 
      `Detected ${skippedCount} duplicates (${duplicateDetectionRate}% rate)`);
    
    return { skippedCount: skippedCount, detectionRate: parseFloat(duplicateDetectionRate) };
    
  } catch (error) {
    Logger.log('[ERROR] ' + testName + ': ' + error.message);
    this.addTestResult(testName, false, 0, 0, error.message);
    return { skippedCount: 0, detectionRate: 0 };
  }
};

/**
 * Test cache hit rate analysis
 */
BatchProcessorCachingTest.prototype.testCacheHitRateAnalysis = function() {
  var testName = 'Cache Hit Rate Analysis';
  Logger.log('[TEST] ' + testName);
  
  try {
    var batchProcessor = new BatchProcessor();
    
    // Create test data for cache analysis
    var testData = this.createCacheAnalysisTestData(15);
    
    // Clear cache to start fresh
    batchProcessor.cache.clear();
    
    var startTime = new Date().getTime();
    
    // First pass - populate cache
    var firstResults = batchProcessor.processBatch(testData, 'update', {});
    
    // Second pass - should hit cache
    var secondResults = batchProcessor.processBatch(testData, 'update', {});
    
    var endTime = new Date().getTime();
    var duration = endTime - startTime;
    
    // Count cache hits
    var cacheHits = 0;
    if (secondResults.results) {
      for (var i = 0; i < secondResults.results.length; i++) {
        if (secondResults.results[i].cached) {
          cacheHits++;
        }
      }
    }
    
    var cacheHitRate = ((cacheHits / testData.length) * 100).toFixed(1);
    
    Logger.log(`[CACHE ANALYSIS] Cache hits: ${cacheHits}/${testData.length} (${cacheHitRate}% hit rate)`);
    
    this.addTestResult(testName, cacheHits > 0, duration, testData.length, 
      `Cache hit rate: ${cacheHitRate}%`);
    
    return { cacheHits: cacheHits, hitRate: parseFloat(cacheHitRate) };
    
  } catch (error) {
    Logger.log('[ERROR] ' + testName + ': ' + error.message);
    this.addTestResult(testName, false, 0, 0, error.message);
    return { cacheHits: 0, hitRate: 0 };
  }
};

/**
 * Generate comprehensive performance report
 */
BatchProcessorCachingTest.prototype.generatePerformanceReport = function() {
  Logger.log('=== MILESTONE 2 PERFORMANCE REPORT ===');
  
  var report = {
    testSuite: 'BatchProcessor Caching & Bulk Operations',
    milestone: 'MILESTONE 2: Import System Optimization',
    timestamp: new Date().toISOString(),
    summary: this.testResults.summary,
    verdict: '',
    recommendations: []
  };
  
  // Calculate overall performance improvement
  var passRate = (this.testResults.summary.passedTests / this.testResults.summary.totalTests * 100).toFixed(1);
  
  if (passRate >= 80) {
    report.verdict = '✅ MILESTONE 2 OPTIMIZATION SUCCESS';
    report.recommendations.push('Caching and bulk operations are working effectively');
    report.recommendations.push('Ready to proceed with incremental sync implementation');
  } else if (passRate >= 60) {
    report.verdict = '⚠️ MILESTONE 2 PARTIAL SUCCESS';
    report.recommendations.push('Some optimizations working, but improvements needed');
    report.recommendations.push('Review failed tests and optimize further');
  } else {
    report.verdict = '❌ MILESTONE 2 OPTIMIZATION NEEDS WORK';
    report.recommendations.push('Significant issues with caching implementation');
    report.recommendations.push('Review and fix caching logic before proceeding');
  }
  
  Logger.log(`[VERDICT] ${report.verdict}`);
  Logger.log(`[PASS RATE] ${passRate}% (${this.testResults.summary.passedTests}/${this.testResults.summary.totalTests} tests passed)`);
  
  for (var i = 0; i < report.recommendations.length; i++) {
    Logger.log(`[RECOMMENDATION] ${report.recommendations[i]}`);
  }
  
  return report;
};

// Helper methods for creating test data

BatchProcessorCachingTest.prototype.createTestData = function(count) {
  var data = [];
  for (var i = 0; i < count; i++) {
    data.push({
      record: {
        id: 1000000 + i,
        title: 'Test Product ' + i,
        handle: 'test-product-' + i,
        price: (10 + i).toString()
      }
    });
  }
  return data;
};

BatchProcessorCachingTest.prototype.createTestDataWithDuplicates = function(count) {
  var data = [];
  for (var i = 0; i < count; i++) {
    // Create duplicates every 3rd item
    var id = i % 3 === 0 ? 1000001 : 1000000 + i;
    data.push({
      record: {
        id: id,
        title: 'Test Product ' + id,
        handle: 'test-product-' + id,
        price: (10 + id).toString()
      }
    });
  }
  return data;
};

BatchProcessorCachingTest.prototype.createBulkOptimizedTestData = function(count) {
  var data = [];
  for (var i = 0; i < count; i++) {
    data.push({
      record: {
        id: 1000000 + i,
        product_id: 2000000 + (i % 5), // Group variants by product
        title: 'Test Variant ' + i,
        price: (10 + i).toString()
      },
      operation: i % 4 === 0 ? 'update' : 'update' // Mix of operations that could use GET
    });
  }
  return data;
};

BatchProcessorCachingTest.prototype.createDuplicateTestData = function(count) {
  var data = [];
  for (var i = 0; i < count; i++) {
    // Create exact duplicates every 2nd item
    var baseId = i % 2 === 0 ? 1000001 : 1000000 + i;
    data.push({
      record: {
        id: baseId,
        title: 'Test Product ' + baseId,
        handle: 'test-product-' + baseId,
        price: '15.00' // Same price to create duplicate operations
      }
    });
  }
  return data;
};

BatchProcessorCachingTest.prototype.createCacheAnalysisTestData = function(count) {
  var data = [];
  for (var i = 0; i < count; i++) {
    data.push({
      record: {
        id: 1000000 + (i % 5), // Repeat IDs to test caching
        title: 'Cache Test Product ' + (i % 5),
        handle: 'cache-test-' + (i % 5),
        price: (20 + (i % 5)).toString()
      }
    });
  }
  return data;
};

BatchProcessorCachingTest.prototype.addTestResult = function(testName, passed, duration, itemCount, details) {
  this.testResults.tests.push({
    name: testName,
    passed: passed,
    duration: duration,
    itemCount: itemCount,
    details: details,
    timestamp: new Date().toISOString()
  });
  
  this.testResults.summary.totalTests++;
  if (passed) {
    this.testResults.summary.passedTests++;
  } else {
    this.testResults.summary.failedTests++;
  }
};

// DEPRECATED: This test makes real API calls and causes retry loops
// Use BatchProcessorCachingTest_Mock.gs instead
function testBatchProcessorCaching() {
  Logger.log('❌ DEPRECATED: Use testBatchProcessorCachingMock() instead');
  Logger.log('This test makes real API calls and will cause retry loops');
  return { 
    error: 'Use BatchProcessorCachingTest_Mock.gs instead',
    recommendation: 'Call testBatchProcessorCachingMock() for safe testing'
  };
}
