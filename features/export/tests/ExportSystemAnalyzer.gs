/**
 * EXPORT SYSTEM ANALYZER - Comprehensive Testing & Optimization Component
 * 
 * This component provides deep analysis of the export system to:
 * 1. Identify performance bottlenecks
 * 2. Analyze change detection accuracy
 * 3. Provide optimization recommendations
 * 4. Test all export workflows comprehensively
 * 
 * Usage: Run runCompleteExportAnalysis() for full system analysis
 */

function ExportSystemAnalyzer() {
  this.results = {
    timestamp: new Date().toISOString(),
    tests: {},
    performance: {},
    recommendations: [],
    summary: {}
  };
}

/**
 * MAIN ANALYSIS FUNCTION - Run this for complete system overview
 */
ExportSystemAnalyzer.prototype.runCompleteExportAnalysis = function() {
  Logger.log('🔍 STARTING COMPREHENSIVE EXPORT SYSTEM ANALYSIS');
  
  try {
    // Phase 1: System Architecture Analysis
    this.analyzeSystemArchitecture();
    
    // Phase 2: Change Detection Deep Dive
    this.analyzeChangeDetectionSystem();
    
    // Phase 3: Hash System Analysis
    this.analyzeHashSystem();
    
    // Phase 4: Performance Analysis
    this.analyzePerformance();
    
    // Phase 5: Data Flow Analysis
    this.analyzeDataFlow();
    
    // Phase 6: Generate Recommendations
    this.generateOptimizationRecommendations();
    
    // Phase 7: Create Summary Report
    this.generateSummaryReport();
    
    // Display results
    this.displayResults();
    
    return this.results;
    
  } catch (error) {
    Logger.log('❌ Analysis failed: ' + error.message);
    Logger.log('Stack: ' + error.stack);
    return { error: error.message, stack: error.stack };
  }
};

/**
 * PHASE 1: SYSTEM ARCHITECTURE ANALYSIS
 */
ExportSystemAnalyzer.prototype.analyzeSystemArchitecture = function() {
  Logger.log('📊 Phase 1: System Architecture Analysis');
  
  var architecture = {
    components: {},
    dependencies: {},
    initialization: {},
    integration: {}
  };
  
  // Test component availability
  var components = [
    'ExportManager', 'ExportQueue', 'ExportValidator', 'BatchProcessor', 
    'RetryManager', 'AuditLogger', 'ApiClient', 'ValidationEngine', 'ConfigManager'
  ];
  
  for (var i = 0; i < components.length; i++) {
    var componentName = components[i];
    try {
      var instance = eval('new ' + componentName + '()');
      architecture.components[componentName] = {
        available: true,
        type: typeof instance,
        methods: this.getComponentMethods(instance)
      };
    } catch (error) {
      architecture.components[componentName] = {
        available: false,
        error: error.message
      };
    }
  }
  
  // Test ExportManager initialization
  try {
    var exportManager = new ExportManager();
    architecture.initialization.exportManager = {
      success: true,
      initialState: {
        sessionId: exportManager.sessionId,
        exportQueue: exportManager.exportQueue,
        auditLogger: exportManager.auditLogger
      }
    };
  } catch (error) {
    architecture.initialization.exportManager = {
      success: false,
      error: error.message
    };
  }
  
  this.results.tests.architecture = architecture;
};

/**
 * PHASE 2: CHANGE DETECTION DEEP DIVE
 */
ExportSystemAnalyzer.prototype.analyzeChangeDetectionSystem = function() {
  Logger.log('🔍 Phase 2: Change Detection Analysis');
  
  var changeDetection = {
    sheetAnalysis: {},
    hashComparison: {},
    detectionAccuracy: {},
    edgeCases: {}
  };
  
  // Analyze each sheet
  var sheets = ['Products', 'Variants'];
  
  for (var i = 0; i < sheets.length; i++) {
    var sheetName = sheets[i];
    changeDetection.sheetAnalysis[sheetName] = this.analyzeSheetChangeDetection(sheetName);
  }
  
  // Test hash comparison logic
  changeDetection.hashComparison = this.testHashComparison();
  
  // Test detection accuracy
  changeDetection.detectionAccuracy = this.testDetectionAccuracy();
  
  this.results.tests.changeDetection = changeDetection;
};

