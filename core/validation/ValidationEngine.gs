// Milestone 2: Validation Engine
// Focused validation component (~200 lines)

function ValidationEngine() {
  this.errors = [];
  this.warnings = [];
}

ValidationEngine.prototype.validateData = function(data, type, options) {
  options = options || {};
  this.errors = [];
  this.warnings = [];
  
  var validRecords = 0;
  var invalidRecords = 0;
  var recordsWithWarnings = 0;
  
  for (var i = 0; i < data.length; i++) {
    var record = data[i];
    var recordErrors = [];
    var recordWarnings = [];
    
    // Get validation rules for this type
    var requiredFields = this.getRequiredFields(type);
    var fieldValidations = this.getFieldValidations(type);
    
    // Required field validation
    for (var j = 0; j < requiredFields.length; j++) {
      var field = requiredFields[j];
      if (!record[field] || record[field] === '') {
        recordErrors.push('Missing required field: ' + field);
      }
    }
    
    // Field-specific validation
    for (var field in fieldValidations) {
      if (record[field] !== undefined && record[field] !== null && record[field] !== '') {
        var validation = fieldValidations[field];
        var fieldError = this.validateField(record[field], validation);
        if (fieldError) {
          recordErrors.push('Invalid ' + field + ': ' + fieldError);
        }
      }
    }
    
    // Business rule warnings
    var businessWarnings = this.checkForWarnings(record, type);
    recordWarnings = recordWarnings.concat(businessWarnings);
    
    // Collect results
    if (recordErrors.length > 0) {
      invalidRecords++;
      this.errors.push({
        recordIndex: i,
        recordId: record.id || 'Unknown',
        errors: recordErrors
      });
    } else {
      validRecords++;
    }
    
    if (recordWarnings.length > 0) {
      recordsWithWarnings++;
      this.warnings.push({
        recordIndex: i,
        recordId: record.id || 'Unknown',
        warnings: recordWarnings
      });
    }
  }
  
  return {
    isValid: invalidRecords === 0,
    errors: this.errors,
    warnings: this.warnings,
    summary: {
      totalRecords: data.length,
      validRecords: validRecords,
      invalidRecords: invalidRecords,
      recordsWithWarnings: recordsWithWarnings
    }
  };
};

ValidationEngine.prototype.getRequiredFields = function(type) {
  switch (type) {
    case 'product':
      return ['id', 'title', 'handle'];
    case 'variant':
      return ['id', 'product_id'];
    default:
      return [];
  }
};

ValidationEngine.prototype.getFieldValidations = function(type) {
  switch (type) {
    case 'product':
      return {
        id: { type: 'number', min: 1 },
        handle: { type: 'string', pattern: /^[a-z0-9-]+$/ },
        price: { type: 'number', min: 0 },
        compare_at_price: { type: 'number', min: 0 }
      };
    case 'variant':
      return {
        id: { type: 'number', min: 1 },
        product_id: { type: 'number', min: 1 },
        price: { type: 'number', min: 0 },
        compare_at_price: { type: 'number', min: 0 },
        inventory_quantity: { type: 'number', min: 0 }
      };
    default:
      return {};
  }
};

ValidationEngine.prototype.validateField = function(value, validation) {
  if (validation.type === 'number') {
    var num = parseFloat(value);
    if (isNaN(num)) {
      return 'must be a number';
    }
    if (validation.min !== undefined && num < validation.min) {
      return 'must be at least ' + validation.min;
    }
    if (validation.max !== undefined && num > validation.max) {
      return 'must be at most ' + validation.max;
    }
  }
  
  if (validation.type === 'string') {
    if (typeof value !== 'string') {
      return 'must be a string';
    }
    if (validation.pattern && !validation.pattern.test(value)) {
      return 'format is invalid';
    }
    if (validation.minLength && value.length < validation.minLength) {
      return 'must be at least ' + validation.minLength + ' characters';
    }
    if (validation.maxLength && value.length > validation.maxLength) {
      return 'must be at most ' + validation.maxLength + ' characters';
    }
  }
  
  return null;
};

