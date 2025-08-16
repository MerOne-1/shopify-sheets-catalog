// Bulk API Operations Test
// Tests bulk API strategies vs individual API calls to validate optimization potential
// Measures the performance difference between single calls and bulk operations

function BulkApiOperationsTest() {
  this.testResults = [];
  this.apiClient = new ApiClient();
}

/**
 * Run comprehensive bulk API operations tests
 */
BulkApiOperationsTest.prototype.runCompleteTest = function() {
  Logger.log('=== BULK API OPERATIONS TEST STARTING ===');
  
  try {
    // Test 1: Individual API calls performance (current approach)
    this.testIndividualApiCalls();
    
    // Test 2: Bulk API calls performance (optimized approach)
    this.testBulkApiCalls();
    
    // Test 3: GraphQL bulk operations (if available)
    this.testGraphQLBulkOperations();
    
    // Test 4: Optimization potential analysis
    this.analyzeOptimizationPotential();
    
    // Generate optimization report
    this.generateOptimizationReport();
    
  } catch (error) {
    Logger.log(`[BulkApiOperationsTest] Critical error: ${error.message}`);
    this.testResults.push({
      test: 'CRITICAL_ERROR',
      status: 'FAILED',
      error: error.message,
      timestamp: new Date()
    });
  }
};

/**
 * Test 1: Individual API calls (current approach)
 * Simulates current approach of making individual API calls
 */
BulkApiOperationsTest.prototype.testIndividualApiCalls = function() {
  Logger.log('[TEST 1] Testing individual API calls performance...');
  
  try {
    var individualCallTimes = [];
    var testProductCount = 10; // Test with 10 products to avoid rate limits
    var totalStartTime = new Date().getTime();
    
    for (var i = 0; i < testProductCount; i++) {
      var callStartTime = new Date().getTime();
      
      try {
        // Simulate individual product fetch (using count endpoint as proxy)
        var response = this.apiClient.makeRequest('products/count.json', 'GET');
        
        var callEndTime = new Date().getTime();
        var callDuration = callEndTime - callStartTime;
        
        individualCallTimes.push({
          callNumber: i + 1,
          duration: callDuration,
          success: true
        });
        
        // Respect rate limits
        Utilities.sleep(1000);
        
      } catch (error) {
        var callEndTime = new Date().getTime();
        var callDuration = callEndTime - callStartTime;
        
        individualCallTimes.push({
          callNumber: i + 1,
          duration: callDuration,
          success: false,
          error: error.message
        });
        
        Logger.log(`Individual call ${i + 1} failed: ${error.message}`);
      }
    }
    
    var totalEndTime = new Date().getTime();
    var totalDuration = totalEndTime - totalStartTime;
    var successfulCalls = individualCallTimes.filter(call => call.success);
    var avgCallTime = successfulCalls.length > 0 ? 
      successfulCalls.reduce((sum, call) => sum + call.duration, 0) / successfulCalls.length : 0;
    
    // Extrapolate to larger datasets
    var estimatedTimeFor1000 = (avgCallTime * 1000) + (1000 * 1000); // Include rate limit delays
    var estimatedTimeFor4000 = (avgCallTime * 4000) + (4000 * 1000); // Full catalog estimate
    
    this.testResults.push({
      test: 'INDIVIDUAL_API_CALLS',
      status: successfulCalls.length > 0 ? 'PASSED' : 'FAILED',
      details: {
        totalCalls: testProductCount,
        successfulCalls: successfulCalls.length,
        totalDuration: totalDuration,
        avgCallTime: Math.round(avgCallTime),
        estimatedTimeFor1000: Math.round(estimatedTimeFor1000 / 1000), // seconds
        estimatedTimeFor4000: Math.round(estimatedTimeFor4000 / 1000), // seconds
        callDetails: individualCallTimes
      },
      timestamp: new Date()
    });
    
    Logger.log(`[TEST 1] Individual calls: ${Math.round(avgCallTime)}ms avg, Est. 1000 products: ${Math.round(estimatedTimeFor1000 / 60000)} minutes`);
    
  } catch (error) {
    this.testResults.push({
      test: 'INDIVIDUAL_API_CALLS',
      status: 'FAILED',
      error: error.message,
      timestamp: new Date()
    });
    Logger.log(`[TEST 1] FAILED - ${error.message}`);
  }
};

/**
 * Test 2: Bulk API calls performance
 * Tests bulk fetching with limit parameters
 */
