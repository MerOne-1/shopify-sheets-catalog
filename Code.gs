
// Configuration constants
var CONFIG = {
  VERSION: '1.0.0',
  SHOPIFY_API_VERSION: '2023-04',
  SHOPIFY_DOMAIN: '1x0ah0-a8.myshopify.com',
  MAX_BATCH_SIZE: 250,
  IMPORT_CHUNK_SIZE: 50,
  RATE_LIMIT_DELAY: 500,
  MAX_RETRIES: 3
};

/**
 * Shopify Sheets Catalog Management System - Main Entry Point
 * Component-based architecture for Google Apps Script
 */
/**
 * Initialize the application on first run or when menu is accessed
 */
function onOpen() {
  Logger.log('Initializing Shopify Sheets Catalog Management System...');
  try {
    // Initialize core components
    var configManager = new ConfigManager();
    var uiManager = new UIManager();
    // Create custom menu
    uiManager.createCustomMenu();
    // Initialize configuration if needed
    if (!configManager.isConfigured()) {
      configManager.initializeConfig();
      uiManager.showSetupWizard();
    }
    // Set up initial tabs if they don't exist
    setupInitialTabs();
    Logger.log('System initialized successfully!');
  } catch (error) {
    Logger.log('Initialization error: ' + error.toString());
    SpreadsheetApp.getUi().alert('Initialization Error: ' + error.toString());
  }
}
/**
 * Set up initial tab structure
 */
function setupInitialTabs() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var requiredTabs = [
    'Products', 'Variants', 'Inventory', 
    'MF_Products', 'MF_Variants', 'Images',
    'Config', 'Logs', 'Backups', 'Guide'
  ];
  requiredTabs.forEach((tabName) => {
    if (!ss.getSheetByName(tabName)) {
      ss.insertSheet(tabName);
      Logger.log('Created tab: ' + tabName);
    }
  });
}
/**
 * Test Shopify connection - Menu item function
 */
function testShopifyConnection() {
  try {
    var apiClient = new ApiClient();
    var result = apiClient.testConnection();
    var ui = SpreadsheetApp.getUi();
    if (result.success && result.shop) {
      ui.alert(
        'Connection Successful!', 
        `Connected to: ${result.shop.name} (${result.shop.domain})`, 
        ui.ButtonSet.OK
      );
    } else {
      ui.alert(
        'Connection Failed!', 
        `Error: ${result.error}`, 
        ui.ButtonSet.OK
      );
    }
  } catch (error) {
    SpreadsheetApp.getUi().alert(
      'Connection Error!', 
      `Error: ${error.toString()}`, 
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
}
function toggleReadOnlyMode() {
  try {
    var configManager = new ConfigManager();
    var currentMode = configManager.isReadOnlyMode();
    var newMode = !currentMode;
    configManager.setConfigValue('read_only_mode', newMode ? 'TRUE' : 'FALSE');
    SpreadsheetApp.getUi().alert(
      'Read-Only Mode Updated',
      `Read-only mode is now ${newMode ? 'ENABLED' : 'DISABLED'}`,
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  } catch (error) {
    SpreadsheetApp.getUi().alert('Security Error', error.toString(), SpreadsheetApp.getUi().ButtonSet.OK);
  }
}
function openUserGuide() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var guideSheet = ss.getSheetByName('Guide');
  if (guideSheet) {
    ss.setActiveSheet(guideSheet);
  } else {
    SpreadsheetApp.getUi().alert('User Guide not found. Please run setup first.');
  }
}
function refreshConfig() {
  try {
    var configManager = new ConfigManager();
    var validation = configManager.validateConfig();
    if (validation.isValid) {
      SpreadsheetApp.getUi().alert(
        'Configuration Valid',
        'All configuration settings are valid and ready to use.',
        SpreadsheetApp.getUi().ButtonSet.OK
      );
    } else {
      SpreadsheetApp.getUi().alert(
        'Configuration Issues',
        `Found issues:\n${validation.errors.join('\n')}`,
        SpreadsheetApp.getUi().ButtonSet.OK
      );
    }
  } catch (error) {
    SpreadsheetApp.getUi().alert('Config Error', error.toString(), SpreadsheetApp.getUi().ButtonSet.OK);
  }
}
// Menu item functions - Milestone 1 Implementation
function importAllProducts() {
  try {
    Logger.log('Starting import all products...');
    var orchestrator = new ImportOrchestrator();
    var result = orchestrator.importAll();
    Logger.log('Import completed: ' + JSON.stringify(result));
  } catch (error) {
    Logger.log('Import error: ' + error.message);
    try {
      SpreadsheetApp.getUi().alert('Import Error', 'Import failed: ' + error.message, SpreadsheetApp.getUi().ButtonSet.OK);
    } catch (uiError) {
      Logger.log('UI Error: ' + uiError.message);
    }
  }
}
function runDryRun() {
  SpreadsheetApp.getUi().alert('Dry Run - Coming in Milestone 2!');
}
function exportChanges() {
  SpreadsheetApp.getUi().alert('Export Changes - Coming in Milestone 3!');
}
function createManualBackup() {
  SpreadsheetApp.getUi().alert('Manual Backup - Coming in Milestone 6!');
}
function showRestoreDialog() {
  SpreadsheetApp.getUi().alert('Restore - Coming in Milestone 6!');
}
// Placeholder functions for features not yet implemented
function importProductsOnly() { SpreadsheetApp.getUi().alert('Import Products Only - Coming in Milestone 1!'); }
function importVariantsOnly() { SpreadsheetApp.getUi().alert('Import Variants Only - Coming in Milestone 1!'); }
function importMetafields() { SpreadsheetApp.getUi().alert('Import Metafields - Coming in Milestone 4!'); }
function importImages() { SpreadsheetApp.getUi().alert('Import Images - Coming in Milestone 5!'); }
function importInventory() { SpreadsheetApp.getUi().alert('Import Inventory - Coming in Milestone 1!'); }
function validateAllData() { SpreadsheetApp.getUi().alert('Validate Data - Coming in Milestone 2!'); }
function checkDuplicates() { SpreadsheetApp.getUi().alert('Check Duplicates - Coming in Milestone 2!'); }
function recomputeHashes() { SpreadsheetApp.getUi().alert('Recompute Hashes - Coming in Milestone 1!'); }
function exportAll() { SpreadsheetApp.getUi().alert('Export All - Coming in Milestone 3!'); }
function resumeExport() { SpreadsheetApp.getUi().alert('Resume Export - Coming in Milestone 3!'); }
function clearLogs() { SpreadsheetApp.getUi().alert('Clear Logs - Coming in Milestone 6!'); }
function openSettings() { SpreadsheetApp.getUi().alert('Settings - Coming in Milestone 6!'); }
// Functions are automatically available globally in Google Apps Script
// No explicit global declarations needed
