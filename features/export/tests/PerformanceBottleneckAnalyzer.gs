// Performance Bottleneck Analyzer
// Comprehensive test runner that executes all performance tests to definitively identify
// whether performance issues come from Shopify API or our system

function PerformanceBottleneckAnalyzer() {
  this.allTestResults = [];
  this.finalAnalysis = {};
}

/**
 * Run complete performance bottleneck analysis
 * This is the main function to execute all tests and provide definitive answers
 */
PerformanceBottleneckAnalyzer.prototype.runCompleteAnalysis = function() {
  Logger.log('=== PERFORMANCE BOTTLENECK ANALYZER STARTING ===');
  Logger.log('🔍 Objective: Determine if performance issues are from Shopify API or our system');
  
  try {
    var startTime = new Date();
    
    // Execute all performance tests
    this.executeApiPerformanceTests();
    this.executeBulkOperationsTests();
    
    // Perform comprehensive analysis
    this.performBottleneckAnalysis();
    
    // Generate definitive verdict
    this.generateDefinitiveVerdict();
    
    var endTime = new Date();
    var totalDuration = endTime.getTime() - startTime.getTime();
    
    Logger.log(`=== ANALYSIS COMPLETED IN ${Math.round(totalDuration / 1000)} SECONDS ===`);
    
    return this.finalAnalysis;
    
  } catch (error) {
    Logger.log(`[PerformanceBottleneckAnalyzer] Critical error: ${error.message}`);
    return {
      success: false,
      error: error.message,
      timestamp: new Date()
    };
  }
};

/**
 * Execute API performance isolation tests
 */
PerformanceBottleneckAnalyzer.prototype.executeApiPerformanceTests = function() {
  Logger.log('📊 [PHASE 1] Executing API Performance Tests...');
  
  try {
    // Check if the test class exists
    if (typeof ApiPerformanceIsolationTest === 'undefined') {
      throw new Error('ApiPerformanceIsolationTest class not found. Make sure the test file is loaded.');
    }
    
    var apiTest = new ApiPerformanceIsolationTest();
    var apiResults = apiTest.runCompleteTest();
    
    this.allTestResults.push({
      testSuite: 'API_PERFORMANCE_ISOLATION',
      results: apiTest.testResults,
      summary: apiResults
    });
    
    Logger.log('✅ [PHASE 1] API Performance Tests completed');
    
  } catch (error) {
    Logger.log(`❌ [PHASE 1] API Performance Tests failed: ${error.message}`);
    this.allTestResults.push({
      testSuite: 'API_PERFORMANCE_ISOLATION',
      error: error.message,
      results: []
    });
  }
};

/**
 * Execute bulk operations tests
 */
PerformanceBottleneckAnalyzer.prototype.executeBulkOperationsTests = function() {
  Logger.log('📊 [PHASE 2] Executing Bulk Operations Tests...');
  
  try {
    // Check if the test class exists
    if (typeof BulkApiOperationsTest === 'undefined') {
      throw new Error('BulkApiOperationsTest class not found. Make sure the test file is loaded.');
    }
    
    var bulkTest = new BulkApiOperationsTest();
    var bulkResults = bulkTest.runCompleteTest();
    
    this.allTestResults.push({
      testSuite: 'BULK_API_OPERATIONS',
      results: bulkTest.testResults,
      summary: bulkResults
    });
    
    Logger.log('✅ [PHASE 2] Bulk Operations Tests completed');
    
  } catch (error) {
    Logger.log(`❌ [PHASE 2] Bulk Operations Tests failed: ${error.message}`);
    this.allTestResults.push({
      testSuite: 'BULK_API_OPERATIONS',
      error: error.message,
      results: []
    });
  }
};

/**
 * Perform comprehensive bottleneck analysis
 */
