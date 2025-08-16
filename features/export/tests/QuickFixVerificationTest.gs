/**
 * Quick Fix Verification Test
 * Verifies that the critical fixes are working properly
 */

function verifyAllFixes() {
  Logger.log('=== QUICK FIX VERIFICATION ===');
  
  var results = {
    configKeys: false,
    priceDetection: false,
    hashMethod: false,
    overallSuccess: false
  };
  
  try {
    // Test 1: Config keys (need to reinitialize first)
    Logger.log('1. Testing configuration keys...');
    var configManager = new ConfigManager();
    configManager.initializeConfig(); // Reinitialize to add missing keys
    
    var batchSize = configManager.getConfigValue('batch_size');
    var maxRetries = configManager.getConfigValue('max_retries');
    results.configKeys = (batchSize !== null && maxRetries !== null);
    Logger.log('   Config keys: ' + (results.configKeys ? 'FIXED' : 'STILL MISSING'));
    
    // Test 2: Hash method access
    Logger.log('2. Testing hash method access...');
    var exportManager = new ExportManager();
    var testRecord = { id: '123', title: 'Test' };
    var hash = exportManager.validator.calculateHash(testRecord);
    results.hashMethod = (hash && hash.length > 0);
    Logger.log('   Hash method: ' + (results.hashMethod ? 'WORKING' : 'BROKEN'));
    
    // Test 3: Price detection (the critical fix)
    Logger.log('3. Testing price detection...');
    var originalData = { id: '123', title: 'Test Product', price: '29.99' };
    var changedData = { id: '123', title: 'Test Product', price: '30.00' };
    
    var originalHash = exportManager.validator.calculateHash(originalData);
    var changedHash = exportManager.validator.calculateHash(changedData);
    results.priceDetection = (originalHash !== changedHash);
    Logger.log('   Price detection: ' + (results.priceDetection ? 'FIXED' : 'STILL BROKEN'));
    
    // Overall result
    results.overallSuccess = results.configKeys && results.hashMethod && results.priceDetection;
    
    Logger.log('');
    Logger.log('=== VERIFICATION RESULTS ===');
    Logger.log('Config Keys: ' + (results.configKeys ? '✅ FIXED' : '❌ BROKEN'));
    Logger.log('Hash Method: ' + (results.hashMethod ? '✅ WORKING' : '❌ BROKEN'));
    Logger.log('Price Detection: ' + (results.priceDetection ? '✅ FIXED' : '❌ BROKEN'));
    Logger.log('Overall: ' + (results.overallSuccess ? '✅ ALL FIXES WORKING' : '❌ ISSUES REMAIN'));
    
    return results;
    
  } catch (error) {
    Logger.log('❌ VERIFICATION FAILED: ' + error.message);
    results.error = error.message;
    return results;
  }
}

/**
 * Test just the price detection fix
 */
function testPriceDetectionFix() {
  Logger.log('=== PRICE DETECTION FIX TEST ===');
  
  try {
    var exportManager = new ExportManager();
    
    // Test different price scenarios
    var scenarios = [
      { name: 'Price Change', original: '29.99', changed: '30.00' },
      { name: 'Small Price Change', original: '10.00', changed: '10.01' },
      { name: 'Large Price Change', original: '100.00', changed: '150.00' }
    ];
    
    var allPassed = true;
    
    for (var i = 0; i < scenarios.length; i++) {
      var scenario = scenarios[i];
      
      var originalData = { id: '123', title: 'Test Product', price: scenario.original };
      var changedData = { id: '123', title: 'Test Product', price: scenario.changed };
      
      var originalHash = exportManager.validator.calculateHash(originalData);
      var changedHash = exportManager.validator.calculateHash(changedData);
      var detected = (originalHash !== changedHash);
      
      Logger.log(scenario.name + ': ' + (detected ? 'DETECTED' : 'NOT DETECTED'));
      if (!detected) allPassed = false;
    }
    
    Logger.log('');
    Logger.log('Price Detection Fix: ' + (allPassed ? '✅ WORKING' : '❌ BROKEN'));
    return allPassed;
    
  } catch (error) {
    Logger.log('❌ TEST FAILED: ' + error.message);
    return false;
  }
}

/**
 * Test change detection with realistic variant data
 */
function testVariantChangeDetection() {
  Logger.log('=== VARIANT CHANGE DETECTION TEST ===');
  
  try {
    var exportManager = new ExportManager();
    
    // Simulate variant data with stored hash
    var validator = new ValidationEngine();
    var originalVariant = {
      id: '456',
      product_id: '123',
      title: 'Medium / Red',
      price: '29.99',
      compare_at_price: '39.99',
      inventory_quantity: '10',
      sku: 'TEST-MED-RED'
    };
    
    // Calculate and store original hash
    var originalHash = validator.calculateHash(originalVariant);
    originalVariant._hash = originalHash;
    
    // Test different types of changes
    var changes = [
      { field: 'price', newValue: '30.99', description: 'Price increase' },
      { field: 'inventory_quantity', newValue: '5', description: 'Inventory decrease' },
      { field: 'sku', newValue: 'TEST-MED-RED-V2', description: 'SKU change' },
      { field: 'compare_at_price', newValue: '42.99', description: 'Compare price change' }
    ];
    
    var detectionResults = [];
    
    for (var i = 0; i < changes.length; i++) {
      var change = changes[i];
      
      // Create modified variant
      var modifiedVariant = JSON.parse(JSON.stringify(originalVariant));
      modifiedVariant[change.field] = change.newValue;
      
      // Test change detection
      var changeResults = exportManager.detectChanges([modifiedVariant], {});
      var detected = (changeResults.toUpdate.length > 0);
      
      detectionResults.push({
        description: change.description,
        field: change.field,
        detected: detected
      });
      
      Logger.log(change.description + ': ' + (detected ? 'DETECTED' : 'NOT DETECTED'));
    }
    
    var allDetected = detectionResults.every(function(result) { return result.detected; });
    
    Logger.log('');
    Logger.log('Variant Change Detection: ' + (allDetected ? '✅ ALL CHANGES DETECTED' : '❌ SOME CHANGES MISSED'));
    return { success: allDetected, results: detectionResults };
    
  } catch (error) {
    Logger.log('❌ TEST FAILED: ' + error.message);
    return { success: false, error: error.message };
  }
}
