// API Performance Isolation Test
// Tests to isolate Shopify API performance from our system performance
// Measures API response times, rate limiting, and system processing separately

function ApiPerformanceIsolationTest() {
  this.testResults = [];
  this.apiClient = new ApiClient();
  this.configManager = new ConfigManager();
}

/**
 * Run comprehensive API performance isolation tests
 */
ApiPerformanceIsolationTest.prototype.runCompleteTest = function() {
  Logger.log('=== API PERFORMANCE ISOLATION TEST STARTING ===');
  
  try {
    // Test 1: Pure API response time measurement
    this.testPureApiResponseTime();
    
    // Test 2: Rate limiting detection and measurement
    this.testRateLimitingBehavior();
    
    // Test 3: System processing time (no API calls)
    this.testSystemProcessingTime();
    
    // Test 4: Comparative analysis
    this.testComparativeAnalysis();
    
    // Generate performance analysis report
    this.generatePerformanceReport();
    
  } catch (error) {
    Logger.log(`[ApiPerformanceIsolationTest] Critical error: ${error.message}`);
    this.testResults.push({
      test: 'CRITICAL_ERROR',
      status: 'FAILED',
      error: error.message,
      timestamp: new Date()
    });
  }
};

/**
 * Test 1: Pure API response time measurement
 * Measures only the time taken for API calls without any processing
 */
ApiPerformanceIsolationTest.prototype.testPureApiResponseTime = function() {
  Logger.log('[TEST 1] Measuring pure API response times...');
  
  try {
    var apiTimes = [];
    var testCalls = 5; // Test with 5 API calls
    
    for (var i = 0; i < testCalls; i++) {
      var startTime = new Date().getTime();
      
      try {
        // Make a simple API call to get product count
        var response = this.apiClient.makeRequest('products/count.json', 'GET');
        
        var endTime = new Date().getTime();
        var apiTime = endTime - startTime;
        
        apiTimes.push({
          callNumber: i + 1,
          responseTime: apiTime,
          success: true,
          statusCode: response ? response.status : 'unknown'
        });
        
        Logger.log(`API Call ${i + 1}: ${apiTime}ms`);
        
        // Small delay to avoid overwhelming the API
        Utilities.sleep(1000);
        
      } catch (apiError) {
        var endTime = new Date().getTime();
        var apiTime = endTime - startTime;
        
        apiTimes.push({
          callNumber: i + 1,
          responseTime: apiTime,
          success: false,
          error: apiError.message,
          isRateLimit: apiError.message && apiError.message.includes('429')
        });
        
        Logger.log(`API Call ${i + 1}: FAILED after ${apiTime}ms - ${apiError.message}`);
      }
    }
    
    // Calculate statistics
    var successfulCalls = apiTimes.filter(call => call.success);
    var avgResponseTime = successfulCalls.length > 0 ? 
      successfulCalls.reduce((sum, call) => sum + call.responseTime, 0) / successfulCalls.length : 0;
    var maxResponseTime = Math.max(...apiTimes.map(call => call.responseTime));
    var minResponseTime = Math.min(...apiTimes.map(call => call.responseTime));
    
    this.testResults.push({
      test: 'PURE_API_RESPONSE_TIME',
      status: successfulCalls.length > 0 ? 'PASSED' : 'FAILED',
      details: {
        totalCalls: testCalls,
        successfulCalls: successfulCalls.length,
        avgResponseTime: Math.round(avgResponseTime),
        maxResponseTime: maxResponseTime,
        minResponseTime: minResponseTime,
        callDetails: apiTimes
      },
      timestamp: new Date()
    });
    
    Logger.log(`[TEST 1] Average API Response Time: ${Math.round(avgResponseTime)}ms`);
    
  } catch (error) {
    this.testResults.push({
      test: 'PURE_API_RESPONSE_TIME',
      status: 'FAILED',
      error: error.message,
      timestamp: new Date()
    });
    Logger.log(`[TEST 1] FAILED - ${error.message}`);
  }
};

/**
 * Test 2: Rate limiting detection and measurement
 */
