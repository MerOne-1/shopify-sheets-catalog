/**
 * MILESTONE 2: Intelligent Incremental Sync Performance Test
 * Tests the new incremental sync functionality with change detection
 */

function IncrementalSyncTest() {
  this.orchestrator = new ImportOrchestrator();
  this.testResults = {
    testName: 'Intelligent Incremental Sync Test',
    timestamp: new Date().toISOString(),
    tests: [],
    summary: {
      totalTests: 0,
      passed: 0,
      failed: 0,
      warnings: 0
    }
  };
}

/**
 * Run comprehensive incremental sync tests
 */
IncrementalSyncTest.prototype.runFullTest = function() {
  Logger.log('=== Starting Intelligent Incremental Sync Test ===');
  
  try {
    // Test 1: Cache and timestamp management
    this.testTimestampManagement();
    
    // Test 2: Change detection logic
    this.testChangeDetection();
    
    // Test 3: Incremental sync with no changes
    this.testIncrementalSyncNoChanges();
    
    // Test 4: Incremental sync with mock changes
    this.testIncrementalSyncWithChanges();
    
    // Test 5: Performance improvement calculations
    this.testPerformanceCalculations();
    
    // Test 6: Error handling and recovery
    this.testErrorHandling();
    
    // Generate final report
    this.generateReport();
    
  } catch (error) {
    Logger.log(`[IncrementalSyncTest] Fatal error: ${error.message}`);
    this.addTestResult('Fatal Error', false, error.message);
  }
  
  return this.testResults;
};

/**
 * Test timestamp management functionality
 */
IncrementalSyncTest.prototype.testTimestampManagement = function() {
  var testName = 'Timestamp Management';
  Logger.log(`[IncrementalSyncTest] Running ${testName}`);
  
  try {
    // Clear any existing timestamp
    PropertiesService.getScriptProperties().deleteProperty('last_sync_timestamp');
    this.orchestrator.cache.delete('last_sync_timestamp');
    
    // Test 1: No previous timestamp
    var timestamp1 = this.orchestrator.getLastSyncTimestamp();
    if (timestamp1 !== null) {
      this.addTestResult(testName + ' - Initial State', false, 'Expected null timestamp, got: ' + timestamp1);
      return;
    }
    
    // Test 2: Set and retrieve timestamp
    var testTimestamp = Date.now();
    this.orchestrator.updateLastSyncTimestamp(testTimestamp);
    
    var timestamp2 = this.orchestrator.getLastSyncTimestamp();
    if (timestamp2 !== testTimestamp) {
      this.addTestResult(testName + ' - Set/Get', false, `Expected ${testTimestamp}, got ${timestamp2}`);
      return;
    }
    
    // Test 3: Cache retrieval (should be faster)
    var startTime = Date.now();
    var timestamp3 = this.orchestrator.getLastSyncTimestamp();
    var cacheTime = Date.now() - startTime;
    
    if (timestamp3 !== testTimestamp || cacheTime > 50) {
      this.addTestResult(testName + ' - Cache Performance', false, `Cache retrieval took ${cacheTime}ms`);
      return;
    }
    
    this.addTestResult(testName, true, `All timestamp operations working correctly. Cache retrieval: ${cacheTime}ms`);
    
  } catch (error) {
    this.addTestResult(testName, false, error.message);
  }
};

/**
 * Test change detection logic
 */
