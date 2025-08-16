/**
 * Architecture Validation Test
 * Validates that the refactored Code.gs orchestrator works correctly
 */

function runArchitectureValidationTest() {
  Logger.log('=== ARCHITECTURE VALIDATION TEST ===');
  
  var results = {
    testName: 'Architecture Validation Test',
    timestamp: new Date().toISOString(),
    tests: [],
    overallSuccess: true
  };
  
  // Test 1: StatsService instantiation
  try {
    var statsService = new StatsService();
    var stats = statsService.getImportStats();
    results.tests.push({
      name: 'StatsService Integration',
      success: true,
      message: `Stats retrieved: ${stats.products} products, ${stats.variants} variants`
    });
  } catch (error) {
    results.tests.push({
      name: 'StatsService Integration',
      success: false,
      message: 'Error: ' + error.message
    });
    results.overallSuccess = false;
  }
  
  // Test 2: ImportOrchestrator enhanced methods
  try {
    var orchestrator = new ImportOrchestrator();
    
    // Test method existence
    var methods = ['dryRunProducts', 'dryRunVariants', 'incrementalProducts', 'incrementalVariants'];
    var methodsExist = true;
    var missingMethods = [];
    
    methods.forEach(function(method) {
      if (typeof orchestrator[method] !== 'function') {
        methodsExist = false;
        missingMethods.push(method);
      }
    });
    
    results.tests.push({
      name: 'ImportOrchestrator Enhanced Methods',
      success: methodsExist,
      message: methodsExist ? 'All enhanced methods available' : 'Missing methods: ' + missingMethods.join(', ')
    });
    
    if (!methodsExist) results.overallSuccess = false;
  } catch (error) {
    results.tests.push({
      name: 'ImportOrchestrator Enhanced Methods',
      success: false,
      message: 'Error: ' + error.message
    });
    results.overallSuccess = false;
  }
  
  // Test 3: Code.gs orchestration functions
  try {
    // Test that viewImportStats delegates correctly
    var stats = viewImportStats();
    
    results.tests.push({
      name: 'Code.gs Orchestration',
      success: true,
      message: 'viewImportStats() delegation working correctly'
    });
  } catch (error) {
    results.tests.push({
      name: 'Code.gs Orchestration',
      success: false,
      message: 'Error: ' + error.message
    });
    results.overallSuccess = false;
  }
  
  // Test 4: Component instantiation
  try {
    var configManager = new ConfigManager();
    var apiClient = new ApiClient();
    var validator = new ValidationEngine();
    var uiManager = new UIManager();
    
    results.tests.push({
      name: 'Core Components Available',
      success: true,
      message: 'All core components instantiate successfully'
    });
  } catch (error) {
    results.tests.push({
      name: 'Core Components Available',
      success: false,
      message: 'Error: ' + error.message
    });
    results.overallSuccess = false;
  }
  
  // Log results
  Logger.log('Architecture Validation Results:');
  results.tests.forEach(function(test) {
    Logger.log(`${test.success ? '✅' : '❌'} ${test.name}: ${test.message}`);
  });
  
  Logger.log(`Overall Result: ${results.overallSuccess ? '✅ PASS' : '❌ FAIL'}`);
  
  return results;
}

/**
 * Quick component connectivity test
 */
function testComponentConnectivity() {
  Logger.log('=== COMPONENT CONNECTIVITY TEST ===');
  
  try {
    // Test orchestrator chain
    Logger.log('Testing ImportOrchestrator...');
    var orchestrator = new ImportOrchestrator();
    Logger.log('✅ ImportOrchestrator instantiated');
    
    // Test stats service
    Logger.log('Testing StatsService...');
    var statsService = new StatsService();
    var stats = statsService.getImportStats();
    Logger.log('✅ StatsService working: ' + JSON.stringify(stats));
    
    // Test configuration
    Logger.log('Testing ConfigManager...');
    var configManager = new ConfigManager();
    Logger.log('✅ ConfigManager instantiated');
    
    Logger.log('🎉 All components connected successfully!');
    return { success: true, message: 'All components working' };
    
  } catch (error) {
    Logger.log('❌ Component connectivity failed: ' + error.message);
    return { success: false, message: error.message };
  }
}
