// Milestone 3: Export Manager
// Main export orchestration component (~200 lines)

function ExportManager() {
  this.configManager = new ConfigManager();
  this.apiClient = new ApiClient(this.configManager);
  this.validator = new ValidationEngine();
  this.exportValidator = new ExportValidator();
  this.batchProcessor = new BatchProcessor(this.apiClient, this.configManager);
  this.retryManager = new RetryManager(this.configManager);
  this.auditLogger = null;
  this.exportQueue = null;
  this.sessionId = null;
}

/**
 * Main export entry point
 * @param {string} sheetName - Name of sheet to export (Products, Variants, etc.)
 * @param {Object} options - Export options
 */
ExportManager.prototype.initiateExport = function(sheetName, options) {
  options = options || {};
  this.sessionId = 'export_' + Date.now();
  
  try {
    Logger.log(`[ExportManager] Starting optimized export for ${sheetName} (Session: ${this.sessionId})`);
    
    // OPTIMIZATION 1: Early Change Detection - Move before validation
    var sheetData = this.getSheetData(sheetName);
    if (!sheetData || sheetData.length === 0) {
      return {
        success: false,
        error: 'No data found in sheet: ' + sheetName,
        sessionId: this.sessionId
      };
    }
    
    var changes = this.detectChanges(sheetData, options);
    Logger.log(`[ExportManager] Quick change detection: ${changes.toUpdate.length} updates, ${changes.toAdd.length} additions`);
    
    // OPTIMIZATION 2: Early Return for No Changes
    if (changes.toUpdate.length === 0 && changes.toAdd.length === 0) {
      Logger.log(`[ExportManager] No changes detected - skipping heavy validation`);
      
      // Minimal validation for no-change scenario
      var quickValidation = this.performQuickValidation(sheetName);
      if (!quickValidation.success) {
        return { 
          success: false, 
          error: quickValidation.error,
          sessionId: this.sessionId
        };
      }
      
      return {
        success: true,
        message: 'No changes detected - export not needed',
        summary: {
          totalRecords: sheetData.length,
          changesDetected: 0,
          unchanged: changes.unchanged.length,
          optimized: true,
          timeSaved: '~20 seconds'
        },
        sessionId: this.sessionId
      };
    }
    
    // OPTIMIZATION 3: Full validation only when changes detected
    Logger.log(`[ExportManager] Changes detected - performing full validation`);
    var preValidation = this.exportValidator.validateExportReadiness(sheetName, options);
    if (!preValidation.isValid) {
      return {
        success: false,
        error: 'Pre-export validation failed',
        details: preValidation.errors,
        sessionId: this.sessionId
      };
    }
    
    // Initialize components for actual export
    this.auditLogger = new AuditLogger(this.sessionId);
    this.exportQueue = new ExportQueue(this.sessionId);
    
    this.auditLogger.startExportSession({
      sheetName: sheetName,
      user: options.user,
      options: options,
      totalRecords: sheetData.length
    });
    
    // Step 4: Create export queue
    var queueItems = this.createExportQueue(changes, sheetName);
    
    // Step 5: Save export state
    this.saveExportState({
      sessionId: this.sessionId,
      sheetName: sheetName,
      options: options,
      queueSize: queueItems.length,
      status: 'ready'
    });
    
    return {
      success: true,
      message: 'Export initialized successfully',
      summary: {
        totalRecords: sheetData.length,
        changesDetected: changes.toUpdate.length + changes.toAdd.length,
        unchanged: changes.unchanged.length,
        queueSize: queueItems.length
      },
      sessionId: this.sessionId
    };
    
  } catch (error) {
    Logger.log(`[ExportManager] Error during optimized export: ${error.message}`);
    return {
      success: false,
      error: 'Export initiation failed: ' + error.message,
      sessionId: this.sessionId
    };
  }
};

/**
 * Quick validation for no-change scenarios
 * Performs minimal checks to avoid 9-second validation overhead
 */
