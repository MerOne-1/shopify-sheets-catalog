/**
 * Performance Analysis Test
 * Analyzes export performance bottlenecks
 */

function analyzeExportPerformance() {
  Logger.log('=== EXPORT PERFORMANCE ANALYSIS ===');
  Logger.log('Analyzing export bottlenecks and timing');
  Logger.log('');
  
  try {
    var configManager = new ConfigManager();
    
    // Test 1: Configuration Analysis
    Logger.log('1. CONFIGURATION ANALYSIS...');
    var batchSize = configManager.getConfigValue('batch_size');
    var rateLimitDelay = configManager.getConfigValue('rate_limit_delay');
    var maxRetries = configManager.getConfigValue('max_retries');
    var retryBaseDelay = configManager.getConfigValue('retry_base_delay');
    
    Logger.log('   Batch Size: ' + batchSize);
    Logger.log('   Rate Limit Delay: ' + rateLimitDelay + 'ms');
    Logger.log('   Max Retries: ' + maxRetries);
    Logger.log('   Retry Base Delay: ' + retryBaseDelay + 'ms');
    
    // Calculate expected timing
    var expectedTimePerVariant = parseInt(rateLimitDelay) + 100; // API call + delay
    var expectedTotal = expectedTimePerVariant * 2; // 2 variants
    Logger.log('   Expected time for 2 variants: ~' + expectedTotal + 'ms (' + (expectedTotal/1000).toFixed(1) + 's)');
    Logger.log('   Actual time: 65.4s');
    Logger.log('   Performance ratio: ' + (65400/expectedTotal).toFixed(1) + 'x slower than expected');
    
    // Test 2: API Response Time Test
    Logger.log('');
    Logger.log('2. API RESPONSE TIME TEST...');
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
    var apiResponseTime = endTime - startTime;
    
    Logger.log('   Single API call time: ' + apiResponseTime + 'ms');
    Logger.log('   API Status: ' + response.getResponseCode());
    
    if (apiResponseTime > 5000) {
      Logger.log('   ⚠️ API response time is very slow (>5s)');
    } else if (apiResponseTime > 1000) {
      Logger.log('   ⚠️ API response time is slow (>1s)');
    } else {
      Logger.log('   ✅ API response time is normal');
    }
    
    // Test 3: Potential Bottlenecks
    Logger.log('');
    Logger.log('3. POTENTIAL BOTTLENECKS...');
    
    var bottlenecks = [];
    
    if (parseInt(rateLimitDelay) > 1000) {
      bottlenecks.push('Rate limit delay too high (' + rateLimitDelay + 'ms)');
    }
    
    if (parseInt(maxRetries) > 5) {
      bottlenecks.push('Too many retry attempts (' + maxRetries + ')');
    }
    
    if (parseInt(retryBaseDelay) > 2000) {
      bottlenecks.push('Retry delay too high (' + retryBaseDelay + 'ms)');
    }
    
    if (apiResponseTime > 2000) {
      bottlenecks.push('Slow API responses (' + apiResponseTime + 'ms)');
    }
    
    if (bottlenecks.length > 0) {
      Logger.log('   Found potential bottlenecks:');
      for (var i = 0; i < bottlenecks.length; i++) {
        Logger.log('   - ' + bottlenecks[i]);
      }
    } else {
      Logger.log('   No obvious configuration bottlenecks found');
    }
    
    // Test 4: Recommendations
    Logger.log('');
    Logger.log('4. PERFORMANCE RECOMMENDATIONS...');
    
    if (parseInt(rateLimitDelay) > 500) {
      Logger.log('   📋 Reduce rate_limit_delay from ' + rateLimitDelay + 'ms to 200ms');
    }
    
    if (parseInt(batchSize) < 50) {
      Logger.log('   📋 Increase batch_size from ' + batchSize + ' to 100 for better throughput');
    }
    
    if (apiResponseTime > 1000) {
      Logger.log('   📋 API responses are slow - check network/Shopify status');
    }
    
    Logger.log('   📋 Expected optimal time for 2 variants: ~1-2 seconds');
    Logger.log('   📋 Current 65s indicates major performance issue');
    
    return {
      configuredDelay: parseInt(rateLimitDelay),
      apiResponseTime: apiResponseTime,
      expectedTime: expectedTotal,
      actualTime: 65400,
      performanceRatio: 65400/expectedTotal,
      bottlenecks: bottlenecks
    };
    
  } catch (error) {
    Logger.log('❌ PERFORMANCE ANALYSIS FAILED: ' + error.message);
    return { error: error.message };
  }
}

