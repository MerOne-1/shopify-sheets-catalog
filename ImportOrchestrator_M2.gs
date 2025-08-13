// Milestone 2: Import Orchestrator
// Focused coordination component (~100 lines)

function ImportOrchestrator() {
  this.productImporter = new ProductImporter();
  this.variantImporter = new VariantImporter();
}

ImportOrchestrator.prototype.importAll = function(options) {
  options = options || {};
  var startTime = Date.now();
  var dryRun = options.dryRun || false;
  var incremental = options.incremental || false;
  
  try {
    var productResults = this.productImporter.import(options);
    if (!productResults.success) {
      return productResults;
    }
    
    var variantResults = this.variantImporter.import(options);
    if (!variantResults.success) {
      return variantResults;
    }
    
    var totalDuration = Date.now() - startTime;
    
    // Combine validation results if available
    var combinedValidationResults = null;
    if (productResults.validationResults || variantResults.validationResults) {
      combinedValidationResults = {
        isValid: (productResults.validationResults ? productResults.validationResults.isValid : true) && 
                (variantResults.validationResults ? variantResults.validationResults.isValid : true),
        errors: (productResults.validationResults ? productResults.validationResults.errors : [])
                .concat(variantResults.validationResults ? variantResults.validationResults.errors : []),
        warnings: (productResults.validationResults ? productResults.validationResults.warnings : [])
                 .concat(variantResults.validationResults ? variantResults.validationResults.warnings : []),
        summary: {
          totalRecords: (productResults.validationResults ? productResults.validationResults.summary.totalRecords : 0) +
                       (variantResults.validationResults ? variantResults.validationResults.summary.totalRecords : 0),
          validRecords: (productResults.validationResults ? productResults.validationResults.summary.validRecords : 0) +
                       (variantResults.validationResults ? variantResults.validationResults.summary.validRecords : 0),
          invalidRecords: (productResults.validationResults ? productResults.validationResults.summary.invalidRecords : 0) +
                         (variantResults.validationResults ? variantResults.validationResults.summary.invalidRecords : 0),
          recordsWithWarnings: (productResults.validationResults ? productResults.validationResults.summary.recordsWithWarnings : 0) +
                              (variantResults.validationResults ? variantResults.validationResults.summary.recordsWithWarnings : 0)
        }
      };
    }
    
    return {
      success: true,
      dryRun: dryRun,
      processingAction: incremental ? 'incremental_import' : 'full_import',
      recordsProcessed: productResults.recordsProcessed + variantResults.recordsProcessed,
      recordsWritten: productResults.recordsWritten + variantResults.recordsWritten,
      duration: totalDuration,
      errors: productResults.errors.concat(variantResults.errors),
      warnings: productResults.warnings.concat(variantResults.warnings),
      rateLimitHits: productResults.rateLimitHits + variantResults.rateLimitHits,
      apiCallCount: productResults.apiCallCount + variantResults.apiCallCount,
      avgRequestsPerSecond: Math.round(((productResults.apiCallCount + variantResults.apiCallCount) / (totalDuration / 1000)) * 100) / 100,
      validationResults: combinedValidationResults,
      productResults: productResults,
      variantResults: variantResults
    };
    
  } catch (error) {
    return {
      success: false,
      dryRun: dryRun,
      recordsProcessed: 0,
      recordsWritten: 0,
      duration: Date.now() - startTime,
      errors: [error.message],
      warnings: [],
      rateLimitHits: 0,
      apiCallCount: 0,
      avgRequestsPerSecond: 0
    };
  }
};

ImportOrchestrator.prototype.importProductsOnly = function(options) {
  return this.productImporter.import(options);
};

ImportOrchestrator.prototype.importVariantsOnly = function(options) {
  return this.variantImporter.import(options);
};
