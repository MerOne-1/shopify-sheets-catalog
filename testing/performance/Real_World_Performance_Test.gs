/**
 * Real-World Performance Test Suite
 * Tests actual API latency, network timeouts, retries, and Google Sheets operations
 * Provides realistic performance measurements including all real-world factors
 */

class RealWorldPerformanceTest {
  
  constructor() {
    this.results = {
      apiLatency: {},
      networkReliability: {},
      sheetsPerformance: {},
      realWorldEstimates: {}
    };
    
    this.configManager = new ConfigManager();
    this.apiClient = new ApiClient(this.configManager);
  }
  
  /**
   * Run comprehensive real-world performance analysis
   */
  runRealWorldAnalysis() {
    Logger.log('🌍 Starting Real-World Performance Analysis...');
    Logger.log('⚠️  This test makes actual API calls and may take 5-10 minutes');
    
    try {
      this.testActualApiLatency();
      this.testNetworkReliability();
      this.testSheetsReadWritePerformance();
      this.generateRealWorldEstimates();
      this.generateRealWorldReport();
      
      Logger.log('✅ Real-World Performance Analysis Complete');
      return this.results;
      
    } catch (error) {
      Logger.log('❌ Real-World Analysis Failed: ' + error.message);
      throw error;
    }
  }
  
  /**
   * Test actual Shopify API latency with real calls
   */
  testActualApiLatency() {
    Logger.log('🔗 Testing Actual API Latency...');
    
    var testCalls = [
      { endpoint: 'shop.json', description: 'Shop info (lightweight)' },
      { endpoint: 'products.json?limit=1', description: 'Single product fetch' },
      { endpoint: 'products.json?limit=10', description: 'Small batch fetch' }
    ];
    
    this.results.apiLatency = {
      testResults: [],
      averageLatency: 0,
      minLatency: Infinity,
      maxLatency: 0,
      errors: 0
    };
    
    for (var i = 0; i < testCalls.length; i++) {
      var testCall = testCalls[i];
      Logger.log('Testing: ' + testCall.description);
      
      var samples = [];
      var errors = 0;
      
      for (var j = 0; j < 3; j++) {
        try {
          var startTime = new Date().getTime();
          var response = this.apiClient.makeRequest(testCall.endpoint, 'GET');
          var endTime = new Date().getTime();
          var latency = endTime - startTime;
          
          if (response && response.data) {
            samples.push(latency);
            Logger.log('  Sample ' + (j + 1) + ': ' + latency + 'ms');
          } else {
            errors++;
          }
          
          Utilities.sleep(2000); // Wait between samples
          
        } catch (error) {
          errors++;
          Logger.log('  Sample ' + (j + 1) + ': Error - ' + error.message);
        }
      }
      
      if (samples.length > 0) {
        var avgLatency = samples.reduce(function(sum, val) { return sum + val; }, 0) / samples.length;
        var minLatency = Math.min.apply(Math, samples);
        var maxLatency = Math.max.apply(Math, samples);
        
        this.results.apiLatency.testResults.push({
          endpoint: testCall.endpoint,
          description: testCall.description,
          averageLatency: avgLatency,
          minLatency: minLatency,
          maxLatency: maxLatency,
          errors: errors
        });
        
        this.results.apiLatency.minLatency = Math.min(this.results.apiLatency.minLatency, minLatency);
        this.results.apiLatency.maxLatency = Math.max(this.results.apiLatency.maxLatency, maxLatency);
        this.results.apiLatency.errors += errors;
        
        Logger.log('✅ ' + testCall.description + ': ' + avgLatency.toFixed(0) + 'ms avg');
      }
    }
    
    if (this.results.apiLatency.testResults.length > 0) {
      var totalLatency = this.results.apiLatency.testResults.reduce(function(sum, r) { 
        return sum + r.averageLatency; 
      }, 0);
      this.results.apiLatency.averageLatency = totalLatency / this.results.apiLatency.testResults.length;
    }
  }
  
  /**
   * Test network reliability
   */
  testNetworkReliability() {
    Logger.log('📡 Testing Network Reliability...');
    
    this.results.networkReliability = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      timeouts: 0,
      reliabilityScore: 0
    };
    
    var testRequests = 5;
    
    for (var i = 0; i < testRequests; i++) {
      this.results.networkReliability.totalRequests++;
      
      try {
        var response = this.apiClient.makeRequest('shop.json', 'GET');
        
        if (response && response.data) {
          this.results.networkReliability.successfulRequests++;
          Logger.log('  Request ' + (i + 1) + ': Success');
        } else {
          this.results.networkReliability.failedRequests++;
        }
        
      } catch (error) {
        this.results.networkReliability.failedRequests++;
        
        if (error.message.includes('timeout')) {
          this.results.networkReliability.timeouts++;
          Logger.log('  Request ' + (i + 1) + ': Timeout');
        } else {
          Logger.log('  Request ' + (i + 1) + ': Error - ' + error.message);
        }
      }
      
      Utilities.sleep(1500);
    }
    
