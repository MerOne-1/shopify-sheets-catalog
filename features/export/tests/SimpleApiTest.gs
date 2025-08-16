// Simple API Test to validate API vs System performance
// This test can be run directly without dependencies

function SimpleApiTest() {
  this.results = [];
}

/**
 * Run a simple API performance test
 */
SimpleApiTest.prototype.runTest = function() {
  Logger.log('=== SIMPLE API PERFORMANCE TEST ===');
  
  try {
    // Test 1: API Response Time
    this.testApiResponseTime();
    
    // Test 2: System Processing Time
    this.testSystemProcessing();
    
    // Test 3: Compare Results
    this.compareResults();
    
    return this.results;
    
  } catch (error) {
    Logger.log(`Test failed: ${error.message}`);
    return { error: error.message };
  }
};

/**
 * Test API response time
 */
SimpleApiTest.prototype.testApiResponseTime = function() {
  Logger.log('[TEST 1] Testing API response time...');
  
  try {
    var apiClient = new ApiClient();
    var startTime = new Date().getTime();
    
    // Make a single API call
    var response = apiClient.makeRequest('products/count.json', 'GET');
    
    var endTime = new Date().getTime();
    var apiTime = endTime - startTime;
    
    this.results.push({
      test: 'API_RESPONSE_TIME',
      duration: apiTime,
      success: true,
      details: `API call took ${apiTime}ms`
    });
    
    Logger.log(`[TEST 1] API Response: ${apiTime}ms`);
    
  } catch (error) {
    this.results.push({
      test: 'API_RESPONSE_TIME',
      duration: 0,
      success: false,
      error: error.message
    });
    
    Logger.log(`[TEST 1] API Test failed: ${error.message}`);
  }
};

/**
 * Test system processing time
 */
SimpleApiTest.prototype.testSystemProcessing = function() {
  Logger.log('[TEST 2] Testing system processing time...');
  
  try {
    var startTime = new Date().getTime();
    
    // Simulate processing 100 mock records
    var mockData = [];
    for (var i = 0; i < 100; i++) {
      mockData.push({
        id: i,
        title: `Product ${i}`,
        handle: `product-${i}`,
        vendor: 'Test Vendor',
        status: 'active'
      });
    }
    
    // Process the data (hash calculation simulation)
    var processedData = [];
    for (var i = 0; i < mockData.length; i++) {
      var item = mockData[i];
      var hash = this.calculateSimpleHash(item);
      processedData.push({
        ...item,
        hash: hash
      });
    }
    
    var endTime = new Date().getTime();
    var processingTime = endTime - startTime;
    var timePerItem = processingTime / mockData.length;
    
    this.results.push({
      test: 'SYSTEM_PROCESSING_TIME',
      duration: processingTime,
      timePerItem: timePerItem,
      itemsProcessed: mockData.length,
      success: true,
      details: `Processed ${mockData.length} items in ${processingTime}ms (${timePerItem.toFixed(2)}ms per item)`
    });
    
    Logger.log(`[TEST 2] System Processing: ${processingTime}ms for ${mockData.length} items (${timePerItem.toFixed(2)}ms per item)`);
    
  } catch (error) {
    this.results.push({
      test: 'SYSTEM_PROCESSING_TIME',
      duration: 0,
      success: false,
      error: error.message
    });
    
    Logger.log(`[TEST 2] System test failed: ${error.message}`);
  }
};

/**
 * Compare API vs System performance
 */
SimpleApiTest.prototype.compareResults = function() {
  Logger.log('[TEST 3] Comparing API vs System performance...');
  
  var apiResult = this.results.find(r => r.test === 'API_RESPONSE_TIME');
  var systemResult = this.results.find(r => r.test === 'SYSTEM_PROCESSING_TIME');
  
  if (!apiResult || !systemResult) {
    Logger.log('[TEST 3] Cannot compare - missing test results');
    return;
  }
  
  var apiTime = apiResult.success ? apiResult.duration : 0;
  var systemTimePerItem = systemResult.success ? systemResult.timePerItem : 0;
  
  // Calculate bottleneck analysis
  var totalTimePerItem = apiTime + systemTimePerItem;
  var apiBottleneckPercent = totalTimePerItem > 0 ? (apiTime / totalTimePerItem) * 100 : 0;
  var systemBottleneckPercent = totalTimePerItem > 0 ? (systemTimePerItem / totalTimePerItem) * 100 : 0;
  
  var primaryBottleneck = apiBottleneckPercent > systemBottleneckPercent ? 'API' : 'SYSTEM';
  
  // Estimate time for 1000 products
  var estimatedApiTimeFor1000 = apiTime * 1000; // 1000 individual API calls
  var estimatedSystemTimeFor1000 = systemTimePerItem * 1000;
  var totalEstimatedTime = estimatedApiTimeFor1000 + estimatedSystemTimeFor1000;
  
  this.results.push({
    test: 'PERFORMANCE_COMPARISON',
    success: true,
    analysis: {
      apiTime: apiTime,
      systemTimePerItem: systemTimePerItem,
      apiBottleneckPercent: Math.round(apiBottleneckPercent),
      systemBottleneckPercent: Math.round(systemBottleneckPercent),
      primaryBottleneck: primaryBottleneck,
      estimatedTimeFor1000Products: {
        apiTime: Math.round(estimatedApiTimeFor1000 / 1000), // seconds
        systemTime: Math.round(estimatedSystemTimeFor1000 / 1000), // seconds
        totalTime: Math.round(totalEstimatedTime / 1000), // seconds
        totalMinutes: Math.round(totalEstimatedTime / 60000) // minutes
      }
    }
  });
  
  Logger.log('=== PERFORMANCE ANALYSIS RESULTS ===');
  Logger.log(`API Response Time: ${apiTime}ms`);
  Logger.log(`System Processing: ${systemTimePerItem.toFixed(2)}ms per item`);
  Logger.log(`Primary Bottleneck: ${primaryBottleneck} (${Math.round(Math.max(apiBottleneckPercent, systemBottleneckPercent))}%)`);
  Logger.log(`Estimated time for 1000 products: ${Math.round(totalEstimatedTime / 60000)} minutes`);
  
  if (primaryBottleneck === 'API') {
    Logger.log('🎯 VERDICT: API is the primary bottleneck - focus on bulk operations and caching');
  } else {
    Logger.log('🎯 VERDICT: System processing is the primary bottleneck - focus on algorithm optimization');
  }
};

/**
 * Simple hash calculation for testing
 */
SimpleApiTest.prototype.calculateSimpleHash = function(item) {
  var str = JSON.stringify(item);
  var hash = 0;
  for (var i = 0; i < str.length; i++) {
    var char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
};

/**
 * Quick test function for manual execution
 */
function runSimpleApiTest() {
  var test = new SimpleApiTest();
  return test.runTest();
}

/**
 * Test API connection only
 */
function testApiConnection() {
  try {
    var apiClient = new ApiClient();
    return apiClient.testConnection();
  } catch (error) {
    Logger.log(`API connection test failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}