/**
 * Analyze change detection for specific sheet
 */
ExportSystemAnalyzer.prototype.analyzeSheetChangeDetection = function(sheetName) {
  var analysis = {
    dataStats: {},
    hashStats: {},
    changeStats: {},
    issues: []
  };
  
  try {
    var exportManager = new ExportManager();
    var sheetData = exportManager.getSheetData(sheetName);
    
    if (!sheetData || sheetData.length === 0) {
      analysis.issues.push('No data found in sheet: ' + sheetName);
      return analysis;
    }
    
    // Data statistics
    analysis.dataStats = {
      totalRecords: sheetData.length,
      recordsWithId: sheetData.filter(function(r) { return r.id && r.id !== ''; }).length,
      recordsWithHash: sheetData.filter(function(r) { return r._hash && r._hash !== ''; }).length,
      emptyRecords: sheetData.filter(function(r) { return !r.id || r.id === ''; }).length
    };
    
    // Hash analysis
    var hashAnalysis = this.analyzeRecordHashes(sheetData, exportManager);
    analysis.hashStats = hashAnalysis.stats;
    analysis.changeStats = hashAnalysis.changes;
    
    // Detect issues
    if (analysis.dataStats.recordsWithHash === 0) {
      analysis.issues.push('No records have stored hashes - all will be treated as new');
    }
    
    if (analysis.dataStats.emptyRecords > 0) {
      analysis.issues.push(analysis.dataStats.emptyRecords + ' records missing IDs');
    }
    
  } catch (error) {
    analysis.issues.push('Error analyzing sheet: ' + error.message);
  }
  
  return analysis;
};

/**
 * Analyze record hashes in detail
 */
ExportSystemAnalyzer.prototype.analyzeRecordHashes = function(sheetData, exportManager) {
  var stats = {
    totalHashes: 0,
    validHashes: 0,
    emptyHashes: 0,
    hashMatches: 0,
    hashMismatches: 0
  };
  
  var changes = {
    toAdd: [],
    toUpdate: [],
    unchanged: []
  };
  
  var sampleMismatches = [];
  
  for (var i = 0; i < sheetData.length; i++) {
    var record = sheetData[i];
    
    if (!record.id || record.id === '') continue;
    
    var storedHash = record._hash || '';
    var currentHash = '';
    
    try {
      currentHash = exportManager.exportValidator.calculateHash(record);
    } catch (error) {
      Logger.log('Hash calculation error for record ' + record.id + ': ' + error.message);
      continue;
    }
    
    stats.totalHashes++;
    
    if (storedHash === '') {
      stats.emptyHashes++;
      changes.toAdd.push({
        id: record.id,
        reason: 'No stored hash',
        currentHash: currentHash.substring(0, 12) + '...'
      });
    } else {
      stats.validHashes++;
      
      if (currentHash === storedHash) {
        stats.hashMatches++;
        changes.unchanged.push({
          id: record.id,
          hash: currentHash.substring(0, 12) + '...'
        });
      } else {
        stats.hashMismatches++;
        changes.toUpdate.push({
          id: record.id,
          reason: 'Hash mismatch',
          currentHash: currentHash.substring(0, 12) + '...',
          storedHash: storedHash.substring(0, 12) + '...'
        });
        
        // Collect sample mismatches for detailed analysis
        if (sampleMismatches.length < 3) {
          sampleMismatches.push({
            id: record.id,
            title: record.title || record.name || 'N/A',
            currentHash: currentHash,
            storedHash: storedHash,
            fieldCount: Object.keys(record).length
          });
        }
      }
    }
  }
  
  return {
    stats: stats,
    changes: changes,
    sampleMismatches: sampleMismatches
  };
};

/**
 * PHASE 3: HASH SYSTEM ANALYSIS
 */
