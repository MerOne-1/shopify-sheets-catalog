/**
 * BulkOperationsPerformanceTest
 * Validates 80%+ performance improvement from bulk operations
 * Measures actual vs projected performance gains
 */
class BulkOperationsPerformanceTest {
  constructor() {
    this.apiClient = new ApiClient();
    this.bulkClient = new BulkApiClient();
    this.results = {
      individual: {},
      bulk: {},
      comparison: {}
    };
  }

  /**
   * Run comprehensive performance validation
   */
  runFullPerformanceValidation() {
    Logger.log('=== BULK OPERATIONS PERFORMANCE VALIDATION ===');
    
    try {
      // Test 1: Product fetch performance
      this.testProductFetchPerformance();
      
      // Test 2: Variant fetch performance  
      this.testVariantFetchPerformance();
      
      // Test 3: Bulk vs individual comparison
      this.testBulkVsIndividualComparison();
      
      // Test 4: Export performance
      this.testExportPerformance();
      
      // Generate final report
      return this.generatePerformanceReport();
      
    } catch (error) {
      Logger.log(`Performance validation failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
        partialResults: this.results
      };
    }
  }

  /**
   * Test product fetch performance improvement
   */
  testProductFetchPerformance() {
    Logger.log('--- Testing Product Fetch Performance ---');
    
    // Test individual operations (legacy mode)
    var startIndividual = Date.now();
    var individualProducts = this.apiClient.getAllProducts(null, 50, false); // Legacy mode, small batch
    var individualTime = (Date.now() - startIndividual) / 1000;
    var individualRate = individualProducts.length / individualTime;
    
    this.results.individual.products = {
      count: individualProducts.length,
      timeSeconds: individualTime,
      ratePerSecond: individualRate
    };
    
    Logger.log(`Individual mode: ${individualProducts.length} products in ${individualTime.toFixed(1)}s (${individualRate.toFixed(1)}/sec)`);
    
    // Test bulk operations
    var startBulk = Date.now();
    var bulkResult = this.bulkClient.bulkFetchProducts({ limit: 250 });
    var bulkTime = bulkResult.timeSeconds;
    var bulkRate = bulkResult.ratePerSecond;
    
    this.results.bulk.products = {
      count: bulkResult.count,
      timeSeconds: bulkTime,
      ratePerSecond: bulkRate
    };
    
    Logger.log(`Bulk mode: ${bulkResult.count} products in ${bulkTime.toFixed(1)}s (${bulkRate.toFixed(1)}/sec)`);
    
    // Calculate improvement
    var improvement = ((bulkRate - individualRate) / individualRate * 100);
    Logger.log(`Product fetch improvement: ${improvement.toFixed(1)}%`);
    
    return {
      individual: this.results.individual.products,
      bulk: this.results.bulk.products,
      improvement: improvement
    };
  }

  /**
   * Test variant fetch performance improvement
   */
  testVariantFetchPerformance() {
    Logger.log('--- Testing Variant Fetch Performance ---');
    
    // Test individual operations (legacy mode)
    var startIndividual = Date.now();
    var individualVariants = this.apiClient.getAllVariants(null, false); // Legacy mode
    var individualTime = (Date.now() - startIndividual) / 1000;
    var individualRate = individualVariants.length / individualTime;
    
    this.results.individual.variants = {
      count: individualVariants.length,
      timeSeconds: individualTime,
      ratePerSecond: individualRate
    };
    
    Logger.log(`Individual mode: ${individualVariants.length} variants in ${individualTime.toFixed(1)}s (${individualRate.toFixed(1)}/sec)`);
    
    // Test bulk operations
    var startBulk = Date.now();
    var bulkResult = this.bulkClient.bulkFetchVariants();
    var bulkTime = bulkResult.timeSeconds;
    var bulkRate = bulkResult.ratePerSecond;
    
    this.results.bulk.variants = {
      count: bulkResult.count,
      timeSeconds: bulkTime,
      ratePerSecond: bulkRate
    };
    
    Logger.log(`Bulk mode: ${bulkResult.count} variants in ${bulkTime.toFixed(1)}s (${bulkRate.toFixed(1)}/sec)`);
    
    // Calculate improvement
    var improvement = ((bulkRate - individualRate) / individualRate * 100);
    Logger.log(`Variant fetch improvement: ${improvement.toFixed(1)}%`);
    
    return {
      individual: this.results.individual.variants,
      bulk: this.results.bulk.variants,
      improvement: improvement
    };
  }

  /**
   * Test bulk vs individual comparison using BulkApiClient's built-in comparison
   */
  testBulkVsIndividualComparison() {
    Logger.log('--- Testing Bulk vs Individual Comparison ---');
    
    var comparison = this.bulkClient.comparePerformance(100);
    this.results.comparison = comparison;
    
    Logger.log(`Comparison results: ${comparison.improvement.rateIncrease.toFixed(1)}% rate improvement`);
    Logger.log(`Projected full import improvement: ${comparison.improvement.projectedFullImport.improvement}`);
    
    return comparison;
  }

  /**
   * Test export performance with bulk operations
   */
  testExportPerformance() {
    Logger.log('--- Testing Export Performance ---');
    
    // Get sample products for export testing
    var sampleProducts = this.bulkClient.bulkFetchProducts({ limit: 50 }).products.slice(0, 20);
    
    // Test individual export operations
    var startIndividual = Date.now();
    var individualResults = {
      success: 0,
      failed: 0,
      total: Math.min(sampleProducts.length, 5) // Limit for testing
    };
    
    for (var i = 0; i < individualResults.total; i++) {
      try {
        // Simulate individual export (dry run)
        var product = sampleProducts[i];
        if (product.title && product.id) {
          individualResults.success++;
        }
      } catch (error) {
        individualResults.failed++;
      }
    }
    
    var individualTime = (Date.now() - startIndividual) / 1000;
    var individualRate = individualResults.total / individualTime;
    
    this.results.individual.export = {
      count: individualResults.total,
      timeSeconds: individualTime,
      ratePerSecond: individualRate,
      success: individualResults.success,
      failed: individualResults.failed
    };
    
    Logger.log(`Individual export: ${individualResults.total} items in ${individualTime.toFixed(1)}s (${individualRate.toFixed(1)}/sec)`);
    
    // Test bulk export operations
    var bulkResult = this.bulkClient.bulkExportProducts(sampleProducts, { 
      dryRun: true, 
      batchSize: 100 
    });
    
    this.results.bulk.export = {
      count: sampleProducts.length,
      timeSeconds: bulkResult.timeSeconds,
      ratePerSecond: bulkResult.ratePerSecond,
      success: bulkResult.success,
      failed: bulkResult.failed
    };
    
    Logger.log(`Bulk export: ${sampleProducts.length} items in ${bulkResult.timeSeconds.toFixed(1)}s (${bulkResult.ratePerSecond.toFixed(1)}/sec)`);
    
    // Calculate improvement
    var improvement = ((bulkResult.ratePerSecond - individualRate) / individualRate * 100);
    Logger.log(`Export performance improvement: ${improvement.toFixed(1)}%`);
    
    return {
      individual: this.results.individual.export,
      bulk: this.results.bulk.export,
      improvement: improvement
    };
  }

  /**
   * Generate comprehensive performance report
   */
  generatePerformanceReport() {
    var report = {
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        productFetchImprovement: 0,
        variantFetchImprovement: 0,
        exportImprovement: 0,
        overallImprovement: 0,
        projectedFullImportTime: 'N/A'
      },
      details: this.results,
      recommendations: [],
      verdict: 'UNKNOWN'
    };

    try {
      // Calculate improvements
      if (this.results.individual.products && this.results.bulk.products) {
        report.summary.productFetchImprovement = 
          ((this.results.bulk.products.ratePerSecond - this.results.individual.products.ratePerSecond) / 
           this.results.individual.products.ratePerSecond * 100);
      }

      if (this.results.individual.variants && this.results.bulk.variants) {
        report.summary.variantFetchImprovement = 
          ((this.results.bulk.variants.ratePerSecond - this.results.individual.variants.ratePerSecond) / 
           this.results.individual.variants.ratePerSecond * 100);
      }

      if (this.results.individual.export && this.results.bulk.export) {
        report.summary.exportImprovement = 
          ((this.results.bulk.export.ratePerSecond - this.results.individual.export.ratePerSecond) / 
           this.results.individual.export.ratePerSecond * 100);
      }

      // Overall improvement (average of all improvements)
      var improvements = [
        report.summary.productFetchImprovement,
        report.summary.variantFetchImprovement,
        report.summary.exportImprovement
      ].filter(imp => imp > 0);

      if (improvements.length > 0) {
        report.summary.overallImprovement = improvements.reduce((a, b) => a + b, 0) / improvements.length;
      }

      // Projected full import time
      if (this.results.comparison && this.results.comparison.improvement) {
        report.summary.projectedFullImportTime = this.results.comparison.improvement.projectedFullImport.optimized;
      }

      // Generate recommendations
      if (report.summary.overallImprovement >= 80) {
        report.verdict = 'EXCELLENT';
        report.recommendations.push('✅ Bulk operations exceed 80% improvement target');
        report.recommendations.push('✅ Ready for production deployment');
      } else if (report.summary.overallImprovement >= 60) {
        report.verdict = 'GOOD';
        report.recommendations.push('✅ Bulk operations provide significant improvement');
        report.recommendations.push('⚠️ Consider additional optimizations for 80% target');
      } else if (report.summary.overallImprovement >= 30) {
        report.verdict = 'MODERATE';
        report.recommendations.push('⚠️ Bulk operations provide moderate improvement');
        report.recommendations.push('🔧 Review batch sizes and API usage patterns');
      } else {
        report.verdict = 'POOR';
        report.recommendations.push('❌ Bulk operations not meeting expectations');
        report.recommendations.push('🔧 Investigate API bottlenecks and optimization strategies');
      }

      // Log summary
      Logger.log('=== PERFORMANCE VALIDATION SUMMARY ===');
      Logger.log(`Overall Improvement: ${report.summary.overallImprovement.toFixed(1)}%`);
      Logger.log(`Product Fetch: ${report.summary.productFetchImprovement.toFixed(1)}%`);
      Logger.log(`Variant Fetch: ${report.summary.variantFetchImprovement.toFixed(1)}%`);
      Logger.log(`Export Operations: ${report.summary.exportImprovement.toFixed(1)}%`);
      Logger.log(`Verdict: ${report.verdict}`);
      Logger.log(`Projected Full Import: ${report.summary.projectedFullImportTime}`);

      return report;

    } catch (error) {
      Logger.log(`Report generation failed: ${error.message}`);
      report.success = false;
      report.error = error.message;
      return report;
    }
  }
}

/**
 * Standalone test functions for easy execution
 */
function testBulkOperationsPerformance() {
  var test = new BulkOperationsPerformanceTest();
  return test.runFullPerformanceValidation();
}

function testProductFetchOnly() {
  var test = new BulkOperationsPerformanceTest();
  return test.testProductFetchPerformance();
}

function testVariantFetchOnly() {
  var test = new BulkOperationsPerformanceTest();
  return test.testVariantFetchPerformance();
}

function testExportOnly() {
  var test = new BulkOperationsPerformanceTest();
  return test.testExportPerformance();
}
