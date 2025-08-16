// Hash Update Flow Test
// Tests the complete hash update mechanism after export

function HashUpdateFlowTest() {
  this.testResults = [];
  this.exportManager = new ExportManager();
  this.validationEngine = new ValidationEngine();
}

/**
 * Run comprehensive hash update flow test
 */
HashUpdateFlowTest.prototype.runCompleteTest = function() {
  Logger.log('=== HASH UPDATE FLOW TEST STARTING ===');
  
  try {
    // Test 1: Verify hash update mechanism works
    this.testHashUpdateMechanism();
    
    // Test 2: Test complete export flow with hash updates
    this.testCompleteExportFlow();
    
    // Test 3: Verify subsequent export detects no changes
    this.testSubsequentExportOptimization();
    
    // Generate final report
    this.generateFinalReport();
    
  } catch (error) {
    Logger.log(`[HashUpdateFlowTest] Critical error: ${error.message}`);
    this.testResults.push({
      test: 'CRITICAL_ERROR',
      status: 'FAILED',
      error: error.message,
      timestamp: new Date()
    });
  }
};

/**
 * Test 1: Hash update mechanism
 */
HashUpdateFlowTest.prototype.testHashUpdateMechanism = function() {
  Logger.log('[TEST 1] Testing hash update mechanism...');
  
  try {
    var sheetName = 'Variants';
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    
    if (!sheet) {
      throw new Error(`Sheet ${sheetName} not found`);
    }
    
    // Get first 3 records for testing
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var testRecords = [];
    
    for (var i = 1; i <= Math.min(3, data.length - 1); i++) {
      var record = {};
      for (var j = 0; j < headers.length; j++) {
        record[headers[j]] = data[i][j];
      }
      testRecords.push(record);
    }
    
    // Test SheetUpdateService directly
    var sheetUpdateService = new SheetUpdateService();
    var updateResult = sheetUpdateService.updateAfterExport(sheetName, testRecords);
    
    this.testResults.push({
      test: 'HASH_UPDATE_MECHANISM',
      status: updateResult.success ? 'PASSED' : 'FAILED',
      details: updateResult.message || updateResult.error,
      recordsProcessed: testRecords.length,
      timestamp: new Date()
    });
    
    Logger.log(`[TEST 1] ${updateResult.success ? 'PASSED' : 'FAILED'} - ${updateResult.message || updateResult.error}`);
    
  } catch (error) {
    this.testResults.push({
      test: 'HASH_UPDATE_MECHANISM',
      status: 'FAILED',
      error: error.message,
      timestamp: new Date()
    });
    Logger.log(`[TEST 1] FAILED - ${error.message}`);
  }
};

/**
 * Test 2: Complete export flow with hash updates
 */
HashUpdateFlowTest.prototype.testCompleteExportFlow = function() {
  Logger.log('[TEST 2] Testing complete export flow...');
  
  try {
    var startTime = new Date();
    
    // Run a small export (first 5 records)
    var sheetName = 'Variants';
    var options = {
      maxRecords: 5,
      testMode: true
    };
    
    var exportResult = this.exportManager.initiateExport(sheetName, options);
    
    var endTime = new Date();
    var duration = endTime.getTime() - startTime.getTime();
    
    this.testResults.push({
      test: 'COMPLETE_EXPORT_FLOW',
      status: exportResult.success ? 'PASSED' : 'FAILED',
      details: exportResult.message || exportResult.error,
      duration: duration,
      recordsProcessed: exportResult.summary ? exportResult.summary.totalItems : 0,
      timestamp: new Date()
    });
    
    Logger.log(`[TEST 2] ${exportResult.success ? 'PASSED' : 'FAILED'} - Duration: ${duration}ms`);
    
  } catch (error) {
    this.testResults.push({
      test: 'COMPLETE_EXPORT_FLOW',
      status: 'FAILED',
      error: error.message,
      timestamp: new Date()
    });
    Logger.log(`[TEST 2] FAILED - ${error.message}`);
  }
};

/**
 * Test 3: Subsequent export optimization
 */
HashUpdateFlowTest.prototype.testSubsequentExportOptimization = function() {
  Logger.log('[TEST 3] Testing subsequent export optimization...');
  
  try {
    var startTime = new Date();
    
    // Run export again immediately - should detect no changes
    var sheetName = 'Variants';
    var options = {
      maxRecords: 5,
      testMode: true
    };
    
    var exportResult = this.exportManager.initiateExport(sheetName, options);
    
    var endTime = new Date();
    var duration = endTime.getTime() - startTime.getTime();
    
    // Check if optimization worked (should be very fast)
    var optimizationWorked = duration < 5000; // Less than 5 seconds
    var noChangesDetected = exportResult.message && exportResult.message.includes('No changes detected');
    
    this.testResults.push({
      test: 'SUBSEQUENT_EXPORT_OPTIMIZATION',
      status: (optimizationWorked && noChangesDetected) ? 'PASSED' : 'FAILED',
      details: `Duration: ${duration}ms, No changes: ${noChangesDetected}`,
      optimizationWorked: optimizationWorked,
      noChangesDetected: noChangesDetected,
      duration: duration,
      timestamp: new Date()
    });
    
    Logger.log(`[TEST 3] ${(optimizationWorked && noChangesDetected) ? 'PASSED' : 'FAILED'} - Duration: ${duration}ms, No changes: ${noChangesDetected}`);
    
  } catch (error) {
    this.testResults.push({
      test: 'SUBSEQUENT_EXPORT_OPTIMIZATION',
      status: 'FAILED',
      error: error.message,
      timestamp: new Date()
    });
    Logger.log(`[TEST 3] FAILED - ${error.message}`);
  }
};

/**
 * Generate final test report
 */
HashUpdateFlowTest.prototype.generateFinalReport = function() {
  Logger.log('=== HASH UPDATE FLOW TEST RESULTS ===');
  
  var passedTests = 0;
  var totalTests = this.testResults.length;
  
  for (var i = 0; i < this.testResults.length; i++) {
    var result = this.testResults[i];
    Logger.log(`${result.test}: ${result.status}`);
    
    if (result.status === 'PASSED') {
      passedTests++;
    }
    
    if (result.details) {
      Logger.log(`  Details: ${result.details}`);
    }
    
    if (result.error) {
      Logger.log(`  Error: ${result.error}`);
    }
    
    if (result.duration) {
      Logger.log(`  Duration: ${result.duration}ms`);
    }
  }
  
  var successRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
  
  Logger.log('=== SUMMARY ===');
  Logger.log(`Tests Passed: ${passedTests}/${totalTests} (${successRate.toFixed(1)}%)`);
  
  if (successRate === 100) {
    Logger.log('🎉 ALL TESTS PASSED - Hash update mechanism is working correctly!');
  } else {
    Logger.log('⚠️ Some tests failed - Hash update mechanism needs attention');
  }
  
  return {
    success: successRate === 100,
    passedTests: passedTests,
    totalTests: totalTests,
    successRate: successRate,
    results: this.testResults
  };
};

/**
 * Quick test function for manual execution
 */
function testHashUpdateFlow() {
  var test = new HashUpdateFlowTest();
  return test.runCompleteTest();
}

/**
 * Test only the hash update mechanism
 */
function testHashUpdateMechanismOnly() {
  var test = new HashUpdateFlowTest();
  test.testHashUpdateMechanism();
  return test.testResults;
}
