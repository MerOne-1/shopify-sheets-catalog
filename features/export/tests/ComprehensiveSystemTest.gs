/**
 * Comprehensive System Test
 * Tests all critical fixes and system functionality
 */

function runComprehensiveSystemTest() {
  Logger.log('=== COMPREHENSIVE SYSTEM TEST ===');
  Logger.log('Testing all critical fixes and system functionality');
  Logger.log('');
  
  var results = {
    timestamp: new Date().toISOString(),
    configTest: {},
    hashMethodTest: {},
    priceDetectionTest: {},
    changeDetectionTest: {},
    systemHealthTest: {},
    overallStatus: 'UNKNOWN',
    criticalIssues: [],
    recommendations: []
  };
  
  try {
    // Test 1: Configuration System
    Logger.log('1. TESTING CONFIGURATION SYSTEM...');
    results.configTest = testConfigurationSystem();
    
    // Test 2: Hash Method Access
    Logger.log('2. TESTING HASH METHOD ACCESS...');
    results.hashMethodTest = testHashMethodAccess();
    
    // Test 3: Price Detection (Critical Fix)
    Logger.log('3. TESTING PRICE DETECTION...');
    results.priceDetectionTest = testPriceDetection();
    
    // Test 4: Change Detection System
    Logger.log('4. TESTING CHANGE DETECTION SYSTEM...');
    results.changeDetectionTest = testChangeDetectionSystem();
    
    // Test 5: Overall System Health
    Logger.log('5. TESTING SYSTEM HEALTH...');
    results.systemHealthTest = testSystemHealth();
    
    // Generate final assessment
    results = generateFinalAssessment(results);
    
    // Log comprehensive results
    logComprehensiveResults(results);
    
    return results;
    
  } catch (error) {
    Logger.log('❌ COMPREHENSIVE TEST FAILED: ' + error.message);
    results.error = error.message;
    results.overallStatus = 'CRITICAL_ERROR';
    return results;
  }
}

/**
 * Test 1: Configuration System
 */
function testConfigurationSystem() {
  var test = {
    name: 'Configuration System',
    status: 'UNKNOWN',
    configSheetExists: false,
    missingKeys: [],
    presentKeys: [],
    reinitializationNeeded: false,
    reinitializationAttempted: false,
    reinitializationSuccess: false
  };
  
  try {
    var configManager = new ConfigManager();
    
    // Check if config sheet exists
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var configSheet = spreadsheet.getSheetByName('Config');
    test.configSheetExists = (configSheet !== null);
    
    // Test for required keys
    var requiredKeys = ['max_retries', 'retry_base_delay', 'retry_max_delay', 'batch_size'];
    var missingKeys = [];
    var presentKeys = [];
    
    for (var i = 0; i < requiredKeys.length; i++) {
      var key = requiredKeys[i];
      var value = configManager.getConfigValue(key);
      
      if (value === null) {
        missingKeys.push(key);
      } else {
        presentKeys.push({ key: key, value: value });
      }
    }
    
    test.missingKeys = missingKeys;
    test.presentKeys = presentKeys;
    test.reinitializationNeeded = (missingKeys.length > 0);
    
    // If keys are missing, attempt reinitialization
    if (test.reinitializationNeeded) {
      Logger.log('   Missing keys detected. Attempting reinitialization...');
      test.reinitializationAttempted = true;
      
      try {
        configManager.initializeConfig();
        test.reinitializationSuccess = true;
        
        // Re-test keys after reinitialization
        var newMissingKeys = [];
        for (var i = 0; i < requiredKeys.length; i++) {
          var key = requiredKeys[i];
          var value = configManager.getConfigValue(key);
          if (value === null) {
            newMissingKeys.push(key);
          }
        }
        test.missingKeys = newMissingKeys;
        
      } catch (reinitError) {
        test.reinitializationSuccess = false;
        test.reinitializationError = reinitError.message;
      }
    }
    
    // Determine status
    if (test.missingKeys.length === 0) {
      test.status = 'PASS';
      Logger.log('   ✅ Configuration system: WORKING');
    } else {
      test.status = 'FAIL';
      Logger.log('   ❌ Configuration system: MISSING KEYS - ' + test.missingKeys.join(', '));
    }
    
  } catch (error) {
    test.status = 'ERROR';
    test.error = error.message;
    Logger.log('   ❌ Configuration system: ERROR - ' + error.message);
  }
  
  return test;
}

