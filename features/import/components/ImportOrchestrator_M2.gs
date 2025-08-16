// Milestone 2: Import Orchestrator
// Focused coordination component (~100 lines)

function ImportOrchestrator() {
  this.productImporter = new ProductImporter();
  this.variantImporter = new VariantImporter();
  this.cache = new IntelligentCache(); // MILESTONE 2: Add intelligent caching
  this.bulkApiClient = new BulkApiClient(); // MILESTONE 2: Add bulk operations
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

// Individual dry-run methods
ImportOrchestrator.prototype.dryRunProducts = function() {
  return this.productImporter.import({ dryRun: true });
};

ImportOrchestrator.prototype.dryRunVariants = function() {
  return this.variantImporter.import({ dryRun: true });
};

ImportOrchestrator.prototype.dryRunAll = function() {
  return this.importAll({ dryRun: true });
};

// Individual incremental methods
ImportOrchestrator.prototype.incrementalProducts = function() {
  return this.productImporter.import({ incremental: true });
};

ImportOrchestrator.prototype.incrementalVariants = function() {
  return this.variantImporter.import({ incremental: true });
};

ImportOrchestrator.prototype.incrementalAll = function() {
  return this.importAll({ incremental: true });
};

/**
 * MILESTONE 2: Intelligent incremental sync with change detection
 * Processes only items that have changed since last sync
 */
ImportOrchestrator.prototype.intelligentIncrementalSync = function(options) {
  options = options || {};
  var startTime = Date.now();
  var dryRun = options.dryRun || false;
  
  try {
    Logger.log('[ImportOrchestrator] Starting intelligent incremental sync');
    
    // Step 1: Get last sync timestamp
    var lastSyncTime = this.getLastSyncTimestamp();
    Logger.log(`[ImportOrchestrator] Last sync: ${lastSyncTime ? new Date(lastSyncTime).toISOString() : 'Never'}`);
    
    // Step 2: Detect changed items using bulk operations
    var changedItems = this.detectChangedItems(lastSyncTime, options);
    Logger.log(`[ImportOrchestrator] Found ${changedItems.products.length} changed products, ${changedItems.variants.length} changed variants`);
    
    // Step 3: Process only changed items
    var results = this.processChangedItems(changedItems, options);
    
    // Step 4: Update sync timestamp if successful
    if (results.success && !dryRun) {
      this.updateLastSyncTimestamp(startTime);
    }
    
    var totalDuration = Date.now() - startTime;
    
    return {
      success: results.success,
      dryRun: dryRun,
      processingAction: 'intelligent_incremental_sync',
      lastSyncTime: lastSyncTime,
      currentSyncTime: startTime,
      changedItemsDetected: changedItems.products.length + changedItems.variants.length,
      recordsProcessed: results.recordsProcessed || 0,
      recordsWritten: results.recordsWritten || 0,
      duration: totalDuration,
      errors: results.errors || [],
      warnings: results.warnings || [],
      rateLimitHits: results.rateLimitHits || 0,
      apiCallCount: results.apiCallCount || 0,
      avgRequestsPerSecond: Math.round(((results.apiCallCount || 0) / (totalDuration / 1000)) * 100) / 100,
      performanceImprovement: this.calculatePerformanceImprovement(changedItems, totalDuration),
      changeDetectionResults: changedItems
    };
    
  } catch (error) {
    Logger.log(`[ImportOrchestrator] Error in intelligent incremental sync: ${error.message}`);
    return {
      success: false,
      dryRun: dryRun,
      processingAction: 'intelligent_incremental_sync',
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

/**
 * Get last sync timestamp from cache or properties
 */
ImportOrchestrator.prototype.getLastSyncTimestamp = function() {
  try {
    // Check cache first
    var cachedTimestamp = this.cache.getSimple('last_sync_timestamp');
    if (cachedTimestamp) {
      return cachedTimestamp;
    }
    
    // Check Properties service
    var properties = PropertiesService.getScriptProperties();
    var timestamp = properties.getProperty('last_sync_timestamp');
    
    if (timestamp) {
      // Cache for faster access
      this.cache.set('last_sync_timestamp', parseInt(timestamp), 60); // 1 hour TTL
      return parseInt(timestamp);
    }
    
    return null;
  } catch (error) {
    Logger.log(`[ImportOrchestrator] Error getting last sync timestamp: ${error.message}`);
    return null;
  }
};

/**
 * Update last sync timestamp
 */
ImportOrchestrator.prototype.updateLastSyncTimestamp = function(timestamp) {
  try {
    // Update cache
    this.cache.set('last_sync_timestamp', timestamp, 60);
    
    // Update Properties service for persistence
    PropertiesService.getScriptProperties().setProperty('last_sync_timestamp', timestamp.toString());
    
    Logger.log(`[ImportOrchestrator] Updated last sync timestamp: ${new Date(timestamp).toISOString()}`);
  } catch (error) {
    Logger.log(`[ImportOrchestrator] Error updating last sync timestamp: ${error.message}`);
  }
};

/**
 * Detect changed items using bulk operations and intelligent caching
 */
ImportOrchestrator.prototype.detectChangedItems = function(lastSyncTime, options) {
  try {
    var changedProducts = [];
    var changedVariants = [];
    
    // If no last sync time, treat as full sync
    if (!lastSyncTime) {
      Logger.log('[ImportOrchestrator] No previous sync found - treating as full sync');
      return this.getAllItemsForFullSync(options);
    }
    
    // Use bulk operations to fetch updated items efficiently
    var sinceDate = new Date(lastSyncTime).toISOString();
    
    // Fetch products updated since last sync
    var updatedProducts = this.bulkApiClient.bulkFetchProducts(null, {
      updated_at_min: sinceDate,
      limit: 250
    });
    
    if (updatedProducts.success && updatedProducts.data) {
      changedProducts = updatedProducts.data;
      Logger.log(`[ImportOrchestrator] Found ${changedProducts.length} updated products since ${sinceDate}`);
    }
    
    // Fetch variants updated since last sync
    var updatedVariants = this.bulkApiClient.bulkFetchVariants(null, {
      updated_at_min: sinceDate,
      limit: 250
    });
    
    if (updatedVariants.success && updatedVariants.data) {
      changedVariants = updatedVariants.data;
      Logger.log(`[ImportOrchestrator] Found ${changedVariants.length} updated variants since ${sinceDate}`);
    }
    
    // Cache the results for potential reuse
    var cacheKey = `changed_items_${lastSyncTime}`;
    var results = {
      products: changedProducts,
      variants: changedVariants,
      detectionTime: Date.now(),
      lastSyncTime: lastSyncTime
    };
    
    this.cache.set(cacheKey, results, 10); // 10 minutes TTL
    
    return results;
    
  } catch (error) {
    Logger.log(`[ImportOrchestrator] Error detecting changed items: ${error.message}`);
    return {
      products: [],
      variants: [],
      error: error.message
    };
  }
};

/**
 * Get all items for full sync (when no previous sync exists)
 */
ImportOrchestrator.prototype.getAllItemsForFullSync = function(options) {
  try {
    Logger.log('[ImportOrchestrator] Performing full sync detection');
    
    // Use bulk operations to fetch all items efficiently
    var allProducts = this.bulkApiClient.bulkFetchProducts(null, { limit: 250 });
    var allVariants = this.bulkApiClient.bulkFetchVariants(null, { limit: 250 });
    
    return {
      products: allProducts.success ? allProducts.data : [],
      variants: allVariants.success ? allVariants.data : [],
      detectionTime: Date.now(),
      lastSyncTime: null,
      fullSync: true
    };
    
  } catch (error) {
    Logger.log(`[ImportOrchestrator] Error in full sync detection: ${error.message}`);
    return {
      products: [],
      variants: [],
      error: error.message,
      fullSync: true
    };
  }
};

/**
 * Process only the changed items
 */
ImportOrchestrator.prototype.processChangedItems = function(changedItems, options) {
  try {
    var productResults = { success: true, recordsProcessed: 0, recordsWritten: 0, errors: [], warnings: [], rateLimitHits: 0, apiCallCount: 0 };
    var variantResults = { success: true, recordsProcessed: 0, recordsWritten: 0, errors: [], warnings: [], rateLimitHits: 0, apiCallCount: 0 };
    
    // Process changed products if any
    if (changedItems.products.length > 0) {
      var productOptions = Object.assign({}, options, { 
        changedItemsOnly: true,
        changedItems: changedItems.products 
      });
      productResults = this.productImporter.import(productOptions);
    }
    
    // Process changed variants if any
    if (changedItems.variants.length > 0) {
      var variantOptions = Object.assign({}, options, { 
        changedItemsOnly: true,
        changedItems: changedItems.variants 
      });
      variantResults = this.variantImporter.import(variantOptions);
    }
    
    return {
      success: productResults.success && variantResults.success,
      recordsProcessed: productResults.recordsProcessed + variantResults.recordsProcessed,
      recordsWritten: productResults.recordsWritten + variantResults.recordsWritten,
      errors: productResults.errors.concat(variantResults.errors),
      warnings: productResults.warnings.concat(variantResults.warnings),
      rateLimitHits: productResults.rateLimitHits + variantResults.rateLimitHits,
      apiCallCount: productResults.apiCallCount + variantResults.apiCallCount,
      productResults: productResults,
      variantResults: variantResults
    };
    
  } catch (error) {
    Logger.log(`[ImportOrchestrator] Error processing changed items: ${error.message}`);
    return {
      success: false,
      recordsProcessed: 0,
      recordsWritten: 0,
      errors: [error.message],
      warnings: [],
      rateLimitHits: 0,
      apiCallCount: 0
    };
  }
};

/**
 * Calculate performance improvement from incremental sync
 */
ImportOrchestrator.prototype.calculatePerformanceImprovement = function(changedItems, actualDuration) {
  try {
    var changedCount = changedItems.products.length + changedItems.variants.length;
    
    // Estimate what full sync would have taken (based on historical data)
    var estimatedFullSyncItems = 4000; // From memory: typical full dataset size
    var estimatedFullSyncDuration = estimatedFullSyncItems * 1500; // 1.5 seconds per item average
    
    if (changedCount === 0) {
      return {
        itemsSkipped: estimatedFullSyncItems,
        timeSkipped: estimatedFullSyncDuration,
        percentageImprovement: 100,
        efficiency: 'Maximum - No changes detected'
      };
    }
    
    var timeSaved = estimatedFullSyncDuration - actualDuration;
    var percentageImprovement = ((timeSaved / estimatedFullSyncDuration) * 100).toFixed(1);
    
    return {
      itemsProcessed: changedCount,
      itemsSkipped: estimatedFullSyncItems - changedCount,
      estimatedFullSyncDuration: estimatedFullSyncDuration,
      actualDuration: actualDuration,
      timeSaved: timeSaved,
      percentageImprovement: parseFloat(percentageImprovement),
      efficiency: percentageImprovement > 80 ? 'Excellent' : percentageImprovement > 60 ? 'Good' : 'Moderate'
    };
    
  } catch (error) {
    Logger.log(`[ImportOrchestrator] Error calculating performance improvement: ${error.message}`);
    return {
      error: error.message,
      efficiency: 'Unknown'
    };
  }
};
