/**
 * Metafield Importer - Handles importing metafields from Shopify API
 * Supports both product and variant metafields with namespace organization
 */

import { BaseImporter } from './BaseImporter';
import { ShopifyMetafield, ImportResult, ImportOptions } from '../../types';

export class MetafieldImporter extends BaseImporter<ShopifyMetafield> {
  private readonly PRODUCT_METAFIELDS_SHEET = 'MF_Products';
  private readonly VARIANT_METAFIELDS_SHEET = 'MF_Variants';

  /**
   * Import all metafields from Shopify
   */
  async import(options: ImportOptions = {}): Promise<ImportResult> {
    const startTime = Date.now();
    this.logProgress('Starting metafield import...');

    try {
      let totalRecords = 0;
      const errors: string[] = [];

      // Import product metafields
      if (!options.variantsOnly) {
        const productResult = await this.importProductMetafields(options);
        totalRecords += productResult.recordsProcessed;
        errors.push(...productResult.errors);
      }

      // Import variant metafields
      if (!options.productsOnly) {
        const variantResult = await this.importVariantMetafields(options);
        totalRecords += variantResult.recordsProcessed;
        errors.push(...variantResult.errors);
      }

      const duration = Date.now() - startTime;
      this.logProgress(`Metafield import completed in ${duration}ms`);

      return {
        success: errors.length === 0,
        recordsProcessed: totalRecords,
        duration,
        errors
      };

    } catch (error) {
      this.logProgress(`Metafield import failed: ${error.message}`);
      return {
        success: false,
        recordsProcessed: 0,
        duration: Date.now() - startTime,
        errors: [error.message]
      };
    }
  }

  /**
   * Import product metafields
   */
  private async importProductMetafields(options: ImportOptions): Promise<ImportResult> {
    this.logProgress('Importing product metafields...');
    
    try {
      const sheet = this.getProductMetafieldsSheet();
      this.setupProductMetafieldsHeaders(sheet);

      const metafields = await this.fetchProductMetafields(options);
      this.logProgress(`Fetched ${metafields.length} product metafields`);

      const sheetData = metafields.map(mf => this.transformProductMetafieldToSheetRow(mf));
      this.batchWriteToSheet(sheet, sheetData);

      return {
        success: true,
        recordsProcessed: metafields.length,
        duration: 0,
        errors: []
      };

    } catch (error) {
      return {
        success: false,
        recordsProcessed: 0,
        duration: 0,
        errors: [error.message]
      };
    }
  }

  /**
   * Import variant metafields
   */
  private async importVariantMetafields(options: ImportOptions): Promise<ImportResult> {
    this.logProgress('Importing variant metafields...');
    
    try {
      const sheet = this.getVariantMetafieldsSheet();
      this.setupVariantMetafieldsHeaders(sheet);

      const metafields = await this.fetchVariantMetafields(options);
      this.logProgress(`Fetched ${metafields.length} variant metafields`);

      const sheetData = metafields.map(mf => this.transformVariantMetafieldToSheetRow(mf));
      this.batchWriteToSheet(sheet, sheetData);

      return {
        success: true,
        recordsProcessed: metafields.length,
        duration: 0,
        errors: []
      };

    } catch (error) {
      return {
        success: false,
        recordsProcessed: 0,
        duration: 0,
        errors: [error.message]
      };
    }
  }

  /**
   * Get the product metafields sheet
   */
  private getProductMetafieldsSheet(): GoogleAppsScript.Spreadsheet.Sheet {
    let sheet = this.ss.getSheetByName(this.PRODUCT_METAFIELDS_SHEET);
    if (!sheet) {
      sheet = this.ss.insertSheet(this.PRODUCT_METAFIELDS_SHEET);
    }
    return sheet;
  }

  /**
   * Get the variant metafields sheet
   */
  private getVariantMetafieldsSheet(): GoogleAppsScript.Spreadsheet.Sheet {
    let sheet = this.ss.getSheetByName(this.VARIANT_METAFIELDS_SHEET);
    if (!sheet) {
      sheet = this.ss.insertSheet(this.VARIANT_METAFIELDS_SHEET);
    }
    return sheet;
  }

  /**
   * Setup product metafields headers
   */
  private setupProductMetafieldsHeaders(sheet: GoogleAppsScript.Spreadsheet.Sheet): void {
    const headers = [
      'id',
      'owner_id',
      '_hash',
      '_last_synced_at',
      'created_at',
      'updated_at',
      'namespace',
      'key',
      'value',
      'type',
      'description',
      '_action',
      '_errors'
    ];
    
    this.setupSheetHeadersWithArray(sheet, headers);
  }

  /**
   * Setup variant metafields headers
   */
  private setupVariantMetafieldsHeaders(sheet: GoogleAppsScript.Spreadsheet.Sheet): void {
    const headers = [
      'id',
      'owner_id',
      'product_id',
      '_hash',
      '_last_synced_at',
      'created_at',
      'updated_at',
      'namespace',
      'key',
      'value',
      'type',
      'description',
      '_action',
      '_errors'
    ];
    
    this.setupSheetHeadersWithArray(sheet, headers);
  }

  /**
   * Helper method to setup headers with custom array
   */
  private setupSheetHeadersWithArray(sheet: GoogleAppsScript.Spreadsheet.Sheet, headers: string[]): void {
    // Clear existing content
    sheet.clear();
    
    // Set headers
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setValues([headers]);
    
    // Format headers
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#4285f4');
    headerRange.setFontColor('#ffffff');
    
    // Freeze header row
    sheet.setFrozenRows(1);
    
    // Auto-resize columns
    for (let i = 1; i <= headers.length; i++) {
      sheet.autoResizeColumn(i);
    }
  }