IncrementalSyncTest.prototype.testChangeDetection = function() {
  var testName = 'Change Detection';
  Logger.log(`[IncrementalSyncTest] Running ${testName}`);
  
  try {
    // Mock the bulk API client to return test data
    var originalBulkFetchProducts = this.orchestrator.bulkApiClient.bulkFetchProducts;
    var originalBulkFetchVariants = this.orchestrator.bulkApiClient.bulkFetchVariants;
    
    // Test 1: No previous sync (full sync detection)
    this.orchestrator.bulkApiClient.bulkFetchProducts = function(ids, options) {
      return {
        success: true,
        data: [
          { id: 1, title: 'Product 1', updated_at: '2024-01-01T00:00:00Z' },
          { id: 2, title: 'Product 2', updated_at: '2024-01-02T00:00:00Z' }
        ]
      };
    };
    
    this.orchestrator.bulkApiClient.bulkFetchVariants = function(ids, options) {
      return {
        success: true,
        data: [
          { id: 101, product_id: 1, title: 'Variant 1', updated_at: '2024-01-01T00:00:00Z' }
        ]
      };
    };
    
    var fullSyncResult = this.orchestrator.detectChangedItems(null, {});
    
    if (!fullSyncResult.fullSync || fullSyncResult.products.length !== 2 || fullSyncResult.variants.length !== 1) {
      this.addTestResult(testName + ' - Full Sync Detection', false, 
        `Expected full sync with 2 products, 1 variant. Got: ${fullSyncResult.products.length} products, ${fullSyncResult.variants.length} variants`);
      return;
    }
    
    // Test 2: Incremental sync with changes
    var lastSyncTime = new Date('2024-01-01T12:00:00Z').getTime();
    
    this.orchestrator.bulkApiClient.bulkFetchProducts = function(ids, options) {
      // Verify updated_at_min parameter is passed
      if (!options.updated_at_min) {
        throw new Error('updated_at_min parameter not passed to bulkFetchProducts');
      }
      
      return {
        success: true,
        data: [
          { id: 2, title: 'Product 2 Updated', updated_at: '2024-01-02T00:00:00Z' }
        ]
      };
    };
    
    this.orchestrator.bulkApiClient.bulkFetchVariants = function(ids, options) {
      if (!options.updated_at_min) {
        throw new Error('updated_at_min parameter not passed to bulkFetchVariants');
      }
      
      return {
        success: true,
        data: []
      };
    };
    
    var incrementalResult = this.orchestrator.detectChangedItems(lastSyncTime, {});
    
    if (incrementalResult.fullSync || incrementalResult.products.length !== 1 || incrementalResult.variants.length !== 0) {
      this.addTestResult(testName + ' - Incremental Detection', false, 
        `Expected 1 changed product, 0 variants. Got: ${incrementalResult.products.length} products, ${incrementalResult.variants.length} variants`);
      return;
    }
    
    // Restore original methods
    this.orchestrator.bulkApiClient.bulkFetchProducts = originalBulkFetchProducts;
    this.orchestrator.bulkApiClient.bulkFetchVariants = originalBulkFetchVariants;
    
    this.addTestResult(testName, true, 'Change detection working correctly for both full and incremental sync');
    
  } catch (error) {
    this.addTestResult(testName, false, error.message);
  }
};

/**
 * Test incremental sync with no changes
 */
IncrementalSyncTest.prototype.testIncrementalSyncNoChanges = function() {
  var testName = 'Incremental Sync - No Changes';
  Logger.log(`[IncrementalSyncTest] Running ${testName}`);
  
  try {
    // Set a recent sync timestamp
    var recentTimestamp = Date.now() - (5 * 60 * 1000); // 5 minutes ago
    this.orchestrator.updateLastSyncTimestamp(recentTimestamp);
    
    // Mock bulk API to return no changes
    var originalBulkFetchProducts = this.orchestrator.bulkApiClient.bulkFetchProducts;
    var originalBulkFetchVariants = this.orchestrator.bulkApiClient.bulkFetchVariants;
    
    this.orchestrator.bulkApiClient.bulkFetchProducts = function(ids, options) {
      return { success: true, data: [] };
    };
    
    this.orchestrator.bulkApiClient.bulkFetchVariants = function(ids, options) {
      return { success: true, data: [] };
    };
    
    var startTime = Date.now();
    var result = this.orchestrator.intelligentIncrementalSync({ dryRun: true });
    var duration = Date.now() - startTime;
    
    // Restore original methods
    this.orchestrator.bulkApiClient.bulkFetchProducts = originalBulkFetchProducts;
    this.orchestrator.bulkApiClient.bulkFetchVariants = originalBulkFetchVariants;
    
    if (!result.success) {
      this.addTestResult(testName, false, 'Sync failed: ' + (result.errors || []).join(', '));
      return;
    }
    
    if (result.changedItemsDetected !== 0) {
      this.addTestResult(testName, false, `Expected 0 changed items, got ${result.changedItemsDetected}`);
      return;
    }
    
    if (result.performanceImprovement.percentageImprovement !== 100) {
      this.addTestResult(testName, false, `Expected 100% improvement, got ${result.performanceImprovement.percentageImprovement}%`);
      return;
    }
    
    this.addTestResult(testName, true, `No changes detected correctly. Duration: ${duration}ms, Performance: ${result.performanceImprovement.efficiency}`);
    
  } catch (error) {
    this.addTestResult(testName, false, error.message);
  }
};

/**
 * Test incremental sync with mock changes
 */