ValidationEngine.prototype.checkForWarnings = function(record, type) {
  var warnings = [];
  
  switch (type) {
    case 'product':
      if (!record.body_html || record.body_html.trim() === '') {
        warnings.push('Missing product description');
      }
      if (!record.vendor || record.vendor.trim() === '') {
        warnings.push('Missing vendor information');
      }
      if (!record.product_type || record.product_type.trim() === '') {
        warnings.push('Missing product type');
      }
      if (record.status !== 'active') {
        warnings.push('Product is not active (status: ' + record.status + ')');
      }
      break;
      
    case 'variant':
      if (!record.title || record.title.trim() === '') {
        warnings.push('Missing variant title');
      }
      if (record.inventory_quantity === 0) {
        warnings.push('Variant is out of stock');
      }
      if (record.inventory_quantity < 0) {
        warnings.push('Negative inventory quantity');
      }
      if (!record.price || record.price <= 0) {
        warnings.push('Invalid or missing price');
      }
      break;
  }
  
  return warnings;
};

// Add validation methods to BaseImporter prototype
BaseImporter.prototype.validateData = function(data, options) {
  var validator = new ValidationEngine();
  var type = this.getSheetName().toLowerCase().replace('s', ''); // 'Products' -> 'product'
  return validator.validateData(data, type, options);
};

BaseImporter.prototype.getIncrementalChanges = function(newData, existingData) {
  var changes = {
    toAdd: [],
    toUpdate: [],
    toDelete: [],
    unchanged: []
  };
  
  // Create hash map of existing data
  var existingMap = {};
  for (var i = 0; i < existingData.length; i++) {
    var record = existingData[i];
    if (record.id) {
      existingMap[record.id] = record;
    }
  }
  
  // Compare new data with existing
  for (var i = 0; i < newData.length; i++) {
    var newRecord = newData[i];
    var existingRecord = existingMap[newRecord.id];
    
    if (!existingRecord) {
      changes.toAdd.push(newRecord);
    } else {
      var newHash = this.calculateHash(newRecord);
      var existingHash = this.calculateHash(existingRecord);
      
      if (newHash !== existingHash) {
        changes.toUpdate.push(newRecord);
      } else {
        changes.unchanged.push(newRecord);
      }
    }
  }
  
  return changes;
};

BaseImporter.prototype.getExistingSheetData = function(sheet) {
  if (sheet.getLastRow() <= 1) {
    return [];
  }
  
  var dataRange = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn());
  var values = dataRange.getValues();
  var headers = this.getExistingHeaders(sheet);
  
  var data = [];
  for (var i = 0; i < values.length; i++) {
    var record = {};
    for (var j = 0; j < headers.length; j++) {
      record[headers[j]] = values[i][j];
    }
    data.push(record);
  }
  
  return data;
};

ValidationEngine.prototype.calculateHash = function(data) {
  // Normalize data by extracting only core comparable fields
  var normalizedData = this.normalizeDataForHash(data);
  var hashInput = JSON.stringify(normalizedData);
  return Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, hashInput)
    .map(function(byte) {
      return (byte + 256).toString(16).slice(1);
    }).join('');
};

