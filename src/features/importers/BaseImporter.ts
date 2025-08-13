/**
 * Base Importer - Abstract base class for all data importers
 * Provides common functionality for importing data from Shopify API
 */

import { ApiClient } from '../../core/ApiClient';
import { ConfigManager } from '../../core/ConfigManager';
import { ShopifyResource, ImportResult, ImportOptions } from '../../types';

export abstract class BaseImporter<T extends ShopifyResource> {
  protected apiClient: ApiClient;
  protected configManager: ConfigManager;
  protected ss: GoogleAppsScript.Spreadsheet.Spreadsheet;
  
  constructor() {
    this.apiClient = new ApiClient();
    this.configManager = new ConfigManager();
    this.ss = SpreadsheetApp.getActiveSpreadsheet();
  }

  /**
   * Abstract method to be implemented by each importer
   */
  abstract import(options?: ImportOptions): Promise<ImportResult>;

  /**
   * Get the target sheet for this importer
   */
  protected abstract getTargetSheet(): GoogleAppsScript.Spreadsheet.Sheet;

  /**
   * Get column headers for the target sheet
   */
  protected abstract getColumnHeaders(): string[];

  /**
   * Transform API data to sheet row format
   */
  protected abstract transformToSheetRow(item: T): any[];

  /**
   * Calculate hash for change detection
   */
  protected calculateHash(data: any[]): string {
    // Simple hash calculation - can be enhanced later
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Batch write data to sheet with performance optimization
   */
  protected batchWriteToSheet(sheet: GoogleAppsScript.Spreadsheet.Sheet, data: any[][], startRow: number = 2): void {
    if (data.length === 0) return;

    const BATCH_SIZE = 1000; // Write in batches of 1000 rows
    
    for (let i = 0; i < data.length; i += BATCH_SIZE) {
      const batch = data.slice(i, i + BATCH_SIZE);
      const range = sheet.getRange(startRow + i, 1, batch.length, batch[0].length);
      range.setValues(batch);
      
      // Log progress for large imports
      if (data.length > BATCH_SIZE) {
        Logger.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(data.length / BATCH_SIZE)} written (${batch.length} rows)`);
      }
    }
  }

  /**
   * Setup sheet headers and formatting
   */
  protected setupSheetHeaders(sheet: GoogleAppsScript.Spreadsheet.Sheet): void {
    const headers = this.getColumnHeaders();
    
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
   * Log import progress
   */
  protected logProgress(message: string, current?: number, total?: number): void {
    const progressInfo = current && total ? ` (${current}/${total})` : '';
    Logger.log(`[${this.constructor.name}] ${message}${progressInfo}`);
  }

  /**
   * Handle API rate limiting
   */
  protected async handleRateLimit(): Promise<void> {
    const delay = this.configManager.getConfigValue('rate_limit_delay') || 500;
    await new Promise(resolve => setTimeout(resolve, delay));
  }
}
