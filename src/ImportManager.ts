/**
 * Import Manager - Consolidated import functionality for Milestone 1
 * Combines all import components into a single Google Apps Script compatible file
 */

// Base Importer functionality
class BaseImporter {
  protected apiClient: any;
  protected configManager: any;
  protected ss: GoogleAppsScript.Spreadsheet.Spreadsheet;

  constructor() {
    this.apiClient = new ApiClient();
    this.configManager = new ConfigManager();
    this.ss = SpreadsheetApp.getActiveSpreadsheet();
  }

  calculateHash(data: any[]): string {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  batchWriteToSheet(sheet: GoogleAppsScript.Spreadsheet.Sheet, data: any[][], startRow: number = 2): void {
    if (data.length === 0) return;

    const BATCH_SIZE = 1000;
    
    for (let i = 0; i < data.length; i += BATCH_SIZE) {
      const batch = data.slice(i, i + BATCH_SIZE);
      const range = sheet.getRange(startRow + i, 1, batch.length, batch[0].length);
      range.setValues(batch);
      
      if (data.length > BATCH_SIZE) {
        Logger.log('Batch ' + (Math.floor(i / BATCH_SIZE) + 1) + '/' + Math.ceil(data.length / BATCH_SIZE) + ' written (' + batch.length + ' rows)');
      }
    }
  }

  setupSheetHeaders(sheet: GoogleAppsScript.Spreadsheet.Sheet, headers: string[]): void {
    sheet.clear();
    
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setValues([headers]);
    
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#4285f4');
    headerRange.setFontColor('#ffffff');
    
    sheet.setFrozenRows(1);
    
    for (let i = 1; i <= headers.length; i++) {
      sheet.autoResizeColumn(i);
    }
  }

  logProgress(message: string, current?: number, total?: number): void {
    const progressInfo = current && total ? ' (' + current + '/' + total + ')' : '';
    Logger.log('[ImportManager] ' + message + progressInfo);
  }

  async handleRateLimit(): Promise<void> {
    const delay = this.configManager.getConfigValue('rate_limit_delay') || 500;
    Utilities.sleep(delay);
  }
}

// Product Importer
class ProductImporter extends BaseImporter {
  private readonly SHEET_NAME = 'Products';
  private readonly MAX_PRODUCTS_PER_REQUEST = 250;

  async import(options: any = {}): Promise<any> {
    const startTime = Date.now();
    this.logProgress('Starting product import...');

    try {
      const sheet = this.getTargetSheet();
      const headers = [
        'id', '_hash', '_last_synced_at', 'created_at', 'updated_at',
        'title', 'handle', 'body_html', 'vendor', 'product_type',
        'tags', 'status', 'published', 'published_at', 'template_suffix',
        'seo_title', 'seo_description', '_action', '_errors'
      ];
      this.setupSheetHeaders(sheet, headers);

      const products = await this.fetchAllProducts(options);
      this.logProgress('Fetched ' + products.length + ' products from Shopify');

      const sheetData = products.map(product => this.transformToSheetRow(product));
      this.batchWriteToSheet(sheet, sheetData);

      const duration = Date.now() - startTime;
      this.logProgress('Product import completed in ' + duration + 'ms');

      return {
        success: true,
        recordsProcessed: products.length,
        duration: duration,
        errors: []
      };

    } catch (error) {
      this.logProgress('Product import failed: ' + error.message);
      return {
        success: false,
        recordsProcessed: 0,
        duration: Date.now() - startTime,
        errors: [error.message]
      };
    }
  }

  getTargetSheet(): GoogleAppsScript.Spreadsheet.Sheet {
    let sheet = this.ss.getSheetByName(this.SHEET_NAME);
    if (!sheet) {
      sheet = this.ss.insertSheet(this.SHEET_NAME);
    }
    return sheet;
  }

  transformToSheetRow(product: any): any[] {
    const now = new Date().toISOString();
    
    const editableData = [
      product.title || '',
      product.handle || '',
      product.body_html || '',
      product.vendor || '',
      product.product_type || '',
      product.tags || '',
      product.status || 'draft',
      product.published_scope === 'global' ? 'TRUE' : 'FALSE',
      product.published_at || '',
      product.template_suffix || '',
      (product.seo_title || ''),
      (product.seo_description || '')
    ];

    const hash = this.calculateHash(editableData);

    return [
      product.id,
      hash,
      now,
      product.created_at || '',
      product.updated_at || '',
      ...editableData,
      '',
      ''
    ];
  }

