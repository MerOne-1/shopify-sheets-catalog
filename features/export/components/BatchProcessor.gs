// Milestone 3: Batch Processor
// Smart batching with rate limiting component (~250 lines)

function BatchProcessor(apiClient, config) {
  this.apiClient = apiClient || new ApiClient(new ConfigManager());
  this.configManager = config || new ConfigManager();
  this.retryManager = new RetryManager(this.configManager);
  this.currentBatch = null;
  this.processingStats = {
    totalBatches: 0,
    processedBatches: 0,
    failedBatches: 0,
    totalItems: 0,
    processedItems: 0,
    failedItems: 0,
    startTime: null,
    endTime: null
  };
}

/**
 * Process all batches with smart batching and rate limiting
 * @param {Array} data - Array of items to process
 * @param {string} operation - Operation type (update, create, delete)
 * @param {Object} options - Processing options
 */
BatchProcessor.prototype.processAllBatches = function(data, operation, options) {
  options = options || {};
  
  try {
    Logger.log(`[BatchProcessor] Starting batch processing: ${data.length} items, operation: ${operation}`);
    
    // Initialize processing stats
    this.processingStats = {
      totalBatches: 0,
      processedBatches: 0,
      failedBatches: 0,
      totalItems: data.length,
      processedItems: 0,
      failedItems: 0,
      startTime: new Date(),
      endTime: null
    };
    
    // Create batches with optimal sizing
    var batches = this.createBatches(data, options.batchSize);
    this.processingStats.totalBatches = batches.length;
    
    Logger.log(`[BatchProcessor] Created ${batches.length} batches for processing`);
    
    var results = {
      success: true,
      processedBatches: [],
      failedBatches: [],
      summary: null
    };
    
    // Process each batch
    for (var i = 0; i < batches.length; i++) {
      var batch = batches[i];
      Logger.log(`[BatchProcessor] Processing batch ${i + 1}/${batches.length} (${batch.length} items)`);
      
      try {
        var batchResult = this.processBatch(batch, operation, options);
        
        if (batchResult.success) {
          results.processedBatches.push({
            batchIndex: i,
            itemCount: batch.length,
            result: batchResult
          });
          this.processingStats.processedBatches++;
          this.processingStats.processedItems += batch.length;
        } else {
          results.failedBatches.push({
            batchIndex: i,
            itemCount: batch.length,
            error: batchResult.error,
            result: batchResult
          });
          this.processingStats.failedBatches++;
          this.processingStats.failedItems += batch.length;
          
          // Decide whether to continue or stop based on error type
          if (batchResult.fatal) {
            Logger.log(`[BatchProcessor] Fatal error in batch ${i + 1}, stopping processing`);
            results.success = false;
            break;
          }
        }
        
        // Progress callback if provided
        if (options.onProgress && typeof options.onProgress === 'function') {
          options.onProgress(i + 1, batches.length, this.processingStats);
        }
        
      } catch (batchError) {
        Logger.log(`[BatchProcessor] Exception in batch ${i + 1}: ${batchError.message}`);
        results.failedBatches.push({
          batchIndex: i,
          itemCount: batch.length,
          error: batchError.message,
          exception: true
        });
        this.processingStats.failedBatches++;
        this.processingStats.failedItems += batch.length;
      }
    }
    
    // Finalize processing stats
    this.processingStats.endTime = new Date();
    results.summary = this.generateProcessingSummary();
    
    Logger.log(`[BatchProcessor] Batch processing completed: ${results.processedBatches.length} successful, ${results.failedBatches.length} failed`);
    
    return results;
    
  } catch (error) {
    Logger.log(`[BatchProcessor] Error in processAllBatches: ${error.message}`);
    return {
      success: false,
      error: 'Batch processing failed: ' + error.message,
      processedBatches: [],
      failedBatches: [],
      summary: this.generateProcessingSummary()
    };
  }
};

/**
 * Process a single batch
 * @param {Array} batch - Batch of items to process
 * @param {string} operation - Operation type
 * @param {Object} options - Processing options
 */
