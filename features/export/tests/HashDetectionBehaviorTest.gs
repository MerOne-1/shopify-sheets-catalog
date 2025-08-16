/**
 * Hash Detection Behavior Test
 * Tests the current hash detection system to understand exactly how it works
 */

function testCurrentHashDetectionBehavior() {
  Logger.log('=== HASH DETECTION BEHAVIOR TEST ===');
  
  var results = {
    timestamp: new Date().toISOString(),
    fieldAnalysis: {},
    hashBehavior: {},
    changeDetection: {},
    recommendations: []
  };
  
  try {
    // Test 1: Analyze which fields are used in hash calculation
    results.fieldAnalysis = analyzeHashFields();
    
    // Test 2: Test hash behavior with different data types
    results.hashBehavior = testHashCalculationBehavior();
    
    // Test 3: Simulate manual sheet changes
    results.changeDetection = testChangeDetectionScenarios();
    
    // Generate analysis summary
    results.summary = generateBehaviorSummary(results);
    
    logBehaviorResults(results);
    return results;
    
  } catch (error) {
    Logger.log('BEHAVIOR TEST FAILED: ' + error.message);
    results.error = error.message;
    return results;
  }
}

/**
 * Analyze which fields are actually used in hash calculation
 */
function analyzeHashFields() {
  var analysis = {
    coreFields: [],
    excludedFields: [],
    testResults: {}
  };
  
  try {
    var validator = new ValidationEngine();
    
    // Get the core fields list from ValidationEngine
    var testData = {
      id: '123',
      title: 'Test Product',
      handle: 'test-product',
      price: '29.99',
      vendor: 'Test Vendor',
      _hash: 'old_hash_value',
      _last_synced_at: '2025-01-01',
      inventory_quantity: '10',
      sku: 'TEST-SKU'
    };
    
    // Test what happens with full data
    var fullHash = validator.calculateHash(testData);
    
    // Test with minimal data (only known core fields)
    var minimalData = {
      id: '123',
      title: 'Test Product',
      handle: 'test-product'
    };
    var minimalHash = validator.calculateHash(minimalData);
    
    // Test with price change
    var priceChangedData = {
      id: '123',
      title: 'Test Product',
      handle: 'test-product',
      price: '30.00'  // Changed price
    };
    var priceChangedHash = validator.calculateHash(priceChangedData);
    
    // Test with vendor change
    var vendorChangedData = {
      id: '123',
      title: 'Test Product',
      handle: 'test-product',
      vendor: 'Different Vendor'  // Changed vendor
    };
    var vendorChangedHash = validator.calculateHash(vendorChangedData);
    
    analysis.testResults = {
      fullDataHash: fullHash,
      minimalDataHash: minimalHash,
      priceChangedHash: priceChangedHash,
      vendorChangedHash: vendorChangedHash,
      priceAffectsHash: minimalHash !== priceChangedHash,
      vendorAffectsHash: minimalHash !== vendorChangedHash,
      systemFieldsAffectHash: fullHash !== minimalHash
    };
    
    // Determine which fields are actually being used
    if (analysis.testResults.priceAffectsHash) {
      analysis.coreFields.push('price');
    } else {
      analysis.excludedFields.push('price');
    }
    
    if (analysis.testResults.vendorAffectsHash) {
      analysis.coreFields.push('vendor');
    } else {
      analysis.excludedFields.push('vendor');
    }
    
    analysis.success = true;
    
  } catch (error) {
    analysis.success = false;
    analysis.error = error.message;
  }
  
  return analysis;
}

/**
 * Test hash calculation behavior with different scenarios
 */
function testHashCalculationBehavior() {
  var behavior = {
    consistency: {},
    sensitivity: {},
    fieldHandling: {}
  };
  
  try {
    var validator = new ValidationEngine();
    
    // Test 1: Consistency - same data should produce same hash
    var data1 = { id: '123', title: 'Test Product', vendor: 'Test Vendor' };
    var data2 = { id: '123', title: 'Test Product', vendor: 'Test Vendor' };
    var hash1 = validator.calculateHash(data1);
    var hash2 = validator.calculateHash(data2);
    
    behavior.consistency = {
      hash1: hash1,
      hash2: hash2,
      consistent: hash1 === hash2
    };
    
    // Test 2: Sensitivity - small changes should be detected
    var originalData = { id: '123', title: 'Test Product', vendor: 'Test Vendor' };
    var modifiedData = { id: '123', title: 'Test Product', vendor: 'Test Vendor Modified' };
    var originalHash = validator.calculateHash(originalData);
    var modifiedHash = validator.calculateHash(modifiedData);
    
    behavior.sensitivity = {
      originalHash: originalHash,
      modifiedHash: modifiedHash,
      detectedChange: originalHash !== modifiedHash
    };
    
    // Test 3: Field handling - how different field types are processed
    var complexData = {
      id: 123,  // number
      title: '  Test Product  ',  // string with whitespace
      tags: 'tag1,tag2',  // string that could be array
      published_at: true,  // boolean
      price: 29.99,  // decimal
      _hash: 'should_be_ignored'  // system field
    };
    var complexHash = validator.calculateHash(complexData);
    
    // Test without system field
    var cleanData = {
      id: 123,
      title: '  Test Product  ',
      tags: 'tag1,tag2',
      published_at: true,
      price: 29.99
    };
    var cleanHash = validator.calculateHash(cleanData);
    
    behavior.fieldHandling = {
      complexHash: complexHash,
      cleanHash: cleanHash,
      systemFieldIgnored: complexHash === cleanHash
    };
    
    behavior.success = true;
    
  } catch (error) {
    behavior.success = false;
    behavior.error = error.message;
  }
  
  return behavior;
}

