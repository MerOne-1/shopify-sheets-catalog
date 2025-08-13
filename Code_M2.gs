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

// Menu français simplifié - Milestone 2
function onOpen() {
  try {
    var ui = SpreadsheetApp.getUi();
    var menu = ui.createMenu('🛍️ Catalogue Shopify');
    
    // Actions principales
    menu.addItem('📥 Importer (Produits+Variants)', 'importAllProducts');
    menu.addItem('⚡ Mise à jour (modifications Produit/Variant)', 'incrementalAll');
    menu.addItem('🧪 Vérifier avant import (Aperçu sécurisé)', 'dryRunAll');
    
    menu.addSeparator();
    
    // Imports spécialisés
    menu.addSubMenu(ui.createMenu('🔧 Imports spécialisés')
      .addItem('📦 Importer produits uniquement', 'importProducts')
      .addItem('🔧 Importer variantes uniquement', 'importVariants')
      .addItem('📋 Importer métachamps "Produit"', 'importProductMetafields')
      .addItem('📋 Importer métachamps "Variant"', 'importVariantMetafields')
      .addItem('🖼️ Importer images produits', 'importProductImages')
      .addItem('📦 Importer stock et inventaire', 'importInventory'));

    menu.addSeparator();
    
    // Configuration
    menu.addSubMenu(ui.createMenu('⚙️ Configuration')
      .addItem('🔗 Tester la connexion Shopify', 'testConnection')
      .addItem('📊 Statistiques des imports', 'viewImportStats')
      .addItem('🔍 Diagnostiquer un problème', 'runDebugTest')
      .addItem('⚙️ Paramètres de connexion', 'setupConfig'));
    
    menu.addToUi();
    
    Logger.log('Milestone 2 menu created successfully');
  } catch (error) {
    Logger.log('Error creating menu: ' + error.message);
  }
}