ExportManager.prototype.performQuickValidation = function(sheetName) {
  try {
    // Only essential checks
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = spreadsheet.getSheetByName(sheetName);
    
    if (!sheet) {
      return { success: false, error: 'Sheet not found: ' + sheetName };
    }
    
    // Skip heavy API connectivity and config validation for no-change scenarios
    // These will be cached or skipped since no actual export is happening
    Logger.log(`[ExportManager] Quick validation passed for ${sheetName}`);
    
    return { success: true };
    
  } catch (error) {
    Logger.log(`[ExportManager] Quick validation failed: ${error.message}`);
    return { success: false, error: error.message };
  }
};

/**
 * Get sheet data for export
 * @param {string} sheetName - Name of the sheet
 */
ExportManager.prototype.getSheetData = function(sheetName) {
  try {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = spreadsheet.getSheetByName(sheetName);
    
    if (!sheet) {
      throw new Error('Sheet not found: ' + sheetName);
    }
    
    if (sheet.getLastRow() <= 1) {
      return [];
    }
    
    var dataRange = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn());
    var values = dataRange.getValues();
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    var data = [];
    for (var i = 0; i < values.length; i++) {
      var record = {};
      for (var j = 0; j < headers.length; j++) {
        record[headers[j]] = values[i][j];
      }
      data.push(record);
    }
    
    return data;
  } catch (error) {
    Logger.log(`[ExportManager] Error getting sheet data: ${error.message}`);
    throw error;
  }
};

/**
 * Detect changes using existing hash system
 * @param {Array} sheetData - Current sheet data
 * @param {Object} options - Export options
 */
ExportManager.prototype.detectChanges = function(sheetData, options) {
  try {
    var changes = {
      toAdd: [],
      toUpdate: [],
      unchanged: []
    };
    
    // Use existing ValidationEngine hash system for change detection
    for (var i = 0; i < sheetData.length; i++) {
      var record = sheetData[i];
      
      // Skip records without ID (invalid)
      if (!record.id || record.id === '') {
        continue;
      }
      
      // Calculate current hash using normalized data
      var currentHash = this.validator.calculateHash(record);
      var storedHash = record._hash || '';
      
      // Determine if record has changes
      if (storedHash === '') {
        // New record (no stored hash)
        changes.toAdd.push(record);
      } else if (currentHash !== storedHash) {
        // Modified record (hash mismatch)
        changes.toUpdate.push(record);
      } else {
        // Unchanged record
        changes.unchanged.push(record);
      }
    }
    
    return changes;
  } catch (error) {
    Logger.log(`[ExportManager] Error detecting changes: ${error.message}`);
    throw error;
  }
};

/**
 * Create export queue from detected changes
 * @param {Object} changes - Changes detected
 * @param {string} sheetName - Sheet name for context
 */
ExportManager.prototype.createExportQueue = function(changes, sheetName) {
  try {
    var queueItems = [];
    
    // Add update operations
    for (var i = 0; i < changes.toUpdate.length; i++) {
      queueItems.push({
        operation: 'update',
        record: changes.toUpdate[i],
        sheetName: sheetName,
        status: 'pending'
      });
    }
    
    // Add create operations
    for (var i = 0; i < changes.toAdd.length; i++) {
      queueItems.push({
        operation: 'create',
        record: changes.toAdd[i],
        sheetName: sheetName,
        status: 'pending'
      });
    }
    
    // Add items to the export queue
    this.exportQueue.addItems(queueItems);
    
    Logger.log(`[ExportManager] Created export queue with ${queueItems.length} items`);
    return queueItems;
    
  } catch (error) {
    Logger.log(`[ExportManager] Error creating export queue: ${error.message}`);
    return [];
  }
};

/**
 * Track export progress
 * @param {number} current - Current progress
 * @param {number} total - Total items
 */
ExportManager.prototype.trackProgress = function(current, total) {
  this.currentProgress = { current: current, total: total };
  var percentage = total > 0 ? Math.round((current / total) * 100) : 0;
  Logger.log(`[ExportManager] Progress: ${current}/${total} (${percentage}%)`);
  
  // Update saved state
  if (this.sessionId) {
    var state = this.loadExportState(this.sessionId);
    if (state) {
      state.progress = this.currentProgress;
      this.saveExportState(state);
    }
  }
};

