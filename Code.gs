// Milestone 2: Enhanced Menu Functions with Dry-Run and Smart Import Options

// Configuration constants
var CONFIG = {
  VERSION: '2.0.0',
  SHOPIFY_API_VERSION: '2023-04',
  SHOPIFY_DOMAIN: '1x0ah0-a8.myshopify.com',
  MAX_BATCH_SIZE: 250,
  IMPORT_CHUNK_SIZE: 50,
  RATE_LIMIT_DELAY: 200,
  MAX_RETRIES: 3
};

/**
 * Called when the spreadsheet is opened
 * Delegates menu creation to UIManager
 */
function onOpen() {
  try {
    var uiManager = new UIManager();
    uiManager.createCustomMenu();
    
    Logger.log('Shopify Sheets Catalog initialized successfully');
  } catch (error) {
    Logger.log('Error during onOpen initialization: ' + error.message);
  }
}

// Core import orchestration - called by UIManager
function importAllProducts() {
  try {
    var orchestrator = new ImportOrchestrator();
    var results = orchestrator.importAll();
    return results;
  } catch (error) {
    Logger.log('Import failed: ' + error.message);
    throw error;
  }
}

// Core dry-run validation functions - called by UIManager
function dryRunProducts() {
  try {
    var importer = new ProductImporter();
    return importer.import({ dryRun: true });
  } catch (error) {
    Logger.log('Dry-run failed: ' + error.message);
    throw error;
  }
}

function dryRunVariants() {
  try {
    var importer = new VariantImporter();
    return importer.import({ dryRun: true });
  } catch (error) {
    Logger.log('Dry-run failed: ' + error.message);
    throw error;
  }
}

function dryRunAll() {
  try {
    Logger.log('DRY-RUN: Starting complete validation');
    var orchestrator = new ImportOrchestrator();
    var results = orchestrator.importAll({ dryRun: true });
    Logger.log('DRY-RUN: Results received: ' + JSON.stringify(results));
    return results;
  } catch (error) {
    Logger.log('Dry-run failed: ' + error.message);
    Logger.log('Error stack: ' + error.stack);
    throw error;
  }
}

// Core incremental import functions - called by UIManager
function incrementalProducts() {
  try {
    var importer = new ProductImporter();
    return importer.import({ incremental: true });
  } catch (error) {
    Logger.log('Incremental import failed: ' + error.message);
    throw error;
  }
}

function incrementalVariants() {
  try {
    var importer = new VariantImporter();
    return importer.import({ incremental: true });
  } catch (error) {
    Logger.log('Incremental import failed: ' + error.message);
    throw error;
  }
}

function incrementalAll() {
  try {
    var orchestrator = new ImportOrchestrator();
    return orchestrator.importAll({ incremental: true });
  } catch (error) {
    Logger.log('Smart import failed: ' + error.message);
    throw error;
  }
}

// Result display functions - moved to UIManager, kept here for backward compatibility
function showDryRunResults(type, results) {
  var uiManager = new UIManager();
  return uiManager.showResultsDialog('🧪 ' + type + ' Validation Results', results);
}

function showIncrementalResults(type, results) {
  var uiManager = new UIManager();
  return uiManager.showResultsDialog('⚡ ' + type + ' Smart Import Results', results);
}

function showImportResults(type, results) {
  var uiManager = new UIManager();
  return uiManager.showResultsDialog('📥 ' + type + ' Import Results', results);
}

// Core statistics gathering - called by UIManager
function viewImportStats() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var stats = {
      products: 0,
      variants: 0,
      configured: false
    };
    
    // Check Products sheet
    var productsSheet = ss.getSheetByName('Products');
    if (productsSheet) {
      stats.products = Math.max(0, productsSheet.getLastRow() - 1);
    }
    
    // Check Variants sheet
    var variantsSheet = ss.getSheetByName('Variants');
    if (variantsSheet) {
      stats.variants = Math.max(0, variantsSheet.getLastRow() - 1);
    }
    
    // Check Configuration
    var configSheet = ss.getSheetByName('Configuration');
    if (configSheet) {
      stats.configured = true;
    }
    
    return stats;
  } catch (error) {
    Logger.log('Error getting stats: ' + error.message);
    throw error;
  }
}

// Core import functions - called by UIManager
function importProductsOnly() {
  try {
    var importer = new ProductImporter();
    return importer.import();
  } catch (error) {
    Logger.log('Product import failed: ' + error.message);
    throw error;
  }
}

function importVariantsOnly() {
  try {
    var importer = new VariantImporter();
    return importer.import();
  } catch (error) {
    Logger.log('Variant import failed: ' + error.message);
    throw error;
  }
}

// Core configuration functions - called by UIManager
function setupConfig() {
  try {
    var configManager = new ConfigManager();
    configManager.initializeConfigSheet();
    return { success: true, message: 'Configuration sheet created successfully!' };
  } catch (error) {
    Logger.log('Config setup failed: ' + error.message);
    throw error;
  }
}

function testShopifyConnection() {
  try {
    var apiClient = new ApiClient();
    var isConnected = apiClient.testConnection();
    return { 
      success: isConnected, 
      message: isConnected ? 'Successfully connected to Shopify API!' : 'Could not connect to Shopify API. Please check your configuration.'
    };
  } catch (error) {
    Logger.log('Connection test failed: ' + error.message);
    throw error;
  }
}

// Future functionality placeholders - called by UIManager
function importMetafields() {
  throw new Error('Metafields import will be available in Milestone 3');
}

function importImages() {
  throw new Error('Images import will be available in Milestone 3');
}

function importInventory() {
  throw new Error('Inventory import will be available in Milestone 3');
}

// Validation functions - called by UIManager
function runDryRun() {
  return dryRunAll();
}

function validateAllData() {
  try {
    var validator = new ValidationEngine();
    return validator.validateAllSheets();
  } catch (error) {
    Logger.log('Validation failed: ' + error.message);
    throw error;
  }
}

function checkDuplicates() {
  throw new Error('Duplicate check is not yet implemented');
}

function recomputeHashes() {
  throw new Error('Hash recomputation is not yet implemented');
}

// Tool functions - called by UIManager
function createManualBackup() {
  throw new Error('Manual backup is not yet implemented');
}

function showRestoreDialog() {
  throw new Error('Restore functionality is not yet implemented');
}

function clearLogs() {
  try {
    console.clear();
    return { success: true, message: 'Application logs have been cleared' };
  } catch (error) {
    Logger.log('Clear logs error: ' + error.message);
    throw error;
  }
}

function toggleReadOnlyMode() {
  throw new Error('Read-only mode toggle is not yet implemented');
}

function refreshConfig() {
  try {
    var configManager = new ConfigManager();
    configManager.refresh();
    return { success: true, message: 'Configuration has been reloaded successfully' };
  } catch (error) {
    Logger.log('Refresh config error: ' + error.message);
    throw error;
  }
}

function openUserGuide() {
  throw new Error('User guide is not yet implemented');
}

function openSettings() {
  throw new Error('Settings dialog is not yet implemented');
}
