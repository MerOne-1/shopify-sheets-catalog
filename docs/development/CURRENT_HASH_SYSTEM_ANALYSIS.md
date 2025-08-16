# Current Hash Detection System - Complete Analysis

## System Architecture

### **ExportManager Components**
```javascript
function ExportManager() {
  this.validator = new ValidationEngine();           // Hash calculation
  this.exportValidator = new ExportValidator();      // Export validation
  // ... other components
}
```

### **Data Flow**
1. `getSheetData(sheetName)` → Reads sheet into array of objects
2. `detectChanges(sheetData, options)` → Processes each record
3. `this.validator.calculateHash(record)` → Generates current hash
4. Compare `currentHash` vs `record._hash` → Determine changes

## Current detectChanges Implementation

```javascript
ExportManager.prototype.detectChanges = function(sheetData, options) {
  var changes = { toAdd: [], toUpdate: [], unchanged: [] };
  
  for (var i = 0; i < sheetData.length; i++) {
    var record = sheetData[i];
    
    if (!record.id || record.id === '') continue;
    
    // KEY LINE: Calculate hash from current sheet data
    var currentHash = this.validator.calculateHash(record);
    var storedHash = record._hash || '';
    
    if (storedHash === '') {
      changes.toAdd.push(record);           // New record
    } else if (currentHash !== storedHash) {
      changes.toUpdate.push(record);        // Modified record
    } else {
      changes.unchanged.push(record);       // Unchanged record
    }
  }
  
  return changes;
};
```

## ValidationEngine Hash System

### **Hash Calculation Chain**
```javascript
ValidationEngine.calculateHash(data)
  ↓
ValidationEngine.normalizeDataForHash(data)
  ↓
JSON.stringify(normalizedData)
  ↓
Utilities.computeDigest(MD5, hashInput)
```

### **Field Normalization (Lines 265-300)**
```javascript
ValidationEngine.prototype.normalizeDataForHash = function(data) {
  var coreFields = [
    'id', 'title', 'handle', 'body_html', 'vendor', 'product_type',
    'created_at', 'updated_at', 'published_at', 'template_suffix',
    'tags', 'status'
  ];
  
  var normalized = {};
  for (var i = 0; i < coreFields.length; i++) {
    var field = coreFields[i];
    if (data[field] !== undefined && data[field] !== null) {
      var value = data[field];
      
      // Normalize arrays, strings, booleans
      if (Array.isArray(value)) {
        value = value.sort().join(',');
      } else if (typeof value === 'string') {
        value = value.trim();
      } else if (field === 'published_at' && typeof value === 'boolean') {
        value = value ? 'published' : '';
      }
      
      normalized[field] = value;
    }
  }
  
  return normalized;
};
```

## Current System Behavior Analysis

### **What Works:**
- ✅ Consistent hash generation using MD5
- ✅ Field normalization (arrays, strings, booleans)
- ✅ Excludes non-core fields from hash calculation
- ✅ Proper change categorization (toAdd, toUpdate, unchanged)

### **The Problem:**
- ❌ **Hash calculation includes ALL current sheet data**
- ❌ **System fields like `_hash` are included in the record object**
- ❌ **Manual sheet changes may not be detected if normalization is too aggressive**

### **Critical Issue:**
When `getSheetData()` reads the sheet, it creates objects like:
```javascript
{
  id: '123',
  title: 'Product Name',
  vendor: 'Vendor Name',
  price: '29.99',
  _hash: 'abc123def456...',  // ← This gets included in hash calculation!
  // ... other fields
}
```

The `normalizeDataForHash()` only looks at `coreFields`, so it **should** exclude `_hash`, but let's verify what fields are actually being processed.

## Test Scenario

### **Manual Edit Example:**
1. User changes price from `29.99` to `30.00` in sheet
2. `getSheetData()` reads: `{id: '123', price: '30.00', _hash: 'old_hash'}`
3. `calculateHash()` processes the record with new price
4. `normalizeDataForHash()` extracts only core fields (should include price if it's a core field)
5. **Expected:** New hash ≠ old hash → Detect change
6. **Actual:** May not detect if price isn't in `coreFields` list

## Key Questions to Investigate

1. **Is `price` in the `coreFields` list?** (Currently it's NOT)
2. **What fields are actually being used for hash calculation?**
3. **Are variant-specific fields being normalized properly?**
4. **Does the system handle both Products and Variants sheets correctly?**

## Potential Issues

### **Missing Fields in coreFields:**
The current `coreFields` array only includes product-level fields:
```javascript
var coreFields = [
  'id', 'title', 'handle', 'body_html', 'vendor', 'product_type',
  'created_at', 'updated_at', 'published_at', 'template_suffix',
  'tags', 'status'
];
```

**Missing important fields:**
- `price` (critical for variants)
- `compare_at_price`
- `inventory_quantity`
- `sku`
- `barcode`
- `weight`
- `requires_shipping`

### **Sheet-Specific Field Lists:**
The system should use different field lists for:
- **Products sheet:** Current `coreFields` are appropriate
- **Variants sheet:** Needs variant-specific fields including `price`

## Next Steps for Investigation

1. **Test with variant data** to see if price changes are detected
2. **Check if field lists are sheet-specific**
3. **Verify actual hash calculation behavior with real data**
4. **Determine if the issue is missing fields or calculation logic**