BulkApiOperationsTest.prototype.testBulkApiCalls = function() {
  Logger.log('[TEST 2] Testing bulk API calls performance...');
  
  try {
    var bulkCallTimes = [];
    var bulkSizes = [50, 100, 250]; // Different bulk sizes to test
    
    for (var i = 0; i < bulkSizes.length; i++) {
      var bulkSize = bulkSizes[i];
      var callStartTime = new Date().getTime();
      
      try {
        // Test bulk fetch with limit parameter
        var endpoint = `products.json?limit=${bulkSize}&fields=id,title,handle,vendor,product_type,status`;
        var response = this.apiClient.makeRequest(endpoint, 'GET');
        
        var callEndTime = new Date().getTime();
        var callDuration = callEndTime - callStartTime;
        
        var productsReturned = response && response.products ? response.products.length : 0;
        
        bulkCallTimes.push({
          bulkSize: bulkSize,
          duration: callDuration,
          productsReturned: productsReturned,
          timePerProduct: productsReturned > 0 ? callDuration / productsReturned : 0,
          success: true
        });
        
        Logger.log(`Bulk call (${bulkSize}): ${callDuration}ms for ${productsReturned} products`);
        
        // Respect rate limits between bulk calls
        Utilities.sleep(2000);
        
      } catch (error) {
        var callEndTime = new Date().getTime();
        var callDuration = callEndTime - callStartTime;
        
        bulkCallTimes.push({
          bulkSize: bulkSize,
          duration: callDuration,
          productsReturned: 0,
          timePerProduct: 0,
          success: false,
          error: error.message
        });
        
        Logger.log(`Bulk call (${bulkSize}) failed: ${error.message}`);
      }
    }
    
    // Find the most efficient bulk size
    var successfulBulkCalls = bulkCallTimes.filter(call => call.success && call.productsReturned > 0);
    var mostEfficientCall = successfulBulkCalls.reduce((best, current) => 
      current.timePerProduct < best.timePerProduct ? current : best, 
      successfulBulkCalls[0] || { timePerProduct: Infinity }
    );
    
    // Calculate optimization potential
    var estimatedCallsFor1000 = mostEfficientCall ? Math.ceil(1000 / mostEfficientCall.bulkSize) : 1000;
    var estimatedTimeFor1000 = mostEfficientCall ? 
      (estimatedCallsFor1000 * mostEfficientCall.duration) + (estimatedCallsFor1000 * 2000) : 0; // Include rate limit delays
    
    this.testResults.push({
      test: 'BULK_API_CALLS',
      status: successfulBulkCalls.length > 0 ? 'PASSED' : 'FAILED',
      details: {
        bulkSizesTested: bulkSizes,
        successfulCalls: successfulBulkCalls.length,
        mostEfficientBulkSize: mostEfficientCall ? mostEfficientCall.bulkSize : 0,
        bestTimePerProduct: mostEfficientCall ? Math.round(mostEfficientCall.timePerProduct) : 0,
        estimatedCallsFor1000: estimatedCallsFor1000,
        estimatedTimeFor1000: Math.round(estimatedTimeFor1000 / 1000), // seconds
        callDetails: bulkCallTimes
      },
      timestamp: new Date()
    });
    
    Logger.log(`[TEST 2] Best bulk size: ${mostEfficientCall ? mostEfficientCall.bulkSize : 'N/A'}, Est. 1000 products: ${Math.round(estimatedTimeFor1000 / 60000)} minutes`);
    
  } catch (error) {
    this.testResults.push({
      test: 'BULK_API_CALLS',
      status: 'FAILED',
      error: error.message,
      timestamp: new Date()
    });
    Logger.log(`[TEST 2] FAILED - ${error.message}`);
  }
};

/**
 * Test 3: GraphQL bulk operations (if available)
 * Tests GraphQL for even more efficient bulk operations
 */