  async fetchAllProducts(options: any): Promise<any[]> {
    const products: any[] = [];
    let pageInfo: string | null = null;
    let hasNextPage = true;

    while (hasNextPage) {
      try {
        let endpoint = 'products.json?limit=' + this.MAX_PRODUCTS_PER_REQUEST;
        if (pageInfo) {
          endpoint += '&page_info=' + pageInfo;
        }

        if (options.sinceId) {
          endpoint += '&since_id=' + options.sinceId;
        }
        if (options.updatedAtMin) {
          endpoint += '&updated_at_min=' + options.updatedAtMin;
        }

        this.logProgress('Fetching products page...', products.length);

        const response = await this.apiClient.makeRequest(endpoint);
        const pageProducts = response.products || [];

        products.push(...pageProducts);

        const linkHeader = response.headers?.Link || '';
        hasNextPage = linkHeader.includes('rel="next"');
        
        if (hasNextPage) {
          const nextMatch = linkHeader.match(/page_info=([^&>]+).*rel="next"/);
          pageInfo = nextMatch ? nextMatch[1] : null;
        }

        await this.handleRateLimit();

      } catch (error) {
        this.logProgress('Error fetching products page: ' + error.message);
        throw error;
      }
    }

    return products;
  }
}

// Variant Importer
class VariantImporter extends BaseImporter {
  private readonly SHEET_NAME = 'Variants';
  private readonly MAX_VARIANTS_PER_REQUEST = 250;

  async import(options: any = {}): Promise<any> {
    const startTime = Date.now();
    this.logProgress('Starting variant import...');

    try {
      const sheet = this.getTargetSheet();
      const headers = [
        'id', 'product_id', '_hash', '_last_synced_at', 'created_at', 'updated_at',
        'inventory_item_id', 'title', 'option1', 'option2', 'option3', 'sku',
        'barcode', 'price', 'compare_at_price', 'cost', 'weight', 'weight_unit',
        'inventory_policy', 'inventory_management', 'fulfillment_service',
        'requires_shipping', 'taxable', 'tax_code', '_action', '_errors'
      ];
      this.setupSheetHeaders(sheet, headers);

      const variants = await this.fetchAllVariants(options);
      this.logProgress('Fetched ' + variants.length + ' variants from Shopify');

      const sheetData = variants.map(variant => this.transformToSheetRow(variant));
      this.batchWriteToSheet(sheet, sheetData);

      const duration = Date.now() - startTime;
      this.logProgress('Variant import completed in ' + duration + 'ms');

      return {
        success: true,
        recordsProcessed: variants.length,
        duration: duration,
        errors: []
      };

    } catch (error) {
      this.logProgress('Variant import failed: ' + error.message);
      return {
        success: false,
        recordsProcessed: 0,
        duration: Date.now() - startTime,
        errors: [error.message]
      };
    }
  }

  getTargetSheet(): GoogleAppsScript.Spreadsheet.Sheet {
    let sheet = this.ss.getSheetByName(this.SHEET_NAME);
    if (!sheet) {
      sheet = this.ss.insertSheet(this.SHEET_NAME);
    }
    return sheet;
  }

  transformToSheetRow(variant: any): any[] {
    const now = new Date().toISOString();
    
    const editableData = [
      variant.title || '',
      variant.option1 || '',
      variant.option2 || '',
      variant.option3 || '',
      variant.sku || '',
      variant.barcode || '',
      variant.price || '',
      variant.compare_at_price || '',
      variant.cost || '',
      variant.weight || '',
      variant.weight_unit || 'kg',
      variant.inventory_policy || 'deny',
      variant.inventory_management || '',
      variant.fulfillment_service || 'manual',
      variant.requires_shipping ? 'TRUE' : 'FALSE',
      variant.taxable ? 'TRUE' : 'FALSE',
      variant.tax_code || ''
    ];

    const hash = this.calculateHash(editableData);

    return [
      variant.id,
      variant.product_id,
      hash,
      now,
      variant.created_at || '',
      variant.updated_at || '',
      variant.inventory_item_id || '',
      ...editableData,
      '',
      ''
    ];
  }

  async fetchAllVariants(options: any): Promise<any[]> {
    const variants: any[] = [];
    let pageInfo: string | null = null;
    let hasNextPage = true;

    while (hasNextPage) {
      try {
        let endpoint = 'variants.json?limit=' + this.MAX_VARIANTS_PER_REQUEST;
        if (pageInfo) {
          endpoint += '&page_info=' + pageInfo;
        }

        if (options.sinceId) {
          endpoint += '&since_id=' + options.sinceId;
        }
        if (options.updatedAtMin) {
          endpoint += '&updated_at_min=' + options.updatedAtMin;
        }

        this.logProgress('Fetching variants page...', variants.length);

        const response = await this.apiClient.makeRequest(endpoint);
        const pageVariants = response.variants || [];

        variants.push(...pageVariants);

        const linkHeader = response.headers?.Link || '';
        hasNextPage = linkHeader.includes('rel="next"');
        
        if (hasNextPage) {
          const nextMatch = linkHeader.match(/page_info=([^&>]+).*rel="next"/);
          pageInfo = nextMatch ? nextMatch[1] : null;
        }

        await this.handleRateLimit();

      } catch (error) {
        this.logProgress('Error fetching variants page: ' + error.message);
        throw error;
      }
    }

    return variants;
  }
}

// Import Orchestrator
class ImportOrchestrator {
  private configManager: any;
  private productImporter: ProductImporter;
  private variantImporter: VariantImporter;