ExportSystemAnalyzer.prototype.analyzeHashSystem = function() {
  Logger.log('🔐 Phase 3: Hash System Analysis');
  
  var hashSystem = {
    algorithm: {},
    performance: {},
    reliability: {},
    recommendations: []
  };
  
  // Test hash algorithm
  hashSystem.algorithm = this.testHashAlgorithm();
  
  // Test hash performance
  hashSystem.performance = this.testHashPerformance();
  
  // Test hash reliability
  hashSystem.reliability = this.testHashReliability();
  
  this.results.tests.hashSystem = hashSystem;
};

/**
 * Test hash algorithm properties
 */
ExportSystemAnalyzer.prototype.testHashAlgorithm = function() {
  var exportManager = new ExportManager();
  var tests = {};
  
  // Test basic hash generation
  var testData = { id: '123', name: 'Test', price: '10.00' };
  var hash1 = exportManager.exportValidator.calculateHash(testData);
  var hash2 = exportManager.exportValidator.calculateHash(testData);
  
  tests.consistency = {
    hash1: hash1,
    hash2: hash2,
    consistent: hash1 === hash2
  };
  
  // Test sensitivity to changes
  var modifiedData = { id: '123', name: 'Test', price: '10.01' };
  var hash3 = exportManager.exportValidator.calculateHash(modifiedData);
  
  tests.sensitivity = {
    originalHash: hash1,
    modifiedHash: hash3,
    different: hash1 !== hash3
  };
  
  // Test hash calculation
  try {
    var sampleRecord = { id: '123', title: 'Test Product', handle: 'test-product' };
    var hash = exportManager.exportValidator.calculateHash(sampleRecord);
    tests.hashCalculation = {
      success: true,
      sampleHash: hash,
      hashLength: hash ? hash.length : 0
    };
  } catch (error) {
    tests.hashCalculation = {
      success: false,
      error: error.message
    };
  }
  
  // Test with different data types
  var complexData = {
    id: 123,
    name: 'Test',
    active: true,
    tags: 'tag1,tag2',
    price: 10.00,
    date: new Date('2025-01-01')
  };
  var hash4 = exportManager.exportValidator.calculateHash(complexData);
  
  tests.dataTypes = {
    hash: hash4,
    length: hash4.length,
    valid: hash4.length > 0
  };
  
  return tests;
};

/**
 * Test hash performance
 */
ExportSystemAnalyzer.prototype.testHashPerformance = function() {
  var exportManager = new ExportManager();
  var performance = {};
  
  // Test single hash performance
  var testData = { id: '123', name: 'Test Product', price: '29.99', description: 'A test product with some description' };
  
  var startTime = Date.now();
  for (var i = 0; i < 100; i++) {
    exportManager.exportValidator.calculateHash(testData);
  }
  var endTime = Date.now();
  
  performance.singleHash = {
    iterations: 100,
    totalTime: endTime - startTime,
    avgTime: (endTime - startTime) / 100
  };
  
  // Test bulk hash performance
  var bulkData = [];
  for (var i = 0; i < 50; i++) {
    bulkData.push({
      id: 'test_' + i,
      name: 'Product ' + i,
      price: (Math.random() * 100).toFixed(2),
      description: 'Description for product ' + i
    });
  }
  
  startTime = Date.now();
  for (var i = 0; i < bulkData.length; i++) {
    exportManager.exportValidator.calculateHash(bulkData[i]);
  }
  endTime = Date.now();
  
  performance.bulkHash = {
    records: bulkData.length,
    totalTime: endTime - startTime,
    avgTimePerRecord: (endTime - startTime) / bulkData.length
  };
  
  return performance;
};

/**
 * PHASE 4: PERFORMANCE ANALYSIS
 */
ExportSystemAnalyzer.prototype.analyzePerformance = function() {
  Logger.log('⚡ Phase 4: Performance Analysis');
  
  var performance = {
    initialization: {},
    dataRetrieval: {},
    changeDetection: {},
    queueProcessing: {}
  };
  
  // Test initialization performance
  performance.initialization = this.testInitializationPerformance();
  
  // Test data retrieval performance
  performance.dataRetrieval = this.testDataRetrievalPerformance();
  
  // Test change detection performance
  performance.changeDetection = this.testChangeDetectionPerformance();
  
  this.results.performance = performance;
};

/**
 * Test initialization performance
 */
