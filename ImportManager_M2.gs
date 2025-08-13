// Milestone 2: Enhanced ImportManager with Dry-Run Validation & Smart Imports
// Features: Header-based imports, incremental updates, validation, column reorganization

// Enhanced Base Importer with Milestone 2 capabilities
function BaseImporter() {
  this.apiClient = new ApiClient();
  this.configManager = new ConfigManager();
  this.ss = SpreadsheetApp.getActiveSpreadsheet();
  this.rateLimitHits = 0;
  this.apiCallCount = 0;
  this.validationErrors = [];
  this.validationWarnings = [];
}

BaseImporter.prototype.calculateHash = function(data) {
  var hashInput = JSON.stringify(data);
  return Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, hashInput)
    .map(function(byte) {
      return (byte + 256).toString(16).slice(1);
    }).join('');
};

BaseImporter.prototype.logProgress = function(message, count) {
  var timestamp = new Date().toISOString();
  var logMessage = '[ImportManager] ' + message;
  if (count !== undefined) {
    logMessage += ' (' + count + ')';
  }
  Logger.log(logMessage);
  console.log(logMessage);
};

BaseImporter.prototype.getTargetSheet = function() {
  var sheetName = this.getSheetName();
  var sheet = this.ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = this.ss.insertSheet(sheetName);
    this.logProgress('Created new sheet: ' + sheetName);
  }
  return sheet;
};

// NEW: Header-based sheet setup for column reorganization safety
BaseImporter.prototype.setupSheetHeaders = function(sheet, headers, options) {
  options = options || {};
  var dryRun = options.dryRun || false;
  
  if (dryRun) {
    this.logProgress('DRY-RUN: Would setup headers: ' + headers.join(', '));
    return { action: 'setup_headers', headers: headers };
  }

  var existingHeaders = this.getExistingHeaders(sheet);
  var headerChanges = this.analyzeHeaderChanges(existingHeaders, headers);
  
  if (headerChanges.requiresReorganization) {
    this.logProgress('🔄 Reorganizing columns to match new header structure...');
    this.reorganizeColumns(sheet, existingHeaders, headers);
  } else {
    // Simple header update
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setValues([headers]);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#f0f0f0');
  }
  
  return headerChanges;
};

// NEW: Get existing headers from sheet
BaseImporter.prototype.getExistingHeaders = function(sheet) {
  if (sheet.getLastRow() === 0) {
    return [];
  }
  
  var lastCol = sheet.getLastColumn();
  if (lastCol === 0) {
    return [];
  }
  
  var headerRange = sheet.getRange(1, 1, 1, lastCol);
  return headerRange.getValues()[0];
};

// NEW: Analyze what changes are needed for headers
BaseImporter.prototype.analyzeHeaderChanges = function(existing, target) {
  var changes = {
    requiresReorganization: false,
    newColumns: [],
    removedColumns: [],
    movedColumns: [],
    preservedData: true
  };
  
  // Find new columns
  for (var i = 0; i < target.length; i++) {
    if (existing.indexOf(target[i]) === -1) {
      changes.newColumns.push(target[i]);
    }
  }
  
  // Find removed columns
  for (var i = 0; i < existing.length; i++) {
    if (target.indexOf(existing[i]) === -1) {
      changes.removedColumns.push(existing[i]);
    }
  }
  
  // Check if reorganization is needed
  var needsReorg = false;
  for (var i = 0; i < Math.min(existing.length, target.length); i++) {
    if (existing[i] !== target[i]) {
      needsReorg = true;
      break;
    }
  }
  
  changes.requiresReorganization = needsReorg || changes.newColumns.length > 0;
  
  return changes;
};