ApiPerformanceIsolationTest.prototype.testRateLimitingBehavior = function() {
  Logger.log('[TEST 2] Testing rate limiting behavior...');
  
  try {
    var rateLimitData = [];
    var rapidCalls = 10; // Make rapid calls to trigger rate limiting
    
    var startTime = new Date().getTime();
    
    for (var i = 0; i < rapidCalls; i++) {
      var callStart = new Date().getTime();
      
      try {
        var response = this.apiClient.makeRequest('products/count.json', 'GET');
        var callEnd = new Date().getTime();
        
        rateLimitData.push({
          callNumber: i + 1,
          responseTime: callEnd - callStart,
          success: true,
          rateLimited: false
        });
        
      } catch (error) {
        var callEnd = new Date().getTime();
        var isRateLimit = error.message && (error.message.includes('429') || error.message.includes('rate'));
        
        rateLimitData.push({
          callNumber: i + 1,
          responseTime: callEnd - callStart,
          success: false,
          rateLimited: isRateLimit,
          error: error.message
        });
        
        if (isRateLimit) {
          Logger.log(`Rate limit hit at call ${i + 1}`);
          break; // Stop when we hit rate limit
        }
      }
    }
    
    var totalTime = new Date().getTime() - startTime;
    var rateLimitedCalls = rateLimitData.filter(call => call.rateLimited).length;
    var successfulCalls = rateLimitData.filter(call => call.success).length;
    var callsPerSecond = successfulCalls / (totalTime / 1000);
    
    this.testResults.push({
      test: 'RATE_LIMITING_BEHAVIOR',
      status: 'PASSED', // Always passes as it's measuring behavior
      details: {
        totalCalls: rateLimitData.length,
        successfulCalls: successfulCalls,
        rateLimitedCalls: rateLimitedCalls,
        totalTime: totalTime,
        callsPerSecond: Math.round(callsPerSecond * 100) / 100,
        rateLimitThreshold: successfulCalls,
        callDetails: rateLimitData
      },
      timestamp: new Date()
    });
    
    Logger.log(`[TEST 2] Rate limit threshold: ${successfulCalls} calls, ${Math.round(callsPerSecond * 100) / 100} calls/second`);
    
  } catch (error) {
    this.testResults.push({
      test: 'RATE_LIMITING_BEHAVIOR',
      status: 'FAILED',
      error: error.message,
      timestamp: new Date()
    });
    Logger.log(`[TEST 2] FAILED - ${error.message}`);
  }
};

/**
 * Test 3: System processing time (no API calls)
 * Measures our internal processing without any API interaction
 */
ApiPerformanceIsolationTest.prototype.testSystemProcessingTime = function() {
  Logger.log('[TEST 3] Measuring system processing time...');
  
  try {
    // Create mock data similar to API responses
    var mockProducts = this.createMockProductData(100);
    var processingTimes = [];
    
    // Test 1: Hash calculation performance
    var hashStart = new Date().getTime();
    var validationEngine = new ValidationEngine();
    
    for (var i = 0; i < mockProducts.length; i++) {
      var hash = validationEngine.calculateHash(mockProducts[i]);
    }
    
    var hashEnd = new Date().getTime();
    var hashTime = hashEnd - hashStart;
    processingTimes.push({ operation: 'hash_calculation', time: hashTime, itemsProcessed: mockProducts.length });
    
    // Test 2: Data transformation performance
    var transformStart = new Date().getTime();
    
    var transformedData = mockProducts.map(function(product) {
      return {
        id: product.id,
        title: product.title,
        handle: product.handle,
        vendor: product.vendor,
        product_type: product.product_type,
        tags: product.tags,
        status: product.status
      };
    });
    
    var transformEnd = new Date().getTime();
    var transformTime = transformEnd - transformStart;
    processingTimes.push({ operation: 'data_transformation', time: transformTime, itemsProcessed: mockProducts.length });
    
    // Test 3: Sheet writing simulation (without actual writing)
    var sheetStart = new Date().getTime();
    
    var sheetData = [];
    for (var i = 0; i < transformedData.length; i++) {
      var row = Object.values(transformedData[i]);
      sheetData.push(row);
    }
    
    var sheetEnd = new Date().getTime();
    var sheetTime = sheetEnd - sheetStart;
    processingTimes.push({ operation: 'sheet_preparation', time: sheetTime, itemsProcessed: mockProducts.length });
    
    var totalProcessingTime = processingTimes.reduce((sum, op) => sum + op.time, 0);
    var avgTimePerItem = totalProcessingTime / mockProducts.length;
    
    this.testResults.push({
      test: 'SYSTEM_PROCESSING_TIME',
      status: 'PASSED',
      details: {
        totalItems: mockProducts.length,
        totalProcessingTime: totalProcessingTime,
        avgTimePerItem: Math.round(avgTimePerItem * 100) / 100,
        operationBreakdown: processingTimes
      },
      timestamp: new Date()
    });
    
    Logger.log(`[TEST 3] System processing: ${totalProcessingTime}ms for ${mockProducts.length} items (${Math.round(avgTimePerItem * 100) / 100}ms per item)`);
    
  } catch (error) {
    this.testResults.push({
      test: 'SYSTEM_PROCESSING_TIME',
      status: 'FAILED',
      error: error.message,
      timestamp: new Date()
    });
    Logger.log(`[TEST 3] FAILED - ${error.message}`);
  }
};