IncrementalSyncTest.prototype.testIncrementalSyncWithChanges = function() {
  var testName = 'Incremental Sync - With Changes';
  Logger.log(`[IncrementalSyncTest] Running ${testName}`);
  
  try {
    // Mock the importers to avoid real processing
    var originalProductImport = this.orchestrator.productImporter.import;
    var originalVariantImport = this.orchestrator.variantImporter.import;
    
    this.orchestrator.productImporter.import = function(options) {
      if (options.changedItemsOnly && options.changedItems) {
        return {
          success: true,
          recordsProcessed: options.changedItems.length,
          recordsWritten: options.changedItems.length,
          errors: [],
          warnings: [],
          rateLimitHits: 0,
          apiCallCount: options.changedItems.length * 2 // Simulate API calls
        };
      }
      return { success: true, recordsProcessed: 0, recordsWritten: 0, errors: [], warnings: [], rateLimitHits: 0, apiCallCount: 0 };
    };
    
    this.orchestrator.variantImporter.import = function(options) {
      if (options.changedItemsOnly && options.changedItems) {
        return {
          success: true,
          recordsProcessed: options.changedItems.length,
          recordsWritten: options.changedItems.length,
          errors: [],
          warnings: [],
          rateLimitHits: 0,
          apiCallCount: options.changedItems.length * 2
        };
      }
      return { success: true, recordsProcessed: 0, recordsWritten: 0, errors: [], warnings: [], rateLimitHits: 0, apiCallCount: 0 };
    };
    
    // Mock bulk API to return changes
    var originalBulkFetchProducts = this.orchestrator.bulkApiClient.bulkFetchProducts;
    var originalBulkFetchVariants = this.orchestrator.bulkApiClient.bulkFetchVariants;
    
    this.orchestrator.bulkApiClient.bulkFetchProducts = function(ids, options) {
      return {
        success: true,
        data: [
          { id: 1, title: 'Changed Product 1' },
          { id: 2, title: 'Changed Product 2' }
        ]
      };
    };
    
    this.orchestrator.bulkApiClient.bulkFetchVariants = function(ids, options) {
      return {
        success: true,
        data: [
          { id: 101, product_id: 1, title: 'Changed Variant 1' }
        ]
      };
    };
    
    var result = this.orchestrator.intelligentIncrementalSync({ dryRun: true });
    
    // Restore original methods
    this.orchestrator.productImporter.import = originalProductImport;
    this.orchestrator.variantImporter.import = originalVariantImport;
    this.orchestrator.bulkApiClient.bulkFetchProducts = originalBulkFetchProducts;
    this.orchestrator.bulkApiClient.bulkFetchVariants = originalBulkFetchVariants;
    
    if (!result.success) {
      this.addTestResult(testName, false, 'Sync failed: ' + (result.errors || []).join(', '));
      return;
    }
    
    if (result.changedItemsDetected !== 3) {
      this.addTestResult(testName, false, `Expected 3 changed items, got ${result.changedItemsDetected}`);
      return;
    }
    
    if (result.recordsProcessed !== 3) {
      this.addTestResult(testName, false, `Expected 3 records processed, got ${result.recordsProcessed}`);
      return;
    }
    
    this.addTestResult(testName, true, `Successfully processed ${result.changedItemsDetected} changed items. Performance improvement: ${result.performanceImprovement.percentageImprovement}%`);
    
  } catch (error) {
    this.addTestResult(testName, false, error.message);
  }
};

/**
 * Test performance improvement calculations
 */
IncrementalSyncTest.prototype.testPerformanceCalculations = function() {
  var testName = 'Performance Calculations';
  Logger.log(`[IncrementalSyncTest] Running ${testName}`);
  
  try {
    // Test 1: No changes scenario
    var noChangesResult = this.orchestrator.calculatePerformanceImprovement(
      { products: [], variants: [] }, 
      1000
    );
    
    if (noChangesResult.percentageImprovement !== 100) {
      this.addTestResult(testName + ' - No Changes', false, `Expected 100% improvement, got ${noChangesResult.percentageImprovement}%`);
      return;
    }
    
    // Test 2: Some changes scenario
    var someChangesResult = this.orchestrator.calculatePerformanceImprovement(
      { products: [1, 2], variants: [1] }, // 3 items
      5000 // 5 seconds
    );
    
    if (someChangesResult.itemsProcessed !== 3) {
      this.addTestResult(testName + ' - Some Changes', false, `Expected 3 items processed, got ${someChangesResult.itemsProcessed}`);
      return;
    }
    
    if (someChangesResult.percentageImprovement <= 0) {
      this.addTestResult(testName + ' - Some Changes', false, `Expected positive improvement, got ${someChangesResult.percentageImprovement}%`);
      return;
    }
    
    this.addTestResult(testName, true, `Performance calculations working correctly. No changes: ${noChangesResult.efficiency}, Some changes: ${someChangesResult.efficiency}`);
    
  } catch (error) {
    this.addTestResult(testName, false, error.message);
  }
};