BatchProcessor.prototype.processBatch = function(batch, operation, options) {
  options = options || {};
  this.currentBatch = batch;
  
  try {
    Logger.log(`[BatchProcessor] Processing batch of ${batch.length} items`);
    
    var batchResults = [];
    var batchErrors = [];
    
    // Process each item in the batch
    for (var i = 0; i < batch.length; i++) {
      var item = batch[i];
      
      try {
        var itemResult = this.processItem(item, operation, options);
        
        if (itemResult.success) {
          batchResults.push(itemResult);
        } else {
          batchErrors.push({
            itemIndex: i,
            item: item,
            error: itemResult.error
          });
        }
        
      } catch (itemError) {
        Logger.log(`[BatchProcessor] Error processing item ${i}: ${itemError.message}`);
        batchErrors.push({
          itemIndex: i,
          item: item,
          error: itemError.message,
          exception: true
        });
      }
    }
    
    var batchSuccess = batchErrors.length === 0;
    
    // CRITICAL: Update hashes after successful batch processing
    if (batchResults.length > 0 && options.sheetName) {
      try {
        var sheetUpdateService = new SheetUpdateService();
        var successfulRecords = batchResults.map(function(result) { 
          return result.item.record || result.item; 
        });
        var updateResult = sheetUpdateService.updateAfterExport(options.sheetName, successfulRecords);
        
        Logger.log(`[BatchProcessor] Hash update result: ${updateResult.success ? 'SUCCESS' : 'FAILED'} - ${updateResult.message || updateResult.error}`);
      } catch (updateError) {
        Logger.log(`[BatchProcessor] Error updating hashes after batch: ${updateError.message}`);
        // Don't fail the batch due to hash update errors
      }
    }
    
    return {
      success: batchSuccess,
      results: batchResults,
      errors: batchErrors,
      summary: {
        totalItems: batch.length,
        successfulItems: batchResults.length,
        failedItems: batchErrors.length,
        successRate: batch.length > 0 ? (batchResults.length / batch.length) * 100 : 0
      }
    };
    
  } catch (error) {
    Logger.log(`[BatchProcessor] Error in processBatch: ${error.message}`);
    return {
      success: false,
      error: 'Batch processing error: ' + error.message,
      results: [],
      errors: [],
      fatal: error.message.includes('quota') || error.message.includes('authentication')
    };
  }
};

/**
 * Process a single item with retry logic
 * @param {Object} item - Item to process
 * @param {string} operation - Operation type
 * @param {Object} options - Processing options
 */
BatchProcessor.prototype.processItem = function(item, operation, options) {
  var itemStartTime = new Date().getTime();
  var itemId = (item.record && item.record.id) || item.id || 'unknown';
  Logger.log('[TIMING] processItem start: ' + itemId);
  
  try {
    // Determine API endpoint and method based on operation and item type
    var buildStartTime = new Date().getTime();
    var apiCall = this.buildApiCall(item, operation);
    var buildEndTime = new Date().getTime();
    Logger.log('[TIMING] buildApiCall: ' + (buildEndTime - buildStartTime) + 'ms');
    
    if (!apiCall) {
      return {
        success: false,
        error: 'Could not determine API call for item: ' + JSON.stringify(item)
      };
    }
    
    // Execute API call with retry logic
    Logger.log('[TIMING] executeWithRetry start');
    var retryStartTime = new Date().getTime();
    var result = this.retryManager.executeWithRetry(
      this.apiClient,
      apiCall.endpoint,
      apiCall.method,
      apiCall.payload
    );
    var retryEndTime = new Date().getTime();
    var retryDuration = retryEndTime - retryStartTime;
    Logger.log('[TIMING] executeWithRetry end: ' + retryDuration + 'ms');
    
    var itemEndTime = new Date().getTime();
    var totalItemTime = itemEndTime - itemStartTime;
    Logger.log('[TIMING] processItem total: ' + totalItemTime + 'ms for ' + itemId);
    
    if (result.success) {
      return {
        success: true,
        item: item,
        operation: operation,
        apiResponse: result.data,
        attempts: result.attempts || 1
      };
    } else {
      return {
        success: false,
        item: item,
        operation: operation,
        error: result.error,
        attempts: result.attempts || 1
      };
    }
    
  } catch (error) {
    var itemEndTime = new Date().getTime();
    var totalItemTime = itemEndTime - itemStartTime;
    Logger.log('[TIMING] processItem ERROR total: ' + totalItemTime + 'ms for ' + itemId);
    Logger.log(`[BatchProcessor] Error processing item: ${error.message}`);
    return {
      success: false,
      item: item,
      operation: operation,
      error: error.message
    };
  }
};

/**
 * Build API call parameters based on item and operation
 * @param {Object} item - Item to process
 * @param {string} operation - Operation type
 */