/**
 * Test 2: Hash Method Access
 */
function testHashMethodAccess() {
  var test = {
    name: 'Hash Method Access',
    status: 'UNKNOWN',
    exportManagerCreated: false,
    validatorExists: false,
    calculateHashExists: false,
    hashGenerated: false,
    sampleHash: null
  };
  
  try {
    // Test ExportManager creation
    var exportManager = new ExportManager();
    test.exportManagerCreated = true;
    
    // Test validator exists
    test.validatorExists = (exportManager.validator !== null && exportManager.validator !== undefined);
    
    // Test calculateHash method exists
    test.calculateHashExists = (typeof exportManager.validator.calculateHash === 'function');
    
    // Test hash generation
    if (test.calculateHashExists) {
      var testRecord = { id: '123', title: 'Test Product', price: '29.99' };
      var hash = exportManager.validator.calculateHash(testRecord);
      test.hashGenerated = (hash && hash.length > 0);
      test.sampleHash = hash;
    }
    
    // Determine status
    if (test.exportManagerCreated && test.validatorExists && test.calculateHashExists && test.hashGenerated) {
      test.status = 'PASS';
      Logger.log('   ✅ Hash method access: WORKING');
    } else {
      test.status = 'FAIL';
      Logger.log('   ❌ Hash method access: BROKEN');
    }
    
  } catch (error) {
    test.status = 'ERROR';
    test.error = error.message;
    Logger.log('   ❌ Hash method access: ERROR - ' + error.message);
  }
  
  return test;
}

/**
 * Test 3: Price Detection (Critical Test)
 */
function testPriceDetection() {
  var test = {
    name: 'Price Detection',
    status: 'UNKNOWN',
    priceInCoreFields: false,
    priceChangesDetected: false,
    scenarios: []
  };
  
  try {
    var exportManager = new ExportManager();
    
    // Test multiple price change scenarios
    var scenarios = [
      { name: 'Basic Price Change', original: '29.99', changed: '30.00' },
      { name: 'Small Price Change', original: '10.00', changed: '10.01' },
      { name: 'Large Price Change', original: '100.00', changed: '150.00' },
      { name: 'Price Reduction', original: '50.00', changed: '45.00' }
    ];
    
    var allScenariosPass = true;
    
    for (var i = 0; i < scenarios.length; i++) {
      var scenario = scenarios[i];
      
      var originalData = { id: '123', title: 'Test Product', price: scenario.original };
      var changedData = { id: '123', title: 'Test Product', price: scenario.changed };
      
      var originalHash = exportManager.validator.calculateHash(originalData);
      var changedHash = exportManager.validator.calculateHash(changedData);
      var detected = (originalHash !== changedHash);
      
      scenario.detected = detected;
      scenario.originalHash = originalHash.substring(0, 8) + '...';
      scenario.changedHash = changedHash.substring(0, 8) + '...';
      
      test.scenarios.push(scenario);
      
      if (!detected) {
        allScenariosPass = false;
      }
      
      Logger.log('   ' + scenario.name + ': ' + (detected ? 'DETECTED' : 'NOT DETECTED'));
    }
    
    test.priceChangesDetected = allScenariosPass;
    
    // Determine status
    if (test.priceChangesDetected) {
      test.status = 'PASS';
      Logger.log('   ✅ Price detection: WORKING - All price changes detected');
    } else {
      test.status = 'FAIL';
      Logger.log('   ❌ Price detection: BROKEN - Some price changes not detected');
    }
    
  } catch (error) {
    test.status = 'ERROR';
    test.error = error.message;
    Logger.log('   ❌ Price detection: ERROR - ' + error.message);
  }
  
  return test;
}

