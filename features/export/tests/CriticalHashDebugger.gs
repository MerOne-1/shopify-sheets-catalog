/**
 * Critical Hash Debugger
 * The hash fix didn't work - still processing all 48 variants
 * Need to find why change detection shows 48 updates after regeneration
 */

var CriticalHashDebugger = {
  
  /**
   * Debug why hash regeneration didn't fix the issue
   */
  debugHashRegenerationFailure: function() {
    try {
      Logger.log('=== CRITICAL HASH DEBUG ===');
      
      // Step 1: Check if hashes were actually updated in the sheet
      var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = spreadsheet.getSheetByName('Variants');
      
      var lastRow = sheet.getLastRow();
      var lastCol = sheet.getLastColumn();
      var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
      var hashColIndex = headers.indexOf('_hash');
      
      if (hashColIndex === -1) {
        Logger.log('ERROR: _hash column not found');
        return { error: '_hash column missing' };
      }
      
      // Get first few hash values from sheet
      var hashValues = sheet.getRange(2, hashColIndex + 1, Math.min(5, lastRow - 1), 1).getValues();
      Logger.log('Current hash values in sheet:');
      for (var i = 0; i < hashValues.length; i++) {
        Logger.log(`Row ${i + 2}: ${hashValues[i][0]}`);
      }
      
      // Step 2: Test change detection with current sheet data
      var exportManager = new ExportManager();
      var sheetData = exportManager.getSheetData('Variants');
      var validator = new ValidationEngine();
      
      Logger.log(`\n=== TESTING CHANGE DETECTION ===`);
      Logger.log(`Total variants loaded: ${sheetData.length}`);
      
      // Test first variant in detail
      if (sheetData.length > 0) {
        var testVariant = sheetData[0];
        var storedHash = testVariant._hash || '';
        var calculatedHash = validator.calculateHash(testVariant);
        
        Logger.log(`\nFirst variant test:`);
        Logger.log(`ID: ${testVariant.id}`);
        Logger.log(`Stored hash: "${storedHash}"`);
        Logger.log(`Calculated hash: "${calculatedHash}"`);
        Logger.log(`Hash lengths: stored=${storedHash.length}, calculated=${calculatedHash.length}`);
        Logger.log(`Hashes match: ${storedHash === calculatedHash}`);
        
        // Check if hash is truncated
        if (storedHash.length !== calculatedHash.length) {
          Logger.log('WARNING: Hash length mismatch - possible truncation in sheet');
        }
      }
      
      // Step 3: Run change detection
      var changes = exportManager.detectChanges(sheetData);
      Logger.log(`\nChange detection results:`);
      Logger.log(`To Add: ${changes.toAdd.length}`);
      Logger.log(`To Update: ${changes.toUpdate.length}`);
      Logger.log(`Unchanged: ${changes.unchanged.length}`);
      
      // Step 4: Check for hash calculation differences
      this.analyzeHashCalculationIssues(sheetData, validator);
      
      return {
        hashColumnExists: hashColIndex !== -1,
        totalVariants: sheetData.length,
        changesDetected: changes.toUpdate.length + changes.toAdd.length,
        sampleHashes: hashValues,
        testResult: {
          storedHash: testVariant ? testVariant._hash : null,
          calculatedHash: testVariant ? validator.calculateHash(testVariant) : null
        }
      };
      
    } catch (error) {
      Logger.log(`Error in critical hash debug: ${error.message}`);
      return { error: error.message };
    }
  },
  
  /**
   * Analyze hash calculation issues
   */
  analyzeHashCalculationIssues: function(sheetData, validator) {
    Logger.log(`\n=== HASH CALCULATION ANALYSIS ===`);
    
    if (sheetData.length === 0) return;
    
    // Test multiple variants
    var testCount = Math.min(3, sheetData.length);
    var hashMismatches = 0;
    var hashLengthIssues = 0;
    var emptyHashes = 0;
    
    for (var i = 0; i < testCount; i++) {
      var variant = sheetData[i];
      var storedHash = variant._hash || '';
      var calculatedHash = validator.calculateHash(variant);
      
      if (storedHash === '') {
        emptyHashes++;
      } else if (storedHash !== calculatedHash) {
        hashMismatches++;
        if (storedHash.length !== calculatedHash.length) {
          hashLengthIssues++;
        }
      }
      
      Logger.log(`Variant ${i + 1} (${variant.id}): stored="${storedHash.substring(0,10)}..." calc="${calculatedHash.substring(0,10)}..." match=${storedHash === calculatedHash}`);
    }
    
    Logger.log(`\nAnalysis summary:`);
    Logger.log(`Hash mismatches: ${hashMismatches}/${testCount}`);
    Logger.log(`Hash length issues: ${hashLengthIssues}/${testCount}`);
    Logger.log(`Empty hashes: ${emptyHashes}/${testCount}`);
    
    // Possible causes
    if (hashLengthIssues > 0) {
      Logger.log(`\nPOSSIBLE CAUSE: Hash truncation in Google Sheets`);
      Logger.log(`Solution: Use shorter hash or different storage method`);
    }
    
    if (hashMismatches === testCount) {
      Logger.log(`\nPOSSIBLE CAUSE: Hash calculation changed after regeneration`);
      Logger.log(`Solution: Check ValidationEngine.normalizeDataForHash() consistency`);
    }
  },
  
  /**
   * Force fix by updating hashes with proper format
   */
  forceFixHashes: function() {
    try {
      Logger.log('=== FORCE FIXING HASHES ===');
      
      var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = spreadsheet.getSheetByName('Variants');
      var lastRow = sheet.getLastRow();
      var lastCol = sheet.getLastColumn();
      
      if (lastRow <= 1) {
        Logger.log('No data to fix');
        return { success: true, updated: 0 };
      }
      
      var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
      var hashColIndex = headers.indexOf('_hash');
      
      if (hashColIndex === -1) {
        Logger.log('ERROR: _hash column not found');
        return { success: false, error: '_hash column missing' };
      }
      
      var dataRange = sheet.getRange(2, 1, lastRow - 1, lastCol);
      var values = dataRange.getValues();
      var validator = new ValidationEngine();
      var updated = 0;
      
      // Process in smaller batches to avoid timeout
      var batchSize = 10;
      for (var start = 0; start < values.length; start += batchSize) {
        var end = Math.min(start + batchSize, values.length);
        
        for (var i = start; i < end; i++) {
          var record = {};
          
          // Convert row to record
          for (var j = 0; j < headers.length; j++) {
            record[headers[j]] = values[i][j];
          }
          
          if (!record.id || record.id === '') continue;
          
          // Calculate hash and ensure it's a string
          var newHash = validator.calculateHash(record);
          var hashToStore = String(newHash).substring(0, 50); // Limit length to prevent truncation
          
          // Update the cell with text format
          var cell = sheet.getRange(i + 2, hashColIndex + 1);
          cell.setValue(hashToStore);
          cell.setNumberFormat('@'); // Force text format
          
          updated++;
        }
        
        Logger.log(`Updated batch ${Math.floor(start/batchSize) + 1}: ${end - start} variants`);
        
        // Small delay to prevent timeout
        if (start + batchSize < values.length) {
          Utilities.sleep(100);
        }
      }
      
      Logger.log(`Force fix completed: ${updated} variants updated with proper hash format`);
      
      return {
        success: true,
        updated: updated,
        message: `Force fixed ${updated} hashes with text formatting`
      };
      
    } catch (error) {
      Logger.log(`Error in force fix: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  /**
   * Complete diagnostic and fix
   */
  completeDiagnosticAndFix: function() {
    Logger.log('=== STARTING COMPLETE DIAGNOSTIC ===');
    
    try {
      // Step 1: Debug the failure
      var debugResult = this.debugHashRegenerationFailure();
      
      if (debugResult.error) {
        throw new Error('Debug failed: ' + debugResult.error);
      }
      
      // Step 2: Force fix if needed
      if (debugResult.changesDetected > 5) {
        Logger.log('Too many changes detected - applying force fix...');
        var fixResult = this.forceFixHashes();
        
        if (!fixResult.success) {
          throw new Error('Force fix failed: ' + fixResult.error);
        }
        
        // Step 3: Test after fix
        Logger.log('Testing change detection after force fix...');
        var exportManager = new ExportManager();
        var sheetData = exportManager.getSheetData('Variants');
        var changes = exportManager.detectChanges(sheetData);
        
        Logger.log(`After force fix - To Add: ${changes.toAdd.length}, To Update: ${changes.toUpdate.length}, Unchanged: ${changes.unchanged.length}`);
        
        return {
          success: true,
          debugResult: debugResult,
          fixResult: fixResult,
          finalChanges: changes.toUpdate.length + changes.toAdd.length,
          message: 'Complete diagnostic and fix applied'
        };
      } else {
        Logger.log('Change detection appears to be working - no force fix needed');
        return {
          success: true,
          debugResult: debugResult,
          message: 'System appears to be working correctly'
        };
      }
      
    } catch (error) {
      Logger.log(`Complete diagnostic failed: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
};

/**
 * Global functions
 */
function debugHashFailure() {
  return CriticalHashDebugger.debugHashRegenerationFailure();
}

function forceFixHashes() {
  return CriticalHashDebugger.forceFixHashes();
}

function completeDiagnosticFix() {
  return CriticalHashDebugger.completeDiagnosticAndFix();
}
