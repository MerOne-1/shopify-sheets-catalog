// Milestone 3: Export Validator
// Export-specific validation component (~150 lines)

function ExportValidator() {
  this.configManager = new ConfigManager();
  this.errors = [];
  this.warnings = [];
  
  // Ensure arrays are properly initialized
  if (!this.errors) this.errors = [];
  if (!this.warnings) this.warnings = [];
}

/**
 * Validate export readiness
 * @param {string} sheetName - Name of sheet to export
 * @param {Object} options - Export options
 */
ExportValidator.prototype.validateExportReadiness = function(sheetName, options) {
  options = options || {};
  this.errors = [];
  this.warnings = [];
  
  try {
    Logger.log(`[ExportValidator] Validating export readiness for ${sheetName}`);
    
    // Check basic requirements
    this.validateSheetExists(sheetName);
    this.validatePermissions(options.user);
    this.checkApiQuotas();
    this.validateConfiguration();
    
    // Check for conflicts if not forcing
    if (!options.force) {
      this.detectConflicts(sheetName);
    }
    
    var result = {
      isValid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
      summary: {
        totalErrors: this.errors.length,
        totalWarnings: this.warnings.length,
        canProceed: this.errors.length === 0
      }
    };
    
    Logger.log(`[ExportValidator] Validation complete: ${result.isValid ? 'PASSED' : 'FAILED'} (${this.errors.length} errors, ${this.warnings.length} warnings)`);
    return result;
    
  } catch (error) {
    Logger.log(`[ExportValidator] Validation error: ${error.message}`);
    this.errors.push('Validation system error: ' + error.message);
    
    return {
      isValid: false,
      errors: this.errors,
      warnings: this.warnings,
      summary: {
        totalErrors: this.errors.length,
        totalWarnings: this.warnings.length,
        canProceed: false
      }
    };
  }
};

/**
 * Validate that the sheet exists and has data
 * @param {string} sheetName - Name of the sheet
 */
ExportValidator.prototype.validateSheetExists = function(sheetName) {
  try {
    // Ensure arrays are initialized
    if (!this.errors) this.errors = [];
    if (!this.warnings) this.warnings = [];
    
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = spreadsheet.getSheetByName(sheetName);
    
    if (!sheet) {
      this.errors.push(`Sheet '${sheetName}' does not exist`);
      return;
    }
    
    if (sheet.getLastRow() <= 1) {
      this.warnings.push(`Sheet '${sheetName}' appears to be empty (no data rows)`);
      return;
    }
    
    // Check for required columns
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var requiredColumns = this.getRequiredColumns(sheetName);
    
    for (var i = 0; i < requiredColumns.length; i++) {
      var column = requiredColumns[i];
      if (headers.indexOf(column) === -1) {
        this.errors.push(`Required column '${column}' missing from sheet '${sheetName}'`);
      }
    }
    
    Logger.log(`[ExportValidator] Sheet validation passed for ${sheetName}`);
  } catch (error) {
    this.errors.push(`Error validating sheet '${sheetName}': ${error.message}`);
  }
};

/**
 * Get required columns for a sheet type
 * @param {string} sheetName - Name of the sheet
 */
ExportValidator.prototype.getRequiredColumns = function(sheetName) {
  switch (sheetName.toLowerCase()) {
    case 'products':
      return ['id', 'title', 'handle'];
    case 'variants':
      return ['id', 'product_id', 'price'];
    case 'inventory':
      return ['variant_id', 'available'];
    case 'mf_products':
    case 'mf_variants':
      return ['id', 'owner_id', 'namespace', 'key', 'value'];
    case 'images':
      return ['id', 'product_id', 'src'];
    default:
      return ['id'];
  }
};

/**
 * Validate export permissions
 * @param {string} user - User email or identifier
 */
ExportValidator.prototype.validatePermissions = function(user) {
  try {
    // Check if read-only mode is enabled
    var readOnlyMode = this.configManager.getConfigValue('read_only_mode');
    if (readOnlyMode === 'true' || readOnlyMode === true) {
      this.errors.push('System is in read-only mode - exports are disabled');
      return;
    }
    
    // Check admin permissions for export operations
    var adminEmails = this.configManager.getConfigValue('admin_emails') || '';
    var adminList = adminEmails.split(',').map(function(email) {
      return email.trim().toLowerCase();
    });
    
    var currentUser = user || Session.getActiveUser().getEmail().toLowerCase();
    
    if (adminList.length > 0 && adminList.indexOf(currentUser) === -1) {
      this.errors.push(`Export permission denied - user '${currentUser}' is not in admin list`);
      return;
    }
    
    Logger.log(`[ExportValidator] Permission validation passed for user: ${currentUser}`);
  } catch (error) {
    this.warnings.push(`Could not validate permissions: ${error.message}`);
  }
};

/**
 * Check API quotas and rate limits
 */