BatchProcessor.prototype.buildApiCall = function(item, operation) {
  try {
    var record = item.record || item;
    
    // Determine resource type based on item structure
    var resourceType = this.determineResourceType(record);
    
    // Handle mixed operations by determining individual operation from item
    var actualOperation = operation.toLowerCase();
  
    if (actualOperation === 'mixed') {
      // Determine operation based on item properties
      if (item.operation) {
        actualOperation = item.operation.toLowerCase();
      } else if (record.id && record.id !== '') {
        actualOperation = 'update'; // Has ID, so it's an update
      } else {
        actualOperation = 'create'; // No ID, so it's a create
      }
    }
  
    switch (actualOperation) {
      case 'update':
        return {
          endpoint: `${resourceType}/${record.id}.json`,
          method: 'PUT',
          payload: this.buildPayload(record, resourceType)
        };
        
      case 'create':
        return {
          endpoint: `${resourceType}.json`,
          method: 'POST',
          payload: this.buildPayload(record, resourceType)
        };
        
      case 'delete':
        return {
          endpoint: `${resourceType}/${record.id}.json`,
          method: 'DELETE',
          payload: null
        };
        
      default:
        Logger.log(`[BatchProcessor] Unknown operation: ${actualOperation} (original: ${operation})`);
        return null;
    }
    
  } catch (error) {
    Logger.log(`[BatchProcessor] Error building API call: ${error.message}`);
    return null;
  }
};

/**
 * Determine resource type from record structure
 * @param {Object} record - Record to analyze
 */
BatchProcessor.prototype.determineResourceType = function(record) {
  if (record.product_id && record.price !== undefined) {
    return 'variants';
  } else if (record.title && record.handle) {
    return 'products';
  } else if (record.namespace && record.key && record.value !== undefined) {
    return record.product_id ? 'variants' : 'products'; // Metafields
  } else if (record.src && record.product_id) {
    return 'products'; // Images
  } else {
    return 'products'; // Default fallback
  }
};

/**
 * Build API payload for the record
 * @param {Object} record - Record data
 * @param {string} resourceType - Type of resource
 */
BatchProcessor.prototype.buildPayload = function(record, resourceType) {
  var payload = {};
  
  switch (resourceType) {
    case 'products':
      payload.product = {
        id: record.id,
        title: record.title,
        handle: record.handle,
        body_html: record.body_html,
        vendor: record.vendor,
        product_type: record.product_type,
        tags: record.tags,
        status: record.status
      };
      break;
      
    case 'variants':
      payload.variant = {
        id: record.id,
        product_id: record.product_id,
        title: record.title,
        price: record.price,
        compare_at_price: record.compare_at_price,
        sku: record.sku,
        barcode: record.barcode,
        inventory_quantity: record.inventory_quantity,
        weight: record.weight,
        option1: record.option1,
        option2: record.option2,
        option3: record.option3
      };
      break;
      
    default:
      // Generic payload - include all non-system fields
      for (var key in record) {
        if (!key.startsWith('_') && record[key] !== null && record[key] !== undefined) {
          payload[key] = record[key];
        }
      }
  }
  
  return payload;
};

/**
 * Create batches with optimal sizing
 * @param {Array} data - Data to batch
 * @param {number} customBatchSize - Custom batch size (optional)
 */
BatchProcessor.prototype.createBatches = function(data, customBatchSize) {
  var batchSize = customBatchSize || this.getOptimalBatchSize(data.length);
  var batches = [];
  
  for (var i = 0; i < data.length; i += batchSize) {
    var batch = data.slice(i, i + batchSize);
    batches.push(batch);
  }
  
  Logger.log(`[BatchProcessor] Created ${batches.length} batches with size ${batchSize}`);
  return batches;
};

/**
 * Determine optimal batch size based on data volume and configuration
 * @param {number} totalItems - Total number of items to process
 */
BatchProcessor.prototype.getOptimalBatchSize = function(totalItems) {
  var configBatchSize = parseInt(this.configManager.getConfigValue('batch_size')) || 50;
  
  // Adjust batch size based on total volume
  if (totalItems < 100) {
    return Math.min(configBatchSize, 25); // Smaller batches for small datasets
  } else if (totalItems > 1000) {
    return Math.min(configBatchSize, 100); // Larger batches for big datasets
  } else {
    return configBatchSize; // Use configured size for medium datasets
  }
};

/**
 * Generate processing summary
 */
BatchProcessor.prototype.generateProcessingSummary = function() {
  var duration = this.processingStats.endTime ? 
    this.processingStats.endTime.getTime() - this.processingStats.startTime.getTime() : 0;
  
  return {
    totalBatches: this.processingStats.totalBatches,
    processedBatches: this.processingStats.processedBatches,
    failedBatches: this.processingStats.failedBatches,
    totalItems: this.processingStats.totalItems,
    processedItems: this.processingStats.processedItems,
    failedItems: this.processingStats.failedItems,
    successRate: this.processingStats.totalItems > 0 ? 
      (this.processingStats.processedItems / this.processingStats.totalItems) * 100 : 0,
    duration: duration,
    itemsPerSecond: duration > 0 ? 
      (this.processingStats.processedItems / (duration / 1000)) : 0
  };
};
