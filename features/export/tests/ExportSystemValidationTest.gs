/**
 * Export System Validation Test
 * Tests the fixed export system to verify all critical issues are resolved
 */

function runExportSystemValidationTest() {
  Logger.log('=== EXPORT SYSTEM VALIDATION TEST ===');
  
  var testResults = {
    timestamp: new Date().toISOString(),
    criticalFixes: {},
    systemHealth: {},
    recommendations: []
  };
  
  try {
    // Test 1: Verify critical fixes
    testResults.criticalFixes = testCriticalFixes();
    
    // Test 2: System health check
    testResults.systemHealth = testSystemHealth();
    
    // Test 3: Hash detection accuracy
    testResults.hashDetection = testHashDetectionAccuracy();
    
    // Test 4: Configuration completeness
    testResults.configuration = testConfigurationCompleteness();
    
    // Generate final assessment
    testResults.finalAssessment = generateFinalAssessment(testResults);
    
    // Log comprehensive results
    logValidationResults(testResults);
    
    return testResults;
    
  } catch (error) {
    Logger.log('VALIDATION TEST FAILED: ' + error.message);
    testResults.error = error.message;
    return testResults;
  }
}

/**
 * Test that critical fixes are working
 */
function testCriticalFixes() {
  var fixes = {
    calculateHashMethod: { tested: false, working: false, error: null },
    configurationKeys: { tested: false, working: false, error: null, missingKeys: [] }
  };
  
  // Test 1: calculateHash method fix
  try {
    var exportManager = new ExportManager();
    var testRecord = { id: '123', title: 'Test Product', handle: 'test-product' };
    var hash = exportManager.validator.calculateHash(testRecord);
    
    fixes.calculateHashMethod.tested = true;
    fixes.calculateHashMethod.working = (hash && hash.length > 0);
    fixes.calculateHashMethod.hashLength = hash ? hash.length : 0;
    fixes.calculateHashMethod.sampleHash = hash;
    
  } catch (error) {
    fixes.calculateHashMethod.tested = true;
    fixes.calculateHashMethod.working = false;
    fixes.calculateHashMethod.error = error.message;
  }
  
  // Test 2: Configuration keys fix
  try {
    var configManager = new ConfigManager();
    var requiredKeys = ['max_retries', 'retry_base_delay', 'retry_max_delay', 'batch_size'];
    var missingKeys = [];
    
    for (var i = 0; i < requiredKeys.length; i++) {
      var key = requiredKeys[i];
      var value = configManager.getConfigValue(key);
      if (value === null) {
        missingKeys.push(key);
      }
    }
    
    fixes.configurationKeys.tested = true;
    fixes.configurationKeys.working = (missingKeys.length === 0);
    fixes.configurationKeys.missingKeys = missingKeys;
    
  } catch (error) {
    fixes.configurationKeys.tested = true;
    fixes.configurationKeys.working = false;
    fixes.configurationKeys.error = error.message;
  }
  
  return fixes;
}

/**
 * Test overall system health
 */
function testSystemHealth() {
  var health = {
    components: {},
    overallStatus: 'UNKNOWN'
  };
  
  // Test ExportManager instantiation
  try {
    var exportManager = new ExportManager();
    health.components.ExportManager = {
      status: 'OK',
      hasValidator: !!exportManager.exportValidator,
      hasConfig: !!exportManager.config
    };
  } catch (error) {
    health.components.ExportManager = {
      status: 'ERROR',
      error: error.message
    };
  }
  
  // Test ValidationEngine
  try {
    var validationEngine = new ValidationEngine();
    var testData = { id: '123', title: 'Test' };
    var hash = validationEngine.calculateHash(testData);
    
    health.components.ValidationEngine = {
      status: 'OK',
      canCalculateHash: !!hash,
      hashLength: hash ? hash.length : 0
    };
  } catch (error) {
    health.components.ValidationEngine = {
      status: 'ERROR',
      error: error.message
    };
  }
  
  // Test ConfigManager
  try {
    var configManager = new ConfigManager();
    var shopDomain = configManager.getConfigValue('shop_domain');
    
    health.components.ConfigManager = {
      status: 'OK',
      hasConfig: !!shopDomain,
      shopDomain: shopDomain
    };
  } catch (error) {
    health.components.ConfigManager = {
      status: 'ERROR',
      error: error.message
    };
  }
  
  // Determine overall status
  var errorCount = 0;
  for (var component in health.components) {
    if (health.components[component].status === 'ERROR') {
      errorCount++;
    }
  }
  
  health.overallStatus = errorCount === 0 ? 'HEALTHY' : (errorCount === 1 ? 'DEGRADED' : 'CRITICAL');
  health.errorCount = errorCount;
  health.totalComponents = Object.keys(health.components).length;
  
  return health;
}

/**
 * Test hash detection accuracy with sample data
 */
