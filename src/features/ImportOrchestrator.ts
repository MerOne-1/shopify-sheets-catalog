/**
 * Import Orchestrator - Coordinates all import operations
 * Handles bulk imports, progress tracking, and error management
 */

import { ProductImporter } from './importers/ProductImporter';
import { VariantImporter } from './importers/VariantImporter';
import { InventoryImporter } from './importers/InventoryImporter';
import { MetafieldImporter } from './importers/MetafieldImporter';
import { ConfigManager } from '../core/ConfigManager';
import { UIManager } from '../core/UIManager';
import { ImportResult, ImportOptions, BulkImportResult } from '../types';

export class ImportOrchestrator {
  private configManager: ConfigManager;
  private uiManager: UIManager;
  private productImporter: ProductImporter;
  private variantImporter: VariantImporter;
  private inventoryImporter: InventoryImporter;
  private metafieldImporter: MetafieldImporter;

  constructor() {
    this.configManager = new ConfigManager();
    this.uiManager = new UIManager();
    this.productImporter = new ProductImporter();
    this.variantImporter = new VariantImporter();
    this.inventoryImporter = new InventoryImporter();
    this.metafieldImporter = new MetafieldImporter();
  }

  /**
   * Import all data types in the correct order
   */
  async importAll(options: ImportOptions = {}): Promise<BulkImportResult> {
    const startTime = Date.now();
    Logger.log('=== STARTING BULK IMPORT ===');

    try {
      // Check if read-only mode is enabled
      if (this.configManager.getConfigValue('read_only_mode') === 'TRUE') {
        throw new Error('System is in read-only mode. Import operations are disabled.');
      }

      const results: BulkImportResult = {
        success: true,
        totalDuration: 0,
        results: {
          products: { success: false, recordsProcessed: 0, duration: 0, errors: [] },
          variants: { success: false, recordsProcessed: 0, duration: 0, errors: [] },
          inventory: { success: false, recordsProcessed: 0, duration: 0, errors: [] },
          metafields: { success: false, recordsProcessed: 0, duration: 0, errors: [] }
        },
        errors: []
      };

      // Show progress dialog
      this.showProgressDialog('Starting bulk import...');

      // Step 1: Import Products
      Logger.log('Step 1/4: Importing Products...');
      this.updateProgressDialog('Importing products...', 25);
      results.results.products = await this.productImporter.import(options);
      
      if (!results.results.products.success) {
        results.success = false;
        results.errors.push('Product import failed');
      }

      // Step 2: Import Variants
      Logger.log('Step 2/4: Importing Variants...');
      this.updateProgressDialog('Importing variants...', 50);
      results.results.variants = await this.variantImporter.import(options);
      
      if (!results.results.variants.success) {
        results.success = false;
        results.errors.push('Variant import failed');
      }

      // Step 3: Import Inventory
      Logger.log('Step 3/4: Importing Inventory...');
      this.updateProgressDialog('Importing inventory...', 75);
      results.results.inventory = await this.inventoryImporter.import(options);
      
      if (results.results.inventory.success) {
        // Populate variant info in inventory
        await this.inventoryImporter.populateVariantInfo();
      } else {
        results.success = false;
        results.errors.push('Inventory import failed');
      }

      // Step 4: Import Metafields
      Logger.log('Step 4/4: Importing Metafields...');
      this.updateProgressDialog('Importing metafields...', 90);
      results.results.metafields = await this.metafieldImporter.import(options);
      
      if (!results.results.metafields.success) {
        results.success = false;
        results.errors.push('Metafield import failed');
      }

      // Calculate total duration
      results.totalDuration = Date.now() - startTime;

      // Update last import timestamp if successful
      if (results.success) {
        this.configManager.setConfigValue('last_import_timestamp', new Date().toISOString());
      }

      // Show completion dialog
      this.showCompletionDialog(results);

      Logger.log('=== BULK IMPORT COMPLETED ===');
      return results;

    } catch (error) {
      Logger.log(`Bulk import failed: ${error.message}`);
      
      const errorResult: BulkImportResult = {
        success: false,
        totalDuration: Date.now() - startTime,
        results: {
          products: { success: false, recordsProcessed: 0, duration: 0, errors: [] },
          variants: { success: false, recordsProcessed: 0, duration: 0, errors: [] },
          inventory: { success: false, recordsProcessed: 0, duration: 0, errors: [] },
          metafields: { success: false, recordsProcessed: 0, duration: 0, errors: [] }
        },
        errors: [error.message]
      };

      this.showErrorDialog(error.message);
      return errorResult;
    }
  }

