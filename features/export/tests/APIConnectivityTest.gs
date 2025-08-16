/**
 * API Connectivity Test
 * Tests Shopify API configuration and connectivity issues
 */

function runAPIConnectivityTest() {
  Logger.log('=== API CONNECTIVITY TEST ===');
  Logger.log('Testing Shopify API configuration and connectivity');
  Logger.log('');
  
  var results = {
    timestamp: new Date().toISOString(),
    configurationTest: {},
    credentialsTest: {},
    apiEndpointTest: {},
    connectivityTest: {},
    overallStatus: 'UNKNOWN',
    criticalIssues: [],
    recommendations: []
  };
  
  try {
    // Test 1: Configuration Values
    Logger.log('1. TESTING CONFIGURATION VALUES...');
    results.configurationTest = testConfigurationValues();
    
    // Test 2: Credentials Access
    Logger.log('2. TESTING CREDENTIALS ACCESS...');
    results.credentialsTest = testCredentialsAccess();
    
    // Test 3: API Endpoint Construction
    Logger.log('3. TESTING API ENDPOINT CONSTRUCTION...');
    results.apiEndpointTest = testAPIEndpointConstruction();
    
    // Test 4: Actual API Connectivity
    Logger.log('4. TESTING ACTUAL API CONNECTIVITY...');
    results.connectivityTest = testActualConnectivity();
    
    // Generate assessment
    results = generateAPIAssessment(results);
    
    // Log results
    logAPIResults(results);
    
    return results;
    
  } catch (error) {
    Logger.log('❌ API CONNECTIVITY TEST FAILED: ' + error.message);
    results.error = error.message;
    results.overallStatus = 'CRITICAL_ERROR';
    return results;
  }
}

/**
 * Test 1: Configuration Values
 */
function testConfigurationValues() {
  var test = {
    name: 'Configuration Values',
    status: 'UNKNOWN',
    shopDomain: null,
    apiVersion: null,
    configComplete: false
  };
  
  try {
    var configManager = new ConfigManager();
    
    // Test shop domain
    test.shopDomain = configManager.getConfigValue('shop_domain');
    Logger.log('   Shop Domain: ' + (test.shopDomain || 'NOT FOUND'));
    
    // Test API version
    test.apiVersion = configManager.getConfigValue('api_version');
    Logger.log('   API Version: ' + (test.apiVersion || 'NOT FOUND'));
    
    // Check if configuration is complete
    test.configComplete = (test.shopDomain && test.apiVersion);
    
    if (test.configComplete) {
      test.status = 'PASS';
      Logger.log('   ✅ Configuration values: COMPLETE');
    } else {
      test.status = 'FAIL';
      Logger.log('   ❌ Configuration values: INCOMPLETE');
    }
    
  } catch (error) {
    test.status = 'ERROR';
    test.error = error.message;
    Logger.log('   ❌ Configuration values: ERROR - ' + error.message);
  }
  
  return test;
}

/**
 * Test 2: Credentials Access
 */
function testCredentialsAccess() {
  var test = {
    name: 'Credentials Access',
    status: 'UNKNOWN',
    accessTokenExists: false,
    credentialsRetrieved: false
  };
  
  try {
    var configManager = new ConfigManager();
    
    // Test access token in Script Properties
    var properties = PropertiesService.getScriptProperties();
    var accessToken = properties.getProperty('SHOPIFY_ACCESS_TOKEN');
    test.accessTokenExists = (accessToken !== null && accessToken !== '');
    
    Logger.log('   Access Token: ' + (test.accessTokenExists ? 'EXISTS' : 'NOT FOUND'));
    
    // Test credentials retrieval
    try {
      var credentials = configManager.getShopifyCredentials();
      test.credentialsRetrieved = true;
      test.credentials = {
        shopDomain: credentials.shopDomain,
        hasAccessToken: !!credentials.accessToken,
        apiVersion: credentials.apiVersion
      };
      Logger.log('   Credentials Retrieved: YES');
    } catch (credError) {
      test.credentialsRetrieved = false;
      test.credentialsError = credError.message;
      Logger.log('   Credentials Retrieved: NO - ' + credError.message);
    }
    
    if (test.accessTokenExists && test.credentialsRetrieved) {
      test.status = 'PASS';
      Logger.log('   ✅ Credentials access: WORKING');
    } else {
      test.status = 'FAIL';
      Logger.log('   ❌ Credentials access: BROKEN');
    }
    
  } catch (error) {
    test.status = 'ERROR';
    test.error = error.message;
    Logger.log('   ❌ Credentials access: ERROR - ' + error.message);
  }
  
  return test;
}

/**
 * Test 3: API Endpoint Construction
 */