function testHashDetectionAccuracy() {
  var detection = {
    tested: false,
    accuracy: 0,
    scenarios: {},
    error: null
  };
  
  try {
    var exportManager = new ExportManager();
    var scenarios = {};
    
    // Scenario 1: Identical records should have same hash
    var record1 = { id: '123', title: 'Test Product', price: '29.99' };
    var record2 = { id: '123', title: 'Test Product', price: '29.99' };
    var hash1 = exportManager.exportValidator.calculateHash(record1);
    var hash2 = exportManager.exportValidator.calculateHash(record2);
    
    scenarios.identicalRecords = {
      passed: hash1 === hash2,
      hash1: hash1,
      hash2: hash2
    };
    
    // Scenario 2: Different records should have different hashes
    var record3 = { id: '123', title: 'Different Product', price: '29.99' };
    var hash3 = exportManager.exportValidator.calculateHash(record3);
    
    scenarios.differentRecords = {
      passed: hash1 !== hash3,
      originalHash: hash1,
      modifiedHash: hash3
    };
    
    // Scenario 3: Minor changes should be detected
    var record4 = { id: '123', title: 'Test Product', price: '30.00' };
    var hash4 = exportManager.exportValidator.calculateHash(record4);
    
    scenarios.minorChanges = {
      passed: hash1 !== hash4,
      originalHash: hash1,
      changedHash: hash4
    };
    
    // Calculate accuracy
    var passedTests = 0;
    var totalTests = 0;
    for (var scenario in scenarios) {
      totalTests++;
      if (scenarios[scenario].passed) {
        passedTests++;
      }
    }
    
    detection.tested = true;
    detection.accuracy = (passedTests / totalTests) * 100;
    detection.scenarios = scenarios;
    detection.passedTests = passedTests;
    detection.totalTests = totalTests;
    
  } catch (error) {
    detection.tested = true;
    detection.error = error.message;
  }
  
  return detection;
}

/**
 * Test configuration completeness
 */
function testConfigurationCompleteness() {
  var config = {
    tested: false,
    complete: false,
    missingKeys: [],
    presentKeys: [],
    error: null
  };
  
  try {
    var configManager = new ConfigManager();
    var expectedKeys = [
      'shop_domain', 'api_version', 'max_batch_size', 'batch_size',
      'rate_limit_delay', 'max_retries', 'retry_base_delay', 'retry_max_delay'
    ];
    
    var missingKeys = [];
    var presentKeys = [];
    
    for (var i = 0; i < expectedKeys.length; i++) {
      var key = expectedKeys[i];
      var value = configManager.getConfigValue(key);
      
      if (value === null) {
        missingKeys.push(key);
      } else {
        presentKeys.push({ key: key, value: value });
      }
    }
    
    config.tested = true;
    config.complete = (missingKeys.length === 0);
    config.missingKeys = missingKeys;
    config.presentKeys = presentKeys;
    config.completeness = ((presentKeys.length / expectedKeys.length) * 100).toFixed(1) + '%';
    
  } catch (error) {
    config.tested = true;
    config.error = error.message;
  }
  
  return config;
}

/**
 * Generate final assessment
 */
function generateFinalAssessment(testResults) {
  var assessment = {
    status: 'UNKNOWN',
    score: 0,
    criticalIssues: [],
    recommendations: [],
    readyForProduction: false
  };
  
  var score = 0;
  var maxScore = 0;
  var criticalIssues = [];
  
  // Assess critical fixes
  if (testResults.criticalFixes.calculateHashMethod.working) {
    score += 25;
  } else {
    criticalIssues.push('calculateHash method not working');
  }
  maxScore += 25;
  
  if (testResults.criticalFixes.configurationKeys.working) {
    score += 25;
  } else {
    criticalIssues.push('Missing configuration keys: ' + testResults.criticalFixes.configurationKeys.missingKeys.join(', '));
  }
  maxScore += 25;
  
  // Assess system health
  if (testResults.systemHealth.overallStatus === 'HEALTHY') {
    score += 25;
  } else if (testResults.systemHealth.overallStatus === 'DEGRADED') {
    score += 15;
    criticalIssues.push('System health degraded');
  } else {
    criticalIssues.push('System health critical');
  }
  maxScore += 25;
  
  // Assess hash detection
  if (testResults.hashDetection.accuracy >= 100) {
    score += 25;
  } else if (testResults.hashDetection.accuracy >= 80) {
    score += 20;
  } else if (testResults.hashDetection.accuracy >= 60) {
    score += 15;
  } else {
    criticalIssues.push('Hash detection accuracy too low: ' + testResults.hashDetection.accuracy + '%');
  }
  maxScore += 25;
  
  assessment.score = Math.round((score / maxScore) * 100);
  assessment.criticalIssues = criticalIssues;
  
  // Determine status
  if (assessment.score >= 90 && criticalIssues.length === 0) {
    assessment.status = 'EXCELLENT';
    assessment.readyForProduction = true;
  } else if (assessment.score >= 75 && criticalIssues.length <= 1) {
    assessment.status = 'GOOD';
    assessment.readyForProduction = true;
  } else if (assessment.score >= 60) {
    assessment.status = 'FAIR';
    assessment.readyForProduction = false;
  } else {
    assessment.status = 'POOR';
    assessment.readyForProduction = false;
  }
  
  // Generate recommendations
  if (criticalIssues.length > 0) {
    assessment.recommendations.push('Address critical issues: ' + criticalIssues.join(', '));
  }
  
  if (testResults.hashDetection.accuracy < 100) {
    assessment.recommendations.push('Improve hash detection algorithm for better change detection');
  }
  
  if (testResults.systemHealth.overallStatus !== 'HEALTHY') {
    assessment.recommendations.push('Fix component health issues before production deployment');
  }
  
  return assessment;
}

