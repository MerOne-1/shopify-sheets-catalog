// Milestone 2: Base Importer with Core Functionality
// Focused, modular component (~200 lines)

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
  // Normalize data by extracting only core comparable fields
  var normalizedData = this.normalizeDataForHash(data);
  var hashInput = JSON.stringify(normalizedData);
  return Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, hashInput)
    .map(function(byte) {
      return (byte + 256).toString(16).slice(1);
    }).join('');
};

BaseImporter.prototype.normalizeDataForHash = function(data) {
  // Define core fields that should be compared (exclude metadata and API-specific fields)
  var coreFields = [
    'id', 'title', 'handle', 'body_html', 'vendor', 'product_type',
    'created_at', 'updated_at', 'published_at', 'template_suffix',
    'tags', 'status'
  ];
  
  var normalized = {};
  
  // Extract only core fields in consistent order
  for (var i = 0; i < coreFields.length; i++) {
    var field = coreFields[i];
    if (data[field] !== undefined && data[field] !== null) {
      // Normalize the value
      var value = data[field];
      
      // Convert arrays to sorted strings for consistent comparison
      if (Array.isArray(value)) {
        value = value.sort().join(',');
      }
      // Convert to string and trim whitespace
      else if (typeof value === 'string') {
        value = value.trim();
      }
      // Convert boolean published_at to consistent format
      else if (field === 'published_at' && typeof value === 'boolean') {
        value = value ? 'published' : '';
      }
      
      normalized[field] = value;
    }
  }
  
  return normalized;
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
  var dataRange = sheet.getRange(1, 1, sheet.getLastRow(), existingHeaders.length);
  var allData = dataRange.getValues();
  
  // Create mapping from old positions to new positions
  var columnMapping = {};
  for (var i = 0; i < existingHeaders.length; i++) {
    var targetIndex = targetHeaders.indexOf(existingHeaders[i]);
    if (targetIndex !== -1) {
      columnMapping[i] = targetIndex;
    }
  }
  
  // Reorganize data according to new header order
  var reorganizedData = [];
  for (var row = 0; row < allData.length; row++) {
    var newRow = new Array(targetHeaders.length);
    
    if (row === 0) {
      // Header row
      newRow = targetHeaders.slice();
    } else {
      // Data row
      for (var oldCol = 0; oldCol < existingHeaders.length; oldCol++) {
        var newCol = columnMapping[oldCol];
        if (newCol !== undefined) {
          newRow[newCol] = allData[row][oldCol];
        }
      }
    }
    
    reorganizedData.push(newRow);
  }
  
  // Clear existing data and write reorganized data
  sheet.clear();
  if (reorganizedData.length > 0) {
    var newRange = sheet.getRange(1, 1, reorganizedData.length, targetHeaders.length);
    newRange.setValues(reorganizedData);
    
    // Format header row
    var headerRange = sheet.getRange(1, 1, 1, targetHeaders.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#f0f0f0');
  }
  
  this.logProgress('✅ Column reorganization completed safely');
};

BaseImporter.prototype.handleRateLimit = function() {
  Utilities.sleep(200); // 200ms delay
};

// SIMPLIFIED: API request with better error handling but no header complexity
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

BaseImporter.prototype.batchWriteToSheet = function(sheet, data) {
  if (data.length === 0) return;
  
  var existingData = this.getExistingSheetData(sheet);
  var existingMap = {};
  var existingRowMap = {};
  
  // Build map of existing products and their row numbers
  for (var i = 0; i < existingData.length; i++) {
    var id = existingData[i].id;
    existingMap[id] = existingData[i];
    existingRowMap[id] = i + 2; // +2 because sheet is 1-indexed and has header
  }
  
  var updatedCount = 0;
  var addedCount = 0;
  
  for (var j = 0; j < data.length; j++) {
    var rowData = data[j];
    var productId = rowData[0]; // ID is first column
    
    if (existingRowMap[productId]) {
      // Update existing row
      var rowNum = existingRowMap[productId];
      var range = sheet.getRange(rowNum, 1, 1, rowData.length);
      range.setValues([rowData]);
      updatedCount++;
    } else {
      // Append new row
      var lastRow = sheet.getLastRow() + 1;
      var range = sheet.getRange(lastRow, 1, 1, rowData.length);
      range.setValues([rowData]);
      addedCount++;
    }
  }
  
  this.logProgress('Updated ' + updatedCount + ' rows, added ' + addedCount + ' new rows');
};