// NEW: Safely reorganize columns preserving data
BaseImporter.prototype.reorganizeColumns = function(sheet, existingHeaders, targetHeaders) {
  if (sheet.getLastRow() <= 1) {
    // No data to preserve, just set headers
    var headerRange = sheet.getRange(1, 1, 1, targetHeaders.length);
    headerRange.setValues([targetHeaders]);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#f0f0f0');
    return;
  }
  
  this.logProgress('🛡️ Preserving existing data during column reorganization...');
  
  // Get all existing data
  var dataRange = sheet.getRange(2, 1, sheet.getLastRow() - 1, existingHeaders.length);
  var existingData = dataRange.getValues();
  
  // Create mapping from old positions to new positions
  var columnMapping = {};
  for (var i = 0; i < existingHeaders.length; i++) {
    var newIndex = targetHeaders.indexOf(existingHeaders[i]);
    if (newIndex !== -1) {
      columnMapping[i] = newIndex;
    }
  }
  
  // Reorganize data according to new header structure
  var reorganizedData = [];
  for (var row = 0; row < existingData.length; row++) {
    var newRow = new Array(targetHeaders.length).fill('');
    
    // Map existing data to new positions
    for (var oldCol in columnMapping) {
      var newCol = columnMapping[oldCol];
      newRow[newCol] = existingData[row][oldCol];
    }
    
    reorganizedData.push(newRow);
  }
  
  // Clear sheet and write reorganized data
  sheet.clear();
  
  // Set new headers
  var headerRange = sheet.getRange(1, 1, 1, targetHeaders.length);
  headerRange.setValues([targetHeaders]);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#f0f0f0');
  
  // Write reorganized data
  if (reorganizedData.length > 0) {
    var newDataRange = sheet.getRange(2, 1, reorganizedData.length, targetHeaders.length);
    newDataRange.setValues(reorganizedData);
  }
  
  this.logProgress('✅ Column reorganization completed successfully');
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
    if (error.message.includes('429') || error.message.includes('rate limit')) {
      this.rateLimitHits++;
      this.logProgress('⚠️ RATE LIMIT HIT #' + this.rateLimitHits + ' - Backing off...');
      
      var backoffDelay = 1000 * Math.pow(2, retryCount);
      Utilities.sleep(backoffDelay);
      
      if (retryCount < maxRetries) {
        this.logProgress('Retrying request after rate limit (attempt ' + (retryCount + 1) + '/' + maxRetries + ')');
        return this.safeApiRequest(endpoint, retryCount + 1);
      } else {
        throw new Error('⚠️ CRITICAL: Rate limit exceeded after ' + maxRetries + ' retries. Total rate limit hits: ' + this.rateLimitHits);
      }
    }
    
    if (error.message.includes('404')) {
      this.logProgress('Warning: Resource not found: ' + endpoint);
      return null;
    }
    
    throw error;
  }
};

// NEW: Validation system for dry-run capabilities
BaseImporter.prototype.validateData = function(data, options) {
  options = options || {};
  var validationResults = {
    isValid: true,
    errors: [],
    warnings: [],
    summary: {
      totalRecords: data.length,
      validRecords: 0,
      invalidRecords: 0,
      recordsWithWarnings: 0
    }
  };
  
  for (var i = 0; i < data.length; i++) {
    var record = data[i];
    var recordErrors = [];
    var recordWarnings = [];
    
    // Validate required fields
    var requiredFields = this.getRequiredFields();
    for (var j = 0; j < requiredFields.length; j++) {
      var field = requiredFields[j];
      if (!record[field] || record[field] === '') {
        recordErrors.push('Missing required field: ' + field);
      }
    }
    
    // Validate data types and formats
    var fieldValidations = this.getFieldValidations();
    for (var field in fieldValidations) {
      if (record[field]) {
        var validation = fieldValidations[field];
        if (!this.validateField(record[field], validation)) {
          recordErrors.push('Invalid ' + field + ': ' + record[field]);
        }
      }
    }
    
    // Check for potential issues
    var warnings = this.checkForWarnings(record);
    recordWarnings = recordWarnings.concat(warnings);
    
    // Update summary
    if (recordErrors.length > 0) {
      validationResults.summary.invalidRecords++;
      validationResults.isValid = false;
      validationResults.errors = validationResults.errors.concat(
        recordErrors.map(function(error) {
          return 'Record ' + (i + 1) + ': ' + error;
        })
      );
    } else {
      validationResults.summary.validRecords++;
    }
    
    if (recordWarnings.length > 0) {
      validationResults.summary.recordsWithWarnings++;
      validationResults.warnings = validationResults.warnings.concat(
        recordWarnings.map(function(warning) {
          return 'Record ' + (i + 1) + ': ' + warning;
        })
      );
    }
  }
  
  return validationResults;
};

// NEW: Get required fields for validation (to be overridden by subclasses)
BaseImporter.prototype.getRequiredFields = function() {
  return ['id'];
};

// NEW: Get field validation rules (to be overridden by subclasses)
BaseImporter.prototype.getFieldValidations = function() {
  return {
    id: { type: 'number', min: 1 },
    created_at: { type: 'date' },
    updated_at: { type: 'date' }
  };
};