/**
 * Test change detection scenarios that simulate real usage
 */
function testChangeDetectionScenarios() {
  var detection = {
    scenarios: {},
    overallAccuracy: 0
  };
  
  try {
    var exportManager = new ExportManager();
    var scenarios = {};
    
    // Scenario 1: New product (no stored hash)
    var newProduct = [{ id: '123', title: 'New Product', vendor: 'Test Vendor' }];
    var newProductChanges = exportManager.detectChanges(newProduct, {});
    scenarios.newProduct = {
      input: newProduct,
      changes: newProductChanges,
      expectedToAdd: 1,
      actualToAdd: newProductChanges.toAdd.length,
      correct: newProductChanges.toAdd.length === 1
    };
    
    // Scenario 2: Unchanged product (hash matches)
    var validator = new ValidationEngine();
    var unchangedData = { id: '456', title: 'Unchanged Product', vendor: 'Test Vendor' };
    var storedHash = validator.calculateHash(unchangedData);
    unchangedData._hash = storedHash;  // Simulate stored hash
    
    var unchangedProduct = [unchangedData];
    var unchangedChanges = exportManager.detectChanges(unchangedProduct, {});
    scenarios.unchangedProduct = {
      input: unchangedProduct,
      changes: unchangedChanges,
      expectedUnchanged: 1,
      actualUnchanged: unchangedChanges.unchanged.length,
      correct: unchangedChanges.unchanged.length === 1
    };
    
    // Scenario 3: Modified product (simulate manual edit)
    var originalData = { id: '789', title: 'Original Product', vendor: 'Original Vendor' };
    var originalHash = validator.calculateHash(originalData);
    
    var modifiedData = { id: '789', title: 'Original Product', vendor: 'Modified Vendor' };
    modifiedData._hash = originalHash;  // Old hash stored
    
    var modifiedProduct = [modifiedData];
    var modifiedChanges = exportManager.detectChanges(modifiedProduct, {});
    scenarios.modifiedProduct = {
      input: modifiedProduct,
      changes: modifiedChanges,
      expectedToUpdate: 1,
      actualToUpdate: modifiedChanges.toUpdate.length,
      correct: modifiedChanges.toUpdate.length === 1
    };
    
    // Scenario 4: Price change (critical test for variants)
    var originalPriceData = { id: '101', title: 'Price Test Product', price: '29.99' };
    var originalPriceHash = validator.calculateHash(originalPriceData);
    
    var changedPriceData = { id: '101', title: 'Price Test Product', price: '30.00' };
    changedPriceData._hash = originalPriceHash;
    
    var priceChangedProduct = [changedPriceData];
    var priceChanges = exportManager.detectChanges(priceChangedProduct, {});
    scenarios.priceChange = {
      input: priceChangedProduct,
      changes: priceChanges,
      expectedToUpdate: 1,
      actualToUpdate: priceChanges.toUpdate.length,
      correct: priceChanges.toUpdate.length === 1,
      critical: true  // This is the main issue we're investigating
    };
    
    detection.scenarios = scenarios;
    
    // Calculate overall accuracy
    var correctScenarios = 0;
    var totalScenarios = 0;
    for (var scenario in scenarios) {
      totalScenarios++;
      if (scenarios[scenario].correct) {
        correctScenarios++;
      }
    }
    detection.overallAccuracy = (correctScenarios / totalScenarios) * 100;
    detection.success = true;
    
  } catch (error) {
    detection.success = false;
    detection.error = error.message;
  }
  
  return detection;
}

/**
 * Generate behavior analysis summary
 */
