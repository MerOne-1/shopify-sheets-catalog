/**
 * Detailed Timing Profiler
 * Identifies exact bottleneck causing 77s export time
 */

function createTimingProfiler() {
  Logger.log('=== DETAILED TIMING PROFILER ===');
  Logger.log('Adding precise timing logs to identify 77s bottleneck');
  Logger.log('');
  
  try {
    Logger.log('1. PROFILER STRATEGY...');
    Logger.log('   Target: Identify where 77s is spent in export process');
    Logger.log('   Method: Add start/end timestamps to each major operation');
    Logger.log('   Focus areas:');
    Logger.log('   - BatchProcessor.processAllBatches()');
    Logger.log('   - BatchProcessor.processBatch()'); 
    Logger.log('   - BatchProcessor.processItem()');
    Logger.log('   - RetryManager.executeWithRetry()');
    Logger.log('   - ApiClient API calls');
    
    Logger.log('');
    Logger.log('2. TIMING INSTRUMENTATION NEEDED...');
    Logger.log('   Add to BatchProcessor.processItem():');
    Logger.log('   - Start time before API call');
    Logger.log('   - End time after API call');
    Logger.log('   - Log individual item processing time');
    
    Logger.log('');
    Logger.log('3. SUSPECTED BOTTLENECKS...');
    Logger.log('   Most likely causes of 77s delay:');
    Logger.log('   - API timeout/retry loops (RetryManager)');
    Logger.log('   - Network latency per API call');
    Logger.log('   - Hidden delays in UrlFetchApp.fetch()');
    Logger.log('   - Sequential processing overhead');
    Logger.log('   - Rate limiting delays accumulating');
    
    return {
      strategy: 'Add timing logs to identify bottleneck',
      targetAreas: ['BatchProcessor', 'RetryManager', 'ApiClient'],
      expectedFindings: 'API calls or retry logic causing delays'
    };
    
  } catch (error) {
    Logger.log('❌ TIMING PROFILER CREATION FAILED: ' + error.message);
    return { error: error.message };
  }
}

/**
 * Add timing instrumentation to BatchProcessor
 */
function addBatchProcessorTiming() {
  Logger.log('=== ADDING BATCH PROCESSOR TIMING ===');
  Logger.log('Instrumenting BatchProcessor with detailed timing logs');
  Logger.log('');
  
  try {
    Logger.log('1. TIMING MODIFICATIONS NEEDED...');
    Logger.log('   File: BatchProcessor.gs');
    Logger.log('   Methods to instrument:');
    Logger.log('   - processAllBatches() - overall timing');
    Logger.log('   - processBatch() - per batch timing');
    Logger.log('   - processItem() - per item timing');
    Logger.log('   - buildApiCall() - API preparation timing');
    
    Logger.log('');
    Logger.log('2. SPECIFIC TIMING POINTS...');
    Logger.log('   processItem() timing:');
    Logger.log('   - Start: Before buildApiCall()');
    Logger.log('   - Middle: Before executeWithRetry()');
    Logger.log('   - End: After API response');
    Logger.log('   - Log: Individual item processing time');
    
    Logger.log('');
    Logger.log('3. EXPECTED TIMING BREAKDOWN...');
    Logger.log('   For 2 variants at 77s total:');
    Logger.log('   - Expected per item: ~38.5s each');
    Logger.log('   - Normal per item: ~0.6s each');
    Logger.log('   - Bottleneck: 64x slower per item');
    
    Logger.log('');
    Logger.log('4. TIMING LOG FORMAT...');
    Logger.log('   Suggested log format:');
    Logger.log('   [TIMING] processItem start: variant_id');
    Logger.log('   [TIMING] buildApiCall: Xms');
    Logger.log('   [TIMING] executeWithRetry start');
    Logger.log('   [TIMING] executeWithRetry end: Xms');
    Logger.log('   [TIMING] processItem total: Xms');
    
    return {
      instrumentationNeeded: true,
      targetFile: 'BatchProcessor.gs',
      expectedBottleneck: 'executeWithRetry or API calls'
    };
    
  } catch (error) {
    Logger.log('❌ BATCH PROCESSOR TIMING FAILED: ' + error.message);
    return { error: error.message };
  }
}

/**
 * Quick performance test with timing
 */