// Enhanced import all with options
function importAllProducts() {
  try {
    var ui = SpreadsheetApp.getUi();
    var response = ui.alert(
      '📥 Import All Products & Variants',
      'This will import all products and variants from Shopify.\\n\\n' +
      'Estimated time: 15-20 seconds for ~100 records\\n\\n' +
      'Continue with import?',
      ui.ButtonSet.YES_NO
    );
    
    if (response !== ui.Button.YES) {
      return;
    }
    
    ui.alert('🚀 Import Started', 'Import is running... Check the logs for progress.', ui.ButtonSet.OK);
    
    var orchestrator = new ImportOrchestrator();
    var results = orchestrator.importAll();
    
    showImportResults('All Products & Variants', results);
    
  } catch (error) {
    Logger.log('Import failed: ' + error.message);
    SpreadsheetApp.getUi().alert('❌ Import Failed', error.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

// NEW: Dry-run validation functions
function dryRunProducts() {
  try {
    var ui = SpreadsheetApp.getUi();
    ui.alert('🧪 Starting Dry-Run Validation', 'Validating products without making changes...', ui.ButtonSet.OK);
    
    var importer = new ProductImporter();
    var results = importer.import({ dryRun: true });
    
    showDryRunResults('Products', results);
    
  } catch (error) {
    Logger.log('Dry-run failed: ' + error.message);
    SpreadsheetApp.getUi().alert('❌ Validation Failed', error.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

function dryRunVariants() {
  try {
    var ui = SpreadsheetApp.getUi();
    ui.alert('🧪 Starting Dry-Run Validation', 'Validating variants without making changes...', ui.ButtonSet.OK);
    
    var importer = new VariantImporter();
    var results = importer.import({ dryRun: true });
    
    showDryRunResults('Variants', results);
    
  } catch (error) {
    Logger.log('Dry-run failed: ' + error.message);
    SpreadsheetApp.getUi().alert('❌ Validation Failed', error.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

function dryRunAll() {
  try {
    var ui = SpreadsheetApp.getUi();
    ui.alert('🧪 Starting Complete Dry-Run', 'Validating all data without making changes...', ui.ButtonSet.OK);
    
    Logger.log('DRY-RUN: Starting complete validation');
    
    var orchestrator = new ImportOrchestrator();
    var results = orchestrator.importAll({ dryRun: true });
    
    Logger.log('DRY-RUN: Results received: ' + JSON.stringify(results));
    
    showDryRunResults('All Data', results);
    
  } catch (error) {
    Logger.log('Dry-run failed: ' + error.message);
    Logger.log('Error stack: ' + error.stack);
    SpreadsheetApp.getUi().alert('❌ Validation Failed', error.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

// NEW: Incremental import functions
function incrementalProducts() {
  try {
    var ui = SpreadsheetApp.getUi();
    var response = ui.alert(
      '⚡ Incremental Product Import',
      'This will only import new or changed products.\\n\\n' +
      'Much faster for regular updates!\\n\\n' +
      'Continue?',
      ui.ButtonSet.YES_NO
    );
    
    if (response !== ui.Button.YES) {
      return;
    }
    
    ui.alert('⚡ Smart Import Started', 'Analyzing changes... This may take a moment.', ui.ButtonSet.OK);
    
    var importer = new ProductImporter();
    var results = importer.import({ incremental: true });
    
    showIncrementalResults('Products', results);
    
  } catch (error) {
    Logger.log('Incremental import failed: ' + error.message);
    SpreadsheetApp.getUi().alert('❌ Import Failed', error.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

function incrementalVariants() {
  try {
    var ui = SpreadsheetApp.getUi();
    var response = ui.alert(
      '⚡ Incremental Variant Import',
      'This will only import new or changed variants.\\n\\n' +
      'Much faster for regular updates!\\n\\n' +
      'Continue?',
      ui.ButtonSet.YES_NO
    );
    
    if (response !== ui.Button.YES) {
      return;
    }
    
    ui.alert('⚡ Smart Import Started', 'Analyzing changes... This may take a moment.', ui.ButtonSet.OK);
    
    var importer = new VariantImporter();
    var results = importer.import({ incremental: true });
    
    showIncrementalResults('Variants', results);
    
  } catch (error) {
    Logger.log('Incremental import failed: ' + error.message);
    SpreadsheetApp.getUi().alert('❌ Import Failed', error.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

function incrementalAll() {
  try {
    var ui = SpreadsheetApp.getUi();
    var response = ui.alert(
      '⚡ Smart Import All',
      'This will only import new or changed data.\\n\\n' +
      'Perfect for regular updates!\\n\\n' +
      'Continue?',
      ui.ButtonSet.YES_NO
    );
    
    if (response !== ui.Button.YES) {
      return;
    }
    
    ui.alert('⚡ Smart Import Started', 'Analyzing all changes... This may take a moment.', ui.ButtonSet.OK);
    
    var orchestrator = new ImportOrchestrator();
    var results = orchestrator.importAll({ incremental: true });
    
    showIncrementalResults('All Data', results);
    
  } catch (error) {
    Logger.log('Smart import failed: ' + error.message);
    SpreadsheetApp.getUi().alert('❌ Import Failed', error.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

// NEW: Enhanced result display functions
function showDryRunResults(type, results) {
  var ui = SpreadsheetApp.getUi();
  
  if (results.success) {
    var message = '🧪 DRY-RUN VALIDATION COMPLETE\\n\\n' +
      '📊 ANALYSIS RESULTS:\\n' +
      '• Records Analyzed: ' + results.recordsProcessed + '\\n';
    
    // Safe access to validation results
    if (results.validationResults && results.validationResults.summary) {
      message += '• Valid Records: ' + results.validationResults.summary.validRecords + '\\n' +
        '• Invalid Records: ' + results.validationResults.summary.invalidRecords + '\\n' +
        '• Records with Warnings: ' + results.validationResults.summary.recordsWithWarnings + '\\n';
    } else {
      message += '• Validation: Completed successfully\\n';
    }
    
    message += '\\n⏱️ Analysis Time: ' + Math.round(results.duration / 1000) + ' seconds\\n' +
      '🌐 API Calls: ' + (results.apiCallCount || 0) + '\\n' +
      '⚡ Rate Limit Hits: ' + (results.rateLimitHits || 0) + '\\n\\n';
    
    // Safe access to validation errors
    if (results.validationResults && results.validationResults.errors && results.validationResults.errors.length > 0) {
      message += '❌ ERRORS FOUND:\\n' + results.validationResults.errors.slice(0, 5).join('\\n') + '\\n\\n';
    }
    
    // Safe access to validation warnings
    if (results.validationResults && results.validationResults.warnings && results.validationResults.warnings.length > 0) {
      var warningTexts = [];
      for (var i = 0; i < Math.min(5, results.validationResults.warnings.length); i++) {
        var warning = results.validationResults.warnings[i];
        if (warning.warnings && warning.warnings.length > 0) {
          warningTexts.push('Record ' + warning.recordId + ': ' + warning.warnings.join(', '));
        }
      }
      if (warningTexts.length > 0) {
        message += '⚠️ WARNINGS:\n' + warningTexts.join('\n') + '\n\n';
      }
    }
    
    // Safe validation status check
    if (results.validationResults && typeof results.validationResults.isValid !== 'undefined') {
      message += results.validationResults.isValid ? 
        '✅ READY FOR IMPORT!' : 
        '❌ FIX ERRORS BEFORE IMPORTING';
    } else {
      message += '✅ DRY-RUN COMPLETED SUCCESSFULLY!';
    }
    
    ui.alert('🧪 ' + type + ' Validation Results', message, ui.ButtonSet.OK);
  } else {
    var errorMessage = 'Validation failed';
    if (results.errors && results.errors.length > 0) {
      errorMessage = results.errors.join('\\n');
    } else if (results.error) {
      errorMessage = results.error;
    }
    ui.alert('❌ Validation Failed', errorMessage, ui.ButtonSet.OK);
  }
}

function showIncrementalResults(type, results) {
  var ui = SpreadsheetApp.getUi();
  
  if (results.success) {
    var message = '⚡ SMART IMPORT COMPLETE\\n\\n' +
      '📊 IMPORT RESULTS:\\n' +
      '• Total Records Processed: ' + results.recordsProcessed + '\\n' +
      '• Records Actually Written: ' + results.recordsWritten + '\\n' +
      '• Processing Action: ' + (results.processingAction === 'incremental_import' ? 'Incremental' : 'Full') + '\\n\\n' +
      '⏱️ Import Time: ' + Math.round(results.duration / 1000) + ' seconds\\n' +
      '🌐 API Calls: ' + results.apiCallCount + '\\n' +
      '📈 Avg Rate: ' + results.avgRequestsPerSecond + ' req/sec\\n' +
      '⚡ Rate Limit Hits: ' + results.rateLimitHits + '\\n\\n';
    
    if (results.warnings.length > 0) {
      message += '⚠️ WARNINGS: ' + results.warnings.length + '\\n';
    }
    
    message += '✅ Import completed successfully!';
    
    ui.alert('⚡ ' + type + ' Smart Import Results', message, ui.ButtonSet.OK);
  } else {
    ui.alert('❌ Import Failed', results.errors.join('\\n'), ui.ButtonSet.OK);
  }
}

function showImportResults(type, results) {
  var ui = SpreadsheetApp.getUi();
  
  if (results.success) {
    var message = '✅ IMPORT COMPLETE\\n\\n' +
      '📊 RESULTS:\\n' +
      '• Records Imported: ' + results.recordsProcessed + '\\n' +
      '• Duration: ' + Math.round(results.duration / 1000) + ' seconds\\n\\n';
    
    if (results.warnings && results.warnings.length > 0) {
      message += '⚠️ Warnings: ' + results.warnings.length + '\\n';
    }
    
    message += '🎉 All data imported successfully!';
    
    ui.alert('📥 ' + type + ' Import Results', message, ui.ButtonSet.OK);
  } else {
    ui.alert('❌ Import Failed', results.errors.join('\\n'), ui.ButtonSet.OK);
  }
}

// NEW: Import statistics viewer
function viewImportStats() {
  try {
    var ui = SpreadsheetApp.getUi();
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    var stats = '📊 IMPORT STATISTICS\\n\\n';
    
    // Check Products sheet
    var productsSheet = ss.getSheetByName('Products');
    if (productsSheet) {
      var productCount = Math.max(0, productsSheet.getLastRow() - 1);
      stats += '📦 Products: ' + productCount + ' records\\n';
    }
    
    // Check Variants sheet
    var variantsSheet = ss.getSheetByName('Variants');
    if (variantsSheet) {
      var variantCount = Math.max(0, variantsSheet.getLastRow() - 1);
      stats += '🔧 Variants: ' + variantCount + ' records\\n';
    }
    
    // Check Configuration
    var configSheet = ss.getSheetByName('Configuration');
    if (configSheet) {
      stats += '⚙️ Configuration: Set up\\n';
    }
    
    stats += '\\n🎯 Ready for Milestone 2 features!';
    
    ui.alert('📊 Current Statistics', stats, ui.ButtonSet.OK);
    
  } catch (error) {
    Logger.log('Error getting stats: ' + error.message);
    SpreadsheetApp.getUi().alert('❌ Error', 'Could not retrieve statistics: ' + error.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

// Existing functions (maintained for compatibility)
function importProducts() {
  try {
    var ui = SpreadsheetApp.getUi();
    var response = ui.alert('Import Products', 'Import all products from Shopify?', ui.ButtonSet.YES_NO);
    
    if (response === ui.Button.YES) {
      ui.alert('Import Started', 'Products import is running...', ui.ButtonSet.OK);
      
      var importer = new ProductImporter();
      var results = importer.import();
      
      showImportResults('Products', results);
    }
  } catch (error) {
    Logger.log('Product import failed: ' + error.message);
    SpreadsheetApp.getUi().alert('Import Failed', error.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

function importVariants() {
  try {
    var ui = SpreadsheetApp.getUi();
    var response = ui.alert('Import Variants', 'Import all variants from Shopify?', ui.ButtonSet.YES_NO);
    
    if (response === ui.Button.YES) {
      ui.alert('Import Started', 'Variants import is running...', ui.ButtonSet.OK);
      
      var importer = new VariantImporter();
      var results = importer.import();
      
      showImportResults('Variants', results);
    }
  } catch (error) {
    Logger.log('Variant import failed: ' + error.message);
    SpreadsheetApp.getUi().alert('Import Failed', error.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

function setupConfig() {
  try {
    var configManager = new ConfigManager();
    configManager.initializeConfigSheet();
    
    SpreadsheetApp.getUi().alert(
      'Configuration Setup',
      'Configuration sheet created! Please fill in your Shopify store details in the Configuration tab.',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  } catch (error) {
    Logger.log('Config setup failed: ' + error.message);
    SpreadsheetApp.getUi().alert('Setup Failed', error.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

function testConnection() {
  try {
    var apiClient = new ApiClient();
    var isConnected = apiClient.testConnection();
    
    if (isConnected) {
      SpreadsheetApp.getUi().alert('✅ Connection Successful', 'Successfully connected to Shopify API!', SpreadsheetApp.getUi().ButtonSet.OK);
    } else {
      SpreadsheetApp.getUi().alert('❌ Connection Failed', 'Could not connect to Shopify API. Please check your configuration.', SpreadsheetApp.getUi().ButtonSet.OK);
    }
  } catch (error) {
    Logger.log('Connection test failed: ' + error.message);
    SpreadsheetApp.getUi().alert('Connection Test Failed', error.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

// ===== NOUVELLES FONCTIONS POUR MENU FRANÇAIS =====

// Fonctions futures - Milestone 3
function importProductMetafields() {
  var ui = SpreadsheetApp.getUi();
  ui.alert('🚧 Fonctionnalité à venir', 
    'L\'import des métachamps produits sera disponible dans Milestone 3.\n\n' +
    'Cette fonction permettra d\'importer tous les champs personnalisés de vos produits.', 
    ui.ButtonSet.OK);
}

function importVariantMetafields() {
  var ui = SpreadsheetApp.getUi();
  ui.alert('🚧 Fonctionnalité à venir', 
    'L\'import des métachamps variantes sera disponible dans Milestone 3.\n\n' +
    'Cette fonction permettra d\'importer tous les champs personnalisés de vos variantes.', 
    ui.ButtonSet.OK);
}

function importProductImages() {
  var ui = SpreadsheetApp.getUi();
  ui.alert('🚧 Fonctionnalité à venir', 
    'L\'import des images produits sera disponible dans Milestone 3.\n\n' +
    'Cette fonction permettra de gérer toutes les images de vos produits.', 
    ui.ButtonSet.OK);
}

function importInventory() {
  var ui = SpreadsheetApp.getUi();
  ui.alert('🚧 Fonctionnalité à venir', 
    'L\'import du stock et inventaire sera disponible dans Milestone 3.\n\n' +
    'Cette fonction permettra de gérer les niveaux de stock par localisation.', 
    ui.ButtonSet.OK);
}
