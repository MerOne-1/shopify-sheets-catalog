/**
 * Shopify Sheets Catalog Management System - Main Entry Point
 * Component-based architecture for Google Apps Script
 */

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
    }
    
    // Set up initial tabs if they don't exist
    setupInitialTabs();
    
    Logger.log('System initialized successfully!');
  } catch (error) {
    Logger.log(`Initialization error: ${error.message}`);
    SpreadsheetApp.getUi().alert(`Initialization Error: ${error.message}`);
  }
}

/**
 * Set up initial tab structure
 */
function setupInitialTabs() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const requiredTabs = [
    'Products', 'Variants', 'Inventory', 
    'MF_Products', 'MF_Variants', 'Images',
    'Config', 'Logs', 'Backups', 'Guide'
  ];
  
  requiredTabs.forEach(tabName => {
    if (!ss.getSheetByName(tabName)) {
      const sheet = ss.insertSheet(tabName);
      Logger.log(`Created tab: ${tabName}`);
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
    
    if (result.success) {
      SpreadsheetApp.getUi().alert(
        'Connection Successful!', 
        `Connected to: ${result.shop.name} (${result.shop.domain})`, 
        SpreadsheetApp.getUi().ButtonSet.OK
      );
    } else {
      SpreadsheetApp.getUi().alert(
        'Connection Failed!', 
        `Error: ${result.error}`, 
        SpreadsheetApp.getUi().ButtonSet.OK
      );
    }
  } catch (error) {
    SpreadsheetApp.getUi().alert(
      'Connection Error!', 
      `Error: ${error.message}`, 
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
}

// Menu item functions - will be implemented in respective components
function importAllProducts() {
  try {
    const importCoordinator = new ImportCoordinator();
    importCoordinator.importAll();
  } catch (error) {
    SpreadsheetApp.getUi().alert('Import Error', error.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

function runDryRun() {
  try {
    const diffCalculator = new DiffCalculator();
    diffCalculator.showDryRunDialog();
  } catch (error) {
    SpreadsheetApp.getUi().alert('Dry Run Error', error.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

function exportChanges() {
  try {
    const exportCoordinator = new ExportCoordinator();
    exportCoordinator.exportChanges();
  } catch (error) {
    SpreadsheetApp.getUi().alert('Export Error', error.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

function createManualBackup() {
  try {
    const backupManager = new BackupManager();
    backupManager.createManualBackup();
  } catch (error) {
    SpreadsheetApp.getUi().alert('Backup Error', error.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

function showRestoreDialog() {
  try {
    const restoreManager = new RestoreManager();
    restoreManager.showRestoreDialog();
  } catch (error) {
    SpreadsheetApp.getUi().alert('Restore Error', error.message, SpreadsheetApp.getUi().ButtonSet.OK);
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
      'Read-only mode is now ' + (newMode ? 'ENABLED' : 'DISABLED'),
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  } catch (error) {
    SpreadsheetApp.getUi().alert('Security Error', error.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

function openUserGuide() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const guideSheet = ss.getSheetByName('Guide');
  if (guideSheet) {
    ss.setActiveSheet(guideSheet);
  } else {
    SpreadsheetApp.getUi().alert('User Guide not found. Please run setup first.');
  }
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
function refreshConfig() { SpreadsheetApp.getUi().alert('Refresh Config - Available Now!'); }
function openSettings() { SpreadsheetApp.getUi().alert('Settings - Coming in Milestone 6!'); }