function quickPerformanceTest() {
  Logger.log('=== QUICK PERFORMANCE TEST ===');
  Logger.log('Testing individual components with timing');
  Logger.log('');
  
  try {
    var configManager = new ConfigManager();
    
    // Test 1: API response time
    Logger.log('1. TESTING API RESPONSE TIME...');
    var credentials = configManager.getShopifyCredentials();
    var testUrl = 'https://' + credentials.shopDomain + '/admin/api/' + credentials.apiVersion + '/shop.json';
    
    var startTime = new Date().getTime();
    var response = UrlFetchApp.fetch(testUrl, {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': credentials.accessToken,
        'Content-Type': 'application/json'
      },
      muteHttpExceptions: true
    });
    var endTime = new Date().getTime();
    var apiTime = endTime - startTime;
    
    Logger.log('   API call time: ' + apiTime + 'ms');
    Logger.log('   Status: ' + response.getResponseCode());
    
    // Test 2: Rate limit delay
    Logger.log('');
    Logger.log('2. TESTING RATE LIMIT DELAY...');
    var rateLimitDelay = parseInt(configManager.getConfigValue('rate_limit_delay'));
    Logger.log('   Configured delay: ' + rateLimitDelay + 'ms');
    
    var delayStart = new Date().getTime();
    Utilities.sleep(rateLimitDelay);
    var delayEnd = new Date().getTime();
    var actualDelay = delayEnd - delayStart;
    
    Logger.log('   Actual delay: ' + actualDelay + 'ms');
    
    // Test 3: Calculate bottleneck
    Logger.log('');
    Logger.log('3. BOTTLENECK CALCULATION...');
    var expectedPerItem = apiTime + rateLimitDelay;
    var expectedTotal = expectedPerItem * 2;
    var actualTotal = 77600; // 77.6s
    var unexplainedTime = actualTotal - expectedTotal;
    
    Logger.log('   Expected per item: ' + expectedPerItem + 'ms');
    Logger.log('   Expected total: ' + expectedTotal + 'ms');
    Logger.log('   Actual total: ' + actualTotal + 'ms');
    Logger.log('   Unexplained time: ' + unexplainedTime + 'ms (' + (unexplainedTime/1000).toFixed(1) + 's)');
    
    if (unexplainedTime > 70000) {
      Logger.log('   🚨 MAJOR BOTTLENECK: ' + (unexplainedTime/1000).toFixed(1) + 's unaccounted for');
      Logger.log('   Likely causes:');
      Logger.log('   - Retry loops with long delays');
      Logger.log('   - API timeouts or errors');
      Logger.log('   - Hidden processing delays');
    }
    
    return {
      apiTime: apiTime,
      rateLimitDelay: actualDelay,
      unexplainedTime: unexplainedTime,
      majorBottleneck: unexplainedTime > 70000
    };
    
  } catch (error) {
    Logger.log('❌ QUICK PERFORMANCE TEST FAILED: ' + error.message);
    return { error: error.message };
  }
}

/**
 * Complete timing analysis
 */
function runCompleteTimingAnalysis() {
  Logger.log('=== COMPLETE TIMING ANALYSIS ===');
  Logger.log('Comprehensive analysis of 77s export bottleneck');
  Logger.log('');
  
  // Create profiler strategy
  var profilerResult = createTimingProfiler();
  
  Logger.log('');
  
  // Analyze timing needs
  var timingResult = addBatchProcessorTiming();
  
  Logger.log('');
  
  // Quick performance test
  var perfResult = quickPerformanceTest();
  
  Logger.log('');
  Logger.log('=== TIMING ANALYSIS SUMMARY ===');
  
  if (perfResult.majorBottleneck) {
    Logger.log('🚨 MAJOR BOTTLENECK CONFIRMED');
    Logger.log('   Unexplained time: ' + (perfResult.unexplainedTime/1000).toFixed(1) + 's');
    Logger.log('   This indicates retry loops, timeouts, or hidden delays');
  }
  
  Logger.log('');
  Logger.log('IMMEDIATE ACTIONS:');
  Logger.log('1. Add detailed timing logs to BatchProcessor.processItem()');
  Logger.log('2. Monitor RetryManager for excessive retry attempts');
  Logger.log('3. Check for API timeout errors in logs');
  Logger.log('4. Consider implementing timeout limits on API calls');
  
  Logger.log('');
  Logger.log('NEXT EXPORT TEST:');
  Logger.log('Run export with timing logs to see exactly where 77s is spent');
  
  return {
    profilerStrategy: profilerResult,
    timingNeeds: timingResult,
    performanceTest: perfResult,
    majorBottleneckConfirmed: perfResult.majorBottleneck
  };
}
