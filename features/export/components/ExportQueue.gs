// Milestone 3: Export Queue Manager
// Queue persistence and management component (~200 lines)

function ExportQueue(sessionId) {
  this.sessionId = sessionId || null;
  this.queue = [];
  this.currentProgress = { current: 0, total: 0 };
  this.persistenceEnabled = true;
  this.stats = {
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0
  };
}

/**
 * Initialize queue with session ID
 * @param {string} sessionId - Session identifier
 */
ExportQueue.prototype.initialize = function(sessionId) {
  this.sessionId = sessionId;
  Logger.log(`[ExportQueue] Initialized with session: ${sessionId}`);
};

/**
 * Add items to the export queue
 * @param {Array} items - Items to add to queue
 */
ExportQueue.prototype.addItems = function(items) {
  if (!Array.isArray(items)) {
    items = [items];
  }
  
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    item.status = item.status || 'pending';
    item.addedAt = new Date().toISOString();
    item.queueIndex = this.queue.length;
    
    this.queue.push(item);
  }
  
  this.updateStats();
  this.saveQueue();
  
  Logger.log(`[ExportQueue] Added ${items.length} items to queue (total: ${this.queue.length})`);
};

/**
 * Get next pending item from queue
 */
ExportQueue.prototype.getNextItem = function() {
  for (var i = 0; i < this.queue.length; i++) {
    if (this.queue[i].status === 'pending') {
      return {
        item: this.queue[i],
        index: i
      };
    }
  }
  return null;
};

/**
 * Get items by status
 * @param {string} status - Status to filter by
 */
ExportQueue.prototype.getItemsByStatus = function(status) {
  var items = [];
  for (var i = 0; i < this.queue.length; i++) {
    if (this.queue[i].status === status) {
      items.push({
        item: this.queue[i],
        index: i
      });
    }
  }
  return items;
};

/**
 * Update item status
 * @param {number} itemIndex - Index of item in queue
 * @param {string} status - New status (pending, processing, completed, failed)
 * @param {Object} result - Processing result (optional)
 */
ExportQueue.prototype.updateItemStatus = function(itemIndex, status, result) {
  if (itemIndex < 0 || itemIndex >= this.queue.length) {
    Logger.log(`[ExportQueue] Invalid item index: ${itemIndex}`);
    return false;
  }
  
  try {
    var item = this.queue[itemIndex];
    var oldStatus = item.status;
    
    item.status = status;
    item.lastUpdated = new Date().toISOString();
    
    if (result) {
      item.result = result;
    }
    
    // Update progress tracking
    if (status === 'completed' || status === 'failed') {
      this.currentProgress.current++;
    }
    
    this.updateStats();
    this.saveQueue();
    
    Logger.log(`[ExportQueue] Updated item ${itemIndex}: ${oldStatus} → ${status}`);
    return true;
    
  } catch (error) {
    Logger.log(`[ExportQueue] Error updating item status: ${error.message}`);
    return false;
  }
};

/**
 * Update internal statistics
 */
ExportQueue.prototype.updateStats = function() {
  this.stats = {
    total: this.queue.length,
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0
  };
  
  for (var i = 0; i < this.queue.length; i++) {
    var status = this.queue[i].status || 'pending';
    if (this.stats[status] !== undefined) {
      this.stats[status]++;
    }
  }
  
  this.stats.completionRate = this.stats.total > 0 ? 
    ((this.stats.completed + this.stats.failed) / this.stats.total) * 100 : 0;
  this.stats.successRate = (this.stats.completed + this.stats.failed) > 0 ? 
    (this.stats.completed / (this.stats.completed + this.stats.failed)) * 100 : 0;
};

/**
 * Get queue processing statistics
 */
ExportQueue.prototype.getStats = function() {
  this.updateStats();
  return {
    sessionId: this.sessionId,
    timestamp: new Date().toISOString(),
    stats: this.stats,
    progress: this.currentProgress
  };
};

/**
 * Save queue to persistent storage
 */
ExportQueue.prototype.saveQueue = function() {
  if (!this.persistenceEnabled || !this.sessionId) {
    return false;
  }
  
  try {
    var properties = PropertiesService.getScriptProperties();
    var queueKey = 'export_queue_' + this.sessionId;
    
    var queueData = {
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      queue: this.queue,
      progress: this.currentProgress,
      stats: this.stats
    };
    
    properties.setProperty(queueKey, JSON.stringify(queueData));
    Logger.log(`[ExportQueue] Queue saved for session: ${this.sessionId}`);
    return true;
    
  } catch (error) {
    Logger.log(`[ExportQueue] Error saving queue: ${error.message}`);
    return false;
  }
};

/**
 * Load queue from persistent storage
 * @param {string} sessionId - Session ID to load (optional, uses current if not provided)
 */