/**
 * Test option field export behavior
 */
function testOptionFieldExport() {
  Logger.log('=== OPTION FIELD EXPORT TEST ===');
  Logger.log('Testing option field export and persistence');
  Logger.log('');
  
  try {
    // Test 1: Hash Detection for Options
    Logger.log('1. TESTING OPTION HASH DETECTION...');
    var validator = new ValidationEngine();
    
    var originalRecord = {
      id: 'test-123',
      title: 'Test Product',
      option1: 'Red',
      option2: 'Large',
      price: '29.99'
    };
    
    var modifiedRecord = {
      id: 'test-123',
      title: 'Test Product',
      option1: 'Blue',  // Changed
      option2: 'Large',
      price: '29.99'
    };
    
    var originalHash = validator.calculateHash(originalRecord);
    var modifiedHash = validator.calculateHash(modifiedRecord);
    
    Logger.log('   Original Hash: ' + originalHash);
    Logger.log('   Modified Hash: ' + modifiedHash);
    Logger.log('   Hash Different: ' + (originalHash !== modifiedHash));
    
    if (originalHash !== modifiedHash) {
      Logger.log('   ✅ Option1 changes are detected by hash system');
    } else {
      Logger.log('   ❌ Option1 changes NOT detected by hash system');
    }
    
    // Test 2: Check Core Fields
    Logger.log('');
    Logger.log('2. CHECKING CORE FIELDS FOR OPTIONS...');
    var normalizedOriginal = validator.normalizeDataForHash(originalRecord);
    var normalizedModified = validator.normalizeDataForHash(modifiedRecord);
    
    Logger.log('   Original normalized option1: ' + normalizedOriginal.option1);
    Logger.log('   Modified normalized option1: ' + normalizedModified.option1);
    
    var hasOption1 = 'option1' in normalizedOriginal;
    var hasOption2 = 'option2' in normalizedOriginal;
    var hasOption3 = 'option3' in normalizedOriginal;
    
    Logger.log('   Option1 in core fields: ' + hasOption1);
    Logger.log('   Option2 in core fields: ' + hasOption2);
    Logger.log('   Option3 in core fields: ' + hasOption3);
    
    // Test 3: Shopify API Structure Analysis
    Logger.log('');
    Logger.log('3. SHOPIFY API STRUCTURE ANALYSIS...');
    Logger.log('   Note: Options in Shopify are handled differently:');
    Logger.log('   - Product level: options array ["Color", "Size"]');
    Logger.log('   - Variant level: option1, option2, option3 values');
    Logger.log('   - Export may need to update both product options AND variant option values');
    
    Logger.log('');
    Logger.log('4. POTENTIAL OPTION EXPORT ISSUES...');
    Logger.log('   Possible causes for option changes not persisting:');
    Logger.log('   - Export updating variant.option1 but not product.options');
    Logger.log('   - Shopify requiring product options to be defined first');
    Logger.log('   - API call sequence: product options → variant options');
    Logger.log('   - Missing product-level option configuration');
    
    return {
      hashDetection: originalHash !== modifiedHash,
      optionFieldsIncluded: { option1: hasOption1, option2: hasOption2, option3: hasOption3 }
    };
    
  } catch (error) {
    Logger.log('❌ OPTION FIELD TEST FAILED: ' + error.message);
    return { error: error.message };
  }
}

/**
 * Complete performance and option analysis
 */
function runCompleteAnalysis() {
  Logger.log('=== COMPLETE EXPORT ANALYSIS ===');
  Logger.log('Analyzing both performance and option export issues');
  Logger.log('');
  
  // Performance analysis
  var perfResults = analyzeExportPerformance();
  
  Logger.log('');
  
  // Option export analysis
  var optionResults = testOptionFieldExport();
  
  Logger.log('');
  Logger.log('=== ANALYSIS SUMMARY ===');
  
  if (perfResults.performanceRatio > 10) {
    Logger.log('🚨 CRITICAL: Export is ' + perfResults.performanceRatio.toFixed(1) + 'x slower than expected');
  }
  
  if (optionResults.hashDetection) {
    Logger.log('✅ Option changes are detected by hash system');
    Logger.log('⚠️ Issue likely in export API calls or Shopify option structure');
  } else {
    Logger.log('❌ Option changes not detected - hash system issue');
  }
  
  Logger.log('');
  Logger.log('IMMEDIATE ACTIONS NEEDED:');
  Logger.log('1. Fix performance bottleneck (65s → 2s target)');
  Logger.log('2. Debug option export API calls');
  Logger.log('3. Verify Shopify product options configuration');
}
