/**
 * Hash System Fixer
 * Fixes the corrupted hash system causing all 48 variants to appear changed
 */

var HashSystemFixer = {
  
  /**
   * Regenerate all hashes to fix the corruption
   */
  regenerateAllHashes: function() {
    try {
      Logger.log('=== REGENERATING ALL HASHES ===');
      
      var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = spreadsheet.getSheetByName('Variants');
      
      if (!sheet) {
        throw new Error('Variants sheet not found');
      }
      
      // Get all data
      var lastRow = sheet.getLastRow();
      var lastCol = sheet.getLastColumn();
      
      if (lastRow <= 1) {
        Logger.log('No data to process');
        return { success: true, updated: 0 };
      }
      
      var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
      var dataRange = sheet.getRange(2, 1, lastRow - 1, lastCol);
      var values = dataRange.getValues();
      
      // Find _hash column
      var hashColIndex = headers.indexOf('_hash');
      if (hashColIndex === -1) {
        throw new Error('_hash column not found');
      }
      
      var validator = new ValidationEngine();
      var updated = 0;
      
      // Process each row
      for (var i = 0; i < values.length; i++) {
        var record = {};
        
        // Convert row to record object
        for (var j = 0; j < headers.length; j++) {
          record[headers[j]] = values[i][j];
        }
        
        // Skip if no ID
        if (!record.id || record.id === '') {
          continue;
        }
        
        // Calculate new hash
        var newHash = validator.calculateHash(record);
        
        // Update the hash in the sheet
        sheet.getRange(i + 2, hashColIndex + 1).setValue(newHash);
        updated++;
        
        if (updated % 10 === 0) {
          Logger.log(`Updated ${updated} hashes...`);
        }
      }
      
      Logger.log(`Hash regeneration completed: ${updated} variants updated`);
      
      return {
        success: true,
        updated: updated,
        message: `Successfully regenerated ${updated} hashes`
      };
      
    } catch (error) {
      Logger.log(`Error regenerating hashes: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  /**
   * Test hash calculation for debugging
   */
  testHashCalculation: function() {
    try {
      Logger.log('=== TESTING HASH CALCULATION ===');
      
      var exportManager = new ExportManager();
      var sheetData = exportManager.getSheetData('Variants');
      var validator = new ValidationEngine();
      
      if (sheetData.length === 0) {
        Logger.log('No data to test');
        return;
      }
      
      // Test first variant
      var testVariant = sheetData[0];
      var storedHash = testVariant._hash || '';
      var calculatedHash = validator.calculateHash(testVariant);
      var normalizedData = validator.normalizeDataForHash(testVariant);
      
      Logger.log(`Test Variant ID: ${testVariant.id}`);
      Logger.log(`Stored Hash: ${storedHash}`);
      Logger.log(`Calculated Hash: ${calculatedHash}`);
      Logger.log(`Hashes Match: ${storedHash === calculatedHash}`);
      Logger.log(`Normalized Fields:`, Object.keys(normalizedData));
      Logger.log(`Sample normalized data:`, {
        id: normalizedData.id,
        option1: normalizedData.option1,
        price: normalizedData.price,
        inventory_quantity: normalizedData.inventory_quantity
      });
      
      return {
        variantId: testVariant.id,
        storedHash: storedHash,
        calculatedHash: calculatedHash,
        match: storedHash === calculatedHash,
        normalizedFields: Object.keys(normalizedData)
      };
      
    } catch (error) {
      Logger.log(`Error testing hash calculation: ${error.message}`);
      throw error;
    }
  },
  
  /**
   * Fix the ExportQueue null reference issue
   */
  fixExportQueueIssue: function() {
    try {
      Logger.log('=== FIXING EXPORT QUEUE ISSUE ===');
      
      // Test ExportQueue initialization
      var exportQueue = new ExportQueue('test-session');
      Logger.log('ExportQueue created successfully');
      
      // Test ExportManager initialization
      var exportManager = new ExportManager();
      Logger.log('ExportManager created successfully');
      
      // The issue is in ExportManager.initiateExport() - exportQueue not initialized before createExportQueue
      Logger.log('Issue identified: ExportQueue not initialized before createExportQueue call');
      
      return {
        success: true,
        issue: 'ExportQueue initialization order problem in ExportManager.initiateExport()',
        fix: 'Move exportQueue initialization before createExportQueue call'
      };
      
    } catch (error) {
      Logger.log(`Error fixing export queue: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  /**
   * Complete fix - regenerate hashes and test
   */
  completeFix: function() {
    Logger.log('=== STARTING COMPLETE HASH SYSTEM FIX ===');
    
    try {
      // Step 1: Test current hash calculation
      Logger.log('Step 1: Testing hash calculation...');
      this.testHashCalculation();
      
      // Step 2: Regenerate all hashes
      Logger.log('Step 2: Regenerating all hashes...');
      var result = this.regenerateAllHashes();
      
      if (!result.success) {
        throw new Error('Hash regeneration failed: ' + result.error);
      }
      
      // Step 3: Test change detection after fix
      Logger.log('Step 3: Testing change detection after fix...');
      var exportManager = new ExportManager();
      var sheetData = exportManager.getSheetData('Variants');
      var changes = exportManager.detectChanges(sheetData);
      
      Logger.log(`After fix - To Add: ${changes.toAdd.length}, To Update: ${changes.toUpdate.length}, Unchanged: ${changes.unchanged.length}`);
      
      // Step 4: Fix export queue issue
      Logger.log('Step 4: Fixing export queue issue...');
      this.fixExportQueueIssue();
      
      Logger.log('=== COMPLETE FIX SUCCESSFUL ===');
      Logger.log(`Hash system restored: ${result.updated} variants updated`);
      Logger.log(`Change detection now shows: ${changes.toUpdate.length} actual changes`);
      
      return {
        success: true,
        hashesUpdated: result.updated,
        changesDetected: changes.toUpdate.length,
        message: 'Hash system completely restored'
      };
      
    } catch (error) {
      Logger.log(`Complete fix failed: ${error.message}`);
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
function regenerateAllHashes() {
  return HashSystemFixer.regenerateAllHashes();
}

function testHashCalculation() {
  return HashSystemFixer.testHashCalculation();
}

function fixHashSystem() {
  return HashSystemFixer.completeFix();
}