ExportQueue.prototype.loadQueue = function(sessionId) {
  sessionId = sessionId || this.sessionId;
  
  if (!sessionId) {
    Logger.log(`[ExportQueue] No session ID provided for loading`);
    return false;
  }
  
  try {
    var properties = PropertiesService.getScriptProperties();
    var queueKey = 'export_queue_' + sessionId;
    var queueJson = properties.getProperty(queueKey);
    
    if (queueJson) {
      var queueData = JSON.parse(queueJson);
      
      this.sessionId = queueData.sessionId;
      this.queue = queueData.queue || [];
      this.currentProgress = queueData.progress || { current: 0, total: 0 };
      this.stats = queueData.stats || {};
      
      Logger.log(`[ExportQueue] Queue loaded for session: ${sessionId} (${this.queue.length} items)`);
      return true;
    }
    
    Logger.log(`[ExportQueue] No saved queue found for session: ${sessionId}`);
    return false;
    
  } catch (error) {
    Logger.log(`[ExportQueue] Error loading queue: ${error.message}`);
    return false;
  }
};

/**
 * Clear the queue
 */
ExportQueue.prototype.clear = function() {
  this.queue = [];
  this.currentProgress = { current: 0, total: 0 };
  this.updateStats();
  this.saveQueue();
  
  Logger.log(`[ExportQueue] Queue cleared for session: ${this.sessionId}`);
};

/**
 * Validate queue integrity
 */
ExportQueue.prototype.validateIntegrity = function() {
  try {
    var issues = [];
    
    for (var i = 0; i < this.queue.length; i++) {
      var item = this.queue[i];
      
      if (!item.operation) {
        issues.push(`Item ${i}: Missing operation`);
      }
      
      if (!item.record || !item.record.id) {
        issues.push(`Item ${i}: Missing record or record ID`);
      }
      
      if (!item.sheetName) {
        issues.push(`Item ${i}: Missing sheet name`);
      }
      
      if (!item.status) {
        issues.push(`Item ${i}: Missing status`);
      }
    }
    
    return {
      valid: issues.length === 0,
      issues: issues,
      totalItems: this.queue.length,
      sessionId: this.sessionId
    };
    
  } catch (error) {
    return {
      valid: false,
      issues: [`Queue validation error: ${error.message}`],
      totalItems: this.queue.length,
      sessionId: this.sessionId
    };
  }
};

/**
 * Get queue summary for reporting
 */
ExportQueue.prototype.getSummary = function() {
  this.updateStats();
  
  return {
    sessionId: this.sessionId,
    totalItems: this.queue.length,
    stats: this.stats,
    progress: this.currentProgress,
    isComplete: this.stats.pending === 0 && this.stats.processing === 0,
    hasErrors: this.stats.failed > 0,
    timestamp: new Date().toISOString()
  };
};

/**
 * Cleanup queue from persistent storage
 * @param {string} sessionId - Session ID to cleanup (optional, uses current if not provided)
 */
ExportQueue.prototype.cleanup = function(sessionId) {
  sessionId = sessionId || this.sessionId;
  
  if (!sessionId) {
    return false;
  }
  
  try {
    var properties = PropertiesService.getScriptProperties();
    var queueKey = 'export_queue_' + sessionId;
    properties.deleteProperty(queueKey);
    
    Logger.log(`[ExportQueue] Queue cleaned up for session: ${sessionId}`);
    return true;
    
  } catch (error) {
    Logger.log(`[ExportQueue] Error cleaning up queue: ${error.message}`);
    return false;
  }
};

/**
 * Get failed items for retry
 */
ExportQueue.prototype.getFailedItems = function() {
  return this.getItemsByStatus('failed');
};

/**
 * Reset failed items to pending for retry
 */
ExportQueue.prototype.resetFailedItems = function() {
  var resetCount = 0;
  
  for (var i = 0; i < this.queue.length; i++) {
    if (this.queue[i].status === 'failed') {
      this.queue[i].status = 'pending';
      this.queue[i].retryCount = (this.queue[i].retryCount || 0) + 1;
      this.queue[i].lastUpdated = new Date().toISOString();
      resetCount++;
    }
  }
  
  if (resetCount > 0) {
    this.currentProgress.current -= resetCount; // Adjust progress
    this.updateStats();
    this.saveQueue();
    
    Logger.log(`[ExportQueue] Reset ${resetCount} failed items to pending`);
  }
  
  return resetCount;
};

/**
 * Get queue as array (for external processing)
 */
ExportQueue.prototype.getQueue = function() {
  return this.queue.slice(); // Return copy to prevent external modification
};

/**
 * Set queue from external source
 * @param {Array} queue - Queue array to set
 */
ExportQueue.prototype.setQueue = function(queue) {
  this.queue = Array.isArray(queue) ? queue : [];
  this.currentProgress.total = this.queue.length;
  this.updateStats();
  this.saveQueue();
  
  Logger.log(`[ExportQueue] Queue set with ${this.queue.length} items`);
};

/**
 * Process queue items using provided processors
 * @param {Object} processors - Processing components { batchProcessor, retryManager, auditLogger }
 * @param {Object} options - Processing options
 */
