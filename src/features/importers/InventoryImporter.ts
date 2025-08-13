/**
 * Inventory Importer - Handles importing inventory levels from Shopify API
 * Manages location mapping and inventory item relationships
 */

import { BaseImporter } from './BaseImporter';
import { ShopifyInventoryLevel, ShopifyLocation, ImportResult, ImportOptions } from '../../types';

export class InventoryImporter extends BaseImporter<ShopifyInventoryLevel> {
  private readonly SHEET_NAME = 'Inventory';
  private readonly MAX_INVENTORY_PER_REQUEST = 250;
  private locations: Map<number, ShopifyLocation> = new Map();

  /**
   * Import all inventory levels from Shopify
   */
  async import(options: ImportOptions = {}): Promise<ImportResult> {
    const startTime = Date.now();
    this.logProgress('Starting inventory import...');

    try {
      // First, fetch and cache all locations
      await this.fetchAndCacheLocations();
      
      // Get or create target sheet
      const sheet = this.getTargetSheet();
      this.setupSheetHeaders(sheet);

      // Fetch inventory levels from Shopify API
      const inventoryLevels = await this.fetchAllInventoryLevels(options);
      this.logProgress(`Fetched ${inventoryLevels.length} inventory levels from Shopify`);

      // Transform and write to sheet
      const sheetData = inventoryLevels.map(level => this.transformToSheetRow(level));
      this.batchWriteToSheet(sheet, sheetData);

      const duration = Date.now() - startTime;
      this.logProgress(`Inventory import completed in ${duration}ms`);

      return {
        success: true,
        recordsProcessed: inventoryLevels.length,
        duration,
        errors: []
      };

    } catch (error) {
      this.logProgress(`Inventory import failed: ${error.message}`);
      return {
        success: false,
        recordsProcessed: 0,
        duration: Date.now() - startTime,
        errors: [error.message]
      };
    }
  }

  /**
   * Get the Inventory sheet
   */
  protected getTargetSheet(): GoogleAppsScript.Spreadsheet.Sheet {
    let sheet = this.ss.getSheetByName(this.SHEET_NAME);
    if (!sheet) {
      sheet = this.ss.insertSheet(this.SHEET_NAME);
    }
    return sheet;
  }

  /**
   * Get column headers for Inventory sheet
   */
  protected getColumnHeaders(): string[] {
    return [
      'variant_id',
      'inventory_item_id',
      'location_id',
      'location_name',
      'sku',
      '_hash',
      '_last_synced_at',
      'available',
      '_action',
      '_errors'
    ];
  }

  /**
   * Transform Shopify inventory level to sheet row
   */
  protected transformToSheetRow(inventoryLevel: ShopifyInventoryLevel): any[] {
    const now = new Date().toISOString();
    const location = this.locations.get(inventoryLevel.location_id);
    
    // Create editable data array (only 'available' is editable)
    const editableData = [
      inventoryLevel.available || 0
    ];

    // Calculate hash for change detection
    const hash = this.calculateHash(editableData);

    return [
      inventoryLevel.variant_id || '',           // variant_id (read-only, populated later)
      inventoryLevel.inventory_item_id,          // inventory_item_id (read-only)
      inventoryLevel.location_id,                // location_id (read-only)
      location?.name || '',                      // location_name (read-only)
      inventoryLevel.sku || '',                  // sku (read-only, populated later)
      hash,                                      // _hash
      now,                                       // _last_synced_at
      ...editableData,                           // editable fields
      '',                                        // _action (empty for imports)
      ''                                         // _errors (empty for imports)
    ];
  }

  /**
   * Fetch and cache all locations
   */
  private async fetchAndCacheLocations(): Promise<void> {
    this.logProgress('Fetching locations...');
    
    try {
      const response = await this.apiClient.makeRequest('locations.json');
      const locations = response.locations || [];
      
      // Cache locations by ID for quick lookup
      for (const location of locations) {
        this.locations.set(location.id, location);
      }
      
      this.logProgress(`Cached ${locations.length} locations`);
    } catch (error) {
      this.logProgress(`Error fetching locations: ${error.message}`);
      throw error;
    }
  }

  /**
   * Fetch all inventory levels using REST API with pagination
   */
  private async fetchAllInventoryLevels(options: ImportOptions): Promise<ShopifyInventoryLevel[]> {
    const inventoryLevels: ShopifyInventoryLevel[] = [];
    
    // If we have specific inventory item IDs, fetch levels for those items
    if (options.inventoryItemIds && options.inventoryItemIds.length > 0) {
      return await this.fetchInventoryByItemIds(options.inventoryItemIds);
    }

    // If we have location IDs, fetch for specific locations
    if (options.locationIds && options.locationIds.length > 0) {
      return await this.fetchInventoryByLocationIds(options.locationIds);
    }

    // Otherwise, fetch all inventory levels across all locations
    for (const [locationId, location] of this.locations) {
      try {
        this.logProgress(`Fetching inventory for location: ${location.name}`);
        
        let pageInfo: string | null = null;
        let hasNextPage = true;

        while (hasNextPage) {
          // Build endpoint with pagination
          let endpoint = `inventory_levels.json?location_ids=${locationId}&limit=${this.MAX_INVENTORY_PER_REQUEST}`;
          if (pageInfo) {
            endpoint += `&page_info=${pageInfo}`;
          }

          // Add filters if specified
          if (options.updatedAtMin) {
            endpoint += `&updated_at_min=${options.updatedAtMin}`;
          }

          const response = await this.apiClient.makeRequest(endpoint);
          const pageInventoryLevels = response.inventory_levels || [];

          inventoryLevels.push(...pageInventoryLevels);

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
        }

      } catch (error) {
        this.logProgress(`Error fetching inventory for location ${locationId}: ${error.message}`);
        // Continue with other locations instead of failing completely
      }
    }

    return inventoryLevels;
  }

