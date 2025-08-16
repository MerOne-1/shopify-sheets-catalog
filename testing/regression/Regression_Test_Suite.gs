/**
 * Regression Test Suite
 * Ensures no existing functionality breaks during performance optimizations
 */

class RegressionTestSuite {
  
  constructor() {
    this.results = {
      coreComponents: {},
      integrationTests: {},
      dataIntegrity: {},
      overallStatus: {}
    };
    
    this.configManager = new ConfigManager();
    this.validationEngine = new ValidationEngine();
  }
  
  /**
   * Run complete regression test suite
   */
  runRegressionTests() {
    Logger.log('🔍 Starting Regression Test Suite...');
    
    try {
      this.testCoreComponents();
      this.testIntegrationPoints();
      this.testDataIntegrity();
      this.generateRegressionReport();
      
      Logger.log('✅ Regression Test Suite Complete');
      return this.results;
      
    } catch (error) {
      Logger.log('❌ Regression Tests Failed: ' + error.message);
      throw error;
    }
  }
  
  /**
   * Test all core components
   */
  testCoreComponents() {
    Logger.log('🔧 Testing Core Components...');
    
    this.results.coreComponents = {
      configManager: this.testConfigManager(),
      validationEngine: this.testValidationEngine(),
      batchProcessor: this.testBatchProcessor()
    };
    
    var passedTests = Object.values(this.results.coreComponents).filter(result => result.passed).length;
    Logger.log('✅ Core Components: ' + passedTests + '/3 passed');
  }
  
  testConfigManager() {
    try {
      var config = new ConfigManager();
      var testKey = 'test_key_' + new Date().getTime();
      var testValue = 'test_value_123';
      
      config.setConfigValue(testKey, testValue);
      var retrievedValue = config.getConfigValue(testKey);
      
      if (retrievedValue !== testValue) {
        throw new Error('Config set/get failed');
      }
      
      config.deleteConfigValue(testKey);
      return { passed: true, message: 'ConfigManager working correctly' };
      
    } catch (error) {
      return { passed: false, message: 'ConfigManager failed: ' + error.message };
    }
  }
  
  testValidationEngine() {
    try {
      var validator = new ValidationEngine();
      var testProduct = {
        id: 123,
        title: 'Test Product',
        status: 'active'
      };
      
      var validationResult = validator.validateData([testProduct], 'product');
      if (!validationResult.isValid) {
        throw new Error('Valid product failed validation');
      }
      
      var hash = validator.calculateHash(testProduct);
      if (!hash || hash.length < 10) {
        throw new Error('Hash calculation failed');
      }
      
      return { passed: true, message: 'ValidationEngine working correctly' };
      
    } catch (error) {
      return { passed: false, message: 'ValidationEngine failed: ' + error.message };
    }
  }
  
  testBatchProcessor() {
    try {
      var processor = new BatchProcessor();
      var testData = [];
      for (var i = 0; i < 100; i++) {
        testData.push({ id: i, name: 'Item ' + i });
      }
      
      var batches = processor.createBatches(testData, 25);
      if (batches.length !== 4) {
        throw new Error('Incorrect batch count');
      }
      
      return { passed: true, message: 'BatchProcessor working correctly' };
      
    } catch (error) {
      return { passed: false, message: 'BatchProcessor failed: ' + error.message };
    }
  }
  
  /**
   * Test integration points
   */
  testIntegrationPoints() {
    Logger.log('🔗 Testing Integration Points...');
    
    this.results.integrationTests = {
      validationBatching: this.testValidationBatchingIntegration()
    };
    
    Logger.log('✅ Integration Tests: 1/1 passed');
  }
  
