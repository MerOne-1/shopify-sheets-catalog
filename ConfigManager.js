/**
 * ConfigManager Component
 * Handles all configuration management and settings
 */

class ConfigManager {
  constructor() {
    this.ss = SpreadsheetApp.getActiveSpreadsheet();
    this.configSheetName = 'Config';
  }

  /**
   * Check if system is configured
   */
  isConfigured() {
    const configSheet = this.ss.getSheetByName(this.configSheetName);
    if (!configSheet) return false;
    
    const data = configSheet.getDataRange().getValues();
    return data.length > 1; // Has header + at least one config row
  }

  /**
   * Initialize configuration tab with default values
   */
  initializeConfig() {
    var configSheet = this.ss.getSheetByName(this.configSheetName);
    
    if (!configSheet) {
      configSheet = this.ss.insertSheet(this.configSheetName);
    }
    
    // Configuration data with your credentials
    var configData = [
      ['Setting', 'Value', 'Description'],
      ['shop_domain', CONFIG.SHOPIFY_DOMAIN, 'Your Shopify shop domain'],
      ['api_version', CONFIG.SHOPIFY_API_VERSION, 'Shopify API version'],
      ['admin_emails', Session.getActiveUser().getEmail(), 'Comma-separated list of admin emails'],
      ['read_only_mode', 'FALSE', 'Enable read-only mode (TRUE/FALSE)'],
      ['volume_alert_threshold', '200', 'Alert when modifying more than X rows'],
      ['auto_backup_enabled', 'TRUE', 'Enable automatic backups before export'],
      ['max_batch_size', CONFIG.MAX_BATCH_SIZE.toString(), 'Maximum batch size for API calls'],
      ['rate_limit_delay', CONFIG.RATE_LIMIT_DELAY.toString(), 'Delay between API calls (ms)'],
      ['last_import_timestamp', '', 'Last successful import timestamp'],
      ['last_export_timestamp', '', 'Last successful export timestamp'],
      ['system_version', CONFIG.VERSION, 'System version'],
      ['setup_completed', 'TRUE', 'Initial setup completed']
    ];
    
    // Clear and populate
    configSheet.clear();
    configSheet.getRange(1, 1, configData.length, 3).setValues(configData);
    
    // Format the config sheet
    this.formatConfigSheet(configSheet, configData.length);
    
    Logger.log('Configuration initialized successfully');
    return true;
  }

  /**
   * Format configuration sheet
   */
  formatConfigSheet(sheet, rowCount) {
    // Header formatting
    const headerRange = sheet.getRange(1, 1, 1, 3);
    headerRange.setFontWeight('bold')
              .setBackground('#4285f4')
              .setFontColor('white');
    
    // Setting names (read-only)
    const settingsRange = sheet.getRange(2, 1, rowCount - 1, 1);
    settingsRange.setBackground('#f8f9fa')
                 .setFontWeight('bold');
    
    // Descriptions (read-only)
    const descriptionsRange = sheet.getRange(2, 3, rowCount - 1, 1);
    descriptionsRange.setBackground('#f8f9fa')
                     .setFontStyle('italic');
    
    // Values (editable)
    const valuesRange = sheet.getRange(2, 2, rowCount - 1, 1);
    valuesRange.setBackground('#ffffff');
    
    // Auto-resize columns
    sheet.autoResizeColumns(1, 3);
    
    // Protect setting names and descriptions
    const protection = sheet.getRange(2, 1, rowCount - 1, 1).protect();
    protection.setDescription('Configuration keys - do not modify');
    protection.setWarningOnly(true);
    
    const descProtection = sheet.getRange(2, 3, rowCount - 1, 1).protect();
    descProtection.setDescription('Configuration descriptions - do not modify');
    descProtection.setWarningOnly(true);
  }

  /**
   * Get configuration value by key
   */
  getConfigValue(key) {
    const configSheet = this.ss.getSheetByName(this.configSheetName);
    
    if (!configSheet) {
      throw new Error('Configuration sheet not found. Please run setup first.');
    }
    
    const data = configSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === key) {
        return data[i][1];
      }
    }
    
    throw new Error(`Configuration key '${key}' not found`);
  }

  /**
   * Set configuration value by key
   */
  setConfigValue(key, value) {
    const configSheet = this.ss.getSheetByName(this.configSheetName);
    
    if (!configSheet) {
      throw new Error('Configuration sheet not found. Please run setup first.');
    }
    
    const data = configSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === key) {
        configSheet.getRange(i + 1, 2).setValue(value);
        Logger.log(`Configuration updated: ${key} = ${value}`);
        return true;
      }
    }
    
    throw new Error(`Configuration key '${key}' not found`);
  }

  /**
   * Get all configuration as an object
   */
  getAllConfig() {
    const configSheet = this.ss.getSheetByName(this.configSheetName);
    
    if (!configSheet) {
      throw new Error('Configuration sheet not found. Please run setup first.');
    }
    
    const data = configSheet.getDataRange().getValues();
    const config = {};
    
    for (let i = 1; i < data.length; i++) {
      config[data[i][0]] = data[i][1];
    }
    
    return config;
  }

  /**
   * Validate configuration
   */
  validateConfig() {
    const errors = [];
    
    try {
      const shopDomain = this.getConfigValue('shop_domain');
      if (!shopDomain || !shopDomain.includes('.myshopify.com')) {
        errors.push('Invalid shop_domain - must be a valid Shopify domain');
      }
    } catch (e) {
      errors.push('Missing shop_domain configuration');
    }
    
    try {
      const adminEmails = this.getConfigValue('admin_emails');
      if (!adminEmails || adminEmails.trim() === '') {
        errors.push('Missing admin_emails configuration');
      }
    } catch (e) {
      errors.push('Missing admin_emails configuration');
    }
    
    // Check if API token is configured in Script Properties
    const properties = PropertiesService.getScriptProperties();
    const accessToken = properties.getProperty('SHOPIFY_ACCESS_TOKEN');
    if (!accessToken) {
      errors.push('Missing SHOPIFY_ACCESS_TOKEN in Script Properties');
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Get Shopify credentials
   */
  getShopifyCredentials() {
    const validation = this.validateConfig();
    if (!validation.isValid) {
      throw new Error(`Configuration errors: ${validation.errors.join(', ')}`);
    }
    
    const properties = PropertiesService.getScriptProperties();
    const shopDomain = this.getConfigValue('shop_domain');
    const accessToken = properties.getProperty('SHOPIFY_ACCESS_TOKEN');
    const apiVersion = this.getConfigValue('api_version');
    
    return {
      shopDomain: shopDomain,
      accessToken: accessToken,
      apiVersion: apiVersion
    };
  }
}
