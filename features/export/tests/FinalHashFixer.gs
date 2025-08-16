/**
 * Final Hash Fixer
 * Regenerate all hashes using current ValidationEngine calculation method
 */

var FinalHashFixer = {
  
  /**
   * Regenerate all hashes with current calculation method
   */
  regenerateAllHashes: function() {
    try {
      Logger.log('=== FINAL HASH REGENERATION ===');
      
      var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = spreadsheet.getSheetByName('Variants');
      var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      var hashColIndex = headers.indexOf('_hash');
      
      if (hashColIndex === -1) {
        throw new Error('_hash column not found');
      }
      
      // Force text format on entire hash column
      var hashColumn = sheet.getRange(1, hashColIndex + 1, sheet.getLastRow(), 1);
      hashColumn.setNumberFormat('@');
      Logger.log('Set hash column to text format');
      
      // Get all data and regenerate hashes
      var exportManager = new ExportManager();
      var sheetData = exportManager.getSheetData('Variants');
      var validator = new ValidationEngine();
      
      var updated = 0;
      var batchUpdates = [];
      
      for (var i = 0; i < sheetData.length; i++) {
        var record = sheetData[i];
        if (!record.id || record.id === '') continue;
        
        // Calculate new hash with current method
        var newHash = validator.calculateHash(record);
        
        // Prepare batch update with explicit text prefix
        batchUpdates.push(["'" + newHash]); // Force text with apostrophe
        updated++;
        
        if (updated % 10 === 0) {
          Logger.log(`Prepared ${updated} hash updates...`);
        }
      }
      
      // Apply all updates at once
      if (batchUpdates.length > 0) {
        var updateRange = sheet.getRange(2, hashColIndex + 1, batchUpdates.length, 1);
        updateRange.setValues(batchUpdates);
        Logger.log(`Applied ${batchUpdates.length} hash updates in batch`);
      }
      
      // Immediate verification
      Logger.log('=== IMMEDIATE VERIFICATION ===');
      var verificationData = exportManager.getSheetData('Variants');
      var changes = exportManager.detectChanges(verificationData);
      
      Logger.log(`Verification result: ${changes.toUpdate.length} updates, ${changes.toAdd.length} additions`);
      
      if (changes.toUpdate.length === 0 && changes.toAdd.length === 0) {
        Logger.log('✅ SUCCESS: Hash system fixed - 0 changes detected');
      } else {
        Logger.log(`❌ STILL BROKEN: ${changes.toUpdate.length + changes.toAdd.length} changes detected`);
      }
      
      return {
        success: true,
        updated: updated,
        verification: {
          updates: changes.toUpdate.length,
          additions: changes.toAdd.length,
          fixed: changes.toUpdate.length === 0 && changes.toAdd.length === 0
        }
      };
      
    } catch (error) {
      Logger.log(`Error in final hash regeneration: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  /**
   * Test a few records before full regeneration
   */
  testHashRegeneration: function() {
    Logger.log('=== TESTING HASH REGENERATION ===');
    
    try {
      var exportManager = new ExportManager();
      var sheetData = exportManager.getSheetData('Variants');
      var validator = new ValidationEngine();
      
      if (sheetData.length === 0) {
        return { error: 'No data found' };
      }
      
      // Test first 3 records
      for (var i = 0; i < Math.min(3, sheetData.length); i++) {
        var record = sheetData[i];
        if (!record.id || record.id === '') continue;
        
        var storedHash = record._hash || '';
        var newHash = validator.calculateHash(record);
        
        Logger.log(`Record ${record.id}:`);
        Logger.log(`  Old: "${storedHash}" (${storedHash.length} chars)`);
        Logger.log(`  New: "${newHash}" (${newHash.length} chars)`);
        Logger.log(`  Different: ${storedHash !== newHash}`);
      }
      
      return { success: true };
      
    } catch (error) {
      Logger.log(`Test failed: ${error.message}`);
      return { error: error.message };
    }
  }
};

/**
 * Global functions
 */
function fixHashesFinally() {
  return FinalHashFixer.regenerateAllHashes();
}

function testHashRegen() {
  return FinalHashFixer.testHashRegeneration();
}