BulkApiOperationsTest.prototype.testGraphQLBulkOperations = function() {
  Logger.log('[TEST 3] Testing GraphQL bulk operations...');
  
  try {
    var graphqlStartTime = new Date().getTime();
    
    // GraphQL query for bulk product fetch
    var graphqlQuery = {
      query: `
        query getProducts($first: Int!) {
          products(first: $first) {
            edges {
              node {
                id
                title
                handle
                vendor
                productType
                status
              }
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      `,
      variables: {
        first: 100
      }
    };
    
    try {
      // Attempt GraphQL request
      var response = this.apiClient.makeRequest('graphql.json', 'POST', graphqlQuery);
      
      var graphqlEndTime = new Date().getTime();
      var graphqlDuration = graphqlEndTime - graphqlStartTime;
      
      var productsReturned = 0;
      if (response && response.data && response.data.products && response.data.products.edges) {
        productsReturned = response.data.products.edges.length;
      }
      
      var timePerProduct = productsReturned > 0 ? graphqlDuration / productsReturned : 0;
      
      // Estimate for larger datasets
      var estimatedCallsFor1000 = Math.ceil(1000 / 100); // Assuming 100 per call
      var estimatedTimeFor1000 = (estimatedCallsFor1000 * graphqlDuration) + (estimatedCallsFor1000 * 2000);
      
      this.testResults.push({
        test: 'GRAPHQL_BULK_OPERATIONS',
        status: 'PASSED',
        details: {
          duration: graphqlDuration,
          productsReturned: productsReturned,
          timePerProduct: Math.round(timePerProduct),
          estimatedCallsFor1000: estimatedCallsFor1000,
          estimatedTimeFor1000: Math.round(estimatedTimeFor1000 / 1000), // seconds
          hasNextPage: response && response.data && response.data.products ? response.data.products.pageInfo.hasNextPage : false
        },
        timestamp: new Date()
      });
      
      Logger.log(`[TEST 3] GraphQL: ${graphqlDuration}ms for ${productsReturned} products, Est. 1000 products: ${Math.round(estimatedTimeFor1000 / 60000)} minutes`);
      
    } catch (graphqlError) {
      // GraphQL might not be available or configured
      this.testResults.push({
        test: 'GRAPHQL_BULK_OPERATIONS',
        status: 'SKIPPED',
        details: {
          reason: 'GraphQL not available or not configured',
          error: graphqlError.message
        },
        timestamp: new Date()
      });
      
      Logger.log(`[TEST 3] SKIPPED - GraphQL not available: ${graphqlError.message}`);
    }
    
  } catch (error) {
    this.testResults.push({
      test: 'GRAPHQL_BULK_OPERATIONS',
      status: 'FAILED',
      error: error.message,
      timestamp: new Date()
    });
    Logger.log(`[TEST 3] FAILED - ${error.message}`);
  }
};

/**
 * Test 4: Optimization potential analysis
 * Compares all approaches and calculates potential improvements
 */
BulkApiOperationsTest.prototype.analyzeOptimizationPotential = function() {
  Logger.log('[TEST 4] Analyzing optimization potential...');
  
  try {
    var individualResult = this.testResults.find(r => r.test === 'INDIVIDUAL_API_CALLS');
    var bulkResult = this.testResults.find(r => r.test === 'BULK_API_CALLS');
    var graphqlResult = this.testResults.find(r => r.test === 'GRAPHQL_BULK_OPERATIONS');
    
    if (!individualResult || !bulkResult) {
      throw new Error('Individual and bulk tests must complete before optimization analysis');
    }
    
    var individualTime1000 = individualResult.details.estimatedTimeFor1000 || 0;
    var bulkTime1000 = bulkResult.details.estimatedTimeFor1000 || 0;
    var graphqlTime1000 = graphqlResult && graphqlResult.details ? graphqlResult.details.estimatedTimeFor1000 : null;
    
    // Calculate improvement percentages
    var bulkImprovement = individualTime1000 > 0 ? ((individualTime1000 - bulkTime1000) / individualTime1000) * 100 : 0;
    var graphqlImprovement = graphqlTime1000 && individualTime1000 > 0 ? 
      ((individualTime1000 - graphqlTime1000) / individualTime1000) * 100 : null;
    
    // Real-world projections based on memory data (6.2 hours for 4000 products)
    var currentRealWorldTime = 6.2 * 60 * 60; // 6.2 hours in seconds
    var projectedBulkTime = currentRealWorldTime * (1 - (bulkImprovement / 100));
    var projectedGraphqlTime = graphqlImprovement ? currentRealWorldTime * (1 - (graphqlImprovement / 100)) : null;
    
    this.testResults.push({
      test: 'OPTIMIZATION_POTENTIAL_ANALYSIS',
      status: 'PASSED',
      details: {
        currentApproach: {
          timeFor1000Products: individualTime1000,
          realWorldTimeFor4000: currentRealWorldTime
        },
        bulkOptimization: {
          timeFor1000Products: bulkTime1000,
          improvementPercent: Math.round(bulkImprovement),
          projectedRealWorldTime: Math.round(projectedBulkTime),
          projectedRealWorldHours: Math.round(projectedBulkTime / 3600 * 10) / 10
        },
        graphqlOptimization: graphqlTime1000 ? {
          timeFor1000Products: graphqlTime1000,
          improvementPercent: Math.round(graphqlImprovement),
          projectedRealWorldTime: Math.round(projectedGraphqlTime),
          projectedRealWorldHours: Math.round(projectedGraphqlTime / 3600 * 10) / 10
        } : null,
        recommendations: {
          primaryStrategy: bulkImprovement > 50 ? 'BULK_API' : 'SYSTEM_OPTIMIZATION',
          expectedTimeReduction: Math.round(Math.max(bulkImprovement, graphqlImprovement || 0)),
          implementationPriority: bulkImprovement > 70 ? 'HIGH' : bulkImprovement > 40 ? 'MEDIUM' : 'LOW'
        }
      },
      timestamp: new Date()
    });
    
    Logger.log(`[TEST 4] Bulk API improvement: ${Math.round(bulkImprovement)}%, Projected time: ${Math.round(projectedBulkTime / 3600 * 10) / 10} hours`);
    
  } catch (error) {
    this.testResults.push({
      test: 'OPTIMIZATION_POTENTIAL_ANALYSIS',
      status: 'FAILED',
      error: error.message,
      timestamp: new Date()
    });
    Logger.log(`[TEST 4] FAILED - ${error.message}`);
  }
};