ExportValidator.prototype.checkApiQuotas = function() {
  try {
    // Ensure arrays are initialized
    if (!this.errors) this.errors = [];
    if (!this.warnings) this.warnings = [];
    
    // Check if we have valid API credentials using ConfigManager (same as ApiClient)
    try {
      var credentials = this.configManager.getShopifyCredentials();
      
      if (!credentials.accessToken || !credentials.shopDomain) {
        this.errors.push('Shopify API credentials not configured');
        return;
      }
    } catch (credError) {
      this.errors.push('Shopify API credentials not configured: ' + credError.message);
      return;
    }
    
    // Check basic API connectivity (lightweight call)
    try {
      var apiClient = new ApiClient(this.configManager);
      var testResponse = apiClient.makeRequest('shop.json', 'GET');
      
      if (!testResponse || !testResponse.shop) {
        this.errors.push('Shopify API connection test failed');
        return;
      }
      
      Logger.log(`[ExportValidator] API connectivity validated for shop: ${testResponse.shop.name}`);
    } catch (apiError) {
      if (apiError.message.includes('429')) {
        this.warnings.push('API rate limit detected - export may be slower');
      } else {
        this.errors.push(`API connectivity error: ${apiError.message}`);
      }
    }
    
  } catch (error) {
    this.warnings.push(`Could not validate API quotas: ${error.message}`);
  }
};

/**
 * Validate system configuration
 */
ExportValidator.prototype.validateConfiguration = function() {
  try {
    // Check essential configuration values
    var requiredConfigs = [
      'rate_limit_delay',
      'batch_size',
      'max_retries'
    ];
    
    for (var i = 0; i < requiredConfigs.length; i++) {
      var config = requiredConfigs[i];
      var value = this.configManager.getConfigValue(config);
      
      if (value === null || value === undefined || value === '') {
        this.warnings.push(`Configuration '${config}' is not set - using defaults`);
      }
    }
    
    // Validate batch size is reasonable
    var batchSize = parseInt(this.configManager.getConfigValue('batch_size')) || 50;
    if (batchSize < 10 || batchSize > 250) {
      this.warnings.push(`Batch size ${batchSize} may not be optimal (recommended: 50-100)`);
    }
    
    Logger.log(`[ExportValidator] Configuration validation completed`);
  } catch (error) {
    this.warnings.push(`Could not validate configuration: ${error.message}`);
  }
};

/**
 * Detect potential conflicts
 * @param {string} sheetName - Name of the sheet
 */
ExportValidator.prototype.detectConflicts = function(sheetName) {
  try {
    // Check for concurrent export sessions
    var properties = PropertiesService.getScriptProperties();
    var allProperties = properties.getProperties();
    
    var activeExports = 0;
    for (var key in allProperties) {
      if (key.startsWith('export_state_')) {
        try {
          var state = JSON.parse(allProperties[key]);
          if (state.status === 'running' || state.status === 'ready') {
            activeExports++;
          }
        } catch (e) {
          // Ignore invalid state entries
        }
      }
    }
    
    if (activeExports > 0) {
      this.warnings.push(`${activeExports} active export session(s) detected - consider waiting for completion`);
    }
    
    // Check for recent modifications (basic conflict detection)
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    if (sheet) {
      var lastModified = DriveApp.getFileById(SpreadsheetApp.getActiveSpreadsheet().getId()).getLastUpdated();
      var fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      if (lastModified > fiveMinutesAgo) {
        this.warnings.push(`Sheet '${sheetName}' was recently modified - ensure changes are intentional`);
      }
    }
    
    Logger.log(`[ExportValidator] Conflict detection completed`);
  } catch (error) {
    this.warnings.push(`Could not detect conflicts: ${error.message}`);
  }
};

/**
 * Validate batch integrity
 * @param {Array} batch - Batch of records to validate
 */
ExportValidator.prototype.validateBatchIntegrity = function(batch) {
  try {
    var errors = [];
    var warnings = [];
    
    if (!batch || !Array.isArray(batch)) {
      errors.push('Invalid batch format - must be an array');
      return { isValid: false, errors: errors, warnings: warnings };
    }
    
    if (batch.length === 0) {
      warnings.push('Empty batch provided');
      return { isValid: true, errors: errors, warnings: warnings };
    }
    
    // Check each record in batch
    for (var i = 0; i < batch.length; i++) {
      var record = batch[i];
      
      if (!record.id || record.id === '') {
        errors.push(`Record at index ${i} missing required ID`);
      }
      
      if (!record.operation || ['create', 'update', 'delete'].indexOf(record.operation) === -1) {
        errors.push(`Record at index ${i} has invalid operation: ${record.operation}`);
      }
    }
    
    // Check batch size
    var maxBatchSize = parseInt(this.configManager.getConfigValue('batch_size')) || 100;
    if (batch.length > maxBatchSize) {
      warnings.push(`Batch size ${batch.length} exceeds recommended maximum ${maxBatchSize}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors,
      warnings: warnings,
      summary: {
        batchSize: batch.length,
        validRecords: batch.length - errors.length,
        invalidRecords: errors.length
      }
    };
    
  } catch (error) {
    return {
      isValid: false,
      errors: [`Batch validation error: ${error.message}`],
      warnings: []
    };
  }
};