  /**
   * Transform product metafield to sheet row
   */
  private transformProductMetafieldToSheetRow(metafield: ShopifyMetafield): any[] {
    const now = new Date().toISOString();
    
    // Create editable data array
    const editableData = [
      metafield.namespace || '',
      metafield.key || '',
      metafield.value || '',
      metafield.type || 'single_line_text_field',
      metafield.description || ''
    ];

    // Calculate hash for change detection
    const hash = this.calculateHash(editableData);

    return [
      metafield.id,                    // id (read-only)
      metafield.owner_id,              // owner_id (read-only)
      hash,                            // _hash
      now,                             // _last_synced_at
      metafield.created_at || '',      // created_at (read-only)
      metafield.updated_at || '',      // updated_at (read-only)
      ...editableData,                 // editable fields
      '',                              // _action (empty for imports)
      ''                               // _errors (empty for imports)
    ];
  }

  /**
   * Transform variant metafield to sheet row
   */
  private transformVariantMetafieldToSheetRow(metafield: ShopifyMetafield): any[] {
    const now = new Date().toISOString();
    
    // Create editable data array
    const editableData = [
      metafield.namespace || '',
      metafield.key || '',
      metafield.value || '',
      metafield.type || 'single_line_text_field',
      metafield.description || ''
    ];

    // Calculate hash for change detection
    const hash = this.calculateHash(editableData);

    return [
      metafield.id,                    // id (read-only)
      metafield.owner_id,              // owner_id (read-only)
      metafield.product_id || '',      // product_id (read-only, populated later)
      hash,                            // _hash
      now,                             // _last_synced_at
      metafield.created_at || '',      // created_at (read-only)
      metafield.updated_at || '',      // updated_at (read-only)
      ...editableData,                 // editable fields
      '',                              // _action (empty for imports)
      ''                               // _errors (empty for imports)
    ];
  }

  /**
   * Fetch product metafields
   */
  private async fetchProductMetafields(options: ImportOptions): Promise<ShopifyMetafield[]> {
    const metafields: ShopifyMetafield[] = [];
    
    // Get all products first
    const productsSheet = this.ss.getSheetByName('Products');
    if (!productsSheet) {
      throw new Error('Products sheet not found. Please import products first.');
    }

    const productsData = productsSheet.getDataRange().getValues();
    const productIds: number[] = [];
    
    // Extract product IDs (skip header row)
    for (let i = 1; i < productsData.length; i++) {
      const productId = productsData[i][0];
      if (productId) {
        productIds.push(productId);
      }
    }

    // Fetch metafields for each product
    for (const productId of productIds) {
      try {
        this.logProgress(`Fetching metafields for product ${productId}...`);
        
        const response = await this.apiClient.makeRequest(`products/${productId}/metafields.json`);
        const productMetafields = response.metafields || [];
        
        // Add owner_id to each metafield
        productMetafields.forEach((mf: ShopifyMetafield) => {
          mf.owner_id = productId;
        });
        
        metafields.push(...productMetafields);
        
        // Rate limiting
        await this.handleRateLimit();
        
      } catch (error) {
        this.logProgress(`Error fetching metafields for product ${productId}: ${error.message}`);
        // Continue with other products
      }
    }

    return metafields;
  }

  /**
   * Fetch variant metafields
   */
  private async fetchVariantMetafields(options: ImportOptions): Promise<ShopifyMetafield[]> {
    const metafields: ShopifyMetafield[] = [];
    
    // Get all variants first
    const variantsSheet = this.ss.getSheetByName('Variants');
    if (!variantsSheet) {
      throw new Error('Variants sheet not found. Please import variants first.');
    }

    const variantsData = variantsSheet.getDataRange().getValues();
    const variantData: Array<{id: number, productId: number}> = [];
    
    // Extract variant IDs and product IDs (skip header row)
    for (let i = 1; i < variantsData.length; i++) {
      const variantId = variantsData[i][0];
      const productId = variantsData[i][1];
      if (variantId && productId) {
        variantData.push({ id: variantId, productId: productId });
      }
    }

    // Fetch metafields for each variant
    for (const variant of variantData) {
      try {
        this.logProgress(`Fetching metafields for variant ${variant.id}...`);
        
        const response = await this.apiClient.makeRequest(`variants/${variant.id}/metafields.json`);
        const variantMetafields = response.metafields || [];
        
        // Add owner_id and product_id to each metafield
        variantMetafields.forEach((mf: ShopifyMetafield) => {
          mf.owner_id = variant.id;
          mf.product_id = variant.productId;
        });
        
        metafields.push(...variantMetafields);
        
        // Rate limiting
        await this.handleRateLimit();
        
      } catch (error) {
        this.logProgress(`Error fetching metafields for variant ${variant.id}: ${error.message}`);
        // Continue with other variants
      }
    }

    return metafields;
  }

  // Required abstract method implementations (not used for metafields)
  protected getTargetSheet(): GoogleAppsScript.Spreadsheet.Sheet {
    throw new Error('getTargetSheet not applicable for MetafieldImporter. Use specific sheet methods.');
  }

  protected getColumnHeaders(): string[] {
    throw new Error('getColumnHeaders not applicable for MetafieldImporter. Use specific header methods.');
  }

  protected transformToSheetRow(item: ShopifyMetafield): any[] {
    throw new Error('transformToSheetRow not applicable for MetafieldImporter. Use specific transform methods.');
  }

  /**
   * Import metafields incrementally (only updated since last sync)
   */
  async importIncremental(): Promise<ImportResult> {
    const lastSync = this.configManager.getConfigValue('last_import_timestamp');
    const options: ImportOptions = {};
    
    if (lastSync) {
      options.updatedAtMin = lastSync;
    }

    return await this.import(options);
  }
}