/**
 * Test 4: Comparative analysis
 * Compares API time vs system processing time
 */
ApiPerformanceIsolationTest.prototype.testComparativeAnalysis = function() {
  Logger.log('[TEST 4] Running comparative analysis...');
  
  try {
    var apiResult = this.testResults.find(r => r.test === 'PURE_API_RESPONSE_TIME');
    var systemResult = this.testResults.find(r => r.test === 'SYSTEM_PROCESSING_TIME');
    var rateLimitResult = this.testResults.find(r => r.test === 'RATE_LIMITING_BEHAVIOR');
    
    if (!apiResult || !systemResult || !rateLimitResult) {
      throw new Error('Previous tests must complete before comparative analysis');
    }
    
    var avgApiTime = apiResult.details.avgResponseTime || 0;
    var avgSystemTime = systemResult.details.avgTimePerItem || 0;
    var maxCallsPerSecond = rateLimitResult.details.callsPerSecond || 0;
    
    // Calculate bottleneck percentages
    var totalTimePerItem = avgApiTime + avgSystemTime;
    var apiBottleneckPercent = (avgApiTime / totalTimePerItem) * 100;
    var systemBottleneckPercent = (avgSystemTime / totalTimePerItem) * 100;
    
    // Estimate time for 1000 products with current constraints
    var itemsPerApiCall = 1; // Assuming 1 product per API call (worst case)
    var totalApiCalls = 1000;
    var timeWithoutRateLimit = (totalApiCalls * avgApiTime) / 1000; // in seconds
    var timeWithRateLimit = totalApiCalls / maxCallsPerSecond; // in seconds
    var actualApiTime = Math.max(timeWithoutRateLimit, timeWithRateLimit);
    var systemProcessingTime = (1000 * avgSystemTime) / 1000; // in seconds
    var totalEstimatedTime = actualApiTime + systemProcessingTime;
    
    this.testResults.push({
      test: 'COMPARATIVE_ANALYSIS',
      status: 'PASSED',
      details: {
        avgApiTimeMs: avgApiTime,
        avgSystemTimeMs: avgSystemTime,
        apiBottleneckPercent: Math.round(apiBottleneckPercent),
        systemBottleneckPercent: Math.round(systemBottleneckPercent),
        maxCallsPerSecond: maxCallsPerSecond,
        estimatedTimeFor1000Products: {
          apiTimeSeconds: Math.round(actualApiTime),
          systemTimeSeconds: Math.round(systemProcessingTime),
          totalTimeSeconds: Math.round(totalEstimatedTime),
          totalTimeMinutes: Math.round(totalEstimatedTime / 60),
          primaryBottleneck: apiBottleneckPercent > systemBottleneckPercent ? 'API' : 'SYSTEM'
        }
      },
      timestamp: new Date()
    });
    
    Logger.log(`[TEST 4] Primary bottleneck: ${apiBottleneckPercent > systemBottleneckPercent ? 'API' : 'SYSTEM'} (${Math.round(Math.max(apiBottleneckPercent, systemBottleneckPercent))}%)`);
    Logger.log(`[TEST 4] Estimated time for 1000 products: ${Math.round(totalEstimatedTime / 60)} minutes`);
    
  } catch (error) {
    this.testResults.push({
      test: 'COMPARATIVE_ANALYSIS',
      status: 'FAILED',
      error: error.message,
      timestamp: new Date()
    });
    Logger.log(`[TEST 4] FAILED - ${error.message}`);
  }
};

/**
 * Generate comprehensive performance report
 */