  /**
   * Import only products
   */
  async importProductsOnly(options: ImportOptions = {}): Promise<ImportResult> {
    Logger.log('Importing products only...');
    return await this.productImporter.import(options);
  }

  /**
   * Import only variants
   */
  async importVariantsOnly(options: ImportOptions = {}): Promise<ImportResult> {
    Logger.log('Importing variants only...');
    return await this.variantImporter.import(options);
  }

  /**
   * Import only inventory
   */
  async importInventoryOnly(options: ImportOptions = {}): Promise<ImportResult> {
    Logger.log('Importing inventory only...');
    const result = await this.inventoryImporter.import(options);
    
    if (result.success) {
      await this.inventoryImporter.populateVariantInfo();
    }
    
    return result;
  }

  /**
   * Import only metafields
   */
  async importMetafieldsOnly(options: ImportOptions = {}): Promise<ImportResult> {
    Logger.log('Importing metafields only...');
    return await this.metafieldImporter.import(options);
  }

  /**
   * Import incrementally (only updated data since last sync)
   */
  async importIncremental(): Promise<BulkImportResult> {
    Logger.log('Starting incremental import...');
    
    const lastSync = this.configManager.getConfigValue('last_import_timestamp');
    if (!lastSync) {
      Logger.log('No previous sync found. Running full import...');
      return await this.importAll();
    }

    const options: ImportOptions = {
      updatedAtMin: lastSync
    };

    return await this.importAll(options);
  }

  /**
   * Show progress dialog
   */
  private showProgressDialog(message: string): void {
    try {
      // Note: In actual implementation, this would show a progress dialog
      // For now, we'll use Logger for progress tracking
      Logger.log(`PROGRESS: ${message}`);
    } catch (error) {
      // Gracefully handle UI context errors
      Logger.log(`Progress: ${message}`);
    }
  }

  /**
   * Update progress dialog
   */
  private updateProgressDialog(message: string, percentage: number): void {
    try {
      Logger.log(`PROGRESS (${percentage}%): ${message}`);
    } catch (error) {
      Logger.log(`Progress ${percentage}%: ${message}`);
    }
  }

  /**
   * Show completion dialog
   */
  private showCompletionDialog(results: BulkImportResult): void {
    const totalRecords = 
      results.results.products.recordsProcessed +
      results.results.variants.recordsProcessed +
      results.results.inventory.recordsProcessed +
      results.results.metafields.recordsProcessed;

    const message = results.success 
      ? `Import completed successfully!\n\nTotal records imported: ${totalRecords}\nDuration: ${Math.round(results.totalDuration / 1000)}s`
      : `Import completed with errors.\n\nRecords imported: ${totalRecords}\nErrors: ${results.errors.length}`;

    try {
      this.uiManager.showAlert('Import Complete', message);
    } catch (error) {
      Logger.log(`COMPLETION: ${message}`);
    }
  }

  /**
   * Show error dialog
   */
  private showErrorDialog(errorMessage: string): void {
    try {
      this.uiManager.showAlert('Import Error', `Import failed: ${errorMessage}`);
    } catch (error) {
      Logger.log(`ERROR: Import failed: ${errorMessage}`);
    }
  }

  /**
   * Get import statistics
   */
  getImportStats(): any {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    const stats = {
      products: 0,
      variants: 0,
      inventory: 0,
      productMetafields: 0,
      variantMetafields: 0,
      lastImport: this.configManager.getConfigValue('last_import_timestamp') || 'Never'
    };

    // Count records in each sheet
    const sheets = ['Products', 'Variants', 'Inventory', 'MF_Products', 'MF_Variants'];
    const keys = ['products', 'variants', 'inventory', 'productMetafields', 'variantMetafields'];

    for (let i = 0; i < sheets.length; i++) {
      const sheet = ss.getSheetByName(sheets[i]);
      if (sheet) {
        const lastRow = sheet.getLastRow();
        stats[keys[i]] = Math.max(0, lastRow - 1); // Subtract header row
      }
    }

    return stats;
  }
}
