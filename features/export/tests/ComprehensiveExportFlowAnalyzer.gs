/**
 * Comprehensive Export Flow Analyzer
 * Analyze the complete export flow to identify where hash updates should happen
 */

var ComprehensiveExportFlowAnalyzer = {
  
  /**
   * Analyze the complete export flow
   */
  analyzeExportFlow: function() {
    Logger.log('=== COMPREHENSIVE EXPORT FLOW ANALYSIS ===');
    
    try {
      var analysis = {
        currentFlow: this.analyzeCurrentFlow(),
        missingComponents: this.identifyMissingComponents(),
        hashUpdatePoints: this.identifyHashUpdatePoints(),
        recommendations: []
      };
      
      // Generate recommendations
      analysis.recommendations = this.generateRecommendations(analysis);
      
      Logger.log('=== ANALYSIS COMPLETE ===');
      for (var i = 0; i < analysis.recommendations.length; i++) {
        Logger.log(`${i + 1}. ${analysis.recommendations[i]}`);
      }
      
      return analysis;
      
    } catch (error) {
      Logger.log(`Analysis failed: ${error.message}`);
      return { error: error.message };
    }
  },
  
  /**
   * Analyze current export flow
   */
  analyzeCurrentFlow: function() {
    Logger.log('--- ANALYZING CURRENT EXPORT FLOW ---');
    
    var flow = {
      steps: [
        'ExportManager.initiateExport() - Entry point',
        'ExportManager.getSheetData() - Load sheet data',
        'ExportManager.detectChanges() - Compare hashes',
        'ExportManager.createExportQueue() - Create queue items',
        'ExportQueue.processQueue() - Process items',
        'BatchProcessor.processBatch() - Make API calls',
        'RetryManager.executeWithRetry() - Handle API calls',
        '??? - UPDATE HASHES AFTER SUCCESS ???'
      ],
      hashUpdateStep: 'MISSING - No hash update after successful API calls'
    };
    
    Logger.log('Current flow steps:');
    for (var i = 0; i < flow.steps.length; i++) {
      Logger.log(`  ${i + 1}. ${flow.steps[i]}`);
    }
    
    Logger.log(`❌ CRITICAL MISSING STEP: ${flow.hashUpdateStep}`);
    
    return flow;
  },
  
  /**
   * Identify missing components
   */
  identifyMissingComponents: function() {
    Logger.log('--- IDENTIFYING MISSING COMPONENTS ---');
    
    var missing = [
      {
        component: 'Hash Update After Export',
        description: 'No mechanism to update _hash values in sheet after successful API calls',
        impact: 'HIGH - Causes all variants to appear changed on next export',
        location: 'Should be in BatchProcessor or ExportQueue after successful API calls'
      },
      {
        component: 'Export Success Callback',
        description: 'No callback to update sheet data after successful export',
        impact: 'HIGH - Sheet data becomes stale after export',
        location: 'Should be called after BatchProcessor.processBatch() success'
      },
      {
        component: 'Sheet Update Service',
        description: 'No service to update specific sheet cells after export',
        impact: 'MEDIUM - Manual sheet updates required',
        location: 'New component needed: SheetUpdateService.gs'
      }
    ];
    
    for (var i = 0; i < missing.length; i++) {
      var item = missing[i];
      Logger.log(`❌ MISSING: ${item.component}`);
      Logger.log(`   Impact: ${item.impact}`);
      Logger.log(`   Location: ${item.location}`);
    }
    
    return missing;
  },
  
  /**
   * Identify where hash updates should happen
   */
  identifyHashUpdatePoints: function() {
    Logger.log('--- IDENTIFYING HASH UPDATE POINTS ---');
    
    var updatePoints = [
      {
        location: 'BatchProcessor.processItem() - After successful API call',
        timing: 'Immediately after successful PUT/POST to Shopify',
        data: 'Update _hash for the specific record that was successfully exported',
        pros: ['Immediate update', 'Per-item granularity'],
        cons: ['Many individual sheet updates', 'Performance impact']
      },
      {
        location: 'BatchProcessor.processBatch() - After successful batch',
        timing: 'After entire batch completes successfully',
        data: 'Update _hash for all records in the successful batch',
        pros: ['Batch updates', 'Better performance'],
        cons: ['All-or-nothing approach', 'Partial failures not handled']
      },
      {
        location: 'ExportQueue.processQueue() - After queue completion',
        timing: 'After entire export queue completes',
        data: 'Update _hash for all successfully exported records',
        pros: ['Single update operation', 'Best performance'],
        cons: ['Delayed updates', 'Complex failure handling']
      }
    ];
    
    for (var i = 0; i < updatePoints.length; i++) {
      var point = updatePoints[i];
      Logger.log(`📍 UPDATE POINT ${i + 1}: ${point.location}`);
      Logger.log(`   Timing: ${point.timing}`);
      Logger.log(`   Pros: ${point.pros.join(', ')}`);
      Logger.log(`   Cons: ${point.cons.join(', ')}`);
    }
    
    return updatePoints;
  },
  
  /**
   * Generate recommendations
   */
  generateRecommendations: function(analysis) {
    var recommendations = [
      'CRITICAL: Add hash update mechanism after successful API calls',
      'RECOMMENDED: Implement SheetUpdateService for efficient sheet updates',
      'OPTIMAL: Update hashes in BatchProcessor.processBatch() after successful batch',
      'FALLBACK: Add hash update in ExportQueue after processing completion',
      'TESTING: Create test to verify hash updates after export',
      'VALIDATION: Ensure hash updates only happen for successful API calls'
    ];
    
    return recommendations;
  },
  
  /**
   * Test current hash update behavior
   */
  testHashUpdateBehavior: function() {
    Logger.log('=== TESTING HASH UPDATE BEHAVIOR ===');
    
    try {
      // Get current hash state
      var exportManager = new ExportManager();
      var sheetData = exportManager.getSheetData('Variants');
      
      if (sheetData.length === 0) {
        return { error: 'No data to test' };
      }
      
      var testRecord = sheetData[0];
      var originalHash = testRecord._hash || '';
      
      Logger.log(`Test record ID: ${testRecord.id}`);
      Logger.log(`Original hash: "${originalHash}"`);
      
      // Calculate what the hash should be
      var validator = new ValidationEngine();
      var calculatedHash = validator.calculateHash(testRecord);
      
      Logger.log(`Calculated hash: "${calculatedHash}"`);
      Logger.log(`Hashes match: ${originalHash === calculatedHash}`);
      
      // Check if there's any mechanism to update this hash
      var hasUpdateMechanism = false;
      try {
        // Try to find update methods
        if (typeof exportManager.updateHashAfterExport === 'function') {
          hasUpdateMechanism = true;
        }
      } catch (e) {
        // Method doesn't exist
      }
      
      Logger.log(`Hash update mechanism exists: ${hasUpdateMechanism}`);
      
      return {
        success: true,
        testRecord: testRecord.id,
        originalHash: originalHash,
        calculatedHash: calculatedHash,
        hashesMatch: originalHash === calculatedHash,
        updateMechanismExists: hasUpdateMechanism
      };
      
    } catch (error) {
      Logger.log(`Test failed: ${error.message}`);
      return { error: error.message };
    }
  },
  
  /**
   * Complete analysis and test
   */
  completeAnalysis: function() {
    Logger.log('=== COMPLETE EXPORT FLOW ANALYSIS ===');
    
    try {
      var flowAnalysis = this.analyzeExportFlow();
      var hashTest = this.testHashUpdateBehavior();
      
      Logger.log('=== FINAL CONCLUSION ===');
      Logger.log('The export system is missing a critical component:');
      Logger.log('❌ NO HASH UPDATE AFTER SUCCESSFUL EXPORT');
      Logger.log('');
      Logger.log('This explains why:');
      Logger.log('1. Hash regeneration works initially (0 changes detected)');
      Logger.log('2. After export, all variants appear changed again (48 updates)');
      Logger.log('3. The cycle repeats because hashes are never updated after export');
      
      return {
        success: true,
        flowAnalysis: flowAnalysis,
        hashTest: hashTest,
        conclusion: 'Missing hash update mechanism after successful export'
      };
      
    } catch (error) {
      Logger.log(`Complete analysis failed: ${error.message}`);
      return { error: error.message };
    }
  }
};

/**
 * Global functions
 */
function analyzeExportFlow() {
  return ComprehensiveExportFlowAnalyzer.completeAnalysis();
}

function testHashUpdates() {
  return ComprehensiveExportFlowAnalyzer.testHashUpdateBehavior();
}
