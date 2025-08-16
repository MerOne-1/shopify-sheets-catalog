/**
 * Config Fix Test
 * Fixes the API version format issue and validates configuration
 */

function fixAPIVersionIssue() {
  Logger.log('=== CONFIG FIX TEST ===');
  Logger.log('Fixing API version format issue');
  Logger.log('');
  
  try {
    var configManager = new ConfigManager();
    
    // Step 1: Check current API version value
    Logger.log('1. CHECKING CURRENT API VERSION...');
    var currentApiVersion = configManager.getConfigValue('api_version');
    Logger.log('   Current API Version: ' + currentApiVersion);
    Logger.log('   Type: ' + typeof currentApiVersion);
    
    // Step 2: Reinitialize config to fix format
    Logger.log('2. REINITIALIZING CONFIG...');
    configManager.initializeConfig();
    Logger.log('   Config reinitialized successfully');
    
    // Step 3: Verify API version is now correct
    Logger.log('3. VERIFYING FIXED API VERSION...');
    var newApiVersion = configManager.getConfigValue('api_version');
    Logger.log('   New API Version: ' + newApiVersion);
    Logger.log('   Type: ' + typeof newApiVersion);
    
    // Step 4: Test API URL construction
    Logger.log('4. TESTING API URL CONSTRUCTION...');
    var credentials = configManager.getShopifyCredentials();
    var baseUrl = 'https://' + credentials.shopDomain + '/admin/api/' + credentials.apiVersion;
    Logger.log('   Base URL: ' + baseUrl);
    
    // Validate URL format
    var urlPattern = /^https:\/\/[a-zA-Z0-9-]+\.myshopify\.com\/admin\/api\/\d{4}-\d{2}$/;
    var validFormat = urlPattern.test(baseUrl);
    Logger.log('   URL Format Valid: ' + validFormat);
    
    // Step 5: Quick API connectivity test
    Logger.log('5. TESTING API CONNECTIVITY...');
    var testUrl = baseUrl + '/shop.json';
    
    var options = {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': credentials.accessToken,
        'Content-Type': 'application/json'
      },
      muteHttpExceptions: true
    };
    
    var response = UrlFetchApp.fetch(testUrl, options);
    var statusCode = response.getResponseCode();
    
    Logger.log('   API Test URL: ' + testUrl);
    Logger.log('   Status Code: ' + statusCode);
    Logger.log('   API Test: ' + (statusCode === 200 ? 'SUCCESS' : 'FAILED'));
    
    if (statusCode !== 200) {
      Logger.log('   Error Response: ' + response.getContentText());
    }
    
    // Final assessment
    Logger.log('');
    Logger.log('=== FIX RESULTS ===');
    if (validFormat && statusCode === 200) {
      Logger.log('✅ API VERSION ISSUE FIXED - API connectivity working');
    } else if (validFormat && statusCode !== 200) {
      Logger.log('⚠️ URL FORMAT FIXED - But API still returns ' + statusCode);
      Logger.log('   This may be a shop domain or access token issue');
    } else {
      Logger.log('❌ API VERSION ISSUE PERSISTS');
    }
    
    return {
      urlFormatFixed: validFormat,
      apiWorking: statusCode === 200,
      statusCode: statusCode,
      baseUrl: baseUrl
    };
    
  } catch (error) {
    Logger.log('❌ CONFIG FIX FAILED: ' + error.message);
    return { error: error.message };
  }
}

/**
 * Validate shop domain format
 */
function validateShopDomain() {
  Logger.log('=== SHOP DOMAIN VALIDATION ===');
  
  try {
    var configManager = new ConfigManager();
    var shopDomain = configManager.getConfigValue('shop_domain');
    
    Logger.log('Shop Domain: ' + shopDomain);
    
    // Test domain format
    var domainPattern = /^[a-zA-Z0-9-]+\.myshopify\.com$/;
    var validFormat = domainPattern.test(shopDomain);
    Logger.log('Domain Format Valid: ' + validFormat);
    
    // Test if domain is accessible (basic HTTP test)
    var testUrl = 'https://' + shopDomain;
    Logger.log('Testing domain accessibility: ' + testUrl);
    
    try {
      var response = UrlFetchApp.fetch(testUrl, { muteHttpExceptions: true });
      var statusCode = response.getResponseCode();
      Logger.log('Domain Response: ' + statusCode);
      
      if (statusCode === 200 || statusCode === 302) {
        Logger.log('✅ Shop domain is accessible');
      } else {
        Logger.log('⚠️ Shop domain returns ' + statusCode + ' - may not exist');
      }
      
    } catch (error) {
      Logger.log('❌ Shop domain not accessible: ' + error.message);
    }
    
  } catch (error) {
    Logger.log('❌ DOMAIN VALIDATION FAILED: ' + error.message);
  }
}

/**
 * Complete API fix and test
 */
function completeAPIFix() {
  Logger.log('=== COMPLETE API FIX ===');
  
  // Step 1: Fix API version
  var fixResult = fixAPIVersionIssue();
  
  // Step 2: Validate shop domain
  validateShopDomain();
  
  // Step 3: Run quick API check again
  Logger.log('');
  Logger.log('=== FINAL API CHECK ===');
  
  try {
    var configManager = new ConfigManager();
    var credentials = configManager.getShopifyCredentials();
    var testUrl = 'https://' + credentials.shopDomain + '/admin/api/' + credentials.apiVersion + '/shop.json';
    
    var options = {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': credentials.accessToken,
        'Content-Type': 'application/json'
      },
      muteHttpExceptions: true
    };
    
    var response = UrlFetchApp.fetch(testUrl, options);
    var statusCode = response.getResponseCode();
    
    Logger.log('Final API Test: ' + statusCode);
    
    if (statusCode === 200) {
      Logger.log('🎉 API CONNECTIVITY FULLY RESTORED');
      Logger.log('You can now export your option1 changes successfully');
    } else {
      Logger.log('❌ API still not working: ' + statusCode);
      Logger.log('Response: ' + response.getContentText());
      
      if (statusCode === 404) {
        Logger.log('');
        Logger.log('RECOMMENDATIONS:');
        Logger.log('1. Verify shop domain is correct in Config sheet');
        Logger.log('2. Check if shop exists and is accessible');
        Logger.log('3. Verify access token has correct permissions');
      }
    }
    
  } catch (error) {
    Logger.log('❌ FINAL API CHECK FAILED: ' + error.message);
  }
}
