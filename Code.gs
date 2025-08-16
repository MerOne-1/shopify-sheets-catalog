/**
 * Shopify Sheets Catalog - Main Entry Point
 * Pure orchestrator pattern - delegates all business logic to appropriate components
 */

/**
 * Called when the spreadsheet is opened
 * Entry point for Google Apps Script
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

// =============================================================================
// THIN ORCHESTRATION WRAPPERS - Delegate to appropriate components
// =============================================================================

// Import Operations
function importAllProducts() {
  return new ImportOrchestrator().importAll();
}

function importProductsOnly() {
  return new ImportOrchestrator().importProductsOnly();
}

function importVariantsOnly() {
  return new ImportOrchestrator().importVariantsOnly();
}

// Dry-Run Operations
function dryRunProducts() {
  return new ImportOrchestrator().dryRunProducts();
}

function dryRunVariants() {
  return new ImportOrchestrator().dryRunVariants();
}

function dryRunAll() {
  return new ImportOrchestrator().dryRunAll();
}

function runDryRun() {
  return dryRunAll();
}

// Incremental Import Operations
function incrementalProducts() {
  return new ImportOrchestrator().incrementalProducts();
}

function incrementalVariants() {
  return new ImportOrchestrator().incrementalVariants();
}

function incrementalAll() {
  return new ImportOrchestrator().incrementalAll();
}

// Statistics
function viewImportStats() {
  return new StatsService().getImportStats();
}

// Configuration
function setupConfig() {
  return new ConfigManager().initializeConfigSheet();
}

function testShopifyConnection() {
  return new ApiClient().testConnection();
}

function refreshConfig() {
  return new ConfigManager().refresh();
}

// Validation
function validateAllData() {
  return new ValidationEngine().validateAllSheets();
}

// Export Operations (from UIManager)
function exportToShopify() {
  return new UIManager().exportToShopify();
}

function exportProducts() {
  return new UIManager().exportProducts();
}

function exportVariants() {
  return new UIManager().exportVariants();
}

function viewExportStatus() {
  return new UIManager().viewExportStatus();
}

function resumeExport() {
  return new UIManager().resumeExport();
}

function viewExportAuditReport() {
  return new UIManager().viewExportAuditReport();
}

// Utilities
function clearLogs() {
  return new UtilityService().clearLogs();
}

// =============================================================================
// PLACEHOLDER FUNCTIONS - Menu callbacks not yet implemented
// =============================================================================

function importMetafields() {
  throw new Error('Metafields import will be available in future milestones');
}

function importImages() {
  throw new Error('Images import will be available in future milestones');
}

function importInventory() {
  throw new Error('Inventory import will be available in future milestones');
}

function checkDuplicates() {
  throw new Error('Duplicate check is not yet implemented');
}

function recomputeHashes() {
  throw new Error('Hash recomputation is not yet implemented');
}

function createManualBackup() {
  throw new Error('Manual backup is not yet implemented');
}

function showRestoreDialog() {
  throw new Error('Restore functionality is not yet implemented');
}

function toggleReadOnlyMode() {
  throw new Error('Read-only mode toggle is not yet implemented');
}

function openUserGuide() {
  throw new Error('User guide is not yet implemented');
}

function openSettings() {
  throw new Error('Settings dialog is not yet implemented');
}
