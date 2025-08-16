// Milestone 3: Audit Logger
// Comprehensive operation logging component (~200 lines)

function AuditLogger(sessionId) {
  this.sessionId = sessionId || 'audit_' + Date.now();
  this.configManager = new ConfigManager();
  this.logs = [];
  this.sessionStartTime = new Date();
  this.performanceMetrics = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    totalProcessingTime: 0,
    averageOperationTime: 0,
    apiCallsCount: 0,
    retryCount: 0
  };
}

/**
 * Start export session logging
 * @param {Object} metadata - Session metadata
 */
AuditLogger.prototype.startExportSession = function(metadata) {
  try {
    var sessionLog = {
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      type: 'session_start',
      level: 'INFO',
      message: 'Export session started',
      metadata: {
        sheetName: metadata.sheetName || 'Unknown',
        user: metadata.user || Session.getActiveUser().getEmail(),
        options: metadata.options || {},
        totalRecords: metadata.totalRecords || 0,
        expectedBatches: metadata.expectedBatches || 0
      }
    };
    
    this.logs.push(sessionLog);
    this.persistLog(sessionLog);
    
    Logger.log(`[AuditLogger] Export session started: ${this.sessionId}`);
    
  } catch (error) {
    Logger.log(`[AuditLogger] Error starting session: ${error.message}`);
  }
};

/**
 * Log batch start
 * @param {Object} batchInfo - Batch information
 */
AuditLogger.prototype.logBatchStart = function(batchInfo) {
  try {
    var batchLog = {
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      type: 'batch_start',
      level: 'INFO',
      message: `Batch ${batchInfo.batchIndex + 1} started`,
      metadata: {
        batchIndex: batchInfo.batchIndex,
        batchSize: batchInfo.batchSize,
        operation: batchInfo.operation || 'unknown',
        estimatedDuration: batchInfo.estimatedDuration || null
      }
    };
    
    this.logs.push(batchLog);
    this.persistLog(batchLog);
    
  } catch (error) {
    Logger.log(`[AuditLogger] Error logging batch start: ${error.message}`);
  }
};

/**
 * Log batch completion
 * @param {Object} batchInfo - Batch information
 * @param {Object} results - Batch results
 */
AuditLogger.prototype.logBatchComplete = function(batchInfo, results) {
  try {
    var duration = results.duration || 0;
    var success = results.success || false;
    
    var batchLog = {
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      type: 'batch_complete',
      level: success ? 'INFO' : 'WARN',
      message: `Batch ${batchInfo.batchIndex + 1} ${success ? 'completed' : 'failed'}`,
      metadata: {
        batchIndex: batchInfo.batchIndex,
        batchSize: batchInfo.batchSize,
        operation: batchInfo.operation || 'unknown',
        duration: duration,
        successfulItems: results.successfulItems || 0,
        failedItems: results.failedItems || 0,
        successRate: results.successRate || 0,
        errors: results.errors || []
      }
    };
    
    this.logs.push(batchLog);
    this.persistLog(batchLog);
    
    // Update performance metrics
    this.performanceMetrics.totalOperations++;
    if (success) {
      this.performanceMetrics.successfulOperations++;
    } else {
      this.performanceMetrics.failedOperations++;
    }
    this.performanceMetrics.totalProcessingTime += duration;
    this.performanceMetrics.averageOperationTime = 
      this.performanceMetrics.totalProcessingTime / this.performanceMetrics.totalOperations;
    
  } catch (error) {
    Logger.log(`[AuditLogger] Error logging batch completion: ${error.message}`);
  }
};

/**
 * Log error with context
 * @param {Error|string} error - Error to log
 * @param {Object} context - Error context
 */
