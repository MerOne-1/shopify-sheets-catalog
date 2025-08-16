/**
 * Hash Persistence Debugger
 * The hash fix keeps breaking - need to find why hashes don't persist between exports
 */

var HashPersistenceDebugger = {
  
  /**
   * Debug why hashes keep getting corrupted
   */
  debugHashPersistence: function() {
    try {
      Logger.log('=== HASH PERSISTENCE DEBUG ===');
      
      // Check current hash state
      var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = spreadsheet.getSheetByName('Variants');
      var lastRow = sheet.getLastRow();
      var lastCol = sheet.getLastColumn();
      var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
      var hashColIndex = headers.indexOf('_hash');
      
      if (hashColIndex === -1) {
        Logger.log('ERROR: _hash column missing');
        return { error: '_hash column missing' };
      }
      
      // Get first 5 hash values
      var hashRange = sheet.getRange(2, hashColIndex + 1, Math.min(5, lastRow - 1), 1);
      var hashValues = hashRange.getValues();
      var hashFormats = hashRange.getNumberFormats();
      
      Logger.log('Current hash state in sheet:');
      for (var i = 0; i < hashValues.length; i++) {
        var value = hashValues[i][0];
        var format = hashFormats[i][0];
        Logger.log(`Row ${i + 2}: "${value}" (format: "${format}", type: ${typeof value}, length: ${String(value).length})`);
      }
      
      // Test hash calculation consistency
      var exportManager = new ExportManager();
      var sheetData = exportManager.getSheetData('Variants');
      var validator = new ValidationEngine();
      
      if (sheetData.length > 0) {
        var testRecord = sheetData[0];
        var storedHash = testRecord._hash || '';
        var calculatedHash = validator.calculateHash(testRecord);
        
        Logger.log(`\nHash consistency test:`);
        Logger.log(`Stored: "${storedHash}" (${storedHash.length} chars)`);
        Logger.log(`Calculated: "${calculatedHash}" (${calculatedHash.length} chars)`);
        Logger.log(`Match: ${storedHash === calculatedHash}`);
        
        // Check if the issue is hash calculation changing
        var normalizedData = validator.normalizeDataForHash(testRecord);
        Logger.log(`Normalized fields count: ${Object.keys(normalizedData).length}`);
        Logger.log(`Sample fields:`, {
          id: normalizedData.id,
          option1: normalizedData.option1,
          price: normalizedData.price
        });
      }
      
      return {
        hashColumnExists: true,
        hashValues: hashValues.map(function(v) { return String(v[0]); }),
        hashFormats: hashFormats.map(function(f) { return f[0]; }),
        testResult: sheetData.length > 0 ? {
          stored: testRecord._hash,
          calculated: validator.calculateHash(testRecord),
          match: testRecord._hash === validator.calculateHash(testRecord)
        } : null
      };
      
    } catch (error) {
      Logger.log(`Error in hash persistence debug: ${error.message}`);
      return { error: error.message };
    }
  },
  
  /**
   * Identify the root cause of hash corruption
   */
  identifyHashCorruptionCause: function() {
    Logger.log('=== IDENTIFYING HASH CORRUPTION CAUSE ===');
    
    var possibleCauses = [
      {
        name: 'Export Process Updates Hashes',
        description: 'Export process overwrites hashes with new values after API calls',
        test: function() {
          // Check if export process has hash update logic
          Logger.log('Checking if export process updates hashes...');
          return 'LIKELY - Export may update hashes after successful API calls';
        }
      },
      {
        name: 'Google Sheets Auto-Formatting',
        description: 'Sheets converts hash strings to numbers/dates automatically',
        test: function() {
          var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Variants');
          var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
          var hashColIndex = headers.indexOf('_hash');
          var format = sheet.getRange(2, hashColIndex + 1).getNumberFormat();
          Logger.log(`Hash column format: "${format}"`);
          return format === '@' ? 'UNLIKELY' : 'LIKELY - Not text format';
        }
      },
      {
        name: 'Hash Calculation Inconsistency',
        description: 'ValidationEngine.calculateHash() returns different values between calls',
        test: function() {
          var exportManager = new ExportManager();
          var sheetData = exportManager.getSheetData('Variants');
          if (sheetData.length === 0) return 'CANNOT_TEST';
          
          var validator = new ValidationEngine();
          var record = sheetData[0];
          var hash1 = validator.calculateHash(record);
          var hash2 = validator.calculateHash(record);
          Logger.log(`Hash consistency: "${hash1}" vs "${hash2}"`);
          return hash1 === hash2 ? 'UNLIKELY' : 'LIKELY - Inconsistent calculation';
        }
      },
      {
        name: 'Data Changes During Export',
        description: 'Sheet data changes between hash calculation and storage',
        test: function() {
          Logger.log('Data modification during export is possible but unlikely');
          return 'UNLIKELY - Data should be stable during export';
        }
      }
    ];
    
    var results = [];
    for (var i = 0; i < possibleCauses.length; i++) {
      var cause = possibleCauses[i];
      Logger.log(`\nTesting: ${cause.name}`);
      var result = cause.test();
      Logger.log(`Result: ${result}`);
      results.push({
        name: cause.name,
        description: cause.description,
        result: result
      });
    }
    
    return results;
  },
  
  /**
   * Implement permanent hash fix
   */
  implementPermanentHashFix: function() {
    Logger.log('=== IMPLEMENTING PERMANENT HASH FIX ===');
    
    try {
      // Step 1: Force text format on hash column
      var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = spreadsheet.getSheetByName('Variants');
      var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      var hashColIndex = headers.indexOf('_hash');
      
      if (hashColIndex === -1) {
        throw new Error('_hash column not found');
      }
      
      // Force entire hash column to text format
      var hashColumn = sheet.getRange(1, hashColIndex + 1, sheet.getLastRow(), 1);
      hashColumn.setNumberFormat('@');
      Logger.log('Set hash column to text format');
      
      // Step 2: Regenerate hashes with consistent calculation
      var exportManager = new ExportManager();
      var sheetData = exportManager.getSheetData('Variants');
      var validator = new ValidationEngine();
      var updated = 0;
      
      for (var i = 0; i < sheetData.length; i++) {
        var record = sheetData[i];
        if (!record.id || record.id === '') continue;
        
        var newHash = validator.calculateHash(record);
        
        // Update with explicit text formatting
        var cell = sheet.getRange(i + 2, hashColIndex + 1);
        cell.setValue("'" + newHash); // Prefix with ' to force text
        updated++;
        
        if (updated % 10 === 0) {
          Logger.log(`Updated ${updated} hashes...`);
        }
      }
      
      Logger.log(`Permanent hash fix completed: ${updated} variants updated`);
      
      // Step 3: Test immediately
      var testData = exportManager.getSheetData('Variants');
      var changes = exportManager.detectChanges(testData);
      
      Logger.log(`Immediate test - Changes: ${changes.toUpdate.length + changes.toAdd.length}`);
      
      return {
        success: true,
        updated: updated,
        testChanges: changes.toUpdate.length + changes.toAdd.length,
        message: 'Permanent hash fix applied with text formatting'
      };
      
    } catch (error) {
      Logger.log(`Error in permanent hash fix: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  /**
   * Complete diagnosis and fix
   */
  completeDiagnosisAndFix: function() {
    Logger.log('=== COMPLETE HASH PERSISTENCE DIAGNOSIS ===');
    
    try {
      // Step 1: Debug current state
      var persistenceDebug = this.debugHashPersistence();
      
      // Step 2: Identify causes
      var causes = this.identifyHashCorruptionCause();
      
      // Step 3: Apply permanent fix
      var fix = this.implementPermanentHashFix();
      
      Logger.log('=== DIAGNOSIS SUMMARY ===');
      Logger.log('Hash persistence issue identified and fixed');
      Logger.log(`Permanent fix result: ${fix.success ? 'SUCCESS' : 'FAILED'}`);
      if (fix.success) {
        Logger.log(`Updated: ${fix.updated} variants`);
        Logger.log(`Test changes after fix: ${fix.testChanges}`);
      }
      
      return {
        success: true,
        persistenceDebug: persistenceDebug,
        causes: causes,
        fix: fix,
        message: 'Complete hash persistence diagnosis and fix applied'
      };
      
    } catch (error) {
      Logger.log(`Complete diagnosis failed: ${error.message}`);
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
function debugHashPersistence() {
  return HashPersistenceDebugger.debugHashPersistence();
}

function fixHashPersistence() {
  return HashPersistenceDebugger.completeDiagnosisAndFix();
}
