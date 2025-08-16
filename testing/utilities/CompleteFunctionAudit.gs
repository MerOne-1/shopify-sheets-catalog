/**
 * Complete Function Audit Test
 * Validates ALL menu callback functions exist in Code.gs
 */

function runCompleteFunctionAudit() {
  Logger.log('=== COMPLETE FUNCTION AUDIT ===');
  
  // All functions that should exist in Code.gs based on UIManager menu
  var requiredFunctions = [
    // Import Operations
    'importAllProducts',
    'importProductsOnly', 
    'importVariantsOnly',
    'importMetafields',
    'importImages',
    'importInventory',
    
    // Validation Operations
    'runDryRun',
    'validateAllData',
    'checkDuplicates',
    'recomputeHashes',
    
    // Export Operations
    'exportToShopify',
    'exportProducts',
    'exportVariants',
    'viewExportStatus',
    'resumeExport',
    'viewExportAuditReport',
    
    // Tools
    'testShopifyConnection',
    'createManualBackup',
    'showRestoreDialog',
    'clearLogs',
    'toggleReadOnlyMode',
    'refreshConfig',
    
    // Main Menu
    'openUserGuide',
    'openSettings',
    
    // Additional functions that might be called
    'setupConfig',
    'viewImportStats',
    'dryRunProducts',
    'dryRunVariants',
    'dryRunAll',
    'incrementalProducts',
    'incrementalVariants',
    'incrementalAll'
  ];
  
  var results = {
    testName: 'Complete Function Audit',
    timestamp: new Date().toISOString(),
    total: requiredFunctions.length,
    existing: 0,
    missing: 0,
    missingFunctions: [],
    existingFunctions: [],
    overallSuccess: true
  };
  
  // Check each function
  requiredFunctions.forEach(function(funcName) {
    try {
      // Try to get the function
      var func = eval(funcName);
      
      if (typeof func === 'function') {
        results.existing++;
        results.existingFunctions.push(funcName);
        Logger.log(`✅ ${funcName}: EXISTS`);
      } else {
        results.missing++;
        results.missingFunctions.push(funcName);
        results.overallSuccess = false;
        Logger.log(`❌ ${funcName}: NOT A FUNCTION`);
      }
    } catch (error) {
      results.missing++;
      results.missingFunctions.push(funcName);
      results.overallSuccess = false;
      Logger.log(`❌ ${funcName}: NOT FOUND - ${error.message}`);
    }
  });
  
  // Log summary
  Logger.log('\n=== AUDIT SUMMARY ===');
  Logger.log(`Total Functions Required: ${results.total}`);
  Logger.log(`Functions Found: ${results.existing}`);
  Logger.log(`Functions Missing: ${results.missing}`);
  Logger.log(`Success Rate: ${Math.round((results.existing / results.total) * 100)}%`);
  
  if (results.missingFunctions.length > 0) {
    Logger.log('\n❌ MISSING FUNCTIONS:');
    results.missingFunctions.forEach(function(func) {
      Logger.log(`   - ${func}`);
    });
  }
  
  Logger.log(`\nOverall Result: ${results.overallSuccess ? '✅ ALL FUNCTIONS EXIST' : '❌ MISSING FUNCTIONS FOUND'}`);
  
  return results;
}

/**
 * Test all existing functions for basic functionality
 */
function testAllExistingFunctions() {
  Logger.log('=== TESTING ALL EXISTING FUNCTIONS ===');
  
  // Safe functions to test (won't modify data)
  var safeFunctions = [
    'viewImportStats',
    'testShopifyConnection',
    'validateAllData',
    'clearLogs',
    'runDryRun'
  ];
  
  var results = {
    tested: 0,
    passed: 0,
    failed: 0,
    results: []
  };
  
  safeFunctions.forEach(function(funcName) {
    results.tested++;
    
    try {
      Logger.log(`Testing ${funcName}()...`);
      var result = eval(funcName + '()');
      
      results.passed++;
      results.results.push({
        function: funcName,
        success: true,
        message: 'Function executed successfully'
      });
      
      Logger.log(`✅ ${funcName}: WORKING`);
      
    } catch (error) {
      results.failed++;
      results.results.push({
        function: funcName,
        success: false,
        message: error.message
      });
      
      Logger.log(`❌ ${funcName}: ERROR - ${error.message}`);
    }
  });
  
  Logger.log(`\nFunction Test Results: ${results.passed}/${results.tested} working`);
  return results;
}

/**
 * Generate missing function stubs
 */
function generateMissingFunctionStubs() {
  Logger.log('=== GENERATING MISSING FUNCTION STUBS ===');
  
  var auditResults = runCompleteFunctionAudit();
  
  if (auditResults.missingFunctions.length === 0) {
    Logger.log('✅ No missing functions - all good!');
    return;
  }
  
  Logger.log('Missing functions that need to be added to Code.gs:');
  Logger.log('');
  
  auditResults.missingFunctions.forEach(function(funcName) {
    var stub = '';
    
    // Generate appropriate stub based on function name
    if (funcName.startsWith('import')) {
      stub = `function ${funcName}() {\n  throw new Error('${funcName} will be available in future milestones');\n}`;
    } else if (funcName.startsWith('export')) {
      stub = `function ${funcName}() {\n  return new UIManager().${funcName}();\n}`;
    } else if (funcName.includes('Backup') || funcName.includes('Restore')) {
      stub = `function ${funcName}() {\n  throw new Error('${funcName} is not yet implemented');\n}`;
    } else {
      stub = `function ${funcName}() {\n  throw new Error('${funcName} is not yet implemented');\n}`;
    }
    
    Logger.log(stub);
    Logger.log('');
  });
  
  return auditResults.missingFunctions;
}