/**
 * Test 4: Change Detection System
 */
function testChangeDetectionSystem() {
  var test = {
    name: 'Change Detection System',
    status: 'UNKNOWN',
    scenarios: {},
    overallAccuracy: 0
  };
  
  try {
    var exportManager = new ExportManager();
    var validator = new ValidationEngine();
    var scenarios = {};
    
    // Scenario 1: New record (no stored hash)
    var newRecord = [{ id: '123', title: 'New Product', price: '29.99' }];
    var newChanges = exportManager.detectChanges(newRecord, {});
    scenarios.newRecord = {
      expected: 'toAdd',
      actual: newChanges.toAdd.length > 0 ? 'toAdd' : (newChanges.toUpdate.length > 0 ? 'toUpdate' : 'unchanged'),
      correct: newChanges.toAdd.length === 1
    };
    
    // Scenario 2: Unchanged record
    var unchangedData = { id: '456', title: 'Unchanged Product', price: '19.99' };
    var storedHash = validator.calculateHash(unchangedData);
    unchangedData._hash = storedHash;
    
    var unchangedRecord = [unchangedData];
    var unchangedChanges = exportManager.detectChanges(unchangedRecord, {});
    scenarios.unchangedRecord = {
      expected: 'unchanged',
      actual: unchangedChanges.unchanged.length > 0 ? 'unchanged' : (unchangedChanges.toUpdate.length > 0 ? 'toUpdate' : 'toAdd'),
      correct: unchangedChanges.unchanged.length === 1
    };
    
    // Scenario 3: Price changed record (CRITICAL TEST)
    var originalData = { id: '789', title: 'Price Test Product', price: '25.00' };
    var originalHash = validator.calculateHash(originalData);
    
    var modifiedData = { id: '789', title: 'Price Test Product', price: '27.50' };
    modifiedData._hash = originalHash; // Store old hash
    
    var modifiedRecord = [modifiedData];
    var modifiedChanges = exportManager.detectChanges(modifiedRecord, {});
    scenarios.priceChanged = {
      expected: 'toUpdate',
      actual: modifiedChanges.toUpdate.length > 0 ? 'toUpdate' : (modifiedChanges.unchanged.length > 0 ? 'unchanged' : 'toAdd'),
      correct: modifiedChanges.toUpdate.length === 1,
      critical: true
    };
    
    // Scenario 4: Vendor changed record
    var vendorOriginal = { id: '101', title: 'Vendor Test', vendor: 'Original Vendor', price: '15.00' };
    var vendorOriginalHash = validator.calculateHash(vendorOriginal);
    
    var vendorModified = { id: '101', title: 'Vendor Test', vendor: 'New Vendor', price: '15.00' };
    vendorModified._hash = vendorOriginalHash;
    
    var vendorRecord = [vendorModified];
    var vendorChanges = exportManager.detectChanges(vendorRecord, {});
    scenarios.vendorChanged = {
      expected: 'toUpdate',
      actual: vendorChanges.toUpdate.length > 0 ? 'toUpdate' : (vendorChanges.unchanged.length > 0 ? 'unchanged' : 'toAdd'),
      correct: vendorChanges.toUpdate.length === 1
    };
    
    test.scenarios = scenarios;
    
    // Calculate accuracy
    var correctScenarios = 0;
    var totalScenarios = 0;
    for (var scenario in scenarios) {
      totalScenarios++;
      if (scenarios[scenario].correct) {
        correctScenarios++;
      }
      
      var s = scenarios[scenario];
      Logger.log('   ' + scenario + ': ' + (s.correct ? 'PASS' : 'FAIL') + 
                 ' (expected: ' + s.expected + ', actual: ' + s.actual + ')' +
                 (s.critical && !s.correct ? ' *** CRITICAL FAILURE ***' : ''));
    }
    
    test.overallAccuracy = Math.round((correctScenarios / totalScenarios) * 100);
    
    // Determine status
    if (test.overallAccuracy === 100) {
      test.status = 'PASS';
      Logger.log('   ✅ Change detection: PERFECT - 100% accuracy');
    } else if (test.overallAccuracy >= 75) {
      test.status = 'PARTIAL';
      Logger.log('   ⚠️ Change detection: PARTIAL - ' + test.overallAccuracy + '% accuracy');
    } else {
      test.status = 'FAIL';
      Logger.log('   ❌ Change detection: BROKEN - ' + test.overallAccuracy + '% accuracy');
    }
    
  } catch (error) {
    test.status = 'ERROR';
    test.error = error.message;
    Logger.log('   ❌ Change detection: ERROR - ' + error.message);
  }
  
  return test;
}

