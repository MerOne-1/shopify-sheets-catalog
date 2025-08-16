// Milestone 3: Retry Manager
// Failure recovery and resume logic component (~150 lines)

function RetryManager(config) {
  this.configManager = config || new ConfigManager();
  this.maxRetries = parseInt(this.configManager.getConfigValue('max_retries')) || 3;
  this.baseDelay = parseInt(this.configManager.getConfigValue('retry_base_delay')) || 1000;
  this.maxDelay = parseInt(this.configManager.getConfigValue('retry_max_delay')) || 30000;
  this.retryState = {};
}

/**
 * Execute API call with retry logic
 * @param {Object} apiClient - ApiClient instance
 * @param {string} endpoint - API endpoint
 * @param {string} method - HTTP method
 * @param {Object} payload - Request payload
 */
RetryManager.prototype.executeWithRetry = function(apiClient, endpoint, method, payload) {
  var attemptCount = 0;
  var lastError = null;
  
  while (attemptCount < this.maxRetries) {
    attemptCount++;
    
    try {
      Logger.log(`[RetryManager] Attempt ${attemptCount}/${this.maxRetries} for ${method} ${endpoint}`);
      
      // Execute the API call
      var response = apiClient.makeRequest(endpoint, method, payload);
      
      // Success - return immediately
      return {
        success: true,
        data: response,
        attempts: attemptCount,
        endpoint: endpoint,
        method: method
      };
      
    } catch (error) {
      lastError = error;
      Logger.log(`[RetryManager] Attempt ${attemptCount} failed: ${error.message}`);
      
      // Categorize the error
      var errorCategory = this.categorizeError(error);
      
      // Check if we should retry
      if (!this.shouldRetry(error, attemptCount)) {
        Logger.log(`[RetryManager] Not retrying - ${errorCategory.reason}`);
        break;
      }
      
      // Calculate backoff delay (except for last attempt)
      if (attemptCount < this.maxRetries) {
        var delay = this.calculateBackoff(attemptCount, errorCategory);
        Logger.log(`[RetryManager] Waiting ${delay}ms before retry...`);
        Utilities.sleep(delay);
      }
    }
  }
  
  // All retries exhausted
  Logger.log(`[RetryManager] All ${this.maxRetries} attempts failed for ${method} ${endpoint}`);
  
  return {
    success: false,
    error: lastError ? lastError.message : 'Unknown error',
    attempts: attemptCount,
    endpoint: endpoint,
    method: method,
    finalError: lastError
  };
};

/**
 * Determine if an error should trigger a retry
 * @param {Error} error - The error that occurred
 * @param {number} attemptCount - Current attempt number
 */
RetryManager.prototype.shouldRetry = function(error, attemptCount) {
  // Don't retry if we've reached max attempts
  if (attemptCount >= this.maxRetries) {
    return false;
  }
  
  var errorCategory = this.categorizeError(error);
  
  // Don't retry fatal errors
  if (errorCategory.fatal) {
    return false;
  }
  
  // Retry retryable errors
  return errorCategory.retryable;
};

/**
 * Categorize error to determine retry strategy
 * @param {Error} error - The error to categorize
 */
RetryManager.prototype.categorizeError = function(error) {
  var message = error.message.toLowerCase();
  
  // Rate limiting errors (definitely retryable)
  if (message.includes('429') || message.includes('rate limit')) {
    return {
      type: 'rate_limit',
      retryable: true,
      fatal: false,
      backoffMultiplier: 2,
      reason: 'Rate limit - will retry with backoff'
    };
  }
  
  // Network/timeout errors (retryable)
  if (message.includes('timeout') || message.includes('network') || 
      message.includes('connection') || message.includes('502') || 
      message.includes('503') || message.includes('504')) {
    return {
      type: 'network',
      retryable: true,
      fatal: false,
      backoffMultiplier: 1.5,
      reason: 'Network/timeout error - will retry'
    };
  }
  
  // Server errors (retryable)
  if (message.includes('500') || message.includes('internal server error')) {
    return {
      type: 'server_error',
      retryable: true,
      fatal: false,
      backoffMultiplier: 2,
      reason: 'Server error - will retry'
    };
  }
  
  // Authentication errors (fatal - don't retry)
  if (message.includes('401') || message.includes('unauthorized') || 
      message.includes('authentication') || message.includes('invalid token')) {
    return {
      type: 'authentication',
      retryable: false,
      fatal: true,
      reason: 'Authentication error - will not retry'
    };
  }
  
  // Permission errors (fatal - don't retry)
  if (message.includes('403') || message.includes('forbidden') || 
      message.includes('permission')) {
    return {
      type: 'permission',
      retryable: false,
      fatal: true,
      reason: 'Permission error - will not retry'
    };
  }
  
  // Not found errors (fatal - don't retry)
  if (message.includes('404') || message.includes('not found')) {
    return {
      type: 'not_found',
      retryable: false,
      fatal: true,
      reason: 'Resource not found - will not retry'
    };
  }
  
  // Validation errors (fatal - don't retry)
  if (message.includes('400') || message.includes('bad request') || 
      message.includes('validation') || message.includes('invalid')) {
    return {
      type: 'validation',
      retryable: false,
      fatal: true,
      reason: 'Validation error - will not retry'
    };
  }
  
  // Unknown errors (retryable with caution)
  return {
    type: 'unknown',
    retryable: true,
    fatal: false,
    backoffMultiplier: 1.5,
    reason: 'Unknown error - will retry with caution'
  };
};