    this.results.networkReliability.reliabilityScore = 
      (this.results.networkReliability.successfulRequests / this.results.networkReliability.totalRequests) * 100;
    
    Logger.log('✅ Network Reliability: ' + this.results.networkReliability.reliabilityScore.toFixed(1) + '% success rate');
  }
  
  /**
   * Test Google Sheets read/write performance
   */
  testSheetsReadWritePerformance() {
    Logger.log('📊 Testing Google Sheets Performance...');
    
    this.results.sheetsPerformance = {
      readTests: [],
      writeTests: [],
      averageReadTime: 0,
      averageWriteTime: 0
    };
    
    try {
      var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
      var testSheet = spreadsheet.getSheetByName('PerformanceTest');
      
      if (!testSheet) {
        testSheet = spreadsheet.insertSheet('PerformanceTest');
      }
      
      // Test read operations
      var readTests = [
        { rows: 10, cols: 5, description: 'Small read (10x5)' },
        { rows: 100, cols: 10, description: 'Medium read (100x10)' }
      ];
      
      for (var i = 0; i < readTests.length; i++) {
        var test = readTests[i];
        
        try {
          // Add test data if needed
          if (testSheet.getLastRow() < test.rows) {
            var testData = [];
            for (var r = 0; r < test.rows; r++) {
              var row = [];
              for (var c = 0; c < test.cols; c++) {
                row.push('Test' + r + '_' + c);
              }
              testData.push(row);
            }
            testSheet.getRange(1, 1, test.rows, test.cols).setValues(testData);
          }
          
          var startTime = new Date().getTime();
          var range = testSheet.getRange(1, 1, test.rows, test.cols);
          var values = range.getValues();
          var endTime = new Date().getTime();
          var readTime = endTime - startTime;
          
          this.results.sheetsPerformance.readTests.push({
            description: test.description,
            cells: test.rows * test.cols,
            time: readTime,
            timePerCell: readTime / (test.rows * test.cols)
          });
          
          Logger.log('✅ ' + test.description + ': ' + readTime + 'ms');
          
        } catch (readError) {
          Logger.log('❌ Read test failed: ' + readError.message);
        }
        
        Utilities.sleep(1000);
      }
      
      // Test write operations
      var writeTest = { rows: 10, cols: 5, description: 'Small write (10x5)' };
      
      try {
        var testData = [];
        for (var r = 0; r < writeTest.rows; r++) {
          var row = [];
          for (var c = 0; c < writeTest.cols; c++) {
            row.push('Write' + new Date().getTime() + '_' + r + '_' + c);
          }
          testData.push(row);
        }
        
        var startTime = new Date().getTime();
        var range = testSheet.getRange(1, 1, writeTest.rows, writeTest.cols);
        range.setValues(testData);
        var endTime = new Date().getTime();
        var writeTime = endTime - startTime;
        
        this.results.sheetsPerformance.writeTests.push({
          description: writeTest.description,
          cells: writeTest.rows * writeTest.cols,
          time: writeTime,
          timePerCell: writeTime / (writeTest.rows * writeTest.cols)
        });
        
        Logger.log('✅ ' + writeTest.description + ': ' + writeTime + 'ms');
        
      } catch (writeError) {
        Logger.log('❌ Write test failed: ' + writeError.message);
      }
      
      // Calculate averages
      if (this.results.sheetsPerformance.readTests.length > 0) {
        var totalReadTime = this.results.sheetsPerformance.readTests.reduce(function(sum, test) {
          return sum + test.timePerCell;
        }, 0);
        this.results.sheetsPerformance.averageReadTime = totalReadTime / this.results.sheetsPerformance.readTests.length;
      }
      
      if (this.results.sheetsPerformance.writeTests.length > 0) {
        var totalWriteTime = this.results.sheetsPerformance.writeTests.reduce(function(sum, test) {
          return sum + test.timePerCell;
        }, 0);
        this.results.sheetsPerformance.averageWriteTime = totalWriteTime / this.results.sheetsPerformance.writeTests.length;
      }
      
    } catch (error) {
      Logger.log('❌ Sheets performance test failed: ' + error.message);
    }
  }
  
  /**
   * Generate real-world performance estimates
   */
  generateRealWorldEstimates() {
    Logger.log('🌍 Generating Real-World Estimates...');
    
    var products = 1000;
    var variants = 3000;
    var totalItems = products + variants;
    
    var avgApiLatency = this.results.apiLatency.averageLatency || 350;
    var reliability = this.results.networkReliability.reliabilityScore || 95;
    
    var processingTime = totalItems * 0.34 / 1000;
    var apiCallTime = totalItems * avgApiLatency / 1000;
    var rateLimitDelay = totalItems / 1.5;
    var retryOverhead = apiCallTime * (100 - reliability) / 100 * 2;
    
    var totalImportTime = processingTime + apiCallTime + rateLimitDelay + retryOverhead;
    
    var sheetsReadTime = this.results.sheetsPerformance.averageReadTime || 0.1;
    var sheetsWriteTime = this.results.sheetsPerformance.averageWriteTime || 0.2;
    var estimatedCells = totalItems * 15;
    var sheetsTime = (estimatedCells * sheetsReadTime + estimatedCells * sheetsWriteTime) / 1000;
    
    this.results.realWorldEstimates = {
      fullImport: {
        processingTime: processingTime,
        apiCallTime: apiCallTime,
        rateLimitDelay: rateLimitDelay,
        retryOverhead: retryOverhead,
        sheetsTime: sheetsTime,
        totalTime: totalImportTime + sheetsTime,
        totalTimeFormatted: this.formatTime(totalImportTime + sheetsTime)
      },
      measuredFactors: {
        avgApiLatency: avgApiLatency,
        networkReliability: reliability,
        avgSheetsReadTime: sheetsReadTime,
        avgSheetsWriteTime: sheetsWriteTime
      }
    };
  }
  
  /**
   * Generate comprehensive real-world report
   */
  generateRealWorldReport() {
    Logger.log('📋 Generating Real-World Performance Report...');
    
    var report = '\n' + '='.repeat(80) + '\n';
    report += '🌍 REAL-WORLD PERFORMANCE ANALYSIS REPORT\n';
    report += '='.repeat(80) + '\n\n';
    
    if (this.results.apiLatency.testResults.length > 0) {
      report += '🔗 API LATENCY (Real Shopify Calls):\n';
      report += '   Average latency: ' + this.results.apiLatency.averageLatency.toFixed(0) + 'ms\n';
      report += '   Range: ' + this.results.apiLatency.minLatency + '-' + this.results.apiLatency.maxLatency + 'ms\n\n';
    }
    
    report += '📡 NETWORK RELIABILITY:\n';
    report += '   Success rate: ' + this.results.networkReliability.reliabilityScore.toFixed(1) + '%\n';
    report += '   Timeouts: ' + this.results.networkReliability.timeouts + '\n\n';
    
    if (this.results.sheetsPerformance.readTests.length > 0) {
      report += '📊 GOOGLE SHEETS PERFORMANCE:\n';
      report += '   Average read time: ' + this.results.sheetsPerformance.averageReadTime.toFixed(2) + 'ms per cell\n';
      report += '   Average write time: ' + this.results.sheetsPerformance.averageWriteTime.toFixed(2) + 'ms per cell\n\n';
    }
    
    if (this.results.realWorldEstimates.fullImport) {
      report += '🌍 REAL-WORLD ESTIMATES (1000 products + 3000 variants):\n';
      report += '   📥 FULL IMPORT: ' + this.results.realWorldEstimates.fullImport.totalTimeFormatted + '\n';
      report += '      Processing: ' + this.formatTime(this.results.realWorldEstimates.fullImport.processingTime) + '\n';
      report += '      API calls: ' + this.formatTime(this.results.realWorldEstimates.fullImport.apiCallTime) + '\n';
      report += '      Rate limiting: ' + this.formatTime(this.results.realWorldEstimates.fullImport.rateLimitDelay) + '\n';
      report += '      Sheets ops: ' + this.formatTime(this.results.realWorldEstimates.fullImport.sheetsTime) + '\n\n';
    }
    
    report += '='.repeat(80) + '\n';
    
    Logger.log(report);
    return report;
  }
  
  formatTime(seconds) {
    if (seconds < 60) {
      return seconds.toFixed(1) + ' seconds';
    } else if (seconds < 3600) {
      return Math.floor(seconds / 60) + 'm ' + Math.floor(seconds % 60) + 's';
    } else {
      return Math.floor(seconds / 3600) + 'h ' + Math.floor((seconds % 3600) / 60) + 'm';
    }
  }
}