/**
 * Handle export completion
 * @param {Object} results - Export results
 */
ExportManager.prototype.handleExportCompletion = function(results) {
  try {
    Logger.log(`[ExportManager] Export completed for session: ${this.sessionId}`);
    
    // Update export state to completed
    var state = this.loadExportState(this.sessionId);
    if (state) {
      state.status = 'completed';
      state.completedAt = new Date().toISOString();
      state.results = results;
      this.saveExportState(state);
    }
    
    return {
      success: true,
      sessionId: this.sessionId,
      results: results,
      message: 'Export completed successfully'
    };
  } catch (error) {
    Logger.log(`[ExportManager] Error handling completion: ${error.message}`);
    return {
      success: false,
      error: error.message,
      sessionId: this.sessionId
    };
  }
};

/**
 * Save export state for resumability
 * @param {string|Object} sessionIdOrState - Session ID or complete state object
 * @param {Object} state - Export state to save (if first param is sessionId)
 */
ExportManager.prototype.saveExportState = function(sessionIdOrState, state) {
  try {
    var properties = PropertiesService.getScriptProperties();
    var sessionId, stateToSave;
    
    // Handle both calling patterns:
    // 1. saveExportState(stateObject) - legacy pattern
    // 2. saveExportState(sessionId, stateObject) - test pattern
    if (typeof sessionIdOrState === 'string' && state) {
      // Pattern 2: separate sessionId and state
      sessionId = sessionIdOrState;
      stateToSave = state;
      // Ensure sessionId is in the state object
      stateToSave.sessionId = sessionId;
    } else if (typeof sessionIdOrState === 'object' && sessionIdOrState.sessionId) {
      // Pattern 1: state object with embedded sessionId
      stateToSave = sessionIdOrState;
      sessionId = stateToSave.sessionId;
    } else {
      throw new Error('Invalid parameters: expected (sessionId, state) or (stateWithSessionId)');
    }
    
    properties.setProperty('export_state_' + sessionId, JSON.stringify(stateToSave));
    Logger.log(`[ExportManager] Export state saved for session: ${sessionId}`);
  } catch (error) {
    Logger.log(`[ExportManager] Error saving export state: ${error.message}`);
  }
};

/**
 * Load export state for resumability
 * @param {string} sessionId - Session ID to load
 */
ExportManager.prototype.loadExportState = function(sessionId) {
  try {
    var properties = PropertiesService.getScriptProperties();
    var stateJson = properties.getProperty('export_state_' + sessionId);
    
    if (stateJson) {
      return JSON.parse(stateJson);
    }
    return null;
  } catch (error) {
    Logger.log(`[ExportManager] Error loading export state: ${error.message}`);
    return null;
  }
};

/**
 * Resume export from saved state
 * @param {string} sessionId - Session ID to resume
 */
ExportManager.prototype.resumeExport = function(sessionId) {
  try {
    var state = this.loadExportState(sessionId);
    if (!state) {
      return {
        success: false,
        error: 'Export state not found for session: ' + sessionId
      };
    }
    
    if (state.status === 'completed') {
      return {
        success: false,
        error: 'Export already completed for session: ' + sessionId
      };
    }
    
    // Restore session state
    this.sessionId = sessionId;
    this.exportQueue = state.queue || [];
    this.currentProgress = state.progress || { current: 0, total: 0 };
    
    Logger.log(`[ExportManager] Resumed export session: ${sessionId}`);
    
    return {
      success: true,
      message: 'Export session resumed successfully',
      sessionId: sessionId,
      progress: this.currentProgress
    };
  } catch (error) {
    Logger.log(`[ExportManager] Error resuming export: ${error.message}`);
    return {
      success: false,
      error: 'Failed to resume export: ' + error.message
    };
  }
};

/**
 * Process the export queue (delegates to ExportQueue component)
 * @param {Object} options - Processing options
 */