/**
 * Calculate exponential backoff delay
 * @param {number} attemptCount - Current attempt number
 * @param {Object} errorCategory - Error category information
 */
RetryManager.prototype.calculateBackoff = function(attemptCount, errorCategory) {
  var multiplier = errorCategory.backoffMultiplier || 2;
  var delay = this.baseDelay * Math.pow(multiplier, attemptCount - 1);
  
  // Add jitter to prevent thundering herd
  var jitter = Math.random() * 0.1 * delay;
  delay += jitter;
  
  // Cap at maximum delay
  delay = Math.min(delay, this.maxDelay);
  
  return Math.round(delay);
};

/**
 * Save retry state for resumability
 * @param {string} operationId - Unique operation identifier
 * @param {Object} state - State to save
 */
RetryManager.prototype.saveRetryState = function(operationId, state) {
  try {
    var properties = PropertiesService.getScriptProperties();
    var stateKey = 'retry_state_' + operationId;
    
    var stateData = {
      operationId: operationId,
      timestamp: new Date().toISOString(),
      attempts: state.attempts || 0,
      lastError: state.lastError || null,
      nextRetryAt: state.nextRetryAt || null,
      endpoint: state.endpoint || null,
      method: state.method || null,
      payload: state.payload || null
    };
    
    properties.setProperty(stateKey, JSON.stringify(stateData));
    Logger.log(`[RetryManager] Retry state saved for operation: ${operationId}`);
    
  } catch (error) {
    Logger.log(`[RetryManager] Error saving retry state: ${error.message}`);
  }
};

/**
 * Load retry state for resumability
 * @param {string} operationId - Unique operation identifier
 */
RetryManager.prototype.loadRetryState = function(operationId) {
  try {
    var properties = PropertiesService.getScriptProperties();
    var stateKey = 'retry_state_' + operationId;
    var stateJson = properties.getProperty(stateKey);
    
    if (stateJson) {
      var state = JSON.parse(stateJson);
      Logger.log(`[RetryManager] Retry state loaded for operation: ${operationId}`);
      return state;
    }
    
    return null;
    
  } catch (error) {
    Logger.log(`[RetryManager] Error loading retry state: ${error.message}`);
    return null;
  }
};

/**
 * Clean up retry state after completion
 * @param {string} operationId - Unique operation identifier
 */
RetryManager.prototype.cleanupRetryState = function(operationId) {
  try {
    var properties = PropertiesService.getScriptProperties();
    var stateKey = 'retry_state_' + operationId;
    properties.deleteProperty(stateKey);
    Logger.log(`[RetryManager] Retry state cleaned up for operation: ${operationId}`);
    
  } catch (error) {
    Logger.log(`[RetryManager] Error cleaning up retry state: ${error.message}`);
  }
};

/**
 * Get retry statistics for monitoring
 */
RetryManager.prototype.getRetryStats = function() {
  try {
    var properties = PropertiesService.getScriptProperties();
    var allProperties = properties.getProperties();
    
    var retryStates = [];
    var activeRetries = 0;
    var completedRetries = 0;
    
    for (var key in allProperties) {
      if (key.startsWith('retry_state_')) {
        try {
          var state = JSON.parse(allProperties[key]);
          retryStates.push(state);
          
          if (state.nextRetryAt && new Date(state.nextRetryAt) > new Date()) {
            activeRetries++;
          } else {
            completedRetries++;
          }
        } catch (e) {
          // Ignore invalid state entries
        }
      }
    }
    
    return {
      totalRetryStates: retryStates.length,
      activeRetries: activeRetries,
      completedRetries: completedRetries,
      retryStates: retryStates
    };
    
  } catch (error) {
    Logger.log(`[RetryManager] Error getting retry stats: ${error.message}`);
    return {
      totalRetryStates: 0,
      activeRetries: 0,
      completedRetries: 0,
      retryStates: [],
      error: error.message
    };
  }
};

/**
 * Validate retry state integrity
 * @param {Object} state - State to validate
 */
RetryManager.prototype.validateStateIntegrity = function(state) {
  if (!state) {
    return { valid: false, reason: 'State is null or undefined' };
  }
  
  if (!state.operationId) {
    return { valid: false, reason: 'Missing operationId' };
  }
  
  if (!state.timestamp) {
    return { valid: false, reason: 'Missing timestamp' };
  }
  
  if (typeof state.attempts !== 'number' || state.attempts < 0) {
    return { valid: false, reason: 'Invalid attempts count' };
  }
  
  // Check if state is too old (older than 24 hours)
  var stateAge = new Date().getTime() - new Date(state.timestamp).getTime();
  var maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  
  if (stateAge > maxAge) {
    return { valid: false, reason: 'State is too old (>24 hours)' };
  }
  
  return { valid: true, reason: 'State is valid' };
};