/**
 * Run real-world performance analysis with actual API calls
 * ⚠️ WARNING: This makes real API calls and may take 5-10 minutes
 */
function runRealWorldPerformanceTest() {
  var test = new RealWorldPerformanceTest();
  return test.runRealWorldAnalysis();
}

/**
 * Quick real-world API latency test (safer, fewer calls)
 */
function quickApiLatencyTest() {
  Logger.log('🔗 Quick API Latency Test...');
  
  try {
    var configManager = new ConfigManager();
    var apiClient = new ApiClient(configManager);
    
    var startTime = new Date().getTime();
    var response = apiClient.makeRequest('shop.json', 'GET');
    var endTime = new Date().getTime();
    
    var latency = endTime - startTime;
    
    var report = '\n🔗 QUICK API LATENCY TEST RESULTS:\n' +
      '='.repeat(50) + '\n' +
      'Single API call latency: ' + latency + 'ms\n' +
      'Estimated for 4000 calls: ' + (latency * 4000 / 1000 / 60).toFixed(1) + ' minutes\n' +
      'Plus rate limiting: ~44 minutes\n' +
      'Total estimated time: ~' + ((latency * 4000 / 1000 / 60) + 44).toFixed(1) + ' minutes\n' +
      '='.repeat(50);
    
    Logger.log(report);
    return { latency: latency, success: true };
    
  } catch (error) {
    Logger.log('❌ API latency test failed: ' + error.message);
    return { latency: null, success: false, error: error.message };
  }
}