/**
 * Test 5: System Health
 */
function testSystemHealth() {
  var test = {
    name: 'System Health',
    status: 'UNKNOWN',
    components: {}
  };
  
  try {
    // Test ExportManager
    try {
      var exportManager = new ExportManager();
      test.components.ExportManager = {
        status: 'OK',
        hasValidator: !!exportManager.validator,
        hasConfig: !!exportManager.configManager
      };
    } catch (error) {
      test.components.ExportManager = { status: 'ERROR', error: error.message };
    }
    
    // Test ValidationEngine
    try {
      var validationEngine = new ValidationEngine();
      var testHash = validationEngine.calculateHash({ id: '123', title: 'Test' });
      test.components.ValidationEngine = {
        status: 'OK',
        canCalculateHash: !!testHash
      };
    } catch (error) {
      test.components.ValidationEngine = { status: 'ERROR', error: error.message };
    }
    
    // Test ConfigManager
    try {
      var configManager = new ConfigManager();
      var shopDomain = configManager.getConfigValue('shop_domain');
      test.components.ConfigManager = {
        status: 'OK',
        hasConfig: !!shopDomain
      };
    } catch (error) {
      test.components.ConfigManager = { status: 'ERROR', error: error.message };
    }
    
    // Determine overall health
    var errorCount = 0;
    var totalComponents = 0;
    for (var component in test.components) {
      totalComponents++;
      if (test.components[component].status === 'ERROR') {
        errorCount++;
      }
    }
    
    if (errorCount === 0) {
      test.status = 'HEALTHY';
      Logger.log('   ✅ System health: HEALTHY - All components working');
    } else if (errorCount === 1) {
      test.status = 'DEGRADED';
      Logger.log('   ⚠️ System health: DEGRADED - ' + errorCount + ' component error');
    } else {
      test.status = 'CRITICAL';
      Logger.log('   ❌ System health: CRITICAL - ' + errorCount + ' component errors');
    }
    
  } catch (error) {
    test.status = 'ERROR';
    test.error = error.message;
    Logger.log('   ❌ System health: ERROR - ' + error.message);
  }
  
  return test;
}

/**
 * Generate final assessment
 */
