/**
 * BulkApiDebugTest
 * Debug the API response parsing issue in BulkApiClient
 */
function debugBulkApiResponse() {
  Logger.log('=== DEBUGGING BULK API RESPONSE ===');
  
  try {
    var apiClient = new ApiClient();
    
    // Test direct API call to see response structure
    Logger.log('Testing direct API call...');
    var response = apiClient.makeRequest('products.json?limit=5');
    
    Logger.log(`Response type: ${typeof response}`);
    Logger.log(`Response keys: ${JSON.stringify(Object.keys(response))}`);
    
    if (response.products) {
      Logger.log(`Products found: ${response.products.length}`);
      Logger.log(`First product keys: ${JSON.stringify(Object.keys(response.products[0] || {}))}`);
    } else {
      Logger.log('No products property found in response');
      Logger.log(`Full response: ${JSON.stringify(response).substring(0, 500)}...`);
    }
    
    // Test BulkApiClient
    Logger.log('\nTesting BulkApiClient...');
    var bulkClient = new BulkApiClient();
    var bulkResult = bulkClient.bulkFetchProducts({ limit: 5 });
    
    Logger.log(`Bulk result: ${JSON.stringify(bulkResult)}`);
    
    return {
      success: true,
      directResponse: response,
      bulkResult: bulkResult
    };
    
  } catch (error) {
    Logger.log(`Debug test failed: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Test individual vs bulk API calls side by side
 */
function compareBulkVsIndividualDebug() {
  Logger.log('=== COMPARING INDIVIDUAL VS BULK API CALLS ===');
  
  try {
    var apiClient = new ApiClient();
    
    // Individual call (legacy mode)
    Logger.log('--- Individual API Call ---');
    var individualProducts = apiClient.getAllProducts(null, 5, false);
    Logger.log(`Individual result: ${individualProducts.length} products`);
    
    // Bulk call
    Logger.log('--- Bulk API Call ---');
    var bulkProducts = apiClient.getAllProducts(null, 5, true);
    Logger.log(`Bulk result: ${bulkProducts.length} products`);
    
    return {
      individual: individualProducts.length,
      bulk: bulkProducts.length,
      success: true
    };
    
  } catch (error) {
    Logger.log(`Comparison failed: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}
