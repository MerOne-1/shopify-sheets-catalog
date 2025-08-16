// Milestone 2: Product Importer with Simplified Pagination
// Focused component (~150 lines)

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

    // MILESTONE 2: Handle changed items only for incremental sync
    var products;
    if (options.changedItemsOnly && options.changedItems && options.changedItems.length > 0) {
      this.logProgress('🎯 Processing ' + options.changedItems.length + ' changed products only');
      products = options.changedItems;
    } else if (options.changedItemsOnly && options.changedItems && options.changedItems.length === 0) {
      this.logProgress('🎯 No changed products to process');
      products = [];
    } else {
      products = this.fetchAllProducts(options);
      this.logProgress('Fetched ' + products.length + ' products from Shopify');
    }

    // Validation
    var validationResults = this.validateData(products, options);
    if (!validationResults.isValid && !options.ignoreValidationErrors) {
      throw new Error('❌ Validation failed: ' + validationResults.errors.join(', '));
    }
    
    warnings = warnings.concat(validationResults.warnings);

    var dataToProcess = products;
    var processingAction = 'full_import';
    
    // Incremental processing
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

// MILESTONE 2: Optimized with intelligent caching and bulk operations
ProductImporter.prototype.fetchAllProducts = function(options) {
  options = options || {};
  var useBulkOperations = options.useBulkOperations !== false; // Default to true
  var cacheKey = 'products_fetch_' + JSON.stringify(options);
  
  // Check cache first for recent fetches
  var cachedProducts = this.cache.getSimple(cacheKey);
  if (cachedProducts && !options.forceRefresh) {
    this.logProgress('🎯 Using cached products (' + cachedProducts.length + ' items)');
    return cachedProducts;
  }
  
  if (useBulkOperations) {
    this.logProgress('🚀 Using optimized bulk operations for product import...');
    
    try {
      var bulkOptions = {
        limit: options.limit || 250,
        fields: options.fields || null,
        sinceId: options.sinceId || null,
        updatedAtMin: options.updatedAtMin || null
      };
      
      var bulkResult = this.bulkApiClient.bulkFetchProducts(null, bulkOptions);
      if (bulkResult.success && bulkResult.data) {
        this.logProgress(`✅ Bulk fetch completed: ${bulkResult.data.length} products`);
        
        // Cache the results for 5 minutes
        this.cache.set(cacheKey, bulkResult.data, 300);
        
        return bulkResult.data;
      } else {
        throw new Error(bulkResult.error || 'Bulk fetch failed');
      }
      
    } catch (bulkError) {
      this.logProgress(`⚠️ Bulk operations failed: ${bulkError.message}. Falling back to individual operations.`);
      // Fall through to legacy mode
    }
  }
  
  // LEGACY: Individual API calls with intelligent caching (for compatibility/fallback)
  this.logProgress('Using legacy individual API calls with caching...');
  var products = [];
  var sinceId = 0; // Use ID-based pagination instead of Link headers
  var limit = options.limit || 250;
  var maxProducts = options.maxProducts || 10000; // Safety limit

  while (products.length < maxProducts) {
    var endpoint = 'products.json?limit=' + limit;
    
    if (sinceId > 0) {
      endpoint += '&since_id=' + sinceId;
    }

    this.logProgress('Fetching products page...', products.length);

    // Cache individual API requests
    var pageKey = 'products_page_' + endpoint;
    var cachedPage = this.cache.getSimple(pageKey);
    
    var response;
    if (cachedPage && !options.forceRefresh) {
      this.logProgress('🎯 Using cached page data');
      response = cachedPage;
    } else {
      response = this.safeApiRequest(endpoint);
      if (response && response.products) {
        // Cache page for 2 minutes
        this.cache.set(pageKey, response, 120);
      }
    }
    
    if (!response || !response.products) {
      this.logProgress('Warning: Empty response for products endpoint');
      break;
    }
    
    var pageProducts = response.products;
    if (pageProducts.length === 0) {
      break; // No more products
    }

    for (var i = 0; i < pageProducts.length; i++) {
      products.push(pageProducts[i]);
      sinceId = Math.max(sinceId, pageProducts[i].id); // Track highest ID
    }

    this.handleRateLimit();

    // If we got fewer than the limit, we're done
    if (pageProducts.length < limit) {
      break;
    }

    if (options.maxProducts && products.length >= options.maxProducts) {
      products = products.slice(0, options.maxProducts);
      break;
    }
  }

  // Cache the final result
  this.cache.set(cacheKey, products, 300);
  
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
    (product.tags || []).join(', '),
    product.status || '',
    product.published_at ? 'true' : 'false',
    product.published_at || '',
    product.template_suffix || '',
    (product.seo && product.seo.title) || '',
    (product.seo && product.seo.description) || '',
    'imported',
    ''
  ];
};