function generateBehaviorSummary(results) {
  var summary = {
    keyFindings: [],
    criticalIssues: [],
    systemStatus: 'UNKNOWN'
  };
  
  // Analyze field analysis results
  if (results.fieldAnalysis.success) {
    if (results.fieldAnalysis.excludedFields.indexOf('price') !== -1) {
      summary.criticalIssues.push('CRITICAL: Price changes not detected - price not in core fields');
    }
    
    if (results.fieldAnalysis.testResults.systemFieldsAffectHash) {
      summary.keyFindings.push('System fields (_hash, etc.) may be affecting hash calculation');
    }
  }
  
  // Analyze change detection results
  if (results.changeDetection.success) {
    var priceScenario = results.changeDetection.scenarios.priceChange;
    if (priceScenario && !priceScenario.correct) {
      summary.criticalIssues.push('CRITICAL: Price changes not detected in change detection test');
    }
    
    if (results.changeDetection.overallAccuracy < 100) {
      summary.criticalIssues.push('Change detection accuracy: ' + results.changeDetection.overallAccuracy + '%');
    }
  }
  
  // Determine system status
  if (summary.criticalIssues.length === 0) {
    summary.systemStatus = 'WORKING_CORRECTLY';
  } else if (summary.criticalIssues.length <= 2) {
    summary.systemStatus = 'HAS_ISSUES';
  } else {
    summary.systemStatus = 'BROKEN';
  }
  
  return summary;
}

/**
 * Log detailed behavior test results
 */
function logBehaviorResults(results) {
  Logger.log('');
  Logger.log('=== HASH DETECTION BEHAVIOR TEST RESULTS ===');
  Logger.log('Timestamp: ' + results.timestamp);
  Logger.log('');
  
  // Field Analysis
  if (results.fieldAnalysis.success) {
    Logger.log('FIELD ANALYSIS:');
    Logger.log('Core Fields: ' + results.fieldAnalysis.coreFields.join(', '));
    Logger.log('Excluded Fields: ' + results.fieldAnalysis.excludedFields.join(', '));
    Logger.log('Price affects hash: ' + results.fieldAnalysis.testResults.priceAffectsHash);
    Logger.log('Vendor affects hash: ' + results.fieldAnalysis.testResults.vendorAffectsHash);
    Logger.log('');
  }
  
  // Hash Behavior
  if (results.hashBehavior.success) {
    Logger.log('HASH BEHAVIOR:');
    Logger.log('Consistency: ' + results.hashBehavior.consistency.consistent);
    Logger.log('Change Detection: ' + results.hashBehavior.sensitivity.detectedChange);
    Logger.log('System Field Handling: ' + (results.hashBehavior.fieldHandling.systemFieldIgnored ? 'IGNORED' : 'INCLUDED'));
    Logger.log('');
  }
  
  // Change Detection Scenarios
  if (results.changeDetection.success) {
    Logger.log('CHANGE DETECTION SCENARIOS:');
    for (var scenario in results.changeDetection.scenarios) {
      var s = results.changeDetection.scenarios[scenario];
      Logger.log('  ' + scenario + ': ' + (s.correct ? 'PASS' : 'FAIL'));
      if (s.critical && !s.correct) {
        Logger.log('    *** CRITICAL FAILURE ***');
      }
    }
    Logger.log('Overall Accuracy: ' + results.changeDetection.overallAccuracy + '%');
    Logger.log('');
  }
  
  // Summary
  if (results.summary) {
    Logger.log('SUMMARY:');
    Logger.log('System Status: ' + results.summary.systemStatus);
    
    if (results.summary.keyFindings.length > 0) {
      Logger.log('Key Findings:');
      for (var i = 0; i < results.summary.keyFindings.length; i++) {
        Logger.log('  - ' + results.summary.keyFindings[i]);
      }
    }
    
    if (results.summary.criticalIssues.length > 0) {
      Logger.log('Critical Issues:');
      for (var i = 0; i < results.summary.criticalIssues.length; i++) {
        Logger.log('  - ' + results.summary.criticalIssues[i]);
      }
    }
  }
  
  Logger.log('');
  Logger.log('=== END BEHAVIOR TEST RESULTS ===');
}

/**
 * Quick test to check if price changes are detected
 */
function quickPriceChangeTest() {
  Logger.log('=== QUICK PRICE CHANGE TEST ===');
  
  try {
    var validator = new ValidationEngine();
    
    // Test 1: Hash with original price
    var originalData = { id: '123', title: 'Test Product', price: '29.99' };
    var originalHash = validator.calculateHash(originalData);
    
    // Test 2: Hash with changed price
    var changedData = { id: '123', title: 'Test Product', price: '30.00' };
    var changedHash = validator.calculateHash(changedData);
    
    Logger.log('Original hash: ' + originalHash.substring(0, 8) + '...');
    Logger.log('Changed hash:  ' + changedHash.substring(0, 8) + '...');
    Logger.log('Hashes different: ' + (originalHash !== changedHash));
    
    if (originalHash !== changedHash) {
      Logger.log('✅ PRICE CHANGES ARE DETECTED');
    } else {
      Logger.log('❌ PRICE CHANGES ARE NOT DETECTED');
    }
    
    return originalHash !== changedHash;
    
  } catch (error) {
    Logger.log('❌ TEST FAILED: ' + error.message);
    return false;
  }
}