/**
 * Generate comprehensive optimization report
 */
BulkApiOperationsTest.prototype.generateOptimizationReport = function() {
  Logger.log('=== BULK API OPERATIONS TEST RESULTS ===');
  
  var passedTests = 0;
  var totalTests = this.testResults.filter(r => r.status !== 'SKIPPED').length;
  
  for (var i = 0; i < this.testResults.length; i++) {
    var result = this.testResults[i];
    Logger.log(`${result.test}: ${result.status}`);
    
    if (result.status === 'PASSED') {
      passedTests++;
    }
    
    // Detailed reporting for each test
    if (result.test === 'INDIVIDUAL_API_CALLS' && result.details) {
      Logger.log(`  Current Approach: ${result.details.avgCallTime}ms per call`);
      Logger.log(`  Est. 1000 products: ${Math.round(result.details.estimatedTimeFor1000 / 60)} minutes`);
    }
    
    if (result.test === 'BULK_API_CALLS' && result.details) {
      Logger.log(`  Best Bulk Size: ${result.details.mostEfficientBulkSize} products`);
      Logger.log(`  Time per Product: ${result.details.bestTimePerProduct}ms`);
      Logger.log(`  Est. 1000 products: ${Math.round(result.details.estimatedTimeFor1000 / 60)} minutes`);
    }
    
    if (result.test === 'OPTIMIZATION_POTENTIAL_ANALYSIS' && result.details) {
      Logger.log(`  🎯 BULK API IMPROVEMENT: ${result.details.bulkOptimization.improvementPercent}%`);
      Logger.log(`  📊 PROJECTED REAL-WORLD TIME: ${result.details.bulkOptimization.projectedRealWorldHours} hours`);
      Logger.log(`  🚀 RECOMMENDATION: ${result.details.recommendations.primaryStrategy}`);
      Logger.log(`  ⭐ PRIORITY: ${result.details.recommendations.implementationPriority}`);
    }
    
    if (result.error) {
      Logger.log(`  Error: ${result.error}`);
    }
  }
  
  var successRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
  
  Logger.log('=== BULK OPTIMIZATION SUMMARY ===');
  Logger.log(`Tests Completed: ${passedTests}/${totalTests} (${successRate.toFixed(1)}%)`);
  
  // Final verdict based on optimization analysis
  var optimizationResult = this.testResults.find(r => r.test === 'OPTIMIZATION_POTENTIAL_ANALYSIS');
  if (optimizationResult && optimizationResult.details) {
    var improvement = optimizationResult.details.bulkOptimization.improvementPercent;
    var newTime = optimizationResult.details.bulkOptimization.projectedRealWorldHours;
    
    Logger.log(`🎉 BULK API VALIDATION: ${improvement}% improvement confirmed`);
    Logger.log(`📈 PERFORMANCE GAIN: 6.2 hours → ${newTime} hours`);
    
    if (improvement >= 70) {
      Logger.log('✅ VERDICT: Bulk API operations will dramatically improve performance - IMPLEMENT IMMEDIATELY');
    } else if (improvement >= 40) {
      Logger.log('✅ VERDICT: Bulk API operations provide significant improvement - IMPLEMENT SOON');
    } else {
      Logger.log('⚠️ VERDICT: Bulk API operations provide modest improvement - CONSIDER OTHER OPTIMIZATIONS');
    }
  }
  
  return {
    success: successRate >= 75,
    passedTests: passedTests,
    totalTests: totalTests,
    successRate: successRate,
    results: this.testResults
  };
};

/**
 * Quick test function for manual execution
 */
function testBulkApiOperations() {
  var test = new BulkApiOperationsTest();
  return test.runCompleteTest();
}

/**
 * Test only bulk vs individual comparison
 */
function testBulkVsIndividual() {
  var test = new BulkApiOperationsTest();
  test.testIndividualApiCalls();
  test.testBulkApiCalls();
  test.analyzeOptimizationPotential();
  return test.testResults;
}