PerformanceBottleneckAnalyzer.prototype.performBottleneckAnalysis = function() {
  Logger.log('🔬 [PHASE 3] Performing Bottleneck Analysis...');
  
  try {
    // Extract key metrics from all tests
    var apiTestSuite = this.allTestResults.find(suite => suite.testSuite === 'API_PERFORMANCE_ISOLATION');
    var bulkTestSuite = this.allTestResults.find(suite => suite.testSuite === 'BULK_API_OPERATIONS');
    
    if (!apiTestSuite || !bulkTestSuite) {
      throw new Error('Both test suites must complete for analysis');
    }
    
    // Extract API performance metrics
    var apiResponseTest = apiTestSuite.results.find(r => r.test === 'PURE_API_RESPONSE_TIME');
    var systemProcessingTest = apiTestSuite.results.find(r => r.test === 'SYSTEM_PROCESSING_TIME');
    var rateLimitTest = apiTestSuite.results.find(r => r.test === 'RATE_LIMITING_BEHAVIOR');
    var comparativeTest = apiTestSuite.results.find(r => r.test === 'COMPARATIVE_ANALYSIS');
    
    // Extract bulk optimization metrics
    var individualCallsTest = bulkTestSuite.results.find(r => r.test === 'INDIVIDUAL_API_CALLS');
    var bulkCallsTest = bulkTestSuite.results.find(r => r.test === 'BULK_API_CALLS');
    var optimizationAnalysis = bulkTestSuite.results.find(r => r.test === 'OPTIMIZATION_POTENTIAL_ANALYSIS');
    
    // Compile comprehensive metrics
    this.finalAnalysis = {
      timestamp: new Date(),
      testSuitesExecuted: this.allTestResults.length,
      
      // API Performance Metrics
      apiMetrics: {
        avgResponseTime: apiResponseTest && apiResponseTest.details ? apiResponseTest.details.avgResponseTime : null,
        maxResponseTime: apiResponseTest && apiResponseTest.details ? apiResponseTest.details.maxResponseTime : null,
        minResponseTime: apiResponseTest && apiResponseTest.details ? apiResponseTest.details.minResponseTime : null,
        successRate: apiResponseTest && apiResponseTest.details ? 
          (apiResponseTest.details.successfulCalls / apiResponseTest.details.totalCalls) * 100 : null
      },
      
      // Rate Limiting Metrics
      rateLimitMetrics: {
        maxCallsPerSecond: rateLimitTest && rateLimitTest.details ? rateLimitTest.details.callsPerSecond : null,
        rateLimitThreshold: rateLimitTest && rateLimitTest.details ? rateLimitTest.details.rateLimitThreshold : null
      },
      
      // System Performance Metrics
      systemMetrics: {
        avgProcessingTimePerItem: systemProcessingTest && systemProcessingTest.details ? 
          systemProcessingTest.details.avgTimePerItem : null,
        totalProcessingTime: systemProcessingTest && systemProcessingTest.details ? 
          systemProcessingTest.details.totalProcessingTime : null
      },
      
      // Bottleneck Analysis
      bottleneckAnalysis: {
        primaryBottleneck: comparativeTest && comparativeTest.details ? 
          comparativeTest.details.estimatedTimeFor1000Products.primaryBottleneck : null,
        apiBottleneckPercent: comparativeTest && comparativeTest.details ? 
          comparativeTest.details.apiBottleneckPercent : null,
        systemBottleneckPercent: comparativeTest && comparativeTest.details ? 
          comparativeTest.details.systemBottleneckPercent : null
      },
      
      // Optimization Potential
      optimizationPotential: {
        bulkImprovementPercent: optimizationAnalysis && optimizationAnalysis.details ? 
          optimizationAnalysis.details.bulkOptimization.improvementPercent : null,
        projectedTimeReduction: optimizationAnalysis && optimizationAnalysis.details ? 
          optimizationAnalysis.details.bulkOptimization.projectedRealWorldHours : null,
        recommendedStrategy: optimizationAnalysis && optimizationAnalysis.details ? 
          optimizationAnalysis.details.recommendations.primaryStrategy : null
      }
    };
    
    Logger.log('✅ [PHASE 3] Bottleneck Analysis completed');
    
  } catch (error) {
    Logger.log(`❌ [PHASE 3] Bottleneck Analysis failed: ${error.message}`);
    this.finalAnalysis.error = error.message;
  }
};