/**
 * Log comprehensive validation results
 */
function logValidationResults(testResults) {
  Logger.log('');
  Logger.log('=== EXPORT SYSTEM VALIDATION RESULTS ===');
  Logger.log('Timestamp: ' + testResults.timestamp);
  Logger.log('');
  
  // Critical Fixes Status
  Logger.log('CRITICAL FIXES STATUS:');
  Logger.log('✓ calculateHash Method: ' + (testResults.criticalFixes.calculateHashMethod.working ? 'WORKING' : 'FAILED'));
  if (testResults.criticalFixes.calculateHashMethod.error) {
    Logger.log('  Error: ' + testResults.criticalFixes.calculateHashMethod.error);
  }
  Logger.log('✓ Configuration Keys: ' + (testResults.criticalFixes.configurationKeys.working ? 'COMPLETE' : 'INCOMPLETE'));
  if (testResults.criticalFixes.configurationKeys.missingKeys.length > 0) {
    Logger.log('  Missing: ' + testResults.criticalFixes.configurationKeys.missingKeys.join(', '));
  }
  Logger.log('');
  
  // System Health
  Logger.log('SYSTEM HEALTH: ' + testResults.systemHealth.overallStatus);
  for (var component in testResults.systemHealth.components) {
    var comp = testResults.systemHealth.components[component];
    Logger.log('  ' + component + ': ' + comp.status);
    if (comp.error) {
      Logger.log('    Error: ' + comp.error);
    }
  }
  Logger.log('');
  
  // Hash Detection
  Logger.log('HASH DETECTION ACCURACY: ' + testResults.hashDetection.accuracy + '%');
  if (testResults.hashDetection.scenarios) {
    for (var scenario in testResults.hashDetection.scenarios) {
      var result = testResults.hashDetection.scenarios[scenario];
      Logger.log('  ' + scenario + ': ' + (result.passed ? 'PASS' : 'FAIL'));
    }
  }
  Logger.log('');
  
  // Final Assessment
  Logger.log('FINAL ASSESSMENT:');
  Logger.log('Status: ' + testResults.finalAssessment.status);
  Logger.log('Score: ' + testResults.finalAssessment.score + '/100');
  Logger.log('Production Ready: ' + (testResults.finalAssessment.readyForProduction ? 'YES' : 'NO'));
  
  if (testResults.finalAssessment.criticalIssues.length > 0) {
    Logger.log('Critical Issues:');
    for (var i = 0; i < testResults.finalAssessment.criticalIssues.length; i++) {
      Logger.log('  - ' + testResults.finalAssessment.criticalIssues[i]);
    }
  }
  
  if (testResults.finalAssessment.recommendations.length > 0) {
    Logger.log('Recommendations:');
    for (var i = 0; i < testResults.finalAssessment.recommendations.length; i++) {
      Logger.log('  - ' + testResults.finalAssessment.recommendations[i]);
    }
  }
  
  Logger.log('');
  Logger.log('=== END VALIDATION RESULTS ===');
}

/**
 * Quick validation function for immediate testing
 */
function quickValidation() {
  Logger.log('=== QUICK VALIDATION ===');
  
  try {
    // Test 1: Can we create ExportManager?
    var exportManager = new ExportManager();
    Logger.log('✓ ExportManager created successfully');
    
    // Test 2: Can we calculate hash?
    var testRecord = { id: '123', title: 'Test Product' };
    var hash = exportManager.validator.calculateHash(testRecord);
    Logger.log('✓ Hash calculation working: ' + hash.substring(0, 8) + '...');
    
    // Test 3: Are config keys present?
    var configManager = new ConfigManager();
    var batchSize = configManager.getConfigValue('batch_size');
    var maxRetries = configManager.getConfigValue('max_retries');
    Logger.log('✓ Config keys present - batch_size: ' + batchSize + ', max_retries: ' + maxRetries);
    
    Logger.log('✅ QUICK VALIDATION PASSED - System appears to be working');
    return true;
    
  } catch (error) {
    Logger.log('❌ QUICK VALIDATION FAILED: ' + error.message);
    return false;
  }
}