ExportSystemAnalyzer.prototype.testInitializationPerformance = function() {
  var results = {};
  
  // Test ExportManager initialization
  var startTime = Date.now();
  var exportManager = new ExportManager();
  var endTime = Date.now();
  
  results.exportManager = {
    time: endTime - startTime,
    success: true
  };
  
  // Test component initialization during initiateExport
  startTime = Date.now();
  try {
    var result = exportManager.initiateExport('Variants', {
      user: 'test@example.com',
      force: false
    });
    endTime = Date.now();
    
    results.initiateExport = {
      time: endTime - startTime,
      success: result.success,
      queueInitialized: exportManager.exportQueue !== null,
      auditInitialized: exportManager.auditLogger !== null
    };
  } catch (error) {
    results.initiateExport = {
      time: Date.now() - startTime,
      success: false,
      error: error.message
    };
  }
  
  return results;
};

/**
 * Test data retrieval performance
 */
ExportSystemAnalyzer.prototype.testDataRetrievalPerformance = function() {
  var results = {};
  var exportManager = new ExportManager();
  
  var sheets = ['Products', 'Variants'];
  
  for (var i = 0; i < sheets.length; i++) {
    var sheetName = sheets[i];
    
    var startTime = Date.now();
    try {
      var data = exportManager.getSheetData(sheetName);
      var endTime = Date.now();
      
      results[sheetName] = {
        time: endTime - startTime,
        recordCount: data ? data.length : 0,
        avgTimePerRecord: data && data.length > 0 ? (endTime - startTime) / data.length : 0,
        success: true
      };
    } catch (error) {
      results[sheetName] = {
        time: Date.now() - startTime,
        success: false,
        error: error.message
      };
    }
  }
  
  return results;
};

/**
 * PHASE 5: DATA FLOW ANALYSIS
 */
ExportSystemAnalyzer.prototype.analyzeDataFlow = function() {
  Logger.log('🌊 Phase 5: Data Flow Analysis');
  
  var dataFlow = {
    workflow: {},
    bottlenecks: [],
    efficiency: {}
  };
  
  // Test complete workflow
  dataFlow.workflow = this.testCompleteWorkflow();
  
  // Identify bottlenecks
  dataFlow.bottlenecks = this.identifyBottlenecks();
  
  this.results.tests.dataFlow = dataFlow;
};

/**
 * Test complete export workflow
 */
ExportSystemAnalyzer.prototype.testCompleteWorkflow = function() {
  var workflow = {
    steps: [],
    totalTime: 0,
    success: false
  };
  
  var overallStart = Date.now();
  
  try {
    // Step 1: Initialize ExportManager
    var stepStart = Date.now();
    var exportManager = new ExportManager();
    workflow.steps.push({
      name: 'Initialize ExportManager',
      time: Date.now() - stepStart,
      success: true
    });
    
    // Step 2: Initiate Export
    stepStart = Date.now();
    var result = exportManager.initiateExport('Variants', {
      user: 'test@example.com',
      force: false
    });
    workflow.steps.push({
      name: 'Initiate Export',
      time: Date.now() - stepStart,
      success: result.success,
      details: result
    });
    
    // Step 3: Process Queue (if changes detected)
    if (result.success && exportManager.exportQueue) {
      stepStart = Date.now();
      var processResult = exportManager.processExportQueue();
      workflow.steps.push({
        name: 'Process Export Queue',
        time: Date.now() - stepStart,
        success: processResult.success,
        details: processResult
      });
    }
    
    workflow.totalTime = Date.now() - overallStart;
    workflow.success = true;
    
  } catch (error) {
    workflow.steps.push({
      name: 'Error',
      time: Date.now() - overallStart,
      success: false,
      error: error.message
    });
    workflow.totalTime = Date.now() - overallStart;
    workflow.success = false;
  }
  
  return workflow;
};

/**
 * PHASE 6: GENERATE OPTIMIZATION RECOMMENDATIONS
 */