AuditLogger.prototype.logError = function(error, context) {
  try {
    var errorMessage = typeof error === 'string' ? error : error.message;
    var errorStack = typeof error === 'object' && error.stack ? error.stack : null;
    
    var errorLog = {
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      type: 'error',
      level: 'ERROR',
      message: errorMessage,
      metadata: {
        context: context || {},
        stack: errorStack,
        errorType: typeof error === 'object' ? error.constructor.name : 'String',
        recoverable: context ? context.recoverable : false,
        retryAttempt: context ? context.retryAttempt : null
      }
    };
    
    this.logs.push(errorLog);
    this.persistLog(errorLog);
    
    Logger.log(`[AuditLogger] Error logged: ${errorMessage}`);
    
  } catch (logError) {
    Logger.log(`[AuditLogger] Error logging error: ${logError.message}`);
  }
};

/**
 * Log performance metrics
 * @param {Object} metrics - Performance metrics
 */
AuditLogger.prototype.logPerformanceMetrics = function(metrics) {
  try {
    var performanceLog = {
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      type: 'performance',
      level: 'INFO',
      message: 'Performance metrics recorded',
      metadata: {
        metrics: metrics,
        sessionMetrics: this.performanceMetrics,
        memoryUsage: this.getMemoryUsage(),
        executionTime: new Date().getTime() - this.sessionStartTime.getTime()
      }
    };
    
    this.logs.push(performanceLog);
    this.persistLog(performanceLog);
    
    // Update internal metrics
    if (metrics.apiCallsCount) {
      this.performanceMetrics.apiCallsCount += metrics.apiCallsCount;
    }
    if (metrics.retryCount) {
      this.performanceMetrics.retryCount += metrics.retryCount;
    }
    
  } catch (error) {
    Logger.log(`[AuditLogger] Error logging performance metrics: ${error.message}`);
  }
};

/**
 * Generate comprehensive audit report
 */
AuditLogger.prototype.generateAuditReport = function() {
  try {
    var sessionEndTime = new Date();
    var totalDuration = sessionEndTime.getTime() - this.sessionStartTime.getTime();
    
    var report = {
      sessionId: this.sessionId,
      sessionStartTime: this.sessionStartTime.toISOString(),
      sessionEndTime: sessionEndTime.toISOString(),
      totalDuration: totalDuration,
      summary: {
        totalLogs: this.logs.length,
        logsByType: this.getLogsByType(),
        logsByLevel: this.getLogsByLevel(),
        performanceMetrics: this.performanceMetrics
      },
      logs: this.logs,
      generatedAt: sessionEndTime.toISOString()
    };
    
    // Persist the complete report
    this.persistAuditReport(report);
    
    Logger.log(`[AuditLogger] Audit report generated for session: ${this.sessionId}`);
    return report;
    
  } catch (error) {
    Logger.log(`[AuditLogger] Error generating audit report: ${error.message}`);
    return {
      sessionId: this.sessionId,
      error: error.message,
      generatedAt: new Date().toISOString()
    };
  }
};

/**
 * Get logs grouped by type
 */
AuditLogger.prototype.getLogsByType = function() {
  var logsByType = {};
  
  for (var i = 0; i < this.logs.length; i++) {
    var log = this.logs[i];
    var type = log.type || 'unknown';
    
    if (!logsByType[type]) {
      logsByType[type] = 0;
    }
    logsByType[type]++;
  }
  
  return logsByType;
};

/**
 * Get logs grouped by level
 */
AuditLogger.prototype.getLogsByLevel = function() {
  var logsByLevel = {};
  
  for (var i = 0; i < this.logs.length; i++) {
    var log = this.logs[i];
    var level = log.level || 'UNKNOWN';
    
    if (!logsByLevel[level]) {
      logsByLevel[level] = 0;
    }
    logsByLevel[level]++;
  }
  
  return logsByLevel;
};

/**
 * Get memory usage information
 */
