/**
 * ConfigManager - Handles configuration management for the Shopify Sheets Catalog
 * Manages configuration tab, validation, and secure credential storage
 */
function ConfigManager() {
  this.ss = SpreadsheetApp.getActiveSpreadsheet();
  this.configSheetName = 'Config';
}

/**
 * Check if system is configured
 */
ConfigManager.prototype.isConfigured = function() {
  var configSheet = this.ss.getSheetByName(this.configSheetName);
  if (!configSheet) return false;
  var data = configSheet.getDataRange().getValues();
  return data.length > 1; // Has header + at least one config row
};

/**
 * Initialize configuration tab with default values
 */
ConfigManager.prototype.initializeConfig = function() {
  var configSheet = this.ss.getSheetByName(this.configSheetName);
  if (!configSheet) {
    configSheet = this.ss.insertSheet(this.configSheetName);
  }
  
  // Configuration data with your credentials
  var configData = [
    ['Setting', 'Value', 'Description'],
    ['shop_domain', '1x0ah0-a8.myshopify.com', 'Your Shopify shop domain'],
    ['api_version', '2023-04', 'Shopify API version'],
    ['admin_emails', Session.getActiveUser().getEmail(), 'Comma-separated list of admin emails'],
    ['read_only_mode', 'FALSE', 'Enable read-only mode (TRUE/FALSE)'],
    ['volume_alert_threshold', '200', 'Alert when modifying more than X rows'],
    ['auto_backup_enabled', 'TRUE', 'Enable automatic backups before export'],
    ['max_batch_size', '250', 'Maximum batch size for API calls'],
    ['batch_size', '100', 'Default batch size for export operations'],
    ['rate_limit_delay', '200', 'Delay between API calls (ms)'],
    ['max_retries', '3', 'Maximum retry attempts for failed operations'],
    ['retry_base_delay', '1000', 'Base delay for retry attempts (ms)'],
    ['retry_max_delay', '10000', 'Maximum delay for retry attempts (ms)'],
    ['last_import_timestamp', '', 'Last successful import timestamp'],
    ['last_export_timestamp', '', 'Last successful export timestamp'],
    ['system_version', '2.0.0', 'System version'],
    ['setup_completed', 'TRUE', 'Initial setup completed']
  ];
  
  // Clear and populate
  configSheet.clear();
  configSheet.getRange(1, 1, configData.length, 3).setValues(configData);
  
  // Format the config sheet
  this.formatConfigSheet(configSheet, configData.length);
  Logger.log('Configuration initialized successfully');
  return true;
};

/**
 * Format configuration sheet
 */
ConfigManager.prototype.formatConfigSheet = function(sheet, rowCount) {
  // Header formatting
  var headerRange = sheet.getRange(1, 1, 1, 3);
  headerRange.setFontWeight('bold')
            .setBackground('#4285f4')
            .setFontColor('white');
  
  // Setting names (read-only)
  var settingsRange = sheet.getRange(2, 1, rowCount - 1, 1);
  settingsRange.setBackground('#f8f9fa')
               .setFontWeight('bold');
  
  // Descriptions (read-only)
  var descriptionsRange = sheet.getRange(2, 3, rowCount - 1, 1);
  descriptionsRange.setBackground('#f8f9fa')
                   .setFontStyle('italic');
  
  // Values (editable)
  var valuesRange = sheet.getRange(2, 2, rowCount - 1, 1);
  valuesRange.setBackground('#ffffff');
  
  // Auto-resize columns
  sheet.autoResizeColumns(1, 3);
};

/**
 * Get configuration value by key
 */
ConfigManager.prototype.getConfigValue = function(key) {
  var configSheet = this.ss.getSheetByName(this.configSheetName);
  if (!configSheet) {
    Logger.log('Config sheet not found');
    return null;
  }
  
  var data = configSheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === key) {
      return data[i][1];
    }
  }
  
  Logger.log('Config key not found: ' + key);
  return null;
};

/**
 * Set configuration value by key
 */
ConfigManager.prototype.setConfigValue = function(key, value) {
  var configSheet = this.ss.getSheetByName(this.configSheetName);
  if (!configSheet) {
    Logger.log('Config sheet not found');
    return false;
  }
  
  var data = configSheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === key) {
      configSheet.getRange(i + 1, 2).setValue(value);
      Logger.log('Updated config: ' + key + ' = ' + value);
      return true;
    }
  }
  
  Logger.log('Config key not found for update: ' + key);
  return false;
};

/**
 * Validate configuration
 */
ConfigManager.prototype.validateConfig = function() {
  var errors = [];
  var warnings = [];
  
  var shopDomain = this.getConfigValue('shop_domain');
  if (!shopDomain || shopDomain === '') {
    errors.push('Shop domain is required');
  }
  
  var apiVersion = this.getConfigValue('api_version');
  if (!apiVersion || apiVersion === '') {
    errors.push('API version is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors,
    warnings: warnings
  };
};

/**
 * Get Shopify credentials from Script Properties (secure storage)
 */
ConfigManager.prototype.getShopifyCredentials = function() {
  var properties = PropertiesService.getScriptProperties();
  var accessToken = properties.getProperty('SHOPIFY_ACCESS_TOKEN');
  
  if (!accessToken) {
    throw new Error('Shopify access token not found. Please set SHOPIFY_ACCESS_TOKEN in Script Properties.');
  }
  
  return {
    shopDomain: this.getConfigValue('shop_domain'),
    accessToken: accessToken,
    apiVersion: this.getConfigValue('api_version')
  };
};

/**
 * Alias for compatibility
 */
ConfigManager.prototype.getCredentials = function() {
  return this.getShopifyCredentials();
};
