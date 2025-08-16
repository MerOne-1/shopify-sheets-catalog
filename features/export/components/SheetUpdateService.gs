/**
 * Sheet Update Service
 * Handles updating sheet data after successful exports
 */

function SheetUpdateService() {
  this.validator = new ValidationEngine();
}

/**
 * Update hash values for successfully exported records
 * @param {string} sheetName - Name of the sheet to update
 * @param {Array} successfulRecords - Records that were successfully exported
 */
SheetUpdateService.prototype.updateHashesAfterExport = function(sheetName, successfulRecords) {
  try {
    Logger.log(`[SheetUpdateService] Updating hashes for ${successfulRecords.length} successful exports`);
    
    if (successfulRecords.length === 0) {
      Logger.log(`[SheetUpdateService] No records to update`);
      return { success: true, updated: 0 };
    }
    
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = spreadsheet.getSheetByName(sheetName);
    
    if (!sheet) {
      throw new Error(`Sheet not found: ${sheetName}`);
    }
    
    // Get sheet structure
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var hashColIndex = headers.indexOf('_hash');
    var idColIndex = headers.indexOf('id');
    
    if (hashColIndex === -1) {
      throw new Error('_hash column not found in sheet');
    }
    
    if (idColIndex === -1) {
      throw new Error('id column not found in sheet');
    }
    
    // Get all sheet data to find row numbers
    var allData = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
    var idToRowMap = {};
    
    for (var i = 0; i < allData.length; i++) {
      var id = allData[i][idColIndex];
      if (id) {
        idToRowMap[id] = i + 2; // +2 because sheet is 1-indexed and has header
      }
    }
    
    // Prepare batch updates
    var updates = [];
    var updated = 0;
    
    for (var j = 0; j < successfulRecords.length; j++) {
      var record = successfulRecords[j];
      
      if (!record.id) {
        Logger.log(`[SheetUpdateService] Skipping record without ID`);
        continue;
      }
      
      var rowNum = idToRowMap[record.id];
      if (!rowNum) {
        Logger.log(`[SheetUpdateService] Row not found for ID: ${record.id}`);
        continue;
      }
      
      // Calculate new hash for the record
      var newHash = this.validator.calculateHash(record);
      
      updates.push({
        range: sheet.getRange(rowNum, hashColIndex + 1),
        value: "'" + newHash // Force text format with apostrophe
      });
      
      updated++;
    }
    
    // Apply all updates
    if (updates.length > 0) {
      for (var k = 0; k < updates.length; k++) {
        var update = updates[k];
        update.range.setValue(update.value);
        update.range.setNumberFormat('@'); // Ensure text format
      }
      
      Logger.log(`[SheetUpdateService] Updated ${updated} hash values in ${sheetName}`);
    }
    
    return {
      success: true,
      updated: updated,
      message: `Updated ${updated} hash values after successful export`
    };
    
  } catch (error) {
    Logger.log(`[SheetUpdateService] Error updating hashes: ${error.message}`);
    return {
      success: false,
      error: error.message,
      updated: 0
    };
  }
};

/**
 * Update last sync timestamp for exported records
 * @param {string} sheetName - Name of the sheet to update
 * @param {Array} successfulRecords - Records that were successfully exported
 */
SheetUpdateService.prototype.updateLastSyncTimestamp = function(sheetName, successfulRecords) {
  try {
    if (successfulRecords.length === 0) {
      return { success: true, updated: 0 };
    }
    
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = spreadsheet.getSheetByName(sheetName);
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var syncColIndex = headers.indexOf('_last_synced_at');
    var idColIndex = headers.indexOf('id');
    
    if (syncColIndex === -1 || idColIndex === -1) {
      Logger.log(`[SheetUpdateService] Sync timestamp column not found, skipping`);
      return { success: true, updated: 0 };
    }
    
    var now = new Date().toISOString();
    var allData = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
    var idToRowMap = {};
    
    for (var i = 0; i < allData.length; i++) {
      var id = allData[i][idColIndex];
      if (id) {
        idToRowMap[id] = i + 2;
      }
    }
    
    var updated = 0;
    for (var j = 0; j < successfulRecords.length; j++) {
      var record = successfulRecords[j];
      var rowNum = idToRowMap[record.id];
      
      if (rowNum) {
        sheet.getRange(rowNum, syncColIndex + 1).setValue(now);
        updated++;
      }
    }
    
    Logger.log(`[SheetUpdateService] Updated ${updated} sync timestamps`);
    return { success: true, updated: updated };
    
  } catch (error) {
    Logger.log(`[SheetUpdateService] Error updating sync timestamps: ${error.message}`);
    return { success: false, error: error.message };
  }
};

/**
 * Complete post-export sheet update
 * @param {string} sheetName - Name of the sheet to update
 * @param {Array} successfulRecords - Records that were successfully exported
 */
SheetUpdateService.prototype.updateAfterExport = function(sheetName, successfulRecords) {
  try {
    Logger.log(`[SheetUpdateService] Starting post-export sheet update for ${successfulRecords.length} records`);
    
    // Update hashes (critical for change detection)
    var hashResult = this.updateHashesAfterExport(sheetName, successfulRecords);
    
    // Update sync timestamps (optional but useful)
    var syncResult = this.updateLastSyncTimestamp(sheetName, successfulRecords);
    
    var totalUpdated = hashResult.updated + (syncResult.updated || 0);
    
    Logger.log(`[SheetUpdateService] Post-export update completed: ${totalUpdated} total updates`);
    
    return {
      success: hashResult.success,
      hashUpdates: hashResult.updated,
      syncUpdates: syncResult.updated || 0,
      totalUpdates: totalUpdated,
      message: `Post-export update: ${hashResult.updated} hashes, ${syncResult.updated || 0} timestamps`
    };
    
  } catch (error) {
    Logger.log(`[SheetUpdateService] Error in post-export update: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
};