AuditLogger.prototype.getMemoryUsage = function() {
  try {
    // Apps Script doesn't provide direct memory usage, so we estimate
    var logsSize = JSON.stringify(this.logs).length;
    var estimatedMemory = logsSize + (this.logs.length * 100); // Rough estimate
    
    return {
      estimatedLogsSize: logsSize,
      estimatedTotalMemory: estimatedMemory,
      logCount: this.logs.length,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Persist individual log entry
 * @param {Object} logEntry - Log entry to persist
 */
AuditLogger.prototype.persistLog = function(logEntry) {
  try {
    var properties = PropertiesService.getScriptProperties();
    var logKey = `audit_log_${this.sessionId}_${Date.now()}`;
    
    // Store individual log entry
    properties.setProperty(logKey, JSON.stringify(logEntry));
    
    // Update session log index
    var sessionIndexKey = `audit_session_${this.sessionId}`;
    var sessionIndex = properties.getProperty(sessionIndexKey);
    var logKeys = sessionIndex ? JSON.parse(sessionIndex) : [];
    logKeys.push(logKey);
    
    properties.setProperty(sessionIndexKey, JSON.stringify(logKeys));
    
  } catch (error) {
    Logger.log(`[AuditLogger] Error persisting log: ${error.message}`);
  }
};

/**
 * Persist complete audit report
 * @param {Object} report - Complete audit report
 */
AuditLogger.prototype.persistAuditReport = function(report) {
  try {
    var properties = PropertiesService.getScriptProperties();
    var reportKey = `audit_report_${this.sessionId}`;
    
    properties.setProperty(reportKey, JSON.stringify(report));
    
    // Update reports index
    var reportsIndexKey = 'audit_reports_index';
    var reportsIndex = properties.getProperty(reportsIndexKey);
    var reportKeys = reportsIndex ? JSON.parse(reportsIndex) : [];
    
    if (reportKeys.indexOf(reportKey) === -1) {
      reportKeys.push(reportKey);
      properties.setProperty(reportsIndexKey, JSON.stringify(reportKeys));
    }
    
    Logger.log(`[AuditLogger] Audit report persisted: ${reportKey}`);
    
  } catch (error) {
    Logger.log(`[AuditLogger] Error persisting audit report: ${error.message}`);
  }
};

/**
 * Load audit report by session ID
 * @param {string} sessionId - Session ID to load
 */
AuditLogger.prototype.loadAuditReport = function(sessionId) {
  try {
    var properties = PropertiesService.getScriptProperties();
    var reportKey = `audit_report_${sessionId}`;
    var reportJson = properties.getProperty(reportKey);
    
    if (reportJson) {
      return JSON.parse(reportJson);
    }
    
    return null;
    
  } catch (error) {
    Logger.log(`[AuditLogger] Error loading audit report: ${error.message}`);
    return null;
  }
};

/**
 * Clean up old audit logs and reports
 * @param {number} maxAgeHours - Maximum age in hours (default: 168 = 7 days)
 */
AuditLogger.prototype.cleanupOldAudits = function(maxAgeHours) {
  maxAgeHours = maxAgeHours || 168; // Default 7 days
  
  try {
    var properties = PropertiesService.getScriptProperties();
    var allProperties = properties.getProperties();
    var cutoffTime = new Date().getTime() - (maxAgeHours * 60 * 60 * 1000);
    
    var deletedCount = 0;
    
    for (var key in allProperties) {
      if (key.startsWith('audit_log_') || key.startsWith('audit_report_')) {
        try {
          var data = JSON.parse(allProperties[key]);
          var logTime = new Date(data.timestamp || data.sessionStartTime).getTime();
          
          if (logTime < cutoffTime) {
            properties.deleteProperty(key);
            deletedCount++;
          }
        } catch (e) {
          // Delete invalid entries
          properties.deleteProperty(key);
          deletedCount++;
        }
      }
    }
    
    Logger.log(`[AuditLogger] Cleaned up ${deletedCount} old audit entries`);
    return deletedCount;
    
  } catch (error) {
    Logger.log(`[AuditLogger] Error cleaning up old audits: ${error.message}`);
    return 0;
  }
};

// ===== ACCEPTANCE CRITERIA METHODS =====

/**
 * Start session (alias for startExportSession for acceptance criteria)
 * @param {string} sheetName - Sheet name
 * @param {Object} options - Session options
 */
AuditLogger.prototype.startSession = function(sheetName, options) {
  return this.startExportSession({
    sheetName: sheetName,
    user: options.user,
    options: options
  });
};

/**
 * Log operation for acceptance criteria testing
 * @param {string} operation - Operation name
 * @param {string} message - Operation message
 * @param {Object} metadata - Operation metadata
 */
AuditLogger.prototype.logOperation = function(operation, message, metadata) {
  try {
    var operationLog = {
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      type: 'operation',
      level: 'INFO',
      operation: operation,
      message: message,
      metadata: metadata || {}
    };
    
    this.logs.push(operationLog);
    this.persistLog(operationLog);
    
    // Update performance metrics
    this.performanceMetrics.totalOperations++;
    this.performanceMetrics.successfulOperations++;
    
  } catch (error) {
    Logger.log(`[AuditLogger] Error logging operation: ${error.message}`);
  }
};

/**
 * Log batch for acceptance criteria testing
 * @param {string} batchId - Batch identifier
 * @param {Object} batchResults - Batch results
 */
AuditLogger.prototype.logBatch = function(batchId, batchResults) {
  try {
    var batchLog = {
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      type: 'batch',
      level: 'INFO',
      message: `Batch ${batchId} processed`,
      metadata: {
        batchId: batchId,
        processed: batchResults.processed || 0,
        failed: batchResults.failed || 0,
        results: batchResults
      }
    };
    
    this.logs.push(batchLog);
    this.persistLog(batchLog);
    
    // Update performance metrics
    this.performanceMetrics.totalOperations++;
    if (batchResults.failed === 0) {
      this.performanceMetrics.successfulOperations++;
    } else {
      this.performanceMetrics.failedOperations++;
    }
    
  } catch (error) {
    Logger.log(`[AuditLogger] Error logging batch: ${error.message}`);
  }
};

/**
 * Record performance metric for acceptance criteria testing
 * @param {string} metricName - Metric name
 * @param {number} value - Metric value
 * @param {boolean} success - Whether operation was successful
 */
AuditLogger.prototype.recordPerformanceMetric = function(metricName, value, success) {
  try {
    var metricLog = {
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      type: 'performance_metric',
      level: 'INFO',
      message: `Performance metric: ${metricName}`,
      metadata: {
        metricName: metricName,
        value: value,
        success: success
      }
    };
    
    this.logs.push(metricLog);
    this.persistLog(metricLog);
    
    // Update performance metrics
    this.performanceMetrics.totalOperations++;
    if (success) {
      this.performanceMetrics.successfulOperations++;
    } else {
      this.performanceMetrics.failedOperations++;
    }
    
  } catch (error) {
    Logger.log(`[AuditLogger] Error recording performance metric: ${error.message}`);
  }
};

/**
 * Generate session report (alias for generateAuditReport for acceptance criteria)
 * @return {Object} Session report
 */
AuditLogger.prototype.generateSessionReport = function() {
  try {
    var report = {
      sessionId: this.sessionId,
      sessionStartTime: this.sessionStartTime.toISOString(),
      sessionEndTime: new Date().toISOString(),
      totalDuration: new Date().getTime() - this.sessionStartTime.getTime(),
      summary: {
        totalLogs: this.logs.length,
        logsByLevel: this.getLogsByLevel(),
        logsByType: this.getLogsByType(),
        performanceMetrics: this.performanceMetrics
      },
      logs: this.logs
    };
    
    // Persist the report
    this.persistAuditReport(report);
    
    return report;
  } catch (error) {
    Logger.log(`[AuditLogger] Error generating session report: ${error.message}`);
    return {
      sessionId: this.sessionId,
      error: error.message,
      summary: {
        totalLogs: this.logs.length,
        performanceMetrics: this.performanceMetrics
      }
    };
  }
};