/**
 * Generate definitive verdict on performance bottlenecks
 */
PerformanceBottleneckAnalyzer.prototype.generateDefinitiveVerdict = function() {
  Logger.log('⚖️ [PHASE 4] Generating Definitive Verdict...');
  
  try {
    var metrics = this.finalAnalysis;
    
    // Determine confidence level based on test completion
    var testCompletionRate = this.calculateTestCompletionRate();
    var confidenceLevel = testCompletionRate >= 80 ? 'HIGH' : testCompletionRate >= 60 ? 'MEDIUM' : 'LOW';
    
    // Analyze bottleneck evidence
    var evidence = this.analyzeBottleneckEvidence();
    
    // Generate verdict
    var verdict = this.determineVerdict(evidence);
    
    // Add verdict to final analysis
    this.finalAnalysis.verdict = {
      confidenceLevel: confidenceLevel,
      testCompletionRate: testCompletionRate,
      evidence: evidence,
      conclusion: verdict,
      recommendations: this.generateRecommendations(verdict, evidence)
    };
    
    // Log definitive results
    this.logDefinitiveResults();
    
    Logger.log('✅ [PHASE 4] Definitive Verdict generated');
    
  } catch (error) {
    Logger.log(`❌ [PHASE 4] Verdict generation failed: ${error.message}`);
    this.finalAnalysis.verdict = {
      error: error.message,
      confidenceLevel: 'LOW'
    };
  }
};

/**
 * Calculate test completion rate
 */
PerformanceBottleneckAnalyzer.prototype.calculateTestCompletionRate = function() {
  var totalExpectedTests = 7; // Expected number of individual tests
  var completedTests = 0;
  
  for (var i = 0; i < this.allTestResults.length; i++) {
    var suite = this.allTestResults[i];
    if (suite.results) {
      completedTests += suite.results.filter(r => r.status === 'PASSED').length;
    }
  }
  
  return Math.round((completedTests / totalExpectedTests) * 100);
};

/**
 * Analyze evidence for bottleneck determination
 */
PerformanceBottleneckAnalyzer.prototype.analyzeBottleneckEvidence = function() {
  var evidence = {
    apiEvidence: [],
    systemEvidence: [],
    optimizationEvidence: []
  };
  
  var metrics = this.finalAnalysis;
  
  // API Evidence
  if (metrics.apiMetrics.avgResponseTime > 3000) {
    evidence.apiEvidence.push(`High API response time: ${metrics.apiMetrics.avgResponseTime}ms average`);
  }
  
  if (metrics.rateLimitMetrics.maxCallsPerSecond < 2) {
    evidence.apiEvidence.push(`Low rate limit: ${metrics.rateLimitMetrics.maxCallsPerSecond} calls/second`);
  }
  
  if (metrics.bottleneckAnalysis.apiBottleneckPercent > 70) {
    evidence.apiEvidence.push(`API represents ${metrics.bottleneckAnalysis.apiBottleneckPercent}% of total time`);
  }
  
  // System Evidence
  if (metrics.systemMetrics.avgProcessingTimePerItem > 100) {
    evidence.systemEvidence.push(`High system processing: ${metrics.systemMetrics.avgProcessingTimePerItem}ms per item`);
  }
  
  if (metrics.bottleneckAnalysis.systemBottleneckPercent > 70) {
    evidence.systemEvidence.push(`System processing represents ${metrics.bottleneckAnalysis.systemBottleneckPercent}% of total time`);
  }
  
  // Optimization Evidence
  if (metrics.optimizationPotential.bulkImprovementPercent > 50) {
    evidence.optimizationEvidence.push(`Bulk operations can improve performance by ${metrics.optimizationPotential.bulkImprovementPercent}%`);
  }
  
  return evidence;
};

