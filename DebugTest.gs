// Debug Test Functions for API Issues

function debugApiConnection() {
  try {
    Logger.log('=== DEBUG: Starting API Connection Test ===');
    
    var apiClient = new ApiClient();
    
    // Test 1: Check credentials
    Logger.log('TEST 1: Getting credentials...');
    var credentials = apiClient.getCredentials();
    Logger.log('Shop Domain: ' + credentials.shopDomain);
    Logger.log('API Version: ' + credentials.apiVersion);
    Logger.log('Access Token exists: ' + (credentials.accessToken ? 'YES' : 'NO'));
    Logger.log('Access Token length: ' + (credentials.accessToken ? credentials.accessToken.length : 0));
    
    // Test 2: Test basic API call
    Logger.log('TEST 2: Testing basic API call...');
    var endpoint = '/admin/api/2023-04/products.json?limit=1';
    var url = 'https://' + credentials.shopDomain + endpoint;
    Logger.log('Full URL: ' + url);
    
    var response = apiClient.makeRequest('products.json?limit=1');
    Logger.log('Response type: ' + typeof response);
    Logger.log('Response: ' + JSON.stringify(response));
    
    if (response && response.products) {
      Logger.log('Products found: ' + response.products.length);
      if (response.products.length > 0) {
        Logger.log('First product ID: ' + response.products[0].id);
        Logger.log('First product title: ' + response.products[0].title);
      }
    } else {
      Logger.log('ERROR: No products in response');
    }
    
    // Test 3: Test product importer directly
    Logger.log('TEST 3: Testing ProductImporter directly...');
    var productImporter = new ProductImporter();
    var products = productImporter.fetchAllProducts({ limit: 5 });
    Logger.log('ProductImporter returned: ' + products.length + ' products');
    
    Logger.log('=== DEBUG: Test Complete ===');
    
    return {
      credentialsOk: !!credentials.accessToken,
      apiResponseOk: !!(response && response.products),
      productCount: response && response.products ? response.products.length : 0,
      importerCount: products.length
    };
    
  } catch (error) {
    Logger.log('ERROR in debug test: ' + error.message);
    Logger.log('Error stack: ' + error.stack);
    throw error;
  }
}

function runDebugTest() {
  try {
    var ui = SpreadsheetApp.getUi();
    ui.alert('🔍 Debug Test', 'Running API debug test... Check the logs for details.', ui.ButtonSet.OK);
    
    var results = debugApiConnection();
    
    var message = '🔍 DEBUG TEST RESULTS:\n\n' +
      '✅ Credentials: ' + (results.credentialsOk ? 'OK' : 'FAILED') + '\n' +
      '✅ API Response: ' + (results.apiResponseOk ? 'OK' : 'FAILED') + '\n' +
      '📊 API Product Count: ' + results.productCount + '\n' +
      '📊 Importer Product Count: ' + results.importerCount + '\n\n' +
      'Check the Apps Script logs for detailed information.';
    
    ui.alert('🔍 Debug Results', message, ui.ButtonSet.OK);
    
  } catch (error) {
    SpreadsheetApp.getUi().alert('❌ Debug Failed', error.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}
