/**
 * Hash Consistency Analyzer
 * Debug why hash calculation differs between debugger and export manager
 */

var HashConsistencyAnalyzer = {
  
  /**
   * Compare hash calculation between different contexts
   */
  analyzeHashConsistency: function() {
    try {
      Logger.log('=== HASH CONSISTENCY ANALYSIS ===');
      
      // Get first 3 records for detailed analysis
      var exportManager = new ExportManager();
      var sheetData = exportManager.getSheetData('Variants');
      
      if (sheetData.length === 0) {
        return { error: 'No data found' };
      }
      
      var results = [];
      
      for (var i = 0; i < Math.min(3, sheetData.length); i++) {
        var record = sheetData[i];
        if (!record.id || record.id === '') continue;
        
        Logger.log(`\n--- ANALYZING RECORD ${i + 1}: ID ${record.id} ---`);
        
        // Method 1: Direct ValidationEngine
        var validator = new ValidationEngine();
        var hash1 = validator.calculateHash(record);
        
        // Method 2: Through ExportManager
        var hash2 = exportManager.validator.calculateHash(record);
        
        // Method 3: Fresh ValidationEngine instance
        var freshValidator = new ValidationEngine();
        var hash3 = freshValidator.calculateHash(record);
        
        // Get stored hash
        var storedHash = record._hash || '';
        
        Logger.log(`Stored hash:     "${storedHash}" (${storedHash.length} chars)`);
        Logger.log(`Direct validator: "${hash1}" (${hash1.length} chars)`);
        Logger.log(`Export validator: "${hash2}" (${hash2.length} chars)`);
        Logger.log(`Fresh validator:  "${hash3}" (${hash3.length} chars)`);
        
        var allMatch = hash1 === hash2 && hash2 === hash3;
        var matchesStored = hash1 === storedHash;
        
        Logger.log(`All calculations match: ${allMatch}`);
        Logger.log(`Matches stored: ${matchesStored}`);
        
        // Analyze normalized data
        var normalizedData = validator.normalizeDataForHash(record);
        Logger.log(`Normalized data keys: ${Object.keys(normalizedData).length}`);
        Logger.log(`Sample normalized:`, {
          id: normalizedData.id,
          price: normalizedData.price,
          option1: normalizedData.option1,
          inventory_quantity: normalizedData.inventory_quantity
        });
        
        results.push({
          recordId: record.id,
          storedHash: storedHash,
          calculatedHash: hash1,
          allCalculationsMatch: allMatch,
          matchesStored: matchesStored,
          normalizedKeys: Object.keys(normalizedData).length
        });
        
        if (!matchesStored) {
          Logger.log(`❌ MISMATCH DETECTED for record ${record.id}`);
          
          // Deep dive into the mismatch
          this.analyzeMismatch(record, storedHash, hash1, normalizedData);
        }
      }
      
      return {
        success: true,
        results: results,
        summary: {
          totalAnalyzed: results.length,
          mismatches: results.filter(function(r) { return !r.matchesStored; }).length
        }
      };
      
    } catch (error) {
      Logger.log(`Error in hash consistency analysis: ${error.message}`);
      return { error: error.message };
    }
  },
  
  /**
   * Deep analysis of hash mismatch
   */
  analyzeMismatch: function(record, storedHash, calculatedHash, normalizedData) {
    Logger.log(`\n🔍 DEEP MISMATCH ANALYSIS:`);
    
    // Check if stored hash format is corrupted
    if (storedHash.length !== calculatedHash.length) {
      Logger.log(`❌ LENGTH MISMATCH: stored=${storedHash.length}, calculated=${calculatedHash.length}`);
    }
    
    // Check for common corruption patterns
    var patterns = [
      { name: 'Truncation', test: function() { return storedHash === calculatedHash.substring(0, storedHash.length); } },
      { name: 'Scientific notation', test: function() { return storedHash.includes('E') || storedHash.includes('e'); } },
      { name: 'Number conversion', test: function() { return !isNaN(parseFloat(storedHash)); } },
      { name: 'Empty/null', test: function() { return storedHash === '' || storedHash === 'null'; } }
    ];
    
    for (var i = 0; i < patterns.length; i++) {
      var pattern = patterns[i];
      if (pattern.test()) {
        Logger.log(`✅ CORRUPTION PATTERN DETECTED: ${pattern.name}`);
      }
    }
    
    // Check if the issue is in the data itself
    Logger.log(`Record data sample:`, {
      id: record.id,
      title: record.title ? record.title.substring(0, 30) : 'N/A',
      price: record.price,
      option1: record.option1,
      inventory_quantity: record.inventory_quantity
    });
  },
  
  /**
   * Test hash calculation with known data
   */
  testHashCalculationStability: function() {
    Logger.log('=== TESTING HASH CALCULATION STABILITY ===');
    
    // Create test record with known values
    var testRecord = {
      id: '12345',
      title: 'Test Product',
      price: '29.99',
      option1: 'Red',
      option2: 'Large',
      inventory_quantity: '10',
      sku: 'TEST-SKU'
    };
    
    var validator = new ValidationEngine();
    var hashes = [];
    
    // Calculate hash 5 times
    for (var i = 0; i < 5; i++) {
      var hash = validator.calculateHash(testRecord);
      hashes.push(hash);
      Logger.log(`Hash ${i + 1}: "${hash}"`);
    }
    
    // Check if all hashes are identical
    var allSame = hashes.every(function(hash) { return hash === hashes[0]; });
    Logger.log(`All hashes identical: ${allSame}`);
    
    if (!allSame) {
      Logger.log(`❌ HASH CALCULATION IS UNSTABLE!`);
      Logger.log(`Unique hashes: ${[...new Set(hashes)].length}`);
    }
    
    return {
      stable: allSame,
      hashes: hashes,
      uniqueCount: [...new Set(hashes)].length
    };
  },
  
  /**
   * Complete analysis and fix recommendation
   */
  completeAnalysis: function() {
    Logger.log('=== COMPLETE HASH CONSISTENCY ANALYSIS ===');
    
    try {
      // Step 1: Analyze current consistency
      var consistencyResult = this.analyzeHashConsistency();
      
      // Step 2: Test calculation stability
      var stabilityResult = this.testHashCalculationStability();
      
      // Step 3: Generate recommendations
      var recommendations = [];
      
      if (consistencyResult.summary && consistencyResult.summary.mismatches > 0) {
        recommendations.push('CRITICAL: Hash mismatches detected - stored hashes are corrupted');
        recommendations.push('ACTION: Regenerate all hashes using current calculation method');
      }
      
      if (!stabilityResult.stable) {
        recommendations.push('CRITICAL: Hash calculation is unstable - ValidationEngine has bugs');
        recommendations.push('ACTION: Fix ValidationEngine.calculateHash method');
      }
      
      if (consistencyResult.success && consistencyResult.summary.mismatches === 0 && stabilityResult.stable) {
        recommendations.push('Hash system appears consistent - investigate export flow timing');
      }
      
      Logger.log('=== RECOMMENDATIONS ===');
      for (var i = 0; i < recommendations.length; i++) {
        Logger.log(`${i + 1}. ${recommendations[i]}`);
      }
      
      return {
        success: true,
        consistency: consistencyResult,
        stability: stabilityResult,
        recommendations: recommendations
      };
      
    } catch (error) {
      Logger.log(`Complete analysis failed: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
};

/**
 * Global functions
 */
function analyzeHashConsistency() {
  return HashConsistencyAnalyzer.completeAnalysis();
}

function testHashStability() {
  return HashConsistencyAnalyzer.testHashCalculationStability();
}