ExportManager.prototype.processExportQueue = function(options) {
  if (!this.exportQueue) {
    return {
      success: false,
      error: 'Export queue not initialized. Call initiateExport first.'
    };
  }
  
  try {
    Logger.log(`[ExportManager] Delegating queue processing to ExportQueue component`);
    
    // Delegate to ExportQueue with all required processors
    var result = this.exportQueue.processQueue({
      batchProcessor: this.batchProcessor,
      retryManager: this.retryManager,
      auditLogger: this.auditLogger
    }, options);
    
    // Update export state after processing
    if (result.success) {
      this.saveExportState({
        sessionId: this.sessionId,
        status: 'completed',
        completedAt: new Date().toISOString(),
        summary: result.summary
      });
    }
    
    return result;
    
  } catch (error) {
    Logger.log(`[ExportManager] Error in processExportQueue: ${error.message}`);
    return {
      success: false,
      error: 'Export queue processing failed: ' + error.message,
      sessionId: this.sessionId
    };
  }
};

/**
 * Cleanup completed export state
 * @param {string} sessionId - Session ID to cleanup
 */
ExportManager.prototype.cleanupCompletedExport = function(sessionId) {
  try {
    var properties = PropertiesService.getScriptProperties();
    properties.deleteProperty('export_state_' + sessionId);
    
    // Cleanup queue using ExportQueue component
    if (this.exportQueue) {
      this.exportQueue.cleanup(sessionId);
    } else {
      // Fallback cleanup if queue not initialized
      properties.deleteProperty('export_queue_' + sessionId);
    }
    
    Logger.log(`[ExportManager] Cleaned up export state for session: ${sessionId}`);
  } catch (error) {
    Logger.log(`[ExportManager] Error cleaning up export state: ${error.message}`);
  }
};

// ===== ACCEPTANCE CRITERIA METHODS =====

/**
 * Generate data hash for idempotency testing
 * @param {Array} data - Data to hash
 * @return {string} MD5 hash of the data
 */
ExportManager.prototype.generateDataHash = function(data) {
  try {
    if (!data || data.length === 0) {
      return '';
    }
    
    // Convert data to consistent string representation
    var dataString = JSON.stringify(data);
    
    // Generate MD5 hash using Google Apps Script Utilities
    var hash = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, dataString);
    
    // Convert to hex string
    var hashString = '';
    for (var i = 0; i < hash.length; i++) {
      var byte = hash[i];
      if (byte < 0) byte += 256;
      var hex = byte.toString(16);
      if (hex.length === 1) hex = '0' + hex;
      hashString += hex;
    }
    
    return hashString;
  } catch (error) {
    Logger.log(`[ExportManager] Error generating data hash: ${error.message}`);
    return '';
  }
};

/**
 * Check if data has changed using hash comparison
 * @param {string} sheetName - Sheet name for hash key
 * @param {Array} currentData - Current data to check
 * @return {boolean} True if data has changed
 */
ExportManager.prototype.hasDataChanged = function(sheetName, currentData) {
  try {
    var currentHash = this.generateDataHash(currentData);
    var properties = PropertiesService.getScriptProperties();
    var hashKey = 'data_hash_' + sheetName;
    var previousHash = properties.getProperty(hashKey);
    
    if (!previousHash) {
      // No previous hash, store current hash and consider as changed
      properties.setProperty(hashKey, currentHash);
      return true;
    }
    
    var hasChanged = currentHash !== previousHash;
    
    // Update stored hash if data has changed
    if (hasChanged) {
      properties.setProperty(hashKey, currentHash);
    }
    
    return hasChanged;
  } catch (error) {
    Logger.log(`[ExportManager] Error checking data changes: ${error.message}`);
    return true; // Assume changed on error
  }
};

/**
 * Get export state (alias for loadExportState for acceptance criteria)
 * @param {string} sessionId - Session ID to get state for
 * @return {Object} Export state object
 */
ExportManager.prototype.getExportState = function(sessionId) {
  return this.loadExportState(sessionId);
};