ExportSystemAnalyzer.prototype.generateOptimizationRecommendations = function() {
  Logger.log('💡 Phase 6: Generating Optimization Recommendations');
  
  var recommendations = [];
  
  // Analyze test results and generate recommendations
  
  // Hash System Recommendations
  if (this.results.tests.changeDetection) {
    var changeDetection = this.results.tests.changeDetection;
    
    for (var sheetName in changeDetection.sheetAnalysis) {
      var analysis = changeDetection.sheetAnalysis[sheetName];
      
      if (analysis.hashStats && analysis.hashStats.hashMismatches > 0) {
        recommendations.push({
          category: 'Hash System',
          priority: 'HIGH',
          issue: 'Hash mismatches detected in ' + sheetName,
          impact: analysis.hashStats.hashMismatches + ' records showing as changed',
          solution: 'Implement improved hash calculation that excludes system fields',
          implementation: 'Modify ValidationEngine.calculateHash() to exclude _hash, _last_synced_at fields'
        });
      }
      
      if (analysis.dataStats && analysis.dataStats.recordsWithHash === 0) {
        recommendations.push({
          category: 'Data Integrity',
          priority: 'MEDIUM',
          issue: 'No stored hashes in ' + sheetName,
          impact: 'All records will be treated as new on export',
          solution: 'Run initial import to populate hash values',
          implementation: 'Execute import operation to establish baseline hashes'
        });
      }
    }
  }
  
  // Performance Recommendations
  if (this.results.performance) {
    var perf = this.results.performance;
    
    if (perf.dataRetrieval) {
      for (var sheet in perf.dataRetrieval) {
        var retrieval = perf.dataRetrieval[sheet];
        if (retrieval.success && retrieval.avgTimePerRecord > 1) {
          recommendations.push({
            category: 'Performance',
            priority: 'MEDIUM',
            issue: 'Slow data retrieval for ' + sheet,
            impact: retrieval.avgTimePerRecord.toFixed(2) + 'ms per record',
            solution: 'Implement batch data retrieval and caching',
            implementation: 'Use getValues() with larger ranges and cache results'
          });
        }
      }
    }
  }
  
  // Architecture Recommendations
  recommendations.push({
    category: 'Architecture',
    priority: 'HIGH',
    issue: 'Hash system unreliable for manual edits',
    impact: 'Manual sheet changes not detected for export',
    solution: 'Implement timestamp-based change detection',
    implementation: 'Add _modified_at column updated on sheet edits, compare with _last_synced_at'
  });
  
  recommendations.push({
    category: 'User Experience',
    priority: 'MEDIUM',
    issue: 'No feedback when no changes detected',
    impact: 'Users confused by "0 items" export results',
    solution: 'Improve export result messages',
    implementation: 'Show "No changes detected since last sync" instead of "0 items"'
  });
  
  this.results.recommendations = recommendations;
};

/**
 * PHASE 7: GENERATE SUMMARY REPORT
 */
ExportSystemAnalyzer.prototype.generateSummaryReport = function() {
  Logger.log('📋 Phase 7: Generating Summary Report');
  
  var summary = {
    systemHealth: 'UNKNOWN',
    criticalIssues: 0,
    performanceScore: 0,
    recommendations: {
      high: 0,
      medium: 0,
      low: 0
    }
  };
  
  // Count recommendation priorities
  for (var i = 0; i < this.results.recommendations.length; i++) {
    var rec = this.results.recommendations[i];
    if (rec.priority === 'HIGH') summary.recommendations.high++;
    else if (rec.priority === 'MEDIUM') summary.recommendations.medium++;
    else summary.recommendations.low++;
  }
  
  // Determine system health
  if (summary.recommendations.high === 0) {
    summary.systemHealth = 'GOOD';
  } else if (summary.recommendations.high <= 2) {
    summary.systemHealth = 'FAIR';
  } else {
    summary.systemHealth = 'NEEDS_ATTENTION';
  }
  
  // Calculate performance score (0-100)
  var score = 100;
  score -= summary.recommendations.high * 20;
  score -= summary.recommendations.medium * 10;
  score -= summary.recommendations.low * 5;
  summary.performanceScore = Math.max(0, score);
  
  this.results.summary = summary;
};

/**
 * DISPLAY RESULTS
 */
