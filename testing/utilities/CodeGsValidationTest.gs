/**
 * Code.gs Validation Test
 * Tests that all Code.gs orchestration functions work correctly
 */

function runCodeGsValidationTest() {
  Logger.log('=== CODE.GS VALIDATION TEST ===');
  
  var results = {
    testName: 'Code.gs Orchestration Validation',
    timestamp: new Date().toISOString(),
    tests: [],
    overallSuccess: true,
    summary: {
      total: 0,
      passed: 0,
      failed: 0
    }
  };
  
  // Test functions to validate (non-destructive tests only)
  var testFunctions = [
    // Statistics
    { name: 'viewImportStats', category: 'Statistics' },
    
    // Configuration (read-only tests)
    { name: 'testShopifyConnection', category: 'Configuration' },
    
    // Validation
    { name: 'validateAllData', category: 'Validation' },
    
    // Utilities
    { name: 'clearLogs', category: 'Utilities' }
  ];
  
  // Test each function
  testFunctions.forEach(function(testFunc) {
    results.summary.total++;
    
    try {
      Logger.log(`Testing ${testFunc.name}()...`);
      
      // Call the function
      var result = eval(testFunc.name + '()');
      
      // Validate result exists
      var success = (result !== undefined && result !== null);
      
      results.tests.push({
        name: testFunc.name,
        category: testFunc.category,
        success: success,
        message: success ? 'Function executed successfully' : 'Function returned null/undefined',
        result: typeof result === 'object' ? JSON.stringify(result).substring(0, 100) + '...' : String(result)
      });
      
      if (success) {
        results.summary.passed++;
        Logger.log(`✅ ${testFunc.name}: PASS`);
      } else {
        results.summary.failed++;
        results.overallSuccess = false;
        Logger.log(`❌ ${testFunc.name}: FAIL - No result returned`);
      }
      
    } catch (error) {
      results.tests.push({
        name: testFunc.name,
        category: testFunc.category,
        success: false,
        message: 'Error: ' + error.message,
        result: null
      });
      
      results.summary.failed++;
      results.overallSuccess = false;
      Logger.log(`❌ ${testFunc.name}: ERROR - ${error.message}`);
    }
  });
  
  // Test component instantiation
  var components = [
    { name: 'ImportOrchestrator', class: 'ImportOrchestrator' },
    { name: 'StatsService', class: 'StatsService' },
    { name: 'ConfigManager', class: 'ConfigManager' },
    { name: 'ApiClient', class: 'ApiClient' },
    { name: 'ValidationEngine', class: 'ValidationEngine' },
    { name: 'UIManager', class: 'UIManager' },
    { name: 'UtilityService', class: 'UtilityService' }
  ];
  
  components.forEach(function(comp) {
    results.summary.total++;
    
    try {
      Logger.log(`Testing ${comp.class} instantiation...`);
      
      var instance = eval('new ' + comp.class + '()');
      var success = (instance !== undefined && instance !== null);
      
      results.tests.push({
        name: comp.class + ' Instantiation',
        category: 'Component',
        success: success,
        message: success ? 'Component instantiated successfully' : 'Component instantiation failed',
        result: success ? 'Instance created' : 'null'
      });
      
      if (success) {
        results.summary.passed++;
        Logger.log(`✅ ${comp.class}: PASS`);
      } else {
        results.summary.failed++;
        results.overallSuccess = false;
        Logger.log(`❌ ${comp.class}: FAIL`);
      }
      
    } catch (error) {
      results.tests.push({
        name: comp.class + ' Instantiation',
        category: 'Component',
        success: false,
        message: 'Error: ' + error.message,
        result: null
      });
      
      results.summary.failed++;
      results.overallSuccess = false;
      Logger.log(`❌ ${comp.class}: ERROR - ${error.message}`);
    }
  });
  
  // Log final results
  Logger.log('\n=== TEST RESULTS ===');
  Logger.log(`Total Tests: ${results.summary.total}`);
  Logger.log(`Passed: ${results.summary.passed}`);
  Logger.log(`Failed: ${results.summary.failed}`);
  Logger.log(`Success Rate: ${Math.round((results.summary.passed / results.summary.total) * 100)}%`);
  Logger.log(`Overall Result: ${results.overallSuccess ? '✅ PASS' : '❌ FAIL'}`);
  
  // Detailed results
  Logger.log('\n=== DETAILED RESULTS ===');
  results.tests.forEach(function(test) {
    Logger.log(`${test.success ? '✅' : '❌'} [${test.category}] ${test.name}: ${test.message}`);
    if (test.result && test.success) {
      Logger.log(`   Result: ${test.result}`);
    }
  });
  
  return results;
}

/**
 * Quick smoke test for Code.gs functions
 */
function quickCodeGsTest() {
  Logger.log('=== QUICK CODE.GS SMOKE TEST ===');
  
  try {
    // Test basic orchestration
    Logger.log('1. Testing viewImportStats...');
    var stats = viewImportStats();
    Logger.log('✅ viewImportStats: ' + JSON.stringify(stats));
    
    Logger.log('2. Testing component instantiation...');
    var orchestrator = new ImportOrchestrator();
    var statsService = new StatsService();
    var configManager = new ConfigManager();
    Logger.log('✅ All components instantiate correctly');
    
    Logger.log('3. Testing clearLogs...');
    var logResult = clearLogs();
    Logger.log('✅ clearLogs: ' + JSON.stringify(logResult));
    
    Logger.log('\n🎉 QUICK TEST PASSED - Code.gs is working correctly!');
    return { success: true, message: 'All basic functions working' };
    
  } catch (error) {
    Logger.log('❌ QUICK TEST FAILED: ' + error.message);
    Logger.log('Error stack: ' + error.stack);
    return { success: false, message: error.message };
  }
}

/**
 * Test menu callback functions (safe ones only)
 */
function testMenuCallbacks() {
  Logger.log('=== MENU CALLBACK TEST ===');
  
  var safeFunctions = [
    'viewImportStats',
    'testShopifyConnection', 
    'validateAllData',
    'clearLogs'
  ];
  
  var results = [];
  
  safeFunctions.forEach(function(funcName) {
    try {
      Logger.log(`Testing menu callback: ${funcName}()`);
      var result = eval(funcName + '()');
      results.push({
        function: funcName,
        success: true,
        result: result
      });
      Logger.log(`✅ ${funcName}: Working`);
    } catch (error) {
      results.push({
        function: funcName,
        success: false,
        error: error.message
      });
      Logger.log(`❌ ${funcName}: ${error.message}`);
    }
  });
  
  var successCount = results.filter(r => r.success).length;
  Logger.log(`\nMenu Callback Test: ${successCount}/${results.length} functions working`);
  
  return results;
}