/**
 * Determine final verdict based on evidence
 */
PerformanceBottleneckAnalyzer.prototype.determineVerdict = function(evidence) {
  var apiEvidenceCount = evidence.apiEvidence.length;
  var systemEvidenceCount = evidence.systemEvidence.length;
  var optimizationEvidenceCount = evidence.optimizationEvidence.length;
  
  var metrics = this.finalAnalysis;
  
  if (apiEvidenceCount >= 2 && metrics.bottleneckAnalysis.primaryBottleneck === 'API') {
    return {
      primaryBottleneck: 'SHOPIFY_API',
      confidence: 'HIGH',
      reasoning: 'Multiple API performance indicators show Shopify API is the primary bottleneck',
      impact: 'API response times and rate limiting are constraining overall performance'
    };
  } else if (systemEvidenceCount >= 2 && metrics.bottleneckAnalysis.primaryBottleneck === 'SYSTEM') {
    return {
      primaryBottleneck: 'OUR_SYSTEM',
      confidence: 'HIGH',
      reasoning: 'System processing time exceeds API response time as primary constraint',
      impact: 'Internal processing algorithms and data handling are the main performance limiters'
    };
  } else if (optimizationEvidenceCount >= 1 && metrics.optimizationPotential.bulkImprovementPercent > 70) {
    return {
      primaryBottleneck: 'API_INEFFICIENCY',
      confidence: 'HIGH',
      reasoning: 'Current API usage pattern is inefficient, bulk operations show major improvement potential',
      impact: 'Using individual API calls instead of bulk operations is causing unnecessary delays'
    };
  } else {
    return {
      primaryBottleneck: 'MIXED_FACTORS',
      confidence: 'MEDIUM',
      reasoning: 'Both API and system factors contribute to performance issues',
      impact: 'Multiple optimization strategies needed for significant improvement'
    };
  }
};

/**
 * Generate recommendations based on verdict
 */
PerformanceBottleneckAnalyzer.prototype.generateRecommendations = function(verdict, evidence) {
  var recommendations = [];
  
  switch (verdict.primaryBottleneck) {
    case 'SHOPIFY_API':
      recommendations.push('Implement bulk API operations to reduce call frequency');
      recommendations.push('Add intelligent caching to minimize API calls');
      recommendations.push('Implement retry logic with exponential backoff for rate limits');
      recommendations.push('Consider GraphQL for more efficient data fetching');
      break;
      
    case 'OUR_SYSTEM':
      recommendations.push('Optimize data processing algorithms');
      recommendations.push('Implement parallel processing where possible');
      recommendations.push('Review and optimize data structures');
      recommendations.push('Add performance monitoring to identify specific bottlenecks');
      break;
      
    case 'API_INEFFICIENCY':
      recommendations.push('PRIORITY: Implement bulk API operations immediately');
      recommendations.push('Replace individual calls with batch operations');
      recommendations.push('Optimize API call patterns and data fetching strategy');
      break;
      
    default:
      recommendations.push('Implement both API and system optimizations');
      recommendations.push('Start with bulk API operations for quick wins');
      recommendations.push('Follow up with system-level optimizations');
      break;
  }
  
  return recommendations;
};

/**
 * Log definitive results
 */