ExportSystemAnalyzer.prototype.displayResults = function() {
  Logger.log('');
  Logger.log('🎯 ========================================');
  Logger.log('🎯 EXPORT SYSTEM ANALYSIS COMPLETE');
  Logger.log('🎯 ========================================');
  Logger.log('');
  
  // System Health
  Logger.log('📊 SYSTEM HEALTH: ' + this.results.summary.systemHealth);
  Logger.log('📊 PERFORMANCE SCORE: ' + this.results.summary.performanceScore + '/100');
  Logger.log('');
  
  // Recommendations Summary
  Logger.log('💡 RECOMMENDATIONS SUMMARY:');
  Logger.log('   🔴 High Priority: ' + this.results.summary.recommendations.high);
  Logger.log('   🟡 Medium Priority: ' + this.results.summary.recommendations.medium);
  Logger.log('   🟢 Low Priority: ' + this.results.summary.recommendations.low);
  Logger.log('');
  
  // Top 3 Recommendations
  Logger.log('🚀 TOP PRIORITY RECOMMENDATIONS:');
  var highPriorityRecs = this.results.recommendations.filter(function(r) { return r.priority === 'HIGH'; });
  for (var i = 0; i < Math.min(3, highPriorityRecs.length); i++) {
    var rec = highPriorityRecs[i];
    Logger.log('   ' + (i + 1) + '. ' + rec.issue);
    Logger.log('      Solution: ' + rec.solution);
    Logger.log('      Implementation: ' + rec.implementation);
    Logger.log('');
  }
  
  // Change Detection Results
  if (this.results.tests.changeDetection && this.results.tests.changeDetection.sheetAnalysis) {
    Logger.log('🔍 CHANGE DETECTION ANALYSIS:');
    for (var sheetName in this.results.tests.changeDetection.sheetAnalysis) {
      var analysis = this.results.tests.changeDetection.sheetAnalysis[sheetName];
      if (analysis.dataStats) {
        Logger.log('   ' + sheetName + ':');
        Logger.log('     - Total Records: ' + analysis.dataStats.totalRecords);
        Logger.log('     - Records with Hash: ' + analysis.dataStats.recordsWithHash);
        if (analysis.hashStats) {
          Logger.log('     - Hash Matches: ' + analysis.hashStats.hashMatches);
          Logger.log('     - Hash Mismatches: ' + analysis.hashStats.hashMismatches);
        }
      }
    }
    Logger.log('');
  }
  
  Logger.log('📋 Full results stored in analyzer.results object');
  Logger.log('🎯 ========================================');
};

/**
 * UTILITY METHODS
 */
ExportSystemAnalyzer.prototype.getComponentMethods = function(instance) {
  var methods = [];
  for (var prop in instance) {
    if (typeof instance[prop] === 'function') {
      methods.push(prop);
    }
  }
  return methods.slice(0, 10); // Limit to first 10 methods
};

ExportSystemAnalyzer.prototype.testHashComparison = function() {
  // Implementation for hash comparison testing
  return { implemented: false, note: 'Hash comparison testing placeholder' };
};

ExportSystemAnalyzer.prototype.testDetectionAccuracy = function() {
  // Implementation for detection accuracy testing
  return { implemented: false, note: 'Detection accuracy testing placeholder' };
};

ExportSystemAnalyzer.prototype.testChangeDetectionPerformance = function() {
  // Implementation for change detection performance testing
  return { implemented: false, note: 'Change detection performance testing placeholder' };
};

ExportSystemAnalyzer.prototype.identifyBottlenecks = function() {
  // Implementation for bottleneck identification
  return ['Bottleneck identification placeholder'];
};

/**
 * GLOBAL FUNCTION FOR EASY ACCESS
 */
function runCompleteExportAnalysis() {
  var analyzer = new ExportSystemAnalyzer();
  return analyzer.runCompleteExportAnalysis();
}

/**
 * QUICK TESTS FOR SPECIFIC ISSUES
 */
function quickHashAnalysis() {
  var analyzer = new ExportSystemAnalyzer();
  analyzer.analyzeHashSystem();
  return analyzer.results.tests.hashSystem;
}

function quickChangeDetectionTest() {
  var analyzer = new ExportSystemAnalyzer();
  analyzer.analyzeChangeDetectionSystem();
  return analyzer.results.tests.changeDetection;
}
