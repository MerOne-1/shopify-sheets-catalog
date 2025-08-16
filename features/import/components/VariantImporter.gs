// Milestone 2: Variant Importer with Simplified Pagination
// Focused component (~150 lines)

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
      'id', '_hash', '_last_synced_at', 'product_id', 'product_title', 'product_handle',
      'title', 'price', 'compare_at_price', 'sku', 'position', 'inventory_policy',
      'fulfillment_service', 'inventory_management', 'option1', 'option2', 'option3',
      'created_at', 'updated_at', 'taxable', 'barcode', 'grams', 'image_id',
      'inventory_quantity', 'weight', 'weight_unit', 'inventory_item_id',
      'old_inventory_quantity', 'requires_shipping', '_action', '_errors'
    ];
    
    var headerChanges = this.setupSheetHeaders(sheet, headers, { dryRun: dryRun });

    // Build product cache for variant enrichment
    this.buildProductCache();

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
      headerChanges: headerChanges
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

VariantImporter.prototype.buildProductCache = function() {
  this.logProgress('Building product cache for variant enrichment...');
  var products = [];
  var sinceId = 0;
  var limit = 250;

  while (true) {
    var endpoint = 'products.json?limit=' + limit + '&fields=id,title,handle';
    
    if (sinceId > 0) {
      endpoint += '&since_id=' + sinceId;
    }

    var response = this.safeApiRequest(endpoint);
    if (!response || !response.products) {
      this.logProgress('Warning: Empty response for product cache endpoint');
      break;
    }
    
    var pageProducts = response.products;
    if (pageProducts.length === 0) {
      break;
    }

    for (var i = 0; i < pageProducts.length; i++) {
      var product = pageProducts[i];
      this.productCache[product.id] = {
        title: product.title,
        handle: product.handle
      };
      sinceId = Math.max(sinceId, product.id);
    }

    this.handleRateLimit();

    if (pageProducts.length < limit) {
      break;
    }
  }
  
  this.logProgress('Built product cache with ' + Object.keys(this.productCache).length + ' products');
};

VariantImporter.prototype.fetchAllVariants = function(options) {
  options = options || {};
  var variants = [];
  var sinceId = 0;
  var limit = options.limit || 250;
  var maxVariants = options.maxVariants || 50000;

  while (variants.length < maxVariants) {
    var endpoint = 'variants.json?limit=' + limit;
    
    if (sinceId > 0) {
      endpoint += '&since_id=' + sinceId;
    }

    this.logProgress('Fetching variants page...', variants.length);

    var response = this.safeApiRequest(endpoint);
    if (!response || !response.variants) {
      this.logProgress('Warning: Empty response for variants endpoint');
      break;
    }
    
    var pageVariants = response.variants;
    if (pageVariants.length === 0) {
      break;
    }

    for (var i = 0; i < pageVariants.length; i++) {
      var variant = pageVariants[i];
      
      // Enrich with product information
      var productInfo = this.productCache[variant.product_id];
      if (productInfo) {
        variant.product_title = productInfo.title;
        variant.product_handle = productInfo.handle;
      } else {
        variant.product_title = 'Product ID: ' + variant.product_id;
        variant.product_handle = '';
      }
      
      variants.push(variant);
      sinceId = Math.max(sinceId, variant.id);
    }

    this.handleRateLimit();

    if (pageVariants.length < limit) {
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
    hash,
    now,
    variant.product_id || '',
    variant.product_title || '',
    variant.product_handle || '',
    variant.title || '',
    variant.price || '',
    variant.compare_at_price || '',
    variant.sku || '',
    variant.position || '',
    variant.inventory_policy || '',
    variant.fulfillment_service || '',
    variant.inventory_management || '',
    variant.option1 || '',
    variant.option2 || '',
    variant.option3 || '',
    variant.created_at || '',
    variant.updated_at || '',
    variant.taxable ? 'true' : 'false',
    variant.barcode || '',
    variant.grams || '',
    variant.image_id || '',
    variant.inventory_quantity || 0,
    variant.weight || '',
    variant.weight_unit || '',
    variant.inventory_item_id || '',
    variant.old_inventory_quantity || '',
    variant.requires_shipping ? 'true' : 'false',
    'imported',
    ''
  ];
};