ExportQueue.prototype.processQueue = function(processors, options) {
  options = options || {};
  
  if (!processors || !processors.batchProcessor) {
    return {
      success: false,
      error: 'BatchProcessor is required for queue processing'
    };
  }
  
  try {
    Logger.log(`[ExportQueue] Starting queue processing for session: ${this.sessionId}`);
    
    // Get pending items
    var pendingItems = this.getItemsByStatus('pending');
    
    if (pendingItems.length === 0) {
      return {
        success: true,
        message: 'No pending items to process',
        summary: this.getSummary()
      };
    }
    
    Logger.log(`[ExportQueue] Processing ${pendingItems.length} pending items`);
    
    // Prepare data for batch processing
    var processingData = pendingItems.map(function(item) {
      return item.item;
    });
    
    // Process using BatchProcessor
    var batchResults = processors.batchProcessor.processAllBatches(
      processingData,
      'mixed', // Mixed operations (create/update)
      {
        onProgress: this.createQueueProgressCallback(processors.auditLogger),
        batchSize: options.batchSize,
        sheetName: this.getSheetNameFromQueue() // Add sheet name for hash updates
      }
    );
    
    // Update queue items based on results
    this.updateItemsFromBatchResults(batchResults, pendingItems);
    
    var finalSummary = this.getSummary();
    
    Logger.log(`[ExportQueue] Queue processing completed: ${finalSummary.stats.completed} completed, ${finalSummary.stats.failed} failed`);
    
    return {
      success: batchResults.success,
      summary: finalSummary,
      batchResults: batchResults,
      sessionId: this.sessionId
    };
    
  } catch (error) {
    Logger.log(`[ExportQueue] Error processing queue: ${error.message}`);
    
    if (processors.auditLogger) {
      processors.auditLogger.logError(error, {
        context: 'queue_processing',
        sessionId: this.sessionId
      });
    }
    
    return {
      success: false,
      error: 'Queue processing failed: ' + error.message,
      sessionId: this.sessionId
    };
  }
};

/**
 * Create progress callback for queue processing
 * @param {Object} auditLogger - AuditLogger instance (optional)
 */
ExportQueue.prototype.createQueueProgressCallback = function(auditLogger) {
  var self = this;
  
  return function(currentBatch, totalBatches, stats) {
    // Update internal progress
    self.currentProgress.current = currentBatch;
    self.currentProgress.total = totalBatches;
    
    // Save progress
    self.saveQueue();
    
    // Log to audit logger if available
    if (auditLogger) {
      auditLogger.logPerformanceMetrics({
        queueProgress: {
          sessionId: self.sessionId,
          currentBatch: currentBatch,
          totalBatches: totalBatches,
          stats: stats
        }
      });
    }
    
    Logger.log(`[ExportQueue] Progress: ${currentBatch}/${totalBatches} batches processed`);
  };
};

/**
 * Update queue items based on batch processing results
 * @param {Object} batchResults - Results from BatchProcessor
 * @param {Array} pendingItems - Items that were processed
 */
ExportQueue.prototype.updateItemsFromBatchResults = function(batchResults, pendingItems) {
  try {
    // Update successful batches
    for (var i = 0; i < batchResults.processedBatches.length; i++) {
      var batch = batchResults.processedBatches[i];
      var batchIndex = batch.batchIndex;
      
      // Mark items in this batch as completed
      if (pendingItems[batchIndex]) {
        this.updateItemStatus(
          pendingItems[batchIndex].index,
          'completed',
          { 
            success: true, 
            processedAt: new Date().toISOString(),
            batchResult: {
              // Extract only safe properties to avoid circular references
              success: batch.result ? batch.result.success : true,
              itemsProcessed: batch.result ? batch.result.itemsProcessed : 0,
              duration: batch.result ? batch.result.duration : 0
            }
          }
        );
      }
    }
    
    // Update failed batches
    for (var i = 0; i < batchResults.failedBatches.length; i++) {
      var batch = batchResults.failedBatches[i];
      var batchIndex = batch.batchIndex;
      
      // Mark items in this batch as failed
      if (pendingItems[batchIndex]) {
        this.updateItemStatus(
          pendingItems[batchIndex].index,
          'failed',
          { 
            success: false, 
            error: batch.error, 
            processedAt: new Date().toISOString(),
            batchResult: {
              // Extract only safe properties to avoid circular references
              success: batch.result ? batch.result.success : false,
              itemsProcessed: batch.result ? batch.result.itemsProcessed : 0,
              duration: batch.result ? batch.result.duration : 0,
              error: batch.error
            }
          }
        );
      }
    }
    
    Logger.log(`[ExportQueue] Updated ${pendingItems.length} queue items based on batch results`);
    
  } catch (error) {
    Logger.log(`[ExportQueue] Error updating items from batch results: ${error.message}`);
  }
};

/**
 * Get sheet name from queue items
 */
ExportQueue.prototype.getSheetNameFromQueue = function() {
  try {
    if (this.queue && this.queue.length > 0) {
      // Get sheet name from first queue item
      var firstItem = this.queue[0];
      if (firstItem && firstItem.sheetName) {
        return firstItem.sheetName;
      }
    }
    
    // Fallback to 'Variants' as default
    Logger.log(`[ExportQueue] No sheet name found in queue, defaulting to 'Variants'`);
    return 'Variants';
    
  } catch (error) {
    Logger.log(`[ExportQueue] Error getting sheet name: ${error.message}`);
    return 'Variants';
  }
};