// NEW: Validate individual field
BaseImporter.prototype.validateField = function(value, validation) {
  switch (validation.type) {
    case 'number':
      var num = parseFloat(value);
      if (isNaN(num)) return false;
      if (validation.min !== undefined && num < validation.min) return false;
      if (validation.max !== undefined && num > validation.max) return false;
      return true;
      
    case 'date':
      var date = new Date(value);
      return !isNaN(date.getTime());
      
    case 'string':
      if (validation.minLength && value.length < validation.minLength) return false;
      if (validation.maxLength && value.length > validation.maxLength) return false;
      if (validation.pattern && !new RegExp(validation.pattern).test(value)) return false;
      return true;
      
    default:
      return true;
  }
};

// NEW: Check for warnings (to be overridden by subclasses)
BaseImporter.prototype.checkForWarnings = function(record) {
  var warnings = [];
  
  if (!record.updated_at) {
    warnings.push('Missing updated_at timestamp');
  }
  
  return warnings;
};

// NEW: Incremental import - only import changed records
BaseImporter.prototype.getIncrementalChanges = function(newData, existingData) {
  var changes = {
    toAdd: [],
    toUpdate: [],
    toDelete: [],
    unchanged: []
  };
  
  // Create lookup maps
  var existingMap = {};
  for (var i = 0; i < existingData.length; i++) {
    existingMap[existingData[i].id] = existingData[i];
  }
  
  var newMap = {};
  for (var i = 0; i < newData.length; i++) {
    newMap[newData[i].id] = newData[i];
  }
  
  // Find additions and updates
  for (var id in newMap) {
    if (!existingMap[id]) {
      changes.toAdd.push(newMap[id]);
    } else {
      // Compare hashes to detect changes
      var newHash = this.calculateHash(newMap[id]);
      var existingHash = existingMap[id]._hash;
      
      if (newHash !== existingHash) {
        changes.toUpdate.push(newMap[id]);
      } else {
        changes.unchanged.push(newMap[id]);
      }
    }
  }
  
  // Find deletions
  for (var id in existingMap) {
    if (!newMap[id]) {
      changes.toDelete.push(existingMap[id]);
    }
  }
  
  return changes;
};

// NEW: Get existing data from sheet for incremental comparison
BaseImporter.prototype.getExistingSheetData = function(sheet) {
  if (sheet.getLastRow() <= 1) {
    return [];
  }
  
  var headers = this.getExistingHeaders(sheet);
  var dataRange = sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length);
  var rawData = dataRange.getValues();
  
  var existingData = [];
  for (var i = 0; i < rawData.length; i++) {
    var record = {};
    for (var j = 0; j < headers.length; j++) {
      record[headers[j]] = rawData[i][j];
    }
    existingData.push(record);
  }
  
  return existingData;
};

BaseImporter.prototype.batchWriteToSheet = function(sheet, data) {
  if (data.length === 0) {
    this.logProgress('No data to write to sheet');
    return;
  }

  var batchSize = 1000;
  var startRow = sheet.getLastRow() + 1;
  
  for (var i = 0; i < data.length; i += batchSize) {
    var batch = data.slice(i, i + batchSize);
    var range = sheet.getRange(startRow + i, 1, batch.length, batch[0].length);
    range.setValues(batch);
    this.logProgress('Wrote batch to sheet', i + batch.length);
  }
};

// Enhanced Product Importer with Milestone 2 features
function ProductImporter() {
  BaseImporter.call(this);
}

ProductImporter.prototype = Object.create(BaseImporter.prototype);
ProductImporter.prototype.constructor = ProductImporter;

ProductImporter.prototype.getSheetName = function() {
  return 'Products';
};

ProductImporter.prototype.getRequiredFields = function() {
  return ['id', 'title', 'handle'];
};

ProductImporter.prototype.getFieldValidations = function() {
  return {
    id: { type: 'number', min: 1 },
    title: { type: 'string', minLength: 1, maxLength: 255 },
    handle: { type: 'string', minLength: 1, maxLength: 255, pattern: '^[a-z0-9-]+$' },
    created_at: { type: 'date' },
    updated_at: { type: 'date' },
    status: { type: 'string', pattern: '^(active|archived|draft)$' }
  };
};