  constructor() {
    this.configManager = new ConfigManager();
    this.productImporter = new ProductImporter();
    this.variantImporter = new VariantImporter();
  }

  async importAll(options: any = {}): Promise<any> {
    const startTime = Date.now();
    Logger.log('=== STARTING BULK IMPORT ===');

    try {
      if (this.configManager.getConfigValue('read_only_mode') === 'TRUE') {
        throw new Error('System is in read-only mode. Import operations are disabled.');
      }

      const results: any = {
        success: true,
        totalDuration: 0,
        results: {
          products: { success: false, recordsProcessed: 0, duration: 0, errors: [] },
          variants: { success: false, recordsProcessed: 0, duration: 0, errors: [] }
        },
        errors: []
      };

      this.showProgressDialog('Starting bulk import...');

      Logger.log('Step 1/2: Importing Products...');
      this.updateProgressDialog('Importing products...', 50);
      results.results.products = await this.productImporter.import(options);
      
      if (!results.results.products.success) {
        results.success = false;
        results.errors.push('Product import failed');
      }

      Logger.log('Step 2/2: Importing Variants...');
      this.updateProgressDialog('Importing variants...', 100);
      results.results.variants = await this.variantImporter.import(options);
      
      if (!results.results.variants.success) {
        results.success = false;
        results.errors.push('Variant import failed');
      }

      results.totalDuration = Date.now() - startTime;

      if (results.success) {
        this.configManager.setConfigValue('last_import_timestamp', new Date().toISOString());
      }

      this.showCompletionDialog(results);

      Logger.log('=== BULK IMPORT COMPLETED ===');
      return results;

    } catch (error) {
      Logger.log('Bulk import failed: ' + error.message);
      
      const errorResult: any = {
        success: false,
        totalDuration: Date.now() - startTime,
        results: {
          products: { success: false, recordsProcessed: 0, duration: 0, errors: [] },
          variants: { success: false, recordsProcessed: 0, duration: 0, errors: [] }
        },
        errors: [error.message]
      };

      this.showErrorDialog(error.message);
      return errorResult;
    }
  }

  async importProductsOnly(options: any = {}): Promise<any> {
    Logger.log('Importing products only...');
    return await this.productImporter.import(options);
  }

  async importVariantsOnly(options: any = {}): Promise<any> {
    Logger.log('Importing variants only...');
    return await this.variantImporter.import(options);
  }

  private showProgressDialog(message: string): void {
    try {
      Logger.log('PROGRESS: ' + message);
    } catch (error) {
      Logger.log('Progress: ' + message);
    }
  }

  private updateProgressDialog(message: string, percentage: number): void {
    try {
      Logger.log('PROGRESS (' + percentage + '%): ' + message);
    } catch (error) {
      Logger.log('Progress ' + percentage + '%: ' + message);
    }
  }

  private showCompletionDialog(results: any): void {
    const totalRecords = 
      results.results.products.recordsProcessed +
      results.results.variants.recordsProcessed;

    const message = results.success 
      ? 'Import completed successfully!\n\nTotal records imported: ' + totalRecords + '\nDuration: ' + Math.round(results.totalDuration / 1000) + 's'
      : 'Import completed with errors.\n\nRecords imported: ' + totalRecords + '\nErrors: ' + results.errors.length;

    try {
      SpreadsheetApp.getUi().alert('Import Complete', message, SpreadsheetApp.getUi().ButtonSet.OK);
    } catch (error) {
      Logger.log('COMPLETION: ' + message);
    }
  }

  private showErrorDialog(errorMessage: string): void {
    try {
      SpreadsheetApp.getUi().alert('Import Error', 'Import failed: ' + errorMessage, SpreadsheetApp.getUi().ButtonSet.OK);
    } catch (error) {
      Logger.log('ERROR: Import failed: ' + errorMessage);
    }
  }

  getImportStats(): any {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    const stats = {
      products: 0,
      variants: 0,
      lastImport: this.configManager.getConfigValue('last_import_timestamp') || 'Never'
    };

    const sheets = ['Products', 'Variants'];
    const keys = ['products', 'variants'];

    for (let i = 0; i < sheets.length; i++) {
      const sheet = ss.getSheetByName(sheets[i]);
      if (sheet) {
        const lastRow = sheet.getLastRow();
        stats[keys[i]] = Math.max(0, lastRow - 1);
      }
    }

    return stats;
  }
}

// Global functions for menu integration
function importAllData() {
  const orchestrator = new ImportOrchestrator();
  return orchestrator.importAll();
}

function importProductsOnly() {
  const orchestrator = new ImportOrchestrator();
  return orchestrator.importProductsOnly();
}

function importVariantsOnly() {
  const orchestrator = new ImportOrchestrator();
  return orchestrator.importVariantsOnly();
}

function getImportStats() {
  const orchestrator = new ImportOrchestrator();
  return orchestrator.getImportStats();
}
