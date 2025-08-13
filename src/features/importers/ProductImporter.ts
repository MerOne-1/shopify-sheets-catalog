/**
 * Product Importer - Handles importing products from Shopify API
 * Implements bulk import with GraphQL and optimized sheet operations
 */

import { BaseImporter } from './BaseImporter';
import { ShopifyProduct, ImportResult, ImportOptions } from '../../types';

export class ProductImporter extends BaseImporter<ShopifyProduct> {
  private readonly SHEET_NAME = 'Products';
  private readonly MAX_PRODUCTS_PER_REQUEST = 250;

  /**
   * Import all products from Shopify
   */
  async import(options: ImportOptions = {}): Promise<ImportResult> {
    const startTime = Date.now();
    this.logProgress('Starting product import...');

    try {
      // Get or create target sheet
      const sheet = this.getTargetSheet();
      this.setupSheetHeaders(sheet);

      // Fetch products from Shopify API
      const products = await this.fetchAllProducts(options);
      this.logProgress(`Fetched ${products.length} products from Shopify`);

      // Transform and write to sheet
      const sheetData = products.map(product => this.transformToSheetRow(product));
      this.batchWriteToSheet(sheet, sheetData);

      const duration = Date.now() - startTime;
      this.logProgress(`Product import completed in ${duration}ms`);

      return {
        success: true,
        recordsProcessed: products.length,
        duration,
        errors: []
      };

    } catch (error) {
      this.logProgress(`Product import failed: ${error.message}`);
      return {
        success: false,
        recordsProcessed: 0,
        duration: Date.now() - startTime,
        errors: [error.message]
      };
    }
  }

  /**
   * Get the Products sheet
   */
  protected getTargetSheet(): GoogleAppsScript.Spreadsheet.Sheet {
    let sheet = this.ss.getSheetByName(this.SHEET_NAME);
    if (!sheet) {
      sheet = this.ss.insertSheet(this.SHEET_NAME);
    }
    return sheet;
  }

  /**
   * Get column headers for Products sheet
   */
  protected getColumnHeaders(): string[] {
    return [
      'id',
      '_hash',
      '_last_synced_at',
      'created_at',
      'updated_at',
      'title',
      'handle',
      'body_html',
      'vendor',
      'product_type',
      'tags',
      'status',
      'published',
      'published_at',
      'template_suffix',
      'seo_title',
      'seo_description',
      '_action',
      '_errors'
    ];
  }

  /**
   * Transform Shopify product to sheet row
   */
  protected transformToSheetRow(product: ShopifyProduct): any[] {
    const now = new Date().toISOString();
    
    // Create editable data array (excluding read-only fields)
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

    // Calculate hash for change detection
    const hash = this.calculateHash(editableData);

    return [
      product.id,                    // id (read-only)
      hash,                         // _hash
      now,                          // _last_synced_at
      product.created_at || '',     // created_at (read-only)
      product.updated_at || '',     // updated_at (read-only)
      ...editableData,              // editable fields
      '',                           // _action (empty for imports)
      ''                            // _errors (empty for imports)
    ];
  }

  /**
   * Fetch all products using REST API with pagination
   */
  private async fetchAllProducts(options: ImportOptions): Promise<ShopifyProduct[]> {
    const products: ShopifyProduct[] = [];
    let pageInfo: string | null = null;
    let hasNextPage = true;

    while (hasNextPage) {
      try {
        // Build endpoint with pagination
        let endpoint = `products.json?limit=${this.MAX_PRODUCTS_PER_REQUEST}`;
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

        this.logProgress(`Fetching products page...`, products.length);

        // Make API request
        const response = await this.apiClient.makeRequest(endpoint);
        const pageProducts = response.products || [];

        products.push(...pageProducts);

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
        this.logProgress(`Error fetching products page: ${error.message}`);
        throw error;
      }
    }

    return products;
  }

  /**
   * Import products incrementally (only updated since last sync)
   */
  async importIncremental(): Promise<ImportResult> {
    const lastSync = this.configManager.getConfigValue('last_import_timestamp');
    const options: ImportOptions = {};
    
    if (lastSync) {
      options.updatedAtMin = lastSync;
    }

    const result = await this.import(options);
    
    if (result.success) {
      // Update last sync timestamp
      this.configManager.setConfigValue('last_import_timestamp', new Date().toISOString());
    }

    return result;
  }
}