ProductImporter.prototype.checkForWarnings = function(record) {
  var warnings = [];
  
  if (!record.body_html || record.body_html.trim() === '') {
    warnings.push('Missing product description');
  }
  
  if (!record.vendor || record.vendor.trim() === '') {
    warnings.push('Missing vendor information');
  }
  
  if (!record.product_type || record.product_type.trim() === '') {
    warnings.push('Missing product type');
  }
  
  return warnings;
};

// NEW: Enhanced import with dry-run and incremental capabilities
ProductImporter.prototype.import = function(options) {
  options = options || {};
  var startTime = Date.now();
  var errors = [];
  var warnings = [];
  var dryRun = options.dryRun || false;
  var incremental = options.incremental || false;
  
  this.logProgress(dryRun ? '🧪 Starting product import DRY-RUN...' : 'Starting product import...');

  try {
    var sheet = this.getTargetSheet();
    var headers = [
      'id', '_hash', '_last_synced_at', 'created_at', 'updated_at',
      'title', 'handle', 'body_html', 'vendor', 'product_type',
      'tags', 'status', 'published', 'published_at', 'template_suffix',
      'seo_title', 'seo_description', '_action', '_errors'
    ];
    
    var headerChanges = this.setupSheetHeaders(sheet, headers, { dryRun: dryRun });

    var products = this.fetchAllProducts(options);
    this.logProgress('Fetched ' + products.length + ' products from Shopify');

    // NEW: Validation
    var validationResults = this.validateData(products, options);
    if (!validationResults.isValid && !options.ignoreValidationErrors) {
      throw new Error('❌ Validation failed: ' + validationResults.errors.join(', '));
    }
    
    warnings = warnings.concat(validationResults.warnings);

    var dataToProcess = products;
    var processingAction = 'full_import';
    
    // NEW: Incremental processing
    if (incremental && !dryRun) {
      var existingData = this.getExistingSheetData(sheet);
      var changes = this.getIncrementalChanges(products, existingData);
      
      this.logProgress('📊 Incremental analysis: ' + 
        changes.toAdd.length + ' new, ' + 
        changes.toUpdate.length + ' updated, ' + 
        changes.toDelete.length + ' deleted, ' +
        changes.unchanged.length + ' unchanged');
      
      dataToProcess = changes.toAdd.concat(changes.toUpdate);
      processingAction = 'incremental_import';
    }

    var sheetData = [];
    for (var i = 0; i < dataToProcess.length; i++) {
      try {
        sheetData.push(this.transformToSheetRow(dataToProcess[i]));
      } catch (transformError) {
        warnings.push('Failed to transform product ID ' + dataToProcess[i].id + ': ' + transformError.message);
        this.logProgress('Warning: ' + transformError.message);
      }
    }
    
    if (dryRun) {
      this.logProgress('🧪 DRY-RUN: Would write ' + sheetData.length + ' records to sheet');
    } else if (sheetData.length > 0) {
      this.batchWriteToSheet(sheet, sheetData);
    }

    var duration = Date.now() - startTime;
    this.logProgress((dryRun ? '🧪 DRY-RUN ' : '✅ ') + 'Product import completed in ' + duration + 'ms with ' + warnings.length + ' warnings');

    return {
      success: true,
      dryRun: dryRun,
      processingAction: processingAction,
      recordsProcessed: products.length,
      recordsWritten: dryRun ? 0 : sheetData.length,
      duration: duration,
      errors: errors,
      warnings: warnings,
      rateLimitHits: this.rateLimitHits,
      apiCallCount: this.apiCallCount,
      avgRequestsPerSecond: Math.round((this.apiCallCount / (duration / 1000)) * 100) / 100,
      validationResults: validationResults,
      headerChanges: headerChanges
    };

  } catch (error) {
    this.logProgress((dryRun ? '🧪 DRY-RUN ' : '❌ ') + 'Product import failed: ' + error.message);
    return {
      success: false,
      dryRun: dryRun,
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

// Existing methods from Milestone 1
ProductImporter.prototype.fetchAllProducts = function(options) {
  options = options || {};
  var products = [];
  var pageInfo = null;
  var limit = options.limit || 250;

  while (true) {
    var endpoint = '/admin/api/2023-04/products.json?limit=' + limit;
    
    if (pageInfo) {
      endpoint += '&page_info=' + pageInfo;
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

    this.handleRateLimit();

    // Get Link header for pagination
    var linkHeader = '';
    if (response._headers && response._headers['Link']) {
      linkHeader = response._headers['Link'];
    }
    var nextPageMatch = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
    if (nextPageMatch) {
      var nextUrl = nextPageMatch[1];
      var pageInfoMatch = nextUrl.match(/page_info=([^&]+)/);
      if (pageInfoMatch) {
        pageInfo = pageInfoMatch[1];
      } else {
        break;
      }
    } else {
      break;
    }

    if (options.maxProducts && products.length >= options.maxProducts) {
      products = products.slice(0, options.maxProducts);
      break;
    }
  }

  return products;
};

ProductImporter.prototype.transformToSheetRow = function(product) {
  var now = new Date().toISOString();
  var hash = this.calculateHash(product);
  
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
    product.status || '',
    product.published_scope === 'global' ? 'Yes' : 'No',
    product.published_at || '',
    product.template_suffix || '',
    product.seo_title || '',
    product.seo_description || '',
    '', // _action
    ''  // _errors
  ];
};

// Enhanced Variant Importer with Milestone 2 features
function VariantImporter() {
  BaseImporter.call(this);
  this.productCache = {};
}

VariantImporter.prototype = Object.create(BaseImporter.prototype);
VariantImporter.prototype.constructor = VariantImporter;

VariantImporter.prototype.getSheetName = function() {
  return 'Variants';
};

VariantImporter.prototype.getRequiredFields = function() {
  return ['id', 'product_id'];
};

VariantImporter.prototype.getFieldValidations = function() {
  return {
    id: { type: 'number', min: 1 },
    product_id: { type: 'number', min: 1 },
    price: { type: 'number', min: 0 },
    compare_at_price: { type: 'number', min: 0 },
    inventory_quantity: { type: 'number' },
    weight: { type: 'number', min: 0 },
    created_at: { type: 'date' },
    updated_at: { type: 'date' }
  };
};

VariantImporter.prototype.checkForWarnings = function(record) {
  var warnings = [];
  
  if (!record.sku || record.sku.trim() === '') {
    warnings.push('Missing SKU');
  }
  
  if (!record.barcode || record.barcode.trim() === '') {
    warnings.push('Missing barcode');
  }
  
  if (record.inventory_quantity < 0) {
    warnings.push('Negative inventory quantity');
  }
  
  return warnings;
};

// Enhanced import with all Milestone 2 features
VariantImporter.prototype.import = function(options) {
  options = options || {};
  var startTime = Date.now();
  var errors = [];
  var warnings = [];
  var dryRun = options.dryRun || false;
  var incremental = options.incremental || false;
  
  this.logProgress(dryRun ? '🧪 Starting variant import DRY-RUN...' : 'Starting variant import...');

  try {
    var sheet = this.getTargetSheet();
    var headers = [
      'id', 'product_id', 'product_title', 'product_handle', '_hash', '_last_synced_at',
      'created_at', 'updated_at', 'title', 'option1', 'option2', 'option3',
      'sku', 'barcode', 'price', 'compare_at_price', 'position',
      'inventory_policy', 'fulfillment_service', 'inventory_management',
      'inventory_quantity', 'weight', 'weight_unit', 'requires_shipping',
      'taxable', 'tax_code', '_action', '_errors'
    ];
    
    var headerChanges = this.setupSheetHeaders(sheet, headers, { dryRun: dryRun });

    if (!dryRun) {
      this.buildProductCache();
    }

    var variants = this.fetchAllVariants(options);
    this.logProgress('Fetched ' + variants.length + ' variants from Shopify');

    // Validation
    var validationResults = this.validateData(variants, options);
    if (!validationResults.isValid && !options.ignoreValidationErrors) {
      throw new Error('❌ Validation failed: ' + validationResults.errors.join(', '));
    }
    
    warnings = warnings.concat(validationResults.warnings);

    var dataToProcess = variants;
    var processingAction = 'full_import';
    
    // Incremental processing
    if (incremental && !dryRun) {
      var existingData = this.getExistingSheetData(sheet);
      var changes = this.getIncrementalChanges(variants, existingData);
      
      this.logProgress('📊 Incremental analysis: ' + 
        changes.toAdd.length + ' new, ' + 
        changes.toUpdate.length + ' updated, ' + 
        changes.toDelete.length + ' deleted, ' +
        changes.unchanged.length + ' unchanged');
      
      dataToProcess = changes.toAdd.concat(changes.toUpdate);
      processingAction = 'incremental_import';
    }

    var sheetData = [];
    for (var i = 0; i < dataToProcess.length; i++) {
      try {
        sheetData.push(this.transformToSheetRow(dataToProcess[i]));
      } catch (transformError) {
        warnings.push('Failed to transform variant ID ' + dataToProcess[i].id + ': ' + transformError.message);
        this.logProgress('Warning: ' + transformError.message);
      }
    }
    
    if (dryRun) {
      this.logProgress('🧪 DRY-RUN: Would write ' + sheetData.length + ' records to sheet');
    } else if (sheetData.length > 0) {
      this.batchWriteToSheet(sheet, sheetData);
    }

    var duration = Date.now() - startTime;
    this.logProgress((dryRun ? '🧪 DRY-RUN ' : '✅ ') + 'Variant import completed in ' + duration + 'ms with ' + warnings.length + ' warnings');

    return {
      success: true,
      dryRun: dryRun,
      processingAction: processingAction,
      recordsProcessed: variants.length,
      recordsWritten: dryRun ? 0 : sheetData.length,
      duration: duration,
      errors: errors,
      warnings: warnings,
      rateLimitHits: this.rateLimitHits,
      apiCallCount: this.apiCallCount,
      avgRequestsPerSecond: Math.round((this.apiCallCount / (duration / 1000)) * 100) / 100,
      validationResults: validationResults,
      headerChanges: headerChanges,
      productCacheSize: Object.keys(this.productCache).length
    };

  } catch (error) {
    this.logProgress((dryRun ? '🧪 DRY-RUN ' : '❌ ') + 'Variant import failed: ' + error.message);
    return {
      success: false,
      dryRun: dryRun,
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

// Existing methods from Milestone 1
VariantImporter.prototype.buildProductCache = function() {
  this.logProgress('Building product cache for variant enrichment...');
  var products = [];
  var pageInfo = null;
  var limit = 250;

  while (true) {
    var endpoint = '/admin/api/2023-04/products.json?limit=' + limit + '&fields=id,title,handle';
    
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
      this.productCache[product.id] = {
        title: product.title,
        handle: product.handle
      };
    }

    this.handleRateLimit();

    // Get Link header for pagination
    var linkHeader = '';
    if (response._headers && response._headers['Link']) {
      linkHeader = response._headers['Link'];
    }
    var nextPageMatch = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
    if (nextPageMatch) {
      var nextUrl = nextPageMatch[1];
      var pageInfoMatch = nextUrl.match(/page_info=([^&]+)/);
      if (pageInfoMatch) {
        pageInfo = pageInfoMatch[1];
      } else {
        break;
      }
    } else {
      break;
    }
  }

  this.logProgress('Built product cache with ' + Object.keys(this.productCache).length + ' products');
};

VariantImporter.prototype.fetchAllVariants = function(options) {
  options = options || {};
  var variants = [];
  var pageInfo = null;
  var limit = options.limit || 250;

  while (true) {
    var endpoint = '/admin/api/2023-04/variants.json?limit=' + limit;
    
    if (pageInfo) {
      endpoint += '&page_info=' + pageInfo;
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
      var productInfo = this.productCache[variant.product_id];
      
      if (productInfo) {
        variant.product_title = productInfo.title;
        variant.product_handle = productInfo.handle;
      } else {
        variant.product_title = 'Product ID: ' + variant.product_id;
        variant.product_handle = '';
      }
      
      variants.push(variant);
    }

    this.handleRateLimit();

    // Get Link header for pagination
    var linkHeader = '';
    if (response._headers && response._headers['Link']) {
      linkHeader = response._headers['Link'];
    }
    var nextPageMatch = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
    if (nextPageMatch) {
      var nextUrl = nextPageMatch[1];
      var pageInfoMatch = nextUrl.match(/page_info=([^&]+)/);
      if (pageInfoMatch) {
        pageInfo = pageInfoMatch[1];
      } else {
        break;
      }
    } else {
      break;
    }

    if (options.maxVariants && variants.length >= options.maxVariants) {
      variants = variants.slice(0, options.maxVariants);
      break;
    }
  }

  return variants;
};

VariantImporter.prototype.transformToSheetRow = function(variant) {
  var now = new Date().toISOString();
  var hash = this.calculateHash(variant);
  
  return [
    variant.id,
    variant.product_id,
    variant.product_title || '',
    variant.product_handle || '',
    hash,
    now,
    variant.created_at || '',
    variant.updated_at || '',
    variant.title || '',
    variant.option1 || '',
    variant.option2 || '',
    variant.option3 || '',
    variant.sku || '',
    variant.barcode || '',
    variant.price || '',
    variant.compare_at_price || '',
    variant.position || '',
    variant.inventory_policy || '',
    variant.fulfillment_service || '',
    variant.inventory_management || '',
    variant.inventory_quantity || '',
    variant.weight || '',
    variant.weight_unit || '',
    variant.requires_shipping ? 'Yes' : 'No',
    variant.taxable ? 'Yes' : 'No',
    variant.tax_code || '',
    '', // _action
    ''  // _errors
  ];
};

// Import Orchestrator with Milestone 2 enhancements
function ImportOrchestrator() {
  this.productImporter = new ProductImporter();
  this.variantImporter = new VariantImporter();
}

ImportOrchestrator.prototype.importAll = function(options) {
  options = options || {};
  var startTime = Date.now();
  var dryRun = options.dryRun || false;
  var incremental = options.incremental || false;
  
  try {
    var productResults = this.productImporter.import(options);
    if (!productResults.success) {
      return productResults;
    }
    
    var variantResults = this.variantImporter.import(options);
    if (!variantResults.success) {
      return variantResults;
    }
    
    var totalDuration = Date.now() - startTime;
    
    // Combine validation results if available
    var combinedValidationResults = null;
    if (productResults.validationResults || variantResults.validationResults) {
      combinedValidationResults = {
        isValid: (productResults.validationResults ? productResults.validationResults.isValid : true) && 
                (variantResults.validationResults ? variantResults.validationResults.isValid : true),
        errors: (productResults.validationResults ? productResults.validationResults.errors : [])
                .concat(variantResults.validationResults ? variantResults.validationResults.errors : []),
        warnings: (productResults.validationResults ? productResults.validationResults.warnings : [])
                 .concat(variantResults.validationResults ? variantResults.validationResults.warnings : []),
        summary: {
          totalRecords: (productResults.validationResults ? productResults.validationResults.summary.totalRecords : 0) +
                       (variantResults.validationResults ? variantResults.validationResults.summary.totalRecords : 0),
          validRecords: (productResults.validationResults ? productResults.validationResults.summary.validRecords : 0) +
                       (variantResults.validationResults ? variantResults.validationResults.summary.validRecords : 0),
          invalidRecords: (productResults.validationResults ? productResults.validationResults.summary.invalidRecords : 0) +
                         (variantResults.validationResults ? variantResults.validationResults.summary.invalidRecords : 0),
          recordsWithWarnings: (productResults.validationResults ? productResults.validationResults.summary.recordsWithWarnings : 0) +
                              (variantResults.validationResults ? variantResults.validationResults.summary.recordsWithWarnings : 0)
        }
      };
    }
    
    return {
      success: true,
      dryRun: dryRun,
      processingAction: incremental ? 'incremental_import' : 'full_import',
      recordsProcessed: productResults.recordsProcessed + variantResults.recordsProcessed,
      recordsWritten: productResults.recordsWritten + variantResults.recordsWritten,
      duration: totalDuration,
      errors: productResults.errors.concat(variantResults.errors),
      warnings: productResults.warnings.concat(variantResults.warnings),
      rateLimitHits: productResults.rateLimitHits + variantResults.rateLimitHits,
      apiCallCount: productResults.apiCallCount + variantResults.apiCallCount,
      avgRequestsPerSecond: Math.round(((productResults.apiCallCount + variantResults.apiCallCount) / (totalDuration / 1000)) * 100) / 100,
      validationResults: combinedValidationResults,
      productResults: productResults,
      variantResults: variantResults
    };
    
  } catch (error) {
    return {
      success: false,
      dryRun: dryRun,
      recordsProcessed: 0,
      recordsWritten: 0,
      duration: Date.now() - startTime,
      errors: [error.message],
      warnings: [],
      rateLimitHits: 0,
      apiCallCount: 0,
      avgRequestsPerSecond: 0
    };
  }
};

ImportOrchestrator.prototype.importProductsOnly = function(options) {
  return this.productImporter.import(options);
};

ImportOrchestrator.prototype.importVariantsOnly = function(options) {
  return this.variantImporter.import(options);
};