function testAPIEndpointConstruction() {
  var test = {
    name: 'API Endpoint Construction',
    status: 'UNKNOWN',
    baseUrl: null,
    testEndpoints: {}
  };
  
  try {
    var configManager = new ConfigManager();
    var credentials = configManager.getShopifyCredentials();
    
    // Construct base URL
    test.baseUrl = 'https://' + credentials.shopDomain + '/admin/api/' + credentials.apiVersion;
    Logger.log('   Base URL: ' + test.baseUrl);
    
    // Test common endpoints
    var endpoints = {
      shop: test.baseUrl + '/shop.json',
      products: test.baseUrl + '/products.json',
      variants: test.baseUrl + '/products/123/variants.json'
    };
    
    test.testEndpoints = endpoints;
    
    // Validate URL format
    var urlPattern = /^https:\/\/[a-zA-Z0-9-]+\.myshopify\.com\/admin\/api\/\d{4}-\d{2}/;
    var validFormat = urlPattern.test(test.baseUrl);
    
    if (validFormat) {
      test.status = 'PASS';
      Logger.log('   ✅ API endpoint construction: VALID');
    } else {
      test.status = 'FAIL';
      Logger.log('   ❌ API endpoint construction: INVALID FORMAT');
    }
    
  } catch (error) {
    test.status = 'ERROR';
    test.error = error.message;
    Logger.log('   ❌ API endpoint construction: ERROR - ' + error.message);
  }
  
  return test;
}

/**
 * Test 4: Actual API Connectivity
 */
function testActualConnectivity() {
  var test = {
    name: 'Actual API Connectivity',
    status: 'UNKNOWN',
    shopEndpointTest: {},
    productsEndpointTest: {},
    authenticationTest: {}
  };
  
  try {
    var configManager = new ConfigManager();
    var credentials = configManager.getShopifyCredentials();
    var baseUrl = 'https://' + credentials.shopDomain + '/admin/api/' + credentials.apiVersion;
    
    // Test 1: Shop endpoint (basic connectivity)
    Logger.log('   Testing shop endpoint...');
    test.shopEndpointTest = testSingleEndpoint(baseUrl + '/shop.json', credentials.accessToken);
    
    // Test 2: Products endpoint (export-relevant)
    Logger.log('   Testing products endpoint...');
    test.productsEndpointTest = testSingleEndpoint(baseUrl + '/products.json?limit=1', credentials.accessToken);
    
    // Determine overall connectivity status
    var successfulTests = 0;
    var totalTests = 2;
    
    if (test.shopEndpointTest.success) successfulTests++;
    if (test.productsEndpointTest.success) successfulTests++;
    
    if (successfulTests === totalTests) {
      test.status = 'PASS';
      Logger.log('   ✅ API connectivity: WORKING');
    } else if (successfulTests > 0) {
      test.status = 'PARTIAL';
      Logger.log('   ⚠️ API connectivity: PARTIAL - ' + successfulTests + '/' + totalTests + ' endpoints working');
    } else {
      test.status = 'FAIL';
      Logger.log('   ❌ API connectivity: BROKEN - All endpoints failing');
    }
    
  } catch (error) {
    test.status = 'ERROR';
    test.error = error.message;
    Logger.log('   ❌ API connectivity: ERROR - ' + error.message);
  }
  
  return test;
}

/**
 * Test a single API endpoint
 */
function testSingleEndpoint(url, accessToken) {
  var result = {
    url: url,
    success: false,
    statusCode: null,
    error: null,
    responseTime: null
  };
  
  try {
    var startTime = Date.now();
    
    var options = {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      },
      muteHttpExceptions: true
    };
    
    var response = UrlFetchApp.fetch(url, options);
    var endTime = Date.now();
    
    result.statusCode = response.getResponseCode();
    result.responseTime = endTime - startTime;
    result.success = (result.statusCode >= 200 && result.statusCode < 300);
    
    if (!result.success) {
      result.error = 'HTTP ' + result.statusCode + ': ' + response.getContentText();
    }
    
    Logger.log('     ' + url + ' -> ' + result.statusCode + ' (' + result.responseTime + 'ms)');
    
  } catch (error) {
    result.error = error.message;
    Logger.log('     ' + url + ' -> ERROR: ' + error.message);
  }
  
  return result;
}

/**
 * Generate API assessment
 */
function generateAPIAssessment(results) {
  var criticalIssues = [];
  var recommendations = [];
  
  // Check configuration
  if (results.configurationTest.status !== 'PASS') {
    criticalIssues.push('Configuration values missing or incomplete');
    recommendations.push('Verify shop_domain and api_version in Config sheet');
  }
  
  // Check credentials
  if (results.credentialsTest.status !== 'PASS') {
    criticalIssues.push('Shopify access token missing or invalid');
    recommendations.push('Set SHOPIFY_ACCESS_TOKEN in Script Properties');
  }
  
  // Check API endpoints
  if (results.apiEndpointTest.status !== 'PASS') {
    criticalIssues.push('API endpoint construction failed');
    recommendations.push('Check shop domain format (should be xxx.myshopify.com)');
  }
  
  // Check connectivity
  if (results.connectivityTest.status === 'FAIL') {
    criticalIssues.push('API connectivity completely broken');
    recommendations.push('Verify access token permissions and shop domain');
  } else if (results.connectivityTest.status === 'PARTIAL') {
    criticalIssues.push('Some API endpoints not working');
    recommendations.push('Check specific endpoint permissions');
  }
  
  // Special check for 404 errors
  if (results.connectivityTest.shopEndpointTest && results.connectivityTest.shopEndpointTest.statusCode === 404) {
    criticalIssues.push('404 Not Found - Shop domain likely incorrect');
    recommendations.push('CRITICAL: Verify shop domain is correct (e.g., your-shop.myshopify.com)');
  }
  
  // Determine overall status
  var overallStatus;
  if (criticalIssues.length === 0) {
    overallStatus = 'WORKING';
  } else if (criticalIssues.length <= 2) {
    overallStatus = 'ISSUES';
  } else {
    overallStatus = 'BROKEN';
  }
  
  results.overallStatus = overallStatus;
  results.criticalIssues = criticalIssues;
  results.recommendations = recommendations;
  
  return results;
}

