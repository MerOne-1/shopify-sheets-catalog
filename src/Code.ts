/**
 * Shopify Sheets Catalog Management System - Main Entry Point
 * Component-based architecture for Google Apps Script
 */

import { ConfigManager } from './core/ConfigManager';
import { UIManager } from './core/UIManager';
import { ApiClient } from './core/ApiClient';
import { CONFIG } from './types';

/**
 * Initialize the application on first run or when menu is accessed
 */
function onOpen(): void {
  Logger.log('Initializing Shopify Sheets Catalog Management System...');
  
  try {
    // Initialize core components
    const configManager = new ConfigManager();
    const uiManager = new UIManager();
    
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
function setupInitialTabs(): void {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const requiredTabs = [
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
function testShopifyConnection(): void {
  try {
    const apiClient = new ApiClient();
    const result = apiClient.testConnection();
    const ui = SpreadsheetApp.getUi();
    
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

function toggleReadOnlyMode(): void {
  try {
    const configManager = new ConfigManager();
    const currentMode = configManager.isReadOnlyMode();
    const newMode = !currentMode;
    
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

function openUserGuide(): void {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const guideSheet = ss.getSheetByName('Guide');
  if (guideSheet) {
    ss.setActiveSheet(guideSheet);
  } else {
    SpreadsheetApp.getUi().alert('User Guide not found. Please run setup first.');
  }
}

function refreshConfig(): void {
  try {
    const configManager = new ConfigManager();
    const validation = configManager.validateConfig();
    
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
function importAllProducts(): void {
  try {
    Logger.log('Starting import all products...');
    const orchestrator = new ImportOrchestrator();
    const result = orchestrator.importAll();
    Logger.log('Import completed: ' + JSON.stringify(result));
  } catch (error) {
    Logger.log('Import error: ' + (error as Error).message);
    try {
      SpreadsheetApp.getUi().alert('Import Error', 'Import failed: ' + (error as Error).message, SpreadsheetApp.getUi().ButtonSet.OK);
    } catch (uiError) {
      Logger.log('UI Error: ' + (uiError as Error).message);
    }
  }
}

function runDryRun(): void {
  SpreadsheetApp.getUi().alert('Dry Run - Coming in Milestone 2!');
}

function exportChanges(): void {
  SpreadsheetApp.getUi().alert('Export Changes - Coming in Milestone 3!');
}

function createManualBackup(): void {
  SpreadsheetApp.getUi().alert('Manual Backup - Coming in Milestone 6!');
}

function showRestoreDialog(): void {
  SpreadsheetApp.getUi().alert('Restore - Coming in Milestone 6!');
}

// Placeholder functions for features not yet implemented
function importProductsOnly(): void { SpreadsheetApp.getUi().alert('Import Products Only - Coming in Milestone 1!'); }
function importVariantsOnly(): void { SpreadsheetApp.getUi().alert('Import Variants Only - Coming in Milestone 1!'); }
function importMetafields(): void { SpreadsheetApp.getUi().alert('Import Metafields - Coming in Milestone 4!'); }
function importImages(): void { SpreadsheetApp.getUi().alert('Import Images - Coming in Milestone 5!'); }
function importInventory(): void { SpreadsheetApp.getUi().alert('Import Inventory - Coming in Milestone 1!'); }
function validateAllData(): void { SpreadsheetApp.getUi().alert('Validate Data - Coming in Milestone 2!'); }
function checkDuplicates(): void { SpreadsheetApp.getUi().alert('Check Duplicates - Coming in Milestone 2!'); }
function recomputeHashes(): void { SpreadsheetApp.getUi().alert('Recompute Hashes - Coming in Milestone 1!'); }
function exportAll(): void { SpreadsheetApp.getUi().alert('Export All - Coming in Milestone 3!'); }
function resumeExport(): void { SpreadsheetApp.getUi().alert('Resume Export - Coming in Milestone 3!'); }
function clearLogs(): void { SpreadsheetApp.getUi().alert('Clear Logs - Coming in Milestone 6!'); }
function openSettings(): void { SpreadsheetApp.getUi().alert('Settings - Coming in Milestone 6!'); }

// Functions are automatically available globally in Google Apps Script
// No explicit global declarations needed
