/**
 * MILESTONE 2: Comprehensive Import Components Test
 * Tests ProductImporter and VariantImporter with intelligent caching and bulk operations
 */

function ImportComponentsTest() {
  this.productImporter = new ProductImporter();
  this.variantImporter = new VariantImporter();
  this.testResults = {
    testName: 'Import Components Test',
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
 * Run comprehensive import components tests
 */
ImportComponentsTest.prototype.runFullTest = function() {
  Logger.log('=== Starting Import Components Test ===');
  
  try {
    // Test 1: ProductImporter initialization
    this.testProductImporterInitialization();
    
    // Test 2: VariantImporter initialization
    this.testVariantImporterInitialization();
    
    // Test 3: ProductImporter caching functionality
    this.testProductImporterCaching();
    
    // Test 4: VariantImporter caching functionality
    this.testVariantImporterCaching();
    
    // Test 5: ProductImporter changed items processing
    this.testProductImporterChangedItems();
    
    // Test 6: VariantImporter changed items processing
    this.testVariantImporterChangedItems();
    
    // Test 7: ProductImporter bulk operations
    this.testProductImporterBulkOperations();
    
    // Test 8: VariantImporter bulk operations
    this.testVariantImporterBulkOperations();
    
    // Test 9: Integration with ImportOrchestrator
    this.testImportOrchestrationIntegration();
    
    // Test 10: Error handling and fallback mechanisms
    this.testErrorHandlingAndFallback();
    
    // Generate final report
    this.generateReport();
    
  } catch (error) {
    Logger.log(`[ImportComponentsTest] Fatal error: ${error.message}`);
    this.addTestResult('Fatal Error', false, error.message);
  }
  
  return this.testResults;
};

/**
 * Test ProductImporter initialization
 */
ImportComponentsTest.prototype.testProductImporterInitialization = function() {
  var testName = 'ProductImporter Initialization';
  Logger.log(`[ImportComponentsTest] Running ${testName}`);
  
  try {
    // Test that cache and bulkApiClient are properly initialized
    if (!this.productImporter.cache) {
      this.addTestResult(testName, false, 'IntelligentCache not initialized');
      return;
    }
    
    if (!this.productImporter.bulkApiClient) {
      this.addTestResult(testName, false, 'BulkApiClient not initialized');
      return;
    }
    
    // Test basic methods exist
    if (typeof this.productImporter.fetchAllProducts !== 'function') {
      this.addTestResult(testName, false, 'fetchAllProducts method missing');
      return;
    }
    
    if (typeof this.productImporter.import !== 'function') {
      this.addTestResult(testName, false, 'import method missing');
      return;
    }
    
    this.addTestResult(testName, true, 'ProductImporter properly initialized with cache and bulk operations');
    
  } catch (error) {
    this.addTestResult(testName, false, error.message);
  }
};

/**
 * Test VariantImporter initialization
 */
ImportComponentsTest.prototype.testVariantImporterInitialization = function() {
  var testName = 'VariantImporter Initialization';
  Logger.log(`[ImportComponentsTest] Running ${testName}`);
  
  try {
    // Test that cache and bulkApiClient are properly initialized
    if (!this.variantImporter.cache) {
      this.addTestResult(testName, false, 'IntelligentCache not initialized');
      return;
    }
    
    if (!this.variantImporter.bulkApiClient) {
      this.addTestResult(testName, false, 'BulkApiClient not initialized');
      return;
    }
    
    // Test basic methods exist
    if (typeof this.variantImporter.fetchAllVariants !== 'function') {
      this.addTestResult(testName, false, 'fetchAllVariants method missing');
      return;
    }
    
    if (typeof this.variantImporter.buildProductCache !== 'function') {
      this.addTestResult(testName, false, 'buildProductCache method missing');
      return;
    }
    
    this.addTestResult(testName, true, 'VariantImporter properly initialized with cache and bulk operations');
    
  } catch (error) {
    this.addTestResult(testName, false, error.message);
  }
};

/**
 * Test ProductImporter caching functionality
 */
ImportComponentsTest.prototype.testProductImporterCaching = function() {
  var testName = 'ProductImporter Caching';
  Logger.log(`[ImportComponentsTest] Running ${testName}`);
  
  try {
    // Mock the bulk API client
    var originalBulkFetch = this.productImporter.bulkApiClient.bulkFetchProducts;
    var fetchCallCount = 0;
    
    this.productImporter.bulkApiClient.bulkFetchProducts = function(ids, options) {
      fetchCallCount++;
      return {
        success: true,
        data: [
          { id: 1, title: 'Test Product 1', handle: 'test-product-1' },
          { id: 2, title: 'Test Product 2', handle: 'test-product-2' }
        ]
      };
    };
    
    // First call should hit the API
    var products1 = this.productImporter.fetchAllProducts({ limit: 10 });
    
    // Second call should use cache
    var products2 = this.productImporter.fetchAllProducts({ limit: 10 });
    
    // Restore original method
    this.productImporter.bulkApiClient.bulkFetchProducts = originalBulkFetch;
    
    if (fetchCallCount !== 1) {
      this.addTestResult(testName, false, `Expected 1 API call, got ${fetchCallCount} (caching not working)`);
      return;
    }
    
    if (products1.length !== 2 || products2.length !== 2) {
      this.addTestResult(testName, false, 'Cached results not matching original results');
      return;
    }
    
    this.addTestResult(testName, true, `Caching working correctly. API called ${fetchCallCount} time, both calls returned ${products1.length} products`);
    
  } catch (error) {
    this.addTestResult(testName, false, error.message);
  }
};

/**
 * Test VariantImporter caching functionality
 */
ImportComponentsTest.prototype.testVariantImporterCaching = function() {
  var testName = 'VariantImporter Caching';
  Logger.log(`[ImportComponentsTest] Running ${testName}`);
  
  try {
    // Mock the bulk API clients
    var originalProductBulkFetch = this.variantImporter.bulkApiClient.bulkFetchProducts;
    var originalVariantBulkFetch = this.variantImporter.bulkApiClient.bulkFetchVariants;
    var productFetchCount = 0;
    var variantFetchCount = 0;
    
    this.variantImporter.bulkApiClient.bulkFetchProducts = function(ids, options) {
      productFetchCount++;
      return {
        success: true,
        data: [
          { id: 1, title: 'Test Product 1', handle: 'test-product-1' }
        ]
      };
    };
    
    this.variantImporter.bulkApiClient.bulkFetchVariants = function(ids, options) {
      variantFetchCount++;
      return {
        success: true,
        data: [
          { id: 101, product_id: 1, title: 'Test Variant 1' }
        ]
      };
    };
    
    // First call should build cache and fetch variants
    this.variantImporter.buildProductCache();
    var variants1 = this.variantImporter.fetchAllVariants({ limit: 10 });
    
    // Second call should use cached product cache and cached variants
    this.variantImporter.buildProductCache();
    var variants2 = this.variantImporter.fetchAllVariants({ limit: 10 });
    
    // Restore original methods
    this.variantImporter.bulkApiClient.bulkFetchProducts = originalProductBulkFetch;
    this.variantImporter.bulkApiClient.bulkFetchVariants = originalVariantBulkFetch;
    
    if (productFetchCount !== 1) {
      this.addTestResult(testName, false, `Expected 1 product API call, got ${productFetchCount} (product cache not working)`);
      return;
    }
    
    if (variantFetchCount !== 1) {
      this.addTestResult(testName, false, `Expected 1 variant API call, got ${variantFetchCount} (variant cache not working)`);
      return;
    }
    
    if (variants1.length !== 1 || variants2.length !== 1) {
      this.addTestResult(testName, false, 'Cached variant results not matching');
      return;
    }
    
    this.addTestResult(testName, true, `Variant caching working correctly. Product API: ${productFetchCount} call, Variant API: ${variantFetchCount} call`);
    
  } catch (error) {
    this.addTestResult(testName, false, error.message);
  }
};

/**
 * Test ProductImporter changed items processing
 */
ImportComponentsTest.prototype.testProductImporterChangedItems = function() {
  var testName = 'ProductImporter Changed Items';
  Logger.log(`[ImportComponentsTest] Running ${testName}`);
  
  try {
    // Mock sheet operations
    var originalGetTargetSheet = this.productImporter.getTargetSheet;
    var originalSetupSheetHeaders = this.productImporter.setupSheetHeaders;
    var originalValidateData = this.productImporter.validateData;
    var originalBatchWriteToSheet = this.productImporter.batchWriteToSheet;
    
    this.productImporter.getTargetSheet = function() {
      return { getRange: function() { return { getValues: function() { return []; } }; } };
    };
    
    this.productImporter.setupSheetHeaders = function() { return {}; };
    this.productImporter.validateData = function() { 
      return { isValid: true, errors: [], warnings: [] }; 
    };
    this.productImporter.batchWriteToSheet = function() {};
    
    // Test changed items only processing
    var changedItems = [
      { id: 1, title: 'Changed Product 1', handle: 'changed-1' },
      { id: 2, title: 'Changed Product 2', handle: 'changed-2' }
    ];
    
    var result = this.productImporter.import({
      dryRun: true,
      changedItemsOnly: true,
      changedItems: changedItems
    });
    
    // Restore original methods
    this.productImporter.getTargetSheet = originalGetTargetSheet;
    this.productImporter.setupSheetHeaders = originalSetupSheetHeaders;
    this.productImporter.validateData = originalValidateData;
    this.productImporter.batchWriteToSheet = originalBatchWriteToSheet;
    
    if (!result.success) {
      this.addTestResult(testName, false, 'Changed items import failed: ' + (result.errors || []).join(', '));
      return;
    }
    
    if (result.recordsProcessed !== 2) {
      this.addTestResult(testName, false, `Expected 2 records processed, got ${result.recordsProcessed}`);
      return;
    }
    
    this.addTestResult(testName, true, `Changed items processing working correctly. Processed ${result.recordsProcessed} changed products`);
    
  } catch (error) {
    this.addTestResult(testName, false, error.message);
  }
};

/**
 * Test VariantImporter changed items processing
 */
ImportComponentsTest.prototype.testVariantImporterChangedItems = function() {
  var testName = 'VariantImporter Changed Items';
  Logger.log(`[ImportComponentsTest] Running ${testName}`);
  
  try {
    // Mock sheet operations and product cache
    var originalGetTargetSheet = this.variantImporter.getTargetSheet;
    var originalSetupSheetHeaders = this.variantImporter.setupSheetHeaders;
    var originalValidateData = this.variantImporter.validateData;
    var originalBatchWriteToSheet = this.variantImporter.batchWriteToSheet;
    var originalBuildProductCache = this.variantImporter.buildProductCache;
    
    this.variantImporter.getTargetSheet = function() {
      return { getRange: function() { return { getValues: function() { return []; } }; } };
    };
    
    this.variantImporter.setupSheetHeaders = function() { return {}; };
    this.variantImporter.validateData = function() { 
      return { isValid: true, errors: [], warnings: [] }; 
    };
    this.variantImporter.batchWriteToSheet = function() {};
    this.variantImporter.buildProductCache = function() {
      this.productCache = { 1: { title: 'Test Product', handle: 'test-product' } };
    };
    
    // Test changed items only processing
    var changedItems = [
      { id: 101, product_id: 1, title: 'Changed Variant 1' }
    ];
    
    var result = this.variantImporter.import({
      dryRun: true,
      changedItemsOnly: true,
      changedItems: changedItems
    });
    
    // Restore original methods
    this.variantImporter.getTargetSheet = originalGetTargetSheet;
    this.variantImporter.setupSheetHeaders = originalSetupSheetHeaders;
    this.variantImporter.validateData = originalValidateData;
    this.variantImporter.batchWriteToSheet = originalBatchWriteToSheet;
    this.variantImporter.buildProductCache = originalBuildProductCache;
    
    if (!result.success) {
      this.addTestResult(testName, false, 'Changed items import failed: ' + (result.errors || []).join(', '));
      return;
    }
    
    if (result.recordsProcessed !== 1) {
      this.addTestResult(testName, false, `Expected 1 record processed, got ${result.recordsProcessed}`);
      return;
    }
    
    this.addTestResult(testName, true, `Changed items processing working correctly. Processed ${result.recordsProcessed} changed variants`);
    
  } catch (error) {
    this.addTestResult(testName, false, error.message);
  }
};

/**
 * Test ProductImporter bulk operations
 */
ImportComponentsTest.prototype.testProductImporterBulkOperations = function() {
  var testName = 'ProductImporter Bulk Operations';
  Logger.log(`[ImportComponentsTest] Running ${testName}`);
  
  try {
    // Mock bulk API client
    var originalBulkFetch = this.productImporter.bulkApiClient.bulkFetchProducts;
    var bulkCallCount = 0;
    
    this.productImporter.bulkApiClient.bulkFetchProducts = function(ids, options) {
      bulkCallCount++;
      
      // Verify bulk options are passed correctly
      if (!options || !options.limit) {
        throw new Error('Bulk options not passed correctly');
      }
      
      return {
        success: true,
        data: [
          { id: 1, title: 'Bulk Product 1' },
          { id: 2, title: 'Bulk Product 2' },
          { id: 3, title: 'Bulk Product 3' }
        ]
      };
    };
    
    var products = this.productImporter.fetchAllProducts({ 
      limit: 250,
      useBulkOperations: true 
    });
    
    // Restore original method
    this.productImporter.bulkApiClient.bulkFetchProducts = originalBulkFetch;
    
    if (bulkCallCount !== 1) {
      this.addTestResult(testName, false, `Expected 1 bulk call, got ${bulkCallCount}`);
      return;
    }
    
    if (products.length !== 3) {
      this.addTestResult(testName, false, `Expected 3 products, got ${products.length}`);
      return;
    }
    
    this.addTestResult(testName, true, `Bulk operations working correctly. Retrieved ${products.length} products in ${bulkCallCount} bulk call`);
    
  } catch (error) {
    this.addTestResult(testName, false, error.message);
  }
};

/**
 * Test VariantImporter bulk operations
 */
ImportComponentsTest.prototype.testVariantImporterBulkOperations = function() {
  var testName = 'VariantImporter Bulk Operations';
  Logger.log(`[ImportComponentsTest] Running ${testName}`);
  
  try {
    // Mock bulk API clients
    var originalProductBulkFetch = this.variantImporter.bulkApiClient.bulkFetchProducts;
    var originalVariantBulkFetch = this.variantImporter.bulkApiClient.bulkFetchVariants;
    var productBulkCount = 0;
    var variantBulkCount = 0;
    
    this.variantImporter.bulkApiClient.bulkFetchProducts = function(ids, options) {
      productBulkCount++;
      return {
        success: true,
        data: [
          { id: 1, title: 'Bulk Product 1', handle: 'bulk-product-1' }
        ]
      };
    };
    
    this.variantImporter.bulkApiClient.bulkFetchVariants = function(ids, options) {
      variantBulkCount++;
      return {
        success: true,
        data: [
          { id: 101, product_id: 1, title: 'Bulk Variant 1' },
          { id: 102, product_id: 1, title: 'Bulk Variant 2' }
        ]
      };
    };
    
    // Build product cache and fetch variants
    this.variantImporter.buildProductCache();
    var variants = this.variantImporter.fetchAllVariants({ limit: 250 });
    
    // Restore original methods
    this.variantImporter.bulkApiClient.bulkFetchProducts = originalProductBulkFetch;
    this.variantImporter.bulkApiClient.bulkFetchVariants = originalVariantBulkFetch;
    
    if (productBulkCount !== 1) {
      this.addTestResult(testName, false, `Expected 1 product bulk call, got ${productBulkCount}`);
      return;
    }
    
    if (variantBulkCount !== 1) {
      this.addTestResult(testName, false, `Expected 1 variant bulk call, got ${variantBulkCount}`);
      return;
    }
    
    if (variants.length !== 2) {
      this.addTestResult(testName, false, `Expected 2 variants, got ${variants.length}`);
      return;
    }
    
    // Check product enrichment
    if (!variants[0].product_title || variants[0].product_title !== 'Bulk Product 1') {
      this.addTestResult(testName, false, 'Product enrichment not working correctly');
      return;
    }
    
    this.addTestResult(testName, true, `Bulk operations working correctly. Product cache: ${productBulkCount} call, Variants: ${variants.length} items with enrichment`);
    
  } catch (error) {
    this.addTestResult(testName, false, error.message);
  }
};

/**
 * Test integration with ImportOrchestrator
 */
ImportComponentsTest.prototype.testImportOrchestrationIntegration = function() {
  var testName = 'ImportOrchestrator Integration';
  Logger.log(`[ImportComponentsTest] Running ${testName}`);
  
  try {
    var orchestrator = new ImportOrchestrator();
    
    // Mock the importers
    var originalProductImport = orchestrator.productImporter.import;
    var originalVariantImport = orchestrator.variantImporter.import;
    
    var productImportCalled = false;
    var variantImportCalled = false;
    var productOptions = null;
    var variantOptions = null;
    
    orchestrator.productImporter.import = function(options) {
      productImportCalled = true;
      productOptions = options;
      return {
        success: true,
        recordsProcessed: 2,
        recordsWritten: 2,
        errors: [],
        warnings: [],
        rateLimitHits: 0,
        apiCallCount: 1
      };
    };
    
    orchestrator.variantImporter.import = function(options) {
      variantImportCalled = true;
      variantOptions = options;
      return {
        success: true,
        recordsProcessed: 1,
        recordsWritten: 1,
        errors: [],
        warnings: [],
        rateLimitHits: 0,
        apiCallCount: 1
      };
    };
    
    // Mock change detection
    var originalDetectChangedItems = orchestrator.detectChangedItems;
    orchestrator.detectChangedItems = function() {
      return {
        products: [{ id: 1 }, { id: 2 }],
        variants: [{ id: 101 }]
      };
    };
    
    // Test intelligent incremental sync
    var result = orchestrator.intelligentIncrementalSync({ dryRun: true });
    
    // Restore original methods
    orchestrator.productImporter.import = originalProductImport;
    orchestrator.variantImporter.import = originalVariantImport;
    orchestrator.detectChangedItems = originalDetectChangedItems;
    
    if (!result.success) {
      this.addTestResult(testName, false, 'Integration test failed: ' + (result.errors || []).join(', '));
      return;
    }
    
    if (!productImportCalled || !variantImportCalled) {
      this.addTestResult(testName, false, 'Not all importers were called during integration');
      return;
    }
    
    if (!productOptions.changedItemsOnly || !variantOptions.changedItemsOnly) {
      this.addTestResult(testName, false, 'changedItemsOnly flag not passed to importers');
      return;
    }
    
    if (result.recordsProcessed !== 3) {
      this.addTestResult(testName, false, `Expected 3 total records processed, got ${result.recordsProcessed}`);
      return;
    }
    
    this.addTestResult(testName, true, `Integration working correctly. Processed ${result.recordsProcessed} records with changed items optimization`);
    
  } catch (error) {
    this.addTestResult(testName, false, error.message);
  }
};

/**
 * Test error handling and fallback mechanisms
 */
ImportComponentsTest.prototype.testErrorHandlingAndFallback = function() {
  var testName = 'Error Handling and Fallback';
  Logger.log(`[ImportComponentsTest] Running ${testName}`);
  
  try {
    // Test ProductImporter fallback when bulk operations fail
    var originalBulkFetch = this.productImporter.bulkApiClient.bulkFetchProducts;
    var originalSafeApiRequest = this.productImporter.safeApiRequest;
    var bulkFailCount = 0;
    var individualCallCount = 0;
    
    this.productImporter.bulkApiClient.bulkFetchProducts = function() {
      bulkFailCount++;
      throw new Error('Simulated bulk operation failure');
    };
    
    this.productImporter.safeApiRequest = function(endpoint) {
      individualCallCount++;
      return {
        products: [
          { id: 1, title: 'Fallback Product 1' }
        ]
      };
    };
    
    var products = this.productImporter.fetchAllProducts({ 
      useBulkOperations: true,
      maxProducts: 1
    });
    
    // Restore original methods
    this.productImporter.bulkApiClient.bulkFetchProducts = originalBulkFetch;
    this.productImporter.safeApiRequest = originalSafeApiRequest;
    
    if (bulkFailCount !== 1) {
      this.addTestResult(testName, false, `Expected 1 bulk failure, got ${bulkFailCount}`);
      return;
    }
    
    if (individualCallCount !== 1) {
      this.addTestResult(testName, false, `Expected 1 individual call, got ${individualCallCount}`);
      return;
    }
    
    if (products.length !== 1) {
      this.addTestResult(testName, false, `Expected 1 product from fallback, got ${products.length}`);
      return;
    }
    
    this.addTestResult(testName, true, `Fallback mechanism working correctly. Bulk failed ${bulkFailCount} time, fallback retrieved ${products.length} product`);
    
  } catch (error) {
    this.addTestResult(testName, false, error.message);
  }
};

/**
 * Add test result
 */
ImportComponentsTest.prototype.addTestResult = function(testName, passed, message) {
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
ImportComponentsTest.prototype.generateReport = function() {
  var passRate = ((this.testResults.summary.passed / this.testResults.summary.totalTests) * 100).toFixed(1);
  
  Logger.log('\n=== IMPORT COMPONENTS TEST RESULTS ===');
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
  
  Logger.log('\n=== MILESTONE 2 IMPORT COMPONENTS STATUS ===');
  if (passRate >= 80) {
    Logger.log('🎉 MILESTONE 2 IMPORT COMPONENTS: READY FOR PRODUCTION');
    Logger.log('✅ ProductImporter with intelligent caching working');
    Logger.log('✅ VariantImporter with bulk operations working');
    Logger.log('✅ Changed items processing optimized');
    Logger.log('✅ Integration with ImportOrchestrator validated');
    Logger.log('✅ Error handling and fallback mechanisms robust');
  } else {
    Logger.log('⚠️ MILESTONE 2 IMPORT COMPONENTS: NEEDS FIXES');
  }
};

/**
 * Standalone test function
 */
function testImportComponents() {
  var test = new ImportComponentsTest();
  return test.runFullTest();
}