  /**
   * Fetch inventory levels for specific inventory item IDs
   */
  private async fetchInventoryByItemIds(inventoryItemIds: number[]): Promise<ShopifyInventoryLevel[]> {
    const inventoryLevels: ShopifyInventoryLevel[] = [];
    
    // Process inventory items in batches
    const BATCH_SIZE = 50;
    for (let i = 0; i < inventoryItemIds.length; i += BATCH_SIZE) {
      const batch = inventoryItemIds.slice(i, i + BATCH_SIZE);
      const itemIdsParam = batch.join(',');
      
      try {
        this.logProgress(`Fetching inventory for items batch ${Math.floor(i / BATCH_SIZE) + 1}...`);
        
        const response = await this.apiClient.makeRequest(`inventory_levels.json?inventory_item_ids=${itemIdsParam}`);
        const batchInventoryLevels = response.inventory_levels || [];
        
        inventoryLevels.push(...batchInventoryLevels);
        
        // Rate limiting
        await this.handleRateLimit();
        
      } catch (error) {
        this.logProgress(`Error fetching inventory batch: ${error.message}`);
        // Continue with other batches
      }
    }

    return inventoryLevels;
  }

  /**
   * Fetch inventory levels for specific location IDs
   */
  private async fetchInventoryByLocationIds(locationIds: number[]): Promise<ShopifyInventoryLevel[]> {
    const inventoryLevels: ShopifyInventoryLevel[] = [];
    
    for (const locationId of locationIds) {
      const location = this.locations.get(locationId);
      if (!location) continue;
      
      try {
        this.logProgress(`Fetching inventory for location: ${location.name}`);
        
        const response = await this.apiClient.makeRequest(`inventory_levels.json?location_ids=${locationId}`);
        const locationInventoryLevels = response.inventory_levels || [];
        
        inventoryLevels.push(...locationInventoryLevels);
        
        // Rate limiting
        await this.handleRateLimit();
        
      } catch (error) {
        this.logProgress(`Error fetching inventory for location ${locationId}: ${error.message}`);
        // Continue with other locations
      }
    }

    return inventoryLevels;
  }

  /**
   * Populate variant_id and SKU fields by cross-referencing with Variants sheet
   */
  async populateVariantInfo(): Promise<void> {
    this.logProgress('Populating variant info in inventory...');
    
    try {
      const inventorySheet = this.getTargetSheet();
      const variantsSheet = this.ss.getSheetByName('Variants');
      
      if (!variantsSheet) {
        this.logProgress('Variants sheet not found. Skipping variant info population.');
        return;
      }

      // Get all data from both sheets
      const inventoryData = inventorySheet.getDataRange().getValues();
      const variantsData = variantsSheet.getDataRange().getValues();

      // Create mapping from inventory_item_id to variant info
      const variantMap = new Map<number, { id: number, sku: string }>();
      
      // Assuming Variants sheet has: id, product_id, ..., inventory_item_id, ..., sku, ...
      for (let i = 1; i < variantsData.length; i++) {
        const row = variantsData[i];
        const variantId = row[0];
        const inventoryItemId = row[6]; // Adjust index based on actual column position
        const sku = row[11]; // Adjust index based on actual column position
        
        if (inventoryItemId) {
          variantMap.set(inventoryItemId, { id: variantId, sku: sku || '' });
        }
      }

      // Update inventory sheet with variant info
      const updates: any[][] = [];
      for (let i = 1; i < inventoryData.length; i++) {
        const row = inventoryData[i];
        const inventoryItemId = row[1];
        const variantInfo = variantMap.get(inventoryItemId);
        
        if (variantInfo) {
          row[0] = variantInfo.id;  // variant_id
          row[4] = variantInfo.sku; // sku
          updates.push(row);
        }
      }

      // Write updates back to sheet
      if (updates.length > 0) {
        const range = inventorySheet.getRange(2, 1, updates.length, inventoryData[0].length);
        range.setValues(updates);
        this.logProgress(`Updated ${updates.length} inventory records with variant info`);
      }

    } catch (error) {
      this.logProgress(`Error populating variant info: ${error.message}`);
    }
  }

  /**
   * Import inventory incrementally (only updated since last sync)
   */
  async importIncremental(): Promise<ImportResult> {
    const lastSync = this.configManager.getConfigValue('last_import_timestamp');
    const options: ImportOptions = {};
    
    if (lastSync) {
      options.updatedAtMin = lastSync;
    }

    const result = await this.import(options);
    
    // After import, populate variant info
    if (result.success) {
      await this.populateVariantInfo();
    }

    return result;
  }
}
