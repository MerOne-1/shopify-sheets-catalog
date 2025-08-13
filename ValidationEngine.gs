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
      var existingHash = existingRecord._hash;
      
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
