/**
 * Import Manager - Consolidated import functionality for Milestone 1
 * Combines all import components into a single Google Apps Script compatible file
 */

// Base Importer functionality
function BaseImporter() {
  this.apiClient = new ApiClient();
  this.configManager = new ConfigManager();
  this.ss = SpreadsheetApp.getActiveSpreadsheet();
  this.rateLimitHits = 0;
  this.apiCallCount = 0;
}

BaseImporter.prototype.calculateHash = function(data) {
  var str = JSON.stringify(data);
  var hash = 0;
  for (var i = 0; i < str.length; i++) {
    var char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
};

BaseImporter.prototype.batchWriteToSheet = function(sheet, data, startRow) {
  startRow = startRow || 2;
  if (data.length === 0) return;

  var BATCH_SIZE = 1000;
  
  for (var i = 0; i < data.length; i += BATCH_SIZE) {
    var batch = data.slice(i, i + BATCH_SIZE);
    var range = sheet.getRange(startRow + i, 1, batch.length, batch[0].length);
    range.setValues(batch);
    
    if (data.length > BATCH_SIZE) {
      Logger.log('Batch ' + (Math.floor(i / BATCH_SIZE) + 1) + '/' + Math.ceil(data.length / BATCH_SIZE) + ' written (' + batch.length + ' rows)');
    }
  }
};

BaseImporter.prototype.setupSheetHeaders = function(sheet, headers) {
  sheet.clear();
  
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#4285f4');
  headerRange.setFontColor('#ffffff');
  
  sheet.setFrozenRows(1);
  
  for (var i = 1; i <= headers.length; i++) {
    sheet.autoResizeColumn(i);
  }
};

BaseImporter.prototype.logProgress = function(message, current, total) {
  var progressInfo = current && total ? ' (' + current + '/' + total + ')' : '';
  Logger.log('[ImportManager] ' + message + progressInfo);
};

BaseImporter.prototype.handleRateLimit = function() {
  var delay = this.configManager.getConfigValue('rate_limit_delay') || 200;
  Utilities.sleep(delay);
};

BaseImporter.prototype.safeApiRequest = function(endpoint, retryCount) {
  retryCount = retryCount || 0;
  var maxRetries = 3;
  
  this.apiCallCount++;
  
  try {
    var response = this.apiClient.makeRequest(endpoint);
    return response;
  } catch (error) {
    // Check for rate limiting errors
    if (error.message.includes('429') || error.message.includes('rate limit')) {
      this.rateLimitHits++;
      this.logProgress('⚠️ RATE LIMIT HIT #' + this.rateLimitHits + ' - Backing off...');
      
      // Increase delay temporarily
      var backoffDelay = 1000 * Math.pow(2, retryCount); // Exponential backoff
      Utilities.sleep(backoffDelay);
      
      if (retryCount < maxRetries) {
        this.logProgress('Retrying request after rate limit (attempt ' + (retryCount + 1) + '/' + maxRetries + ')');
        return this.safeApiRequest(endpoint, retryCount + 1);
      } else {
        throw new Error('⚠️ CRITICAL: Rate limit exceeded after ' + maxRetries + ' retries. Total rate limit hits: ' + this.rateLimitHits);
      }
    }
    
    // Check for other API errors
    if (error.message.includes('404')) {
      this.logProgress('Warning: Resource not found: ' + endpoint);
      return null; // Return null for missing resources
    }
    
    // Re-throw other errors
    throw error;
  }
};

// Product Importer
function ProductImporter() {
  BaseImporter.call(this);
  this.SHEET_NAME = 'Products';
  this.MAX_PRODUCTS_PER_REQUEST = 250;
}

ProductImporter.prototype = Object.create(BaseImporter.prototype);
ProductImporter.prototype.constructor = ProductImporter;

ProductImporter.prototype.import = function(options) {
  options = options || {};
  var startTime = Date.now();
  var errors = [];
  var warnings = [];
  
  this.logProgress('Starting product import...');

  try {
    var sheet = this.getTargetSheet();
    var headers = [
      'id', '_hash', '_last_synced_at', 'created_at', 'updated_at',
      'title', 'handle', 'body_html', 'vendor', 'product_type',
      'tags', 'status', 'published', 'published_at', 'template_suffix',
      'seo_title', 'seo_description', '_action', '_errors'
    ];
    this.setupSheetHeaders(sheet, headers);

    var products = this.fetchAllProducts(options);
    this.logProgress('Fetched ' + products.length + ' products from Shopify');

    var sheetData = [];
    for (var i = 0; i < products.length; i++) {
      try {
        sheetData.push(this.transformToSheetRow(products[i]));
      } catch (transformError) {
        warnings.push('Failed to transform product ID ' + products[i].id + ': ' + transformError.message);
        this.logProgress('Warning: ' + transformError.message);
      }
    }
    
    if (sheetData.length > 0) {
      this.batchWriteToSheet(sheet, sheetData);
    }

    var duration = Date.now() - startTime;
    this.logProgress('Product import completed in ' + duration + 'ms with ' + warnings.length + ' warnings');

    return {
      success: true,
      recordsProcessed: products.length,
      recordsWritten: sheetData.length,
      duration: duration,
      errors: errors,
      warnings: warnings,
      rateLimitHits: this.rateLimitHits,
      apiCallCount: this.apiCallCount,
      avgRequestsPerSecond: Math.round((this.apiCallCount / (duration / 1000)) * 100) / 100
    };

  } catch (error) {
    this.logProgress('Product import failed: ' + error.message);
    return {
      success: false,
      recordsProcessed: 0,
      recordsWritten: 0,
      duration: Date.now() - startTime,
      errors: [error.message],
      warnings: warnings,
      rateLimitHits: this.rateLimitHits,
      apiCallCount: this.apiCallCount,
      avgRequestsPerSecond: this.apiCallCount > 0 ? Math.round((this.apiCallCount / ((Date.now() - startTime) / 1000)) * 100) / 100 : 0
    };
  }
};

ProductImporter.prototype.getTargetSheet = function() {
  var sheet = this.ss.getSheetByName(this.SHEET_NAME);
  if (!sheet) {
    sheet = this.ss.insertSheet(this.SHEET_NAME);
  }
  return sheet;
};

ProductImporter.prototype.transformToSheetRow = function(product) {
  var now = new Date().toISOString();
  
  var editableData = [
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

  var hash = this.calculateHash(editableData);

  return [
    product.id,
    hash,
    now,
    product.created_at || '',
    product.updated_at || '',
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
    (product.seo_description || ''),
    '',
    ''
  ];
};

ProductImporter.prototype.fetchAllProducts = function(options) {
  var products = [];
  var pageInfo = null;
  var hasNextPage = true;

  while (hasNextPage) {
    try {
      var endpoint = 'products.json?limit=' + this.MAX_PRODUCTS_PER_REQUEST;
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

      var response = this.safeApiRequest(endpoint);
      if (!response) {
        this.logProgress('Warning: Empty response for products endpoint');
        break;
      }
      var pageProducts = response.products || [];

      for (var i = 0; i < pageProducts.length; i++) {
        products.push(pageProducts[i]);
      }

      var linkHeader = (response.headers && response.headers.Link) || '';
      hasNextPage = linkHeader.indexOf('rel="next"') !== -1;
      
      if (hasNextPage) {
        var nextMatch = linkHeader.match(/page_info=([^&>]+).*rel="next"/);
        pageInfo = nextMatch ? nextMatch[1] : null;
      }

      this.handleRateLimit();

    } catch (error) {
      this.logProgress('Error fetching products page: ' + error.message);
      throw error;
    }
  }

  return products;
};

// Variant Importer
function VariantImporter() {
  BaseImporter.call(this);
  this.SHEET_NAME = 'Variants';
  this.MAX_VARIANTS_PER_REQUEST = 250;
}

VariantImporter.prototype = Object.create(BaseImporter.prototype);
VariantImporter.prototype.constructor = VariantImporter;

VariantImporter.prototype.import = function(options) {
  options = options || {};
  var startTime = Date.now();
  this.logProgress('Starting variant import...');

  try {
    var sheet = this.getTargetSheet();
    var headers = [
      'id', 'product_id', 'product_title', 'product_handle', '_hash', '_last_synced_at', 'created_at', 'updated_at',
      'inventory_item_id', 'title', 'option1', 'option2', 'option3', 'sku',
      'barcode', 'price', 'compare_at_price', 'cost', 'weight', 'weight_unit',
      'inventory_policy', 'inventory_management', 'fulfillment_service',
      'requires_shipping', 'taxable', 'tax_code', '_action', '_errors'
    ];
    this.setupSheetHeaders(sheet, headers);

    // First, build a product cache for efficient lookups
    this.logProgress('Building product cache for variant enrichment...');
    var productCache = this.buildProductCache();
    
    var variants = this.fetchAllVariants(options, productCache);
    this.logProgress('Fetched ' + variants.length + ' variants from Shopify');

    var sheetData = [];
    for (var i = 0; i < variants.length; i++) {
      sheetData.push(this.transformToSheetRow(variants[i]));
    }
    this.batchWriteToSheet(sheet, sheetData);

    var duration = Date.now() - startTime;
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
};

VariantImporter.prototype.getTargetSheet = function() {
  var sheet = this.ss.getSheetByName(this.SHEET_NAME);
  if (!sheet) {
    sheet = this.ss.insertSheet(this.SHEET_NAME);
  }
  return sheet;
};

VariantImporter.prototype.buildProductCache = function() {
  var productCache = {};
  var pageInfo = null;
  var hasNextPage = true;
  var totalProducts = 0;

  this.logProgress('Fetching all products for variant enrichment...');

  while (hasNextPage) {
    try {
      var endpoint = 'products.json?limit=250&fields=id,title,handle';
      if (pageInfo) {
        endpoint += '&page_info=' + pageInfo;
      }

      var response = this.safeApiRequest(endpoint);
      if (!response) {
        this.logProgress('Warning: Empty response for product cache endpoint');
        break;
      }
      var products = response.products || [];

      for (var i = 0; i < products.length; i++) {
        var product = products[i];
        productCache[product.id] = {
          title: product.title,
          handle: product.handle
        };
        totalProducts++;
      }

      var linkHeader = (response.headers && response.headers.Link) || '';
      hasNextPage = linkHeader.indexOf('rel="next"') !== -1;
      
      if (hasNextPage) {
        var nextMatch = linkHeader.match(/page_info=([^&>]+).*rel="next"/);
        pageInfo = nextMatch ? nextMatch[1] : null;
      }

      this.handleRateLimit();

    } catch (error) {
      this.logProgress('Error building product cache: ' + error.message);
      throw error;
    }
  }

  this.logProgress('Built product cache with ' + totalProducts + ' products');
  return productCache;
};

VariantImporter.prototype.transformToSheetRow = function(variant) {
  var now = new Date().toISOString();
  
  var editableData = [
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

  var hash = this.calculateHash(editableData);

  return [
    variant.id,
    variant.product_id,
    variant.product_title || '',
    variant.product_handle || '',
    hash,
    now,
    variant.created_at || '',
    variant.updated_at || '',
    variant.inventory_item_id || '',
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
    variant.tax_code || '',
    '',
    ''
  ];
};

VariantImporter.prototype.fetchAllVariants = function(options, productCache) {
  var variants = [];
  var pageInfo = null;
  var hasNextPage = true;

  while (hasNextPage) {
    try {
      var endpoint = 'variants.json?limit=' + this.MAX_VARIANTS_PER_REQUEST;
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

      var response = this.safeApiRequest(endpoint);
      if (!response) {
        this.logProgress('Warning: Empty response for variants endpoint');
        break;
      }
      var pageVariants = response.variants || [];

      // Enrich variants with product information from cache
      for (var i = 0; i < pageVariants.length; i++) {
        var variant = pageVariants[i];
        var productId = variant.product_id;
        
        // Add product info from cache
        if (productCache[productId]) {
          variant.product_title = productCache[productId].title;
          variant.product_handle = productCache[productId].handle;
        } else {
          // Fallback if product not found in cache
          variant.product_title = 'Product ID: ' + productId;
          variant.product_handle = 'unknown-' + productId;
          this.logProgress('Warning: Product ID ' + productId + ' not found in cache');
        }
        
        variants.push(variant);
      }

      var linkHeader = (response.headers && response.headers.Link) || '';
      hasNextPage = linkHeader.indexOf('rel="next"') !== -1;
      
      if (hasNextPage) {
        var nextMatch = linkHeader.match(/page_info=([^&>]+).*rel="next"/);
        pageInfo = nextMatch ? nextMatch[1] : null;
      }

      this.handleRateLimit();

    } catch (error) {
      this.logProgress('Error fetching variants page: ' + error.message);
      throw error;
    }
  }

  return variants;
};

// Import Orchestrator
function ImportOrchestrator() {
  this.configManager = new ConfigManager();
  this.productImporter = new ProductImporter();
  this.variantImporter = new VariantImporter();
}

ImportOrchestrator.prototype.importAll = function(options) {
  options = options || {};
  var startTime = Date.now();
  Logger.log('=== STARTING BULK IMPORT ===');

  try {
    if (this.configManager.getConfigValue('read_only_mode') === 'TRUE') {
      throw new Error('System is in read-only mode. Import operations are disabled.');
    }

    var results = {
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
    results.results.products = this.productImporter.import(options);
    
    if (!results.results.products.success) {
      results.success = false;
      results.errors.push('Product import failed');
    }

    Logger.log('Step 2/2: Importing Variants...');
    this.updateProgressDialog('Importing variants...', 100);
    results.results.variants = this.variantImporter.import(options);
    
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
    
    var errorResult = {
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
};

ImportOrchestrator.prototype.importProductsOnly = function(options) {
  options = options || {};
  Logger.log('Importing products only...');
  return this.productImporter.import(options);
};

ImportOrchestrator.prototype.importVariantsOnly = function(options) {
  options = options || {};
  Logger.log('Importing variants only...');
  return this.variantImporter.import(options);
};

ImportOrchestrator.prototype.showProgressDialog = function(message) {
  try {
    Logger.log('PROGRESS: ' + message);
  } catch (error) {
    Logger.log('Progress: ' + message);
  }
};

ImportOrchestrator.prototype.updateProgressDialog = function(message, percentage) {
  try {
    Logger.log('PROGRESS (' + percentage + '%): ' + message);
  } catch (error) {
    Logger.log('Progress ' + percentage + '%: ' + message);
  }
};

ImportOrchestrator.prototype.showCompletionDialog = function(results) {
  var totalRecords = 
    results.results.products.recordsProcessed +
    results.results.variants.recordsProcessed;

  var message = results.success 
    ? 'Import completed successfully!\n\nTotal records imported: ' + totalRecords + '\nDuration: ' + Math.round(results.totalDuration / 1000) + 's'
    : 'Import completed with errors.\n\nRecords imported: ' + totalRecords + '\nErrors: ' + results.errors.length;

  try {
    SpreadsheetApp.getUi().alert('Import Complete', message, SpreadsheetApp.getUi().ButtonSet.OK);
  } catch (error) {
    Logger.log('COMPLETION: ' + message);
  }
};

ImportOrchestrator.prototype.showErrorDialog = function(errorMessage) {
  try {
    SpreadsheetApp.getUi().alert('Import Error', 'Import failed: ' + errorMessage, SpreadsheetApp.getUi().ButtonSet.OK);
  } catch (error) {
    Logger.log('ERROR: Import failed: ' + errorMessage);
  }
};

ImportOrchestrator.prototype.getImportStats = function() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  var stats = {
    products: 0,
    variants: 0,
    lastImport: this.configManager.getConfigValue('last_import_timestamp') || 'Never'
  };

  var sheets = ['Products', 'Variants'];
  var keys = ['products', 'variants'];

  for (var i = 0; i < sheets.length; i++) {
    var sheet = ss.getSheetByName(sheets[i]);
    if (sheet) {
      var lastRow = sheet.getLastRow();
      stats[keys[i]] = Math.max(0, lastRow - 1);
    }
  }

  return stats;
};

// Global functions for menu integration
function importAllData() {
  var orchestrator = new ImportOrchestrator();
  return orchestrator.importAll();
}

function importProductsOnly() {
  var orchestrator = new ImportOrchestrator();
  return orchestrator.importProductsOnly();
}

function importVariantsOnly() {
  var orchestrator = new ImportOrchestrator();
  return orchestrator.importVariantsOnly();
}

function getImportStats() {
  var orchestrator = new ImportOrchestrator();
  return orchestrator.getImportStats();
}