ApiPerformanceIsolationTest.prototype.generatePerformanceReport = function() {
  Logger.log('=== API PERFORMANCE ISOLATION TEST RESULTS ===');
  
  var passedTests = 0;
  var totalTests = this.testResults.length;
  
  for (var i = 0; i < this.testResults.length; i++) {
    var result = this.testResults[i];
    Logger.log(`${result.test}: ${result.status}`);
    
    if (result.status === 'PASSED') {
      passedTests++;
    }
    
    // Detailed reporting for each test
    if (result.test === 'PURE_API_RESPONSE_TIME' && result.details) {
      Logger.log(`  Average API Response: ${result.details.avgResponseTime}ms`);
      Logger.log(`  Range: ${result.details.minResponseTime}ms - ${result.details.maxResponseTime}ms`);
      Logger.log(`  Success Rate: ${result.details.successfulCalls}/${result.details.totalCalls}`);
    }
    
    if (result.test === 'RATE_LIMITING_BEHAVIOR' && result.details) {
      Logger.log(`  Rate Limit: ${result.details.callsPerSecond} calls/second`);
      Logger.log(`  Threshold: ${result.details.rateLimitThreshold} successful calls`);
    }
    
    if (result.test === 'SYSTEM_PROCESSING_TIME' && result.details) {
      Logger.log(`  Processing Speed: ${result.details.avgTimePerItem}ms per item`);
      Logger.log(`  Total for ${result.details.totalItems} items: ${result.details.totalProcessingTime}ms`);
    }
    
    if (result.test === 'COMPARATIVE_ANALYSIS' && result.details) {
      Logger.log(`  PRIMARY BOTTLENECK: ${result.details.estimatedTimeFor1000Products.primaryBottleneck}`);
      Logger.log(`  API Impact: ${result.details.apiBottleneckPercent}%`);
      Logger.log(`  System Impact: ${result.details.systemBottleneckPercent}%`);
      Logger.log(`  Est. 1000 products: ${result.details.estimatedTimeFor1000Products.totalTimeMinutes} minutes`);
    }
    
    if (result.error) {
      Logger.log(`  Error: ${result.error}`);
    }
  }
  
  var successRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
  
  Logger.log('=== PERFORMANCE ANALYSIS SUMMARY ===');
  Logger.log(`Tests Completed: ${passedTests}/${totalTests} (${successRate.toFixed(1)}%)`);
  
  // Find the comparative analysis for final verdict
  var comparativeResult = this.testResults.find(r => r.test === 'COMPARATIVE_ANALYSIS');
  if (comparativeResult && comparativeResult.details) {
    var bottleneck = comparativeResult.details.estimatedTimeFor1000Products.primaryBottleneck;
    Logger.log(`🎯 VERDICT: ${bottleneck} is the primary performance bottleneck`);
    
    if (bottleneck === 'API') {
      Logger.log('📊 RECOMMENDATION: Focus on API optimization strategies (bulk operations, caching, rate limit handling)');
    } else {
      Logger.log('📊 RECOMMENDATION: Focus on system optimization (algorithm efficiency, data structures, processing logic)');
    }
  }
  
  return {
    success: successRate >= 75, // Consider successful if 75% of tests pass
    passedTests: passedTests,
    totalTests: totalTests,
    successRate: successRate,
    results: this.testResults
  };
};

/**
 * Helper function to create mock product data for testing
 */
ApiPerformanceIsolationTest.prototype.createMockProductData = function(count) {
  var mockProducts = [];
  
  for (var i = 1; i <= count; i++) {
    mockProducts.push({
      id: 1000000 + i,
      title: `Test Product ${i}`,
      handle: `test-product-${i}`,
      vendor: `Vendor ${i % 10}`,
      product_type: `Type ${i % 5}`,
      tags: `tag1, tag2, tag${i % 3}`,
      status: i % 2 === 0 ? 'active' : 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }
  
  return mockProducts;
};

/**
 * Quick test function for manual execution
 */
function testApiPerformanceIsolation() {
  var test = new ApiPerformanceIsolationTest();
  return test.runCompleteTest();
}

/**
 * Test only API response times
 */
function testApiResponseTimeOnly() {
  var test = new ApiPerformanceIsolationTest();
  test.testPureApiResponseTime();
  return test.testResults;
}

/**
 * Test only system processing
 */
function testSystemProcessingOnly() {
  var test = new ApiPerformanceIsolationTest();
  test.testSystemProcessingTime();
  return test.testResults;
}