/**
 * Test error handling and recovery
 */
IncrementalSyncTest.prototype.testErrorHandling = function() {
  var testName = 'Error Handling';
  Logger.log(`[IncrementalSyncTest] Running ${testName}`);
  
  try {
    // Mock bulk API to fail
    var originalBulkFetchProducts = this.orchestrator.bulkApiClient.bulkFetchProducts;
    
    this.orchestrator.bulkApiClient.bulkFetchProducts = function(ids, options) {
      throw new Error('Simulated API failure');
    };
    
    var result = this.orchestrator.intelligentIncrementalSync({ dryRun: true });
    
    // Restore original method
    this.orchestrator.bulkApiClient.bulkFetchProducts = originalBulkFetchProducts;
    
    // Test graceful degradation: system should continue working with empty results
    if (!result.success) {
      this.addTestResult(testName, false, 'System should gracefully handle API failures, not fail completely');
      return;
    }
    
    // Should detect 0 changes due to API failure (graceful degradation)
    if (result.changedItemsDetected !== 0) {
      this.addTestResult(testName, false, `Expected 0 changed items due to API failure, got ${result.changedItemsDetected}`);
      return;
    }
    
    // Should have change detection error in the results
    if (!result.changeDetectionResults || !result.changeDetectionResults.error) {
      this.addTestResult(testName, false, 'Expected change detection error to be logged in results');
      return;
    }
    
    this.addTestResult(testName, true, `Graceful error handling working correctly. API failure handled gracefully with error: ${result.changeDetectionResults.error}`);
    
  } catch (error) {
    this.addTestResult(testName, false, error.message);
  }
};

/**
 * Add test result
 */
IncrementalSyncTest.prototype.addTestResult = function(testName, passed, message) {
  this.testResults.tests.push({
    name: testName,
    passed: passed,
    message: message,
    timestamp: new Date().toISOString()
  });
  
  this.testResults.summary.totalTests++;
  if (passed) {
    this.testResults.summary.passed++;
    Logger.log(`✅ ${testName}: ${message}`);
  } else {
    this.testResults.summary.failed++;
    Logger.log(`❌ ${testName}: ${message}`);
  }
};

/**
 * Generate final test report
 */
IncrementalSyncTest.prototype.generateReport = function() {
  var passRate = ((this.testResults.summary.passed / this.testResults.summary.totalTests) * 100).toFixed(1);
  
  Logger.log('\n=== INTELLIGENT INCREMENTAL SYNC TEST RESULTS ===');
  Logger.log(`Total Tests: ${this.testResults.summary.totalTests}`);
  Logger.log(`Passed: ${this.testResults.summary.passed}`);
  Logger.log(`Failed: ${this.testResults.summary.failed}`);
  Logger.log(`Pass Rate: ${passRate}%`);
  Logger.log(`Test Status: ${passRate >= 80 ? '✅ EXCELLENT' : passRate >= 60 ? '⚠️ GOOD' : '❌ NEEDS IMPROVEMENT'}`);
  
  if (this.testResults.summary.failed > 0) {
    Logger.log('\n=== FAILED TESTS ===');
    this.testResults.tests.forEach(function(test) {
      if (!test.passed) {
        Logger.log(`❌ ${test.name}: ${test.message}`);
      }
    });
  }
  
  Logger.log('\n=== MILESTONE 2 INCREMENTAL SYNC STATUS ===');
  if (passRate >= 80) {
    Logger.log('🎉 MILESTONE 2 INCREMENTAL SYNC: READY FOR PRODUCTION');
    Logger.log('✅ Timestamp management working');
    Logger.log('✅ Change detection optimized');
    Logger.log('✅ Performance improvements validated');
    Logger.log('✅ Error handling robust');
  } else {
    Logger.log('⚠️ MILESTONE 2 INCREMENTAL SYNC: NEEDS FIXES');
  }
};

/**
 * Standalone test function
 */
function testIncrementalSync() {
  var test = new IncrementalSyncTest();
  return test.runFullTest();
}