function generateFinalAssessment(results) {
  var criticalIssues = [];
  var recommendations = [];
  var score = 0;
  var maxScore = 0;
  
  // Assess each test
  var tests = ['configTest', 'hashMethodTest', 'priceDetectionTest', 'changeDetectionTest', 'systemHealthTest'];
  
  for (var i = 0; i < tests.length; i++) {
    var testName = tests[i];
    var test = results[testName];
    maxScore += 20;
    
    if (test.status === 'PASS') {
      score += 20;
    } else if (test.status === 'PARTIAL') {
      score += 15;
    } else if (test.status === 'FAIL') {
      score += 5;
      criticalIssues.push(test.name + ' failed');
    } else if (test.status === 'ERROR') {
      criticalIssues.push(test.name + ' error: ' + test.error);
    }
  }
  
  // Special attention to price detection
  if (results.priceDetectionTest.status !== 'PASS') {
    criticalIssues.push('CRITICAL: Price detection not working - manual sheet changes will not be exported');
    recommendations.push('Fix ValidationEngine coreFields to include price and variant fields');
  }
  
  // Configuration issues
  if (results.configTest.status !== 'PASS') {
    recommendations.push('Run ConfigManager.initializeConfig() to add missing configuration keys');
  }
  
  // Overall status
  var overallScore = Math.round((score / maxScore) * 100);
  var overallStatus;
  
  if (overallScore >= 90 && criticalIssues.length === 0) {
    overallStatus = 'EXCELLENT';
  } else if (overallScore >= 75 && criticalIssues.length <= 1) {
    overallStatus = 'GOOD';
  } else if (overallScore >= 60) {
    overallStatus = 'FAIR';
  } else {
    overallStatus = 'POOR';
  }
  
  results.overallStatus = overallStatus;
  results.overallScore = overallScore;
  results.criticalIssues = criticalIssues;
  results.recommendations = recommendations;
  results.productionReady = (overallStatus === 'EXCELLENT' || overallStatus === 'GOOD') && criticalIssues.length === 0;
  
  return results;
}

/**
 * Log comprehensive results
 */
function logComprehensiveResults(results) {
  Logger.log('');
  Logger.log('=== COMPREHENSIVE TEST RESULTS ===');
  Logger.log('Timestamp: ' + results.timestamp);
  Logger.log('');
  
  // Test summaries
  Logger.log('TEST SUMMARIES:');
  Logger.log('1. Configuration System: ' + results.configTest.status);
  Logger.log('2. Hash Method Access: ' + results.hashMethodTest.status);
  Logger.log('3. Price Detection: ' + results.priceDetectionTest.status);
  Logger.log('4. Change Detection: ' + results.changeDetectionTest.status + ' (' + results.changeDetectionTest.overallAccuracy + '% accuracy)');
  Logger.log('5. System Health: ' + results.systemHealthTest.status);
  Logger.log('');
  
  // Overall assessment
  Logger.log('OVERALL ASSESSMENT:');
  Logger.log('Status: ' + results.overallStatus);
  Logger.log('Score: ' + results.overallScore + '/100');
  Logger.log('Production Ready: ' + (results.productionReady ? 'YES' : 'NO'));
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
  
  Logger.log('=== END COMPREHENSIVE TEST ===');
}

/**
 * Quick test for immediate feedback
 */
function quickSystemCheck() {
  Logger.log('=== QUICK SYSTEM CHECK ===');
  
  try {
    // 1. Can we create components?
    var exportManager = new ExportManager();
    Logger.log('✅ ExportManager created');
    
    // 2. Can we calculate hash?
    var hash = exportManager.validator.calculateHash({ id: '123', title: 'Test', price: '29.99' });
    Logger.log('✅ Hash calculation: ' + hash.substring(0, 8) + '...');
    
    // 3. Does price affect hash?
    var hash1 = exportManager.validator.calculateHash({ id: '123', price: '29.99' });
    var hash2 = exportManager.validator.calculateHash({ id: '123', price: '30.00' });
    var priceDetected = (hash1 !== hash2);
    Logger.log((priceDetected ? '✅' : '❌') + ' Price detection: ' + (priceDetected ? 'WORKING' : 'BROKEN'));
    
    // 4. Config keys present?
    var configManager = new ConfigManager();
    var batchSize = configManager.getConfigValue('batch_size');
    Logger.log((batchSize ? '✅' : '❌') + ' Config keys: ' + (batchSize ? 'PRESENT' : 'MISSING'));
    
    Logger.log('');
    Logger.log('Run runComprehensiveSystemTest() for detailed analysis');
    
  } catch (error) {
    Logger.log('❌ QUICK CHECK FAILED: ' + error.message);
  }
}