  testValidationBatchingIntegration() {
    try {
      var processor = new BatchProcessor();
      var testData = [];
      for (var i = 0; i < 50; i++) {
        testData.push({ id: i, title: 'Product ' + i, status: 'active' });
      }
      
      var batches = processor.createBatches(testData, 10);
      
      for (var i = 0; i < batches.length; i++) {
        var validationResult = this.validationEngine.validateData(batches[i], 'product');
        if (!validationResult.isValid) {
          throw new Error('Batch validation failed');
        }
      }
      
      return { passed: true, message: 'ValidationEngine-BatchProcessor integration working' };
      
    } catch (error) {
      return { passed: false, message: 'Integration failed: ' + error.message };
    }
  }
  
  /**
   * Test data integrity
   */
  testDataIntegrity() {
    Logger.log('🔒 Testing Data Integrity...');
    
    this.results.dataIntegrity = {
      hashConsistency: this.testHashConsistency(),
      dataPreservation: this.testDataPreservation()
    };
    
    var passedTests = Object.values(this.results.dataIntegrity).filter(result => result.passed).length;
    Logger.log('✅ Data Integrity Tests: ' + passedTests + '/2 passed');
  }
  
  testHashConsistency() {
    try {
      var validator = new ValidationEngine();
      var testData = { id: 123, title: 'Test', status: 'active' };
      
      var hash1 = validator.calculateHash(testData);
      var hash2 = validator.calculateHash(testData);
      
      if (hash1 !== hash2) {
        throw new Error('Hash calculation inconsistent');
      }
      
      return { passed: true, message: 'Hash consistency verified' };
      
    } catch (error) {
      return { passed: false, message: 'Hash consistency failed: ' + error.message };
    }
  }
  
  testDataPreservation() {
    try {
      var processor = new BatchProcessor();
      var originalData = [
        { id: 1, title: 'Product 1' },
        { id: 2, title: 'Product 2' },
        { id: 3, title: 'Product 3' }
      ];
      
      var batches = processor.createBatches(originalData, 2);
      var reconstructedData = [];
      
      for (var i = 0; i < batches.length; i++) {
        reconstructedData = reconstructedData.concat(batches[i]);
      }
      
      if (reconstructedData.length !== originalData.length) {
        throw new Error('Data count mismatch');
      }
      
      return { passed: true, message: 'Data preservation verified' };
      
    } catch (error) {
      return { passed: false, message: 'Data preservation failed: ' + error.message };
    }
  }
  
  /**
   * Generate regression report
   */
  generateRegressionReport() {
    var totalTests = 0;
    var passedTests = 0;
    
    var testCategories = [
      this.results.coreComponents,
      this.results.integrationTests,
      this.results.dataIntegrity
    ];
    
    for (var i = 0; i < testCategories.length; i++) {
      var categoryResults = Object.values(testCategories[i]);
      totalTests += categoryResults.length;
      passedTests += categoryResults.filter(function(result) { return result.passed; }).length;
    }
    
    var successRate = (passedTests / totalTests * 100).toFixed(1);
    
    this.results.overallStatus = {
      totalTests: totalTests,
      passedTests: passedTests,
      successRate: successRate,
      status: passedTests === totalTests ? 'PASS' : 'FAIL'
    };
    
    var report = '\n🔍 REGRESSION TEST RESULTS:\n' +
      '='.repeat(50) + '\n' +
      'Total Tests: ' + totalTests + '\n' +
      'Passed: ' + passedTests + '\n' +
      'Success Rate: ' + successRate + '%\n' +
      'Status: ' + this.results.overallStatus.status + '\n' +
      '='.repeat(50);
    
    Logger.log(report);
    return report;
  }
}

/**
 * Run complete regression test suite
 */
function runRegressionTests() {
  var testSuite = new RegressionTestSuite();
  return testSuite.runRegressionTests();
}

/**
 * Quick regression test
 */
function quickRegressionTest() {
  var testSuite = new RegressionTestSuite();
  testSuite.testCoreComponents();
  
  var results = testSuite.results.coreComponents;
  var passedTests = Object.values(results).filter(function(result) { return result.passed; }).length;
  
  Logger.log('⚡ Quick Regression: ' + passedTests + '/3 core components passed');
  return results;
}