/**
 * Log API test results
 */
function logAPIResults(results) {
  Logger.log('');
  Logger.log('=== API CONNECTIVITY TEST RESULTS ===');
  Logger.log('Timestamp: ' + results.timestamp);
  Logger.log('');
  
  // Test summaries
  Logger.log('TEST SUMMARIES:');
  Logger.log('1. Configuration Values: ' + results.configurationTest.status);
  Logger.log('2. Credentials Access: ' + results.credentialsTest.status);
  Logger.log('3. API Endpoint Construction: ' + results.apiEndpointTest.status);
  Logger.log('4. Actual API Connectivity: ' + results.connectivityTest.status);
  Logger.log('');
  
  // Overall status
  Logger.log('OVERALL API STATUS: ' + results.overallStatus);
  Logger.log('');
  
  // Critical issues
  if (results.criticalIssues.length > 0) {
    Logger.log('CRITICAL ISSUES:');
    for (var i = 0; i < results.criticalIssues.length; i++) {
      Logger.log('  ❌ ' + results.criticalIssues[i]);
    }
    Logger.log('');
  }
  
  // Recommendations
  if (results.recommendations.length > 0) {
    Logger.log('RECOMMENDATIONS:');
    for (var i = 0; i < results.recommendations.length; i++) {
      Logger.log('  📋 ' + results.recommendations[i]);
    }
    Logger.log('');
  }
  
  Logger.log('=== END API CONNECTIVITY TEST ===');
}

/**
 * Quick API connectivity check
 */
function quickAPICheck() {
  Logger.log('=== QUICK API CHECK ===');
  
  try {
    // 1. Check configuration
    var configManager = new ConfigManager();
    var shopDomain = configManager.getConfigValue('shop_domain');
    Logger.log('Shop Domain: ' + (shopDomain || 'NOT FOUND'));
    
    // 2. Check access token
    var properties = PropertiesService.getScriptProperties();
    var accessToken = properties.getProperty('SHOPIFY_ACCESS_TOKEN');
    Logger.log('Access Token: ' + (accessToken ? 'EXISTS' : 'NOT FOUND'));
    
    // 3. Test basic connectivity
    if (shopDomain && accessToken) {
      var apiVersion = configManager.getConfigValue('api_version') || '2023-04';
      var testUrl = 'https://' + shopDomain + '/admin/api/' + apiVersion + '/shop.json';
      
      var options = {
        method: 'GET',
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json'
        },
        muteHttpExceptions: true
      };
      
      var response = UrlFetchApp.fetch(testUrl, options);
      var statusCode = response.getResponseCode();
      
      Logger.log('API Test: ' + statusCode + ' - ' + (statusCode === 200 ? 'SUCCESS' : 'FAILED'));
      
      if (statusCode !== 200) {
        Logger.log('Error Response: ' + response.getContentText());
      }
    }
    
    Logger.log('');
    Logger.log('Run runAPIConnectivityTest() for detailed analysis');
    
  } catch (error) {
    Logger.log('❌ QUICK API CHECK FAILED: ' + error.message);
  }
}

/**
 * Test option1 field detection specifically
 */
function testOption1FieldDetection() {
  Logger.log('=== OPTION1 FIELD DETECTION TEST ===');
  
  try {
    var exportManager = new ExportManager();
    
    // Test option1 field changes
    var originalData = { 
      id: '123', 
      title: 'Test Variant', 
      option1: 'Small',
      price: '29.99'
    };
    
    var changedData = { 
      id: '123', 
      title: 'Test Variant', 
      option1: 'Medium',  // Changed option1
      price: '29.99'
    };
    
    var originalHash = exportManager.validator.calculateHash(originalData);
    var changedHash = exportManager.validator.calculateHash(changedData);
    var detected = (originalHash !== changedHash);
    
    Logger.log('Original option1: ' + originalData.option1);
    Logger.log('Changed option1: ' + changedData.option1);
    Logger.log('Option1 change detected: ' + (detected ? 'YES' : 'NO'));
    
    if (detected) {
      Logger.log('✅ Option1 field changes are properly detected');
    } else {
      Logger.log('❌ Option1 field changes are NOT detected');
    }
    
    return detected;
    
  } catch (error) {
    Logger.log('❌ OPTION1 TEST FAILED: ' + error.message);
    return false;
  }
}