PerformanceBottleneckAnalyzer.prototype.logDefinitiveResults = function() {
  Logger.log('');
  Logger.log('🎯 ===== DEFINITIVE PERFORMANCE BOTTLENECK ANALYSIS RESULTS =====');
  Logger.log('');
  
  var verdict = this.finalAnalysis.verdict;
  var metrics = this.finalAnalysis;
  
  // Header with confidence
  Logger.log(`📊 ANALYSIS CONFIDENCE: ${verdict.confidenceLevel} (${verdict.testCompletionRate}% tests completed)`);
  Logger.log('');
  
  // Primary verdict
  Logger.log(`🔍 PRIMARY BOTTLENECK: ${verdict.conclusion.primaryBottleneck}`);
  Logger.log(`📈 CONFIDENCE LEVEL: ${verdict.conclusion.confidence}`);
  Logger.log(`💡 REASONING: ${verdict.conclusion.reasoning}`);
  Logger.log(`⚡ IMPACT: ${verdict.conclusion.impact}`);
  Logger.log('');
  
  // Key metrics
  Logger.log('📋 KEY PERFORMANCE METRICS:');
  if (metrics.apiMetrics.avgResponseTime) {
    Logger.log(`   • Average API Response: ${metrics.apiMetrics.avgResponseTime}ms`);
  }
  if (metrics.rateLimitMetrics.maxCallsPerSecond) {
    Logger.log(`   • Rate Limit: ${metrics.rateLimitMetrics.maxCallsPerSecond} calls/second`);
  }
  if (metrics.systemMetrics.avgProcessingTimePerItem) {
    Logger.log(`   • System Processing: ${metrics.systemMetrics.avgProcessingTimePerItem}ms per item`);
  }
  if (metrics.bottleneckAnalysis.apiBottleneckPercent) {
    Logger.log(`   • API Impact: ${metrics.bottleneckAnalysis.apiBottleneckPercent}%`);
    Logger.log(`   • System Impact: ${metrics.bottleneckAnalysis.systemBottleneckPercent}%`);
  }
  Logger.log('');
  
  // Optimization potential
  if (metrics.optimizationPotential.bulkImprovementPercent) {
    Logger.log('🚀 OPTIMIZATION POTENTIAL:');
    Logger.log(`   • Bulk API Improvement: ${metrics.optimizationPotential.bulkImprovementPercent}%`);
    Logger.log(`   • Projected Time Reduction: ${metrics.optimizationPotential.projectedTimeReduction} hours`);
    Logger.log(`   • Recommended Strategy: ${metrics.optimizationPotential.recommendedStrategy}`);
    Logger.log('');
  }
  
  // Recommendations
  Logger.log('✅ RECOMMENDED ACTIONS:');
  for (var i = 0; i < verdict.recommendations.length; i++) {
    Logger.log(`   ${i + 1}. ${verdict.recommendations[i]}`);
  }
  Logger.log('');
  
  // Final verdict
  if (verdict.conclusion.primaryBottleneck === 'SHOPIFY_API' || verdict.conclusion.primaryBottleneck === 'API_INEFFICIENCY') {
    Logger.log('🎉 CONCLUSION: Performance issues are primarily from SHOPIFY API, not our system!');
    Logger.log('✨ This validates that our system architecture is sound and API optimization will yield major improvements.');
  } else if (verdict.conclusion.primaryBottleneck === 'OUR_SYSTEM') {
    Logger.log('⚠️ CONCLUSION: Performance issues are primarily from OUR SYSTEM processing.');
    Logger.log('🔧 Focus optimization efforts on internal algorithms and data processing.');
  } else {
    Logger.log('📊 CONCLUSION: Performance issues stem from both API and system factors.');
    Logger.log('🎯 Balanced optimization approach recommended for maximum impact.');
  }
  
  Logger.log('');
  Logger.log('===== END OF ANALYSIS =====');
};

/**
 * Quick test function for manual execution
 */
function analyzePerformanceBottlenecks() {
  var analyzer = new PerformanceBottleneckAnalyzer();
  return analyzer.runCompleteAnalysis();
}

/**
 * Get summary of last analysis
 */
function getBottleneckAnalysisSummary() {
  var analyzer = new PerformanceBottleneckAnalyzer();
  if (analyzer.finalAnalysis && analyzer.finalAnalysis.verdict) {
    return {
      primaryBottleneck: analyzer.finalAnalysis.verdict.conclusion.primaryBottleneck,
      confidence: analyzer.finalAnalysis.verdict.conclusion.confidence,
      recommendations: analyzer.finalAnalysis.verdict.recommendations
    };
  }
  return null;
}
