/**
 * Global type declarations for Google Apps Script environment
 */

/// <reference types="google-apps-script" />

// Make Google Apps Script globals available
declare global {
  // Google Apps Script built-in services
  const SpreadsheetApp: GoogleAppsScript.Spreadsheet.SpreadsheetApp;
  const PropertiesService: GoogleAppsScript.Properties.PropertiesService;
  const UrlFetchApp: GoogleAppsScript.URL_Fetch.UrlFetchApp;
  const Utilities: GoogleAppsScript.Utilities.Utilities;
  const Session: GoogleAppsScript.Base.Session;
  const Logger: GoogleAppsScript.Base.Logger;
  const DriveApp: GoogleAppsScript.Drive.DriveApp;
  const HtmlService: GoogleAppsScript.HTML.HtmlService;
  
  // Configuration constants
  const CONFIG: {
    readonly VERSION: string;
    readonly SHOPIFY_API_VERSION: string;
    readonly SHOPIFY_DOMAIN: string;
    readonly MAX_BATCH_SIZE: number;
    readonly IMPORT_CHUNK_SIZE: number;
    readonly RATE_LIMIT_DELAY: number;
    readonly MAX_RETRIES: number;
  };
}

export {};