ValidationEngine.prototype.normalizeDataForHash = function(data) {
  // Define core fields that should be compared (exclude metadata and API-specific fields)
  // Includes both product and variant fields for comprehensive change detection
  var coreFields = [
    'id', 'title', 'handle', 'body_html', 'vendor', 'product_type',
    'created_at', 'updated_at', 'published_at', 'template_suffix',
    'tags', 'status',
    // Variant fields - CRITICAL for detecting price/inventory changes
    'price', 'compare_at_price', 'inventory_quantity', 'sku', 'barcode',
    'weight', 'weight_unit', 'requires_shipping', 'taxable', 'fulfillment_service',
    'inventory_management', 'inventory_policy', 'option1', 'option2', 'option3'
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

/**
 * Validate all sheets in the spreadsheet
 * @return {Object} Validation results for all sheets
 */
ValidationEngine.prototype.validateAllSheets = function() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var results = {
      success: true,
      sheets: [],
      totalErrors: 0,
      totalWarnings: 0,
      summary: {
        totalSheets: 0,
        validSheets: 0,
        invalidSheets: 0
      }
    };
    
    // Get all sheets
    var sheets = ss.getSheets();
    results.summary.totalSheets = sheets.length;
    
    for (var i = 0; i < sheets.length; i++) {
      var sheet = sheets[i];
      var sheetName = sheet.getName();
      
      // Skip system sheets
      if (sheetName === 'Config' || sheetName === 'Configuration') {
        continue;
      }
      
      var sheetResult = {
        name: sheetName,
        valid: true,
        errors: [],
        warnings: [],
        recordCount: 0
      };
      
      try {
        // Get data from sheet
        var lastRow = sheet.getLastRow();
        if (lastRow > 1) {
          var data = sheet.getDataRange().getValues();
          sheetResult.recordCount = lastRow - 1; // Exclude header
          
          // Basic validation - check for empty required columns
          if (sheetName === 'Products') {
            this.validateProductsSheet(data, sheetResult);
          } else if (sheetName === 'Variants') {
            this.validateVariantsSheet(data, sheetResult);
          }
        }
        
        if (sheetResult.errors.length > 0) {
          sheetResult.valid = false;
          results.success = false;
          results.summary.invalidSheets++;
        } else {
          results.summary.validSheets++;
        }
        
        results.totalErrors += sheetResult.errors.length;
        results.totalWarnings += sheetResult.warnings.length;
        
      } catch (error) {
        sheetResult.valid = false;
        sheetResult.errors.push('Sheet validation error: ' + error.message);
        results.success = false;
        results.summary.invalidSheets++;
      }
      
      results.sheets.push(sheetResult);
    }
    
    return results;
    
  } catch (error) {
    return {
      success: false,
      error: 'Validation failed: ' + error.message,
      sheets: [],
      totalErrors: 1,
      totalWarnings: 0
    };
  }
};

/**
 * Validate Products sheet data
 */
ValidationEngine.prototype.validateProductsSheet = function(data, result) {
  if (data.length < 2) return; // No data rows
  
  var headers = data[0];
  var requiredColumns = ['id', 'title', 'handle'];
  
  // Check for required columns
  for (var i = 0; i < requiredColumns.length; i++) {
    var col = requiredColumns[i];
    if (headers.indexOf(col) === -1) {
      result.errors.push('Missing required column: ' + col);
    }
  }
  
  // Check for duplicate IDs
  var ids = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var id = row[headers.indexOf('id')];
    if (id && ids.indexOf(id) !== -1) {
      result.errors.push('Duplicate product ID: ' + id + ' (row ' + (i + 1) + ')');
    }
    if (id) ids.push(id);
  }
};

/**
 * Validate Variants sheet data
 */
ValidationEngine.prototype.validateVariantsSheet = function(data, result) {
  if (data.length < 2) return; // No data rows
  
  var headers = data[0];
  var requiredColumns = ['id', 'product_id', 'title'];
  
  // Check for required columns
  for (var i = 0; i < requiredColumns.length; i++) {
    var col = requiredColumns[i];
    if (headers.indexOf(col) === -1) {
      result.errors.push('Missing required column: ' + col);
    }
  }
  
  // Check for duplicate IDs
  var ids = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var id = row[headers.indexOf('id')];
    if (id && ids.indexOf(id) !== -1) {
      result.errors.push('Duplicate variant ID: ' + id + ' (row ' + (i + 1) + ')');
    }
    if (id) ids.push(id);
  }
};