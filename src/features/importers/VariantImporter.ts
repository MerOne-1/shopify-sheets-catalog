/**
 * Variant Importer - Handles importing product variants from Shopify API
 * Optimized for large datasets with batch processing
 */

import { BaseImporter } from './BaseImporter';
import { ShopifyVariant, ImportResult, ImportOptions } from '../../types';

export class VariantImporter extends BaseImporter<ShopifyVariant> {
  private readonly SHEET_NAME = 'Variants';
  private readonly MAX_VARIANTS_PER_REQUEST = 250;

  /**
   * Import all variants from Shopify
   */
  async import(options: ImportOptions = {}): Promise<ImportResult> {
    const startTime = Date.now();
    this.logProgress('Starting variant import...');

    try {
      // Get or create target sheet
      const sheet = this.getTargetSheet();
      this.setupSheetHeaders(sheet);

      // Fetch variants from Shopify API
      const variants = await this.fetchAllVariants(options);
      this.logProgress(`Fetched ${variants.length} variants from Shopify`);

      // Transform and write to sheet
      const sheetData = variants.map(variant => this.transformToSheetRow(variant));
      this.batchWriteToSheet(sheet, sheetData);

      const duration = Date.now() - startTime;
      this.logProgress(`Variant import completed in ${duration}ms`);

      return {
        success: true,
        recordsProcessed: variants.length,
        duration,
        errors: []
      };

    } catch (error) {
      this.logProgress(`Variant import failed: ${error.message}`);
      return {
        success: false,
        recordsProcessed: 0,
        duration: Date.now() - startTime,
        errors: [error.message]
      };
    }
  }

  /**
   * Get the Variants sheet
   */
  protected getTargetSheet(): GoogleAppsScript.Spreadsheet.Sheet {
    let sheet = this.ss.getSheetByName(this.SHEET_NAME);
    if (!sheet) {
      sheet = this.ss.insertSheet(this.SHEET_NAME);
    }
    return sheet;
  }

  /**
   * Get column headers for Variants sheet
   */
  protected getColumnHeaders(): string[] {
    return [
      'id',
      'product_id',
      '_hash',
      '_last_synced_at',
      'created_at',
      'updated_at',
      'inventory_item_id',
      'title',
      'option1',
      'option2',
      'option3',
      'sku',
      'barcode',
      'price',
      'compare_at_price',
      'cost',
      'weight',
      'weight_unit',
      'inventory_policy',
      'inventory_management',
      'fulfillment_service',
      'requires_shipping',
      'taxable',
      'tax_code',
      '_action',
      '_errors'
    ];
  }

  /**
   * Transform Shopify variant to sheet row
   */
  protected transformToSheetRow(variant: ShopifyVariant): any[] {
    const now = new Date().toISOString();
    
    // Create editable data array (excluding read-only fields)
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

    // Calculate hash for change detection
    const hash = this.calculateHash(editableData);

    return [
      variant.id,                           // id (read-only)
      variant.product_id,                   // product_id (read-only)
      hash,                                 // _hash
      now,                                  // _last_synced_at
      variant.created_at || '',             // created_at (read-only)
      variant.updated_at || '',             // updated_at (read-only)
      variant.inventory_item_id || '',      // inventory_item_id (read-only)
      ...editableData,                      // editable fields
      '',                                   // _action (empty for imports)
      ''                                    // _errors (empty for imports)
    ];
  }

  /**
   * Fetch all variants using REST API with pagination
   */
  private async fetchAllVariants(options: ImportOptions): Promise<ShopifyVariant[]> {
    const variants: ShopifyVariant[] = [];
    
    // If we have specific product IDs, fetch variants for those products
    if (options.productIds && options.productIds.length > 0) {
      return await this.fetchVariantsByProductIds(options.productIds);
    }

    // Otherwise, fetch all variants across all products
    let pageInfo: string | null = null;
    let hasNextPage = true;

    while (hasNextPage) {
      try {
        // Build endpoint with pagination
        let endpoint = `variants.json?limit=${this.MAX_VARIANTS_PER_REQUEST}`;
        if (pageInfo) {
          endpoint += `&page_info=${pageInfo}`;
        }

        // Add filters if specified
        if (options.sinceId) {
          endpoint += `&since_id=${options.sinceId}`;
        }
        if (options.updatedAtMin) {
          endpoint += `&updated_at_min=${options.updatedAtMin}`;
        }

        this.logProgress(`Fetching variants page...`, variants.length);

        // Make API request
        const response = await this.apiClient.makeRequest(endpoint);
        const pageVariants = response.variants || [];

        variants.push(...pageVariants);

        // Check for next page
        const linkHeader = response.headers?.Link || '';
        hasNextPage = linkHeader.includes('rel="next"');
        
        if (hasNextPage) {
          // Extract page_info from Link header
          const nextMatch = linkHeader.match(/page_info=([^&>]+).*rel="next"/);
          pageInfo = nextMatch ? nextMatch[1] : null;
        }

        // Rate limiting
        await this.handleRateLimit();

      } catch (error) {
        this.logProgress(`Error fetching variants page: ${error.message}`);
        throw error;
      }
    }

    return variants;
  }

  /**
   * Fetch variants for specific product IDs
   */
  private async fetchVariantsByProductIds(productIds: number[]): Promise<ShopifyVariant[]> {
    const variants: ShopifyVariant[] = [];
    
    // Process products in batches to avoid URL length limits
    const BATCH_SIZE = 50;
    for (let i = 0; i < productIds.length; i += BATCH_SIZE) {
      const batch = productIds.slice(i, i + BATCH_SIZE);
      
      for (const productId of batch) {
        try {
          this.logProgress(`Fetching variants for product ${productId}...`);
          
          const response = await this.apiClient.makeRequest(`products/${productId}/variants.json`);
          const productVariants = response.variants || [];
          
          variants.push(...productVariants);
          
          // Rate limiting
          await this.handleRateLimit();
          
        } catch (error) {
          this.logProgress(`Error fetching variants for product ${productId}: ${error.message}`);
          // Continue with other products instead of failing completely
        }
      }
    }

    return variants;
  }

  /**
   * Import variants for specific products only
   */
  async importForProducts(productIds: number[]): Promise<ImportResult> {
    const options: ImportOptions = { productIds };
    return await this.import(options);
  }

  /**
   * Import variants incrementally (only updated since last sync)
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
