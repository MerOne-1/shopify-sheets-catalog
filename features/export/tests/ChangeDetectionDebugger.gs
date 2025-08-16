/**
 * Change Detection Debugger
 * Analyzes why only 2 of 3 changed variants were exported
 * and why 48 variants were processed when only 3 were changed
 */

var ChangeDetectionDebugger = {
  
  /**
   * Debug the change detection process and provide exact fixes
   */
  debugChangeDetection: function() {
    try {
      Logger.log('=== CHANGE DETECTION DEBUG ===');
      
      // Get current sheet data
      var exportManager = new ExportManager();
      var sheetData = exportManager.getSheetData('Variants');
      
      Logger.log(`Total variants in sheet: ${sheetData.length}`);
      
      // Analyze each variant's hash status
      var hashAnalysis = this.analyzeHashStatus(sheetData);
      
      // Run change detection
      var changes = exportManager.detectChanges(sheetData);
      
      Logger.log(`\n=== CHANGE DETECTION RESULTS ===`);
      Logger.log(`To Add: ${changes.toAdd.length}`);
      Logger.log(`To Update: ${changes.toUpdate.length}`);
      Logger.log(`Unchanged: ${changes.unchanged.length}`);
      
      // Debug specific variants that should have changed
      this.debugSpecificVariants(sheetData, changes);
      
      // Analyze the export flow to find where filtering breaks
      var flowAnalysis = this.analyzeExportFlow(exportManager, changes);
      
      // Generate specific code fixes
      var fixes = this.generateCodeFixes(hashAnalysis, changes, flowAnalysis);
      
      Logger.log(`\n=== RECOMMENDED FIXES ===`);
      for (var i = 0; i < fixes.length; i++) {
        Logger.log(`${i + 1}. ${fixes[i].description}`);
        Logger.log(`   File: ${fixes[i].file}`);
        Logger.log(`   Fix: ${fixes[i].fix}`);
      }
      
      return {
        totalVariants: sheetData.length,
        hashAnalysis: hashAnalysis,
        changes: changes,
        flowAnalysis: flowAnalysis,
        fixes: fixes
      };
      
    } catch (error) {
      Logger.log(`Error in change detection debug: ${error.message}`);
      throw error;
    }
  },
  
  /**
   * Analyze hash status of all variants
   */
  analyzeHashStatus: function(sheetData) {
    var analysis = {
      withHash: 0,
      withoutHash: 0,
      emptyHash: 0,
      hashMismatches: 0
    };
    
    var validator = new ValidationEngine();
    
    for (var i = 0; i < sheetData.length; i++) {
      var record = sheetData[i];
      
      if (!record.id || record.id === '') {
        continue;
      }
      
      var storedHash = record._hash || '';
      var currentHash = validator.calculateHash(record);
      
      if (storedHash === '') {
        analysis.emptyHash++;
      } else {
        analysis.withHash++;
        if (currentHash !== storedHash) {
          analysis.hashMismatches++;
          Logger.log(`Hash mismatch for variant ${record.id}: stored="${storedHash.substring(0,10)}..." current="${currentHash.substring(0,10)}..."`);
        }
      }
    }
    
    Logger.log(`\n=== HASH ANALYSIS ===`);
    Logger.log(`Variants with hash: ${analysis.withHash}`);
    Logger.log(`Variants without hash: ${analysis.emptyHash}`);
    Logger.log(`Hash mismatches (changes): ${analysis.hashMismatches}`);
    
    return analysis;
  },
  
  /**
   * Debug specific variants that should have been detected as changed
   */
  debugSpecificVariants: function(sheetData, changes) {
    Logger.log(`\n=== DEBUGGING SPECIFIC VARIANTS ===`);
    
    // Find variants that were updated
    if (changes.toUpdate.length > 0) {
      Logger.log(`Variants detected as changed:`);
      for (var i = 0; i < changes.toUpdate.length; i++) {
        var variant = changes.toUpdate[i];
        Logger.log(`- Variant ID: ${variant.id}, SKU: ${variant.sku}, Option1: ${variant.option1}`);
      }
    }
    
    // Look for variants that might have been missed
    var validator = new ValidationEngine();
    var recentlyModified = [];
    
    for (var i = 0; i < sheetData.length; i++) {
      var record = sheetData[i];
      if (!record.id || record.id === '') continue;
      
      var storedHash = record._hash || '';
      var currentHash = validator.calculateHash(record);
      
      // Check if this variant has a hash mismatch but wasn't in toUpdate
      if (storedHash !== '' && currentHash !== storedHash) {
        var foundInUpdate = changes.toUpdate.some(function(item) {
          return item.id === record.id;
        });
        
        if (!foundInUpdate) {
          Logger.log(`MISSED CHANGE: Variant ${record.id} has hash mismatch but not in toUpdate list`);
          recentlyModified.push(record);
        }
      }
    }
    
    if (recentlyModified.length > 0) {
      Logger.log(`Found ${recentlyModified.length} variants with changes that were missed`);
    }
  },
  
  /**
   * Test hash calculation for specific variant
   */
  testHashCalculation: function(variantId) {
    try {
      var exportManager = new ExportManager();
      var sheetData = exportManager.getSheetData('Variants');
      var validator = new ValidationEngine();
      
      var variant = sheetData.find(function(item) {
        return item.id == variantId;
      });
      
      if (!variant) {
        Logger.log(`Variant ${variantId} not found`);
        return;
      }
      
      var storedHash = variant._hash || '';
      var currentHash = validator.calculateHash(variant);
      var normalizedData = validator.normalizeDataForHash(variant);
      
      Logger.log(`\n=== HASH TEST FOR VARIANT ${variantId} ===`);
      Logger.log(`Stored hash: ${storedHash}`);
      Logger.log(`Current hash: ${currentHash}`);
      Logger.log(`Hashes match: ${storedHash === currentHash}`);
      Logger.log(`Normalized data:`, normalizedData);
      
      return {
        variantId: variantId,
        storedHash: storedHash,
        currentHash: currentHash,
        match: storedHash === currentHash,
        normalizedData: normalizedData
      };
      
    } catch (error) {
      Logger.log(`Error testing hash for variant ${variantId}: ${error.message}`);
      throw error;
    }
  },
  
  /**
   * Analyze the export flow to find where filtering breaks
   */
  analyzeExportFlow: function(exportManager, changes) {
    try {
      Logger.log(`\n=== EXPORT FLOW ANALYSIS ===`);
      
      // Check if queue creation respects change detection
      var queueItems = exportManager.createExportQueue(changes, 'Variants');
      Logger.log(`Queue items created: ${queueItems.length}`);
      Logger.log(`Expected queue size: ${changes.toAdd.length + changes.toUpdate.length}`);
      
      var queueCorrect = queueItems.length === (changes.toAdd.length + changes.toUpdate.length);
      Logger.log(`Queue size correct: ${queueCorrect}`);
      
      // Check BatchProcessor behavior
      var batchProcessor = new BatchProcessor();
      Logger.log(`BatchProcessor initialized`);
      
      return {
        queueSize: queueItems.length,
        expectedQueueSize: changes.toAdd.length + changes.toUpdate.length,
        queueCorrect: queueCorrect,
        queueItems: queueItems.slice(0, 5) // First 5 items for inspection
      };
      
    } catch (error) {
      Logger.log(`Error in export flow analysis: ${error.message}`);
      return { error: error.message };
    }
  },
  
  /**
   * Generate specific code fixes based on analysis
   */
  generateCodeFixes: function(hashAnalysis, changes, flowAnalysis) {
    var fixes = [];
    
    // Fix 1: If all variants have empty hashes
    if (hashAnalysis.emptyHash > hashAnalysis.withHash) {
      fixes.push({
        priority: 'HIGH',
        description: 'Hash system not initialized - all variants missing _hash values',
        file: 'ValidationEngine.gs or ExportManager.gs',
        fix: 'Add hash initialization after import or manual sheet updates',
        code: 'Need to call updateHashesAfterImport() or similar method'
      });
    }
    
    // Fix 2: If change detection finds correct changes but queue is wrong
    if (changes.toUpdate.length < 10 && flowAnalysis.queueSize > changes.toUpdate.length + changes.toAdd.length) {
      fixes.push({
        priority: 'HIGH',
        description: 'Queue creation bypassing change detection results',
        file: 'ExportManager.createExportQueue()',
        fix: 'Ensure queue only contains items from changes.toUpdate and changes.toAdd',
        code: 'Check if createExportQueue is adding extra items or processing entire sheet'
      });
    }
    
    // Fix 3: If BatchProcessor processes more than queue size
    if (flowAnalysis.queueCorrect && changes.toUpdate.length < 10) {
      fixes.push({
        priority: 'HIGH',
        description: 'BatchProcessor processing entire sheet instead of queue',
        file: 'BatchProcessor.gs',
        fix: 'Ensure BatchProcessor only processes items from the export queue',
        code: 'Check processExportQueue() method - should not process entire sheet data'
      });
    }
    
    // Fix 4: UI display counting issue
    fixes.push({
      priority: 'MEDIUM',
      description: 'UI shows incorrect completion count',
      file: 'UIManager.gs or export UI components',
      fix: 'Fix completion counter to count individual variants, not batches',
      code: 'Update progress tracking to increment by actual items processed'
    });
    
    // Fix 5: Hash calculation issues
    if (hashAnalysis.hashMismatches === 0 && changes.toUpdate.length > 0) {
      fixes.push({
        priority: 'MEDIUM',
        description: 'Hash calculation may not be detecting changes properly',
        file: 'ValidationEngine.normalizeDataForHash()',
        fix: 'Verify hash calculation includes all relevant fields and normalizes correctly',
        code: 'Check if option1, option2, option3 changes are properly detected in hash'
      });
    }
    
    return fixes;
  },
  
  /**
   * Quick test to run change detection debug
   */
  quickTest: function() {
    Logger.log('Starting Enhanced Change Detection Debug...');
    var result = this.debugChangeDetection();
    Logger.log('Enhanced Change Detection Debug completed.');
    return result;
  },
  
  /**
   * Apply automatic fixes where possible
   */
  applyAutomaticFixes: function() {
    Logger.log('=== APPLYING AUTOMATIC FIXES ===');
    
    try {
      // Fix 1: Initialize missing hashes
      var exportManager = new ExportManager();
      var sheetData = exportManager.getSheetData('Variants');
      var validator = new ValidationEngine();
      
      var hashesUpdated = 0;
      for (var i = 0; i < sheetData.length; i++) {
        var record = sheetData[i];
        if (!record._hash || record._hash === '') {
          var newHash = validator.calculateHash(record);
          // Note: This would need actual sheet update logic
          Logger.log(`Would update hash for variant ${record.id}: ${newHash.substring(0,10)}...`);
          hashesUpdated++;
        }
      }
      
      Logger.log(`Automatic fixes applied: ${hashesUpdated} hashes would be updated`);
      Logger.log('Note: Actual hash updates require sheet write permissions');
      
      return {
        success: true,
        hashesUpdated: hashesUpdated,
        message: 'Automatic fixes identified - manual implementation required'
      };
      
    } catch (error) {
      Logger.log(`Error applying automatic fixes: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
};

/**
 * Global function to run the debug test
 */
function runChangeDetectionDebug() {
  return ChangeDetectionDebugger.quickTest();
}

/**
 * Test hash calculation for a specific variant
 */
function testVariantHash(variantId) {
  return ChangeDetectionDebugger.testHashCalculation(variantId);
}
