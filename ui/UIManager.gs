/**
 * UIManager Component
 * Handles all user interface elements, menus, and dialogs
 */
class UIManager {
  constructor() {
    this.ui = SpreadsheetApp.getUi();
  }
  /**
   * Create custom menu in Google Sheets
   */
  createCustomMenu() {
    this.ui.createMenu('🛍️ Shopify Catalog')
      .addSubMenu(this.ui.createMenu('📥 Import')
        .addItem('Import All Products', 'importAllProducts')
        .addItem('Import Products Only', 'importProductsOnly')
        .addItem('Import Variants Only', 'importVariantsOnly')
        .addItem('Import Metafields', 'importMetafields')
        .addItem('Import Images', 'importImages')
        .addItem('Import Inventory', 'importInventory'))
      .addSeparator()
      .addSubMenu(this.ui.createMenu('🔍 Validate')
        .addItem('Run Dry Run', 'runDryRun')
        .addItem('Validate Data', 'validateAllData')
        .addItem('Check Duplicates', 'checkDuplicates')
        .addItem('Recompute Hashes', 'recomputeHashes'))
      .addSeparator()
      .addSubMenu(this.ui.createMenu('📤 Export')
        .addItem('📤 Export to Shopify', 'exportToShopify')
        .addItem('📦 Export Products Only', 'exportProducts')
        .addItem('🔧 Export Variants Only', 'exportVariants')
        .addSeparator()
        .addItem('📊 Export Status', 'viewExportStatus')
        .addItem('🔄 Resume Export', 'resumeExport')
        .addItem('📋 Audit Report', 'viewExportAuditReport'))
      .addSeparator()
      .addSubMenu(this.ui.createMenu('🔧 Tools')
        .addItem('Test Connection', 'testShopifyConnection')
        .addItem('Create Backup', 'createManualBackup')
        .addItem('Restore Backup', 'showRestoreDialog')
        .addItem('Clear Logs', 'clearLogs')
        .addItem('Toggle Read-Only Mode', 'toggleReadOnlyMode')
        .addItem('Refresh Config', 'refreshConfig'))
      .addSeparator()
      .addItem('📚 User Guide', 'openUserGuide')
      .addItem('⚙️ Settings', 'openSettings')
      .addToUi();
    Logger.log('Custom menu created successfully');
  }
  /**
   * Show success message
   */
  showSuccess(title, message) {
    this.ui.alert(title, message, this.ui.ButtonSet.OK);
  }
  /**
   * Show error message
   */
  showError(title, message) {
    this.ui.alert(title, message, this.ui.ButtonSet.OK);
  }
  /**
   * Show warning message
   */
  showWarning(title, message) {
    return this.ui.alert(title, message, this.ui.ButtonSet.OK_CANCEL);
  }
  /**
   * Show confirmation dialog
   */
  showConfirmation(title, message) {
    var response = this.ui.alert(title, message, this.ui.ButtonSet.YES_NO);
    return response === this.ui.Button.YES;
  }
  /**
   * Show progress dialog (using toast for now)
   */
  showProgress(message) {
    SpreadsheetApp.getActiveSpreadsheet().toast(message, 'Progress', 3);
  }
  /**
   * Show input dialog
   */
  showInputDialog(title, prompt) {
    var response = this.ui.prompt(title, prompt, this.ui.ButtonSet.OK_CANCEL);
    if (response.getSelectedButton() === this.ui.Button.OK) {
      return {
        success: true,
        value: response.getResponseText()
      };
    }
    return {
      success: false,
      value: null
    };
  }
  /**
   * Show multi-choice dialog
   */
  showChoiceDialog(title, message, choices) {
    // For now, use a simple alert with instructions
    // In future versions, this could be enhanced with HTML dialogs
    var choiceText = choices.map((choice, index) => `${index + 1}. ${choice}`).join('\n');
    var fullMessage = `${message}\n\n${choiceText}\n\nPlease enter the number of your choice:`;
    var response = this.ui.prompt(title, fullMessage, this.ui.ButtonSet.OK_CANCEL);
    if (response.getSelectedButton() === this.ui.Button.OK) {
      var choiceIndex = parseInt(response.getResponseText()) - 1;
      if (choiceIndex >= 0 && choiceIndex < choices.length) {
        return {
          success: true,
          choice: choiceIndex,
          value: choices[choiceIndex]
        };
      }
    }
    return {
      success: false,
      choice: -1,
      value: null
    };
  }
  /**
   * Show detailed results dialog
   */
  showResultsDialog(title, results) {
    var message = '';
    if (results.summary) {
      message += `Summary: ${results.summary}\n\n`;
    }
    if (results.success && results.success.length > 0) {
      message += `✅ Successful (${results.success.length}):\n`;
      results.success.slice(0, 5).forEach(item => {
        message += `  • ${item}\n`;
      });
      if (results.success.length > 5) {
        message += `  • ... and ${results.success.length - 5} more\n`;
      }
      message += '\n';
    }
    if (results.errors && results.errors.length > 0) {
      message += `❌ Errors (${results.errors.length}):\n`;
      results.errors.slice(0, 5).forEach(error => {
        message += `  • ${error}\n`;
      });
      if (results.errors.length > 5) {
        message += `  • ... and ${results.errors.length - 5} more\n`;
      }
      message += '\n';
    }
    if (results.warnings && results.warnings.length > 0) {
      message += `⚠️ Warnings (${results.warnings.length}):\n`;
      results.warnings.slice(0, 3).forEach(warning => {
        message += `  • ${warning}\n`;
      });
      if (results.warnings.length > 3) {
        message += `  • ... and ${results.warnings.length - 3} more\n`;
      }
    }
    this.ui.alert(title, message, this.ui.ButtonSet.OK);
  }
  /**
   * Navigate to specific sheet
   */
  navigateToSheet(sheetName) {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);
    if (sheet) {
      ss.setActiveSheet(sheet);
      return true;
    } else {
      this.showError('Navigation Error', `Sheet '${sheetName}' not found.`);
      return false;
    }
  }
  /**
   * Highlight cells with errors
   */
  highlightErrors(sheetName, errorRanges) {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      Logger.log(`Sheet '${sheetName}' not found for error highlighting`);
      return;
    }
    errorRanges.forEach(range => {
      try {
        var cellRange = sheet.getRange(range.row, range.col);
        cellRange.setBackground('#f8d7da'); // Light red background
        cellRange.setNote(range.error || 'Validation error');
      } catch (error) {
        Logger.log(`Error highlighting cell ${range.row},${range.col}: ${error.message}`);
      }
    });
  }
  /**
   * Clear error highlighting
   */
  clearErrorHighlighting(sheetName) {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      Logger.log(`Sheet '${sheetName}' not found for clearing highlights`);
      return;
    }
    // Clear background colors and notes for the entire sheet
    var dataRange = sheet.getDataRange();
    dataRange.setBackground(null);
    dataRange.clearNote();
  }
  /**
   * Export functionality - integrated from ExportUI
   */
  exportToShopify() {
    try {
      var response = this.ui.alert(
        '📤 Export to Shopify',
        'This will export all changes from your sheets to Shopify.\n\n' +
        'Only modified records will be processed.\n' +
        'Estimated time: 10-30 seconds depending on changes\n\n' +
        'Continue with export?',
        this.ui.ButtonSet.YES_NO
      );
      
      if (response !== this.ui.Button.YES) {
        return;
      }
      
      this.ui.alert('🚀 Export Started', 'Export is running... Progress will be shown when complete.', this.ui.ButtonSet.OK);
      
      var exportManager = new ExportManager();
      var results = { success: false, details: [], summary: { productsProcessed: 0, variantsProcessed: 0 } };
      
      try {
        var productResults = exportManager.initiateExport('Products', { 
          user: Session.getActiveUser().getEmail(),
          force: false 
        });
        
        if (productResults.success) {
          var processResults = exportManager.processExportQueue();
          results.success = processResults.success;
          results.details = processResults.details || [];
          results.summary = processResults.summary || {};
          results.summary.productsProcessed = results.summary.totalProcessed || 0;
          
          if (processResults.success) {
            var variantResults = exportManager.initiateExport('Variants', { 
              user: Session.getActiveUser().getEmail(),
              force: false 
            });
            
            if (variantResults.success) {
              var variantProcessResults = exportManager.processExportQueue();
              
              if (variantProcessResults.success) {
                if (!results.details) results.details = [];
                results.details.push('✅ Products exported: ' + (results.summary.productsProcessed || 0) + ' items');
                results.details.push('✅ Variants exported: ' + (variantProcessResults.summary?.totalProcessed || 0) + ' items');
                results.details.push('✅ Export completed successfully');
                
                results.summary.variantsProcessed = variantProcessResults.summary?.totalProcessed || 0;
                results.summary.totalProcessed = results.summary.productsProcessed + results.summary.variantsProcessed;
              }
            }
          }
        } else {
          results = productResults;
          if (!results.details) results.details = [];
        }
        
        if (exportManager.sessionId) {
          exportManager.cleanupCompletedExport(exportManager.sessionId);
        }
        
      } catch (exportError) {
        results = {
          success: false,
          error: exportError.message,
          details: ['Export system error: ' + exportError.message]
        };
      }
      
      this.showExportResults('All Products & Variants', results);
      
    } catch (error) {
      Logger.log('Export failed: ' + error.message);
      this.ui.alert('❌ Export Failed', 
        'Export error: ' + error.message + '\n\nCheck the logs for more details.', 
        this.ui.ButtonSet.OK);
    }
  }

  exportProducts() {
    try {
      var response = this.ui.alert(
        '📦 Export Products',
        'Export product changes to Shopify?\n\nOnly modified products will be processed.',
        this.ui.ButtonSet.YES_NO
      );
      
      if (response !== this.ui.Button.YES) {
        return;
      }
      
      this.ui.alert('🚀 Export Started', 'Products export is running...', this.ui.ButtonSet.OK);
      
      var exportManager = new ExportManager();
      var results = exportManager.initiateExport('Products', { 
        user: Session.getActiveUser().getEmail(),
        force: false 
      });
      
      if (results.success) {
        var processResults = exportManager.processExportQueue();
        this.showExportResults('Products', processResults);
      } else {
        this.showExportResults('Products', results);
      }
      
      if (exportManager.sessionId) {
        exportManager.cleanupCompletedExport(exportManager.sessionId);
      }
      
    } catch (error) {
      Logger.log('Product export failed: ' + error.message);
      this.ui.alert('❌ Export Failed', error.message, this.ui.ButtonSet.OK);
    }
  }

  exportVariants() {
    try {
      var response = this.ui.alert(
        '🔧 Export Variants',
        'Export variant changes to Shopify?\n\nOnly modified variants will be processed.',
        this.ui.ButtonSet.YES_NO
      );
      
      if (response !== this.ui.Button.YES) {
        return;
      }
      
      this.ui.alert('🚀 Export Started', 'Variants export is running...', this.ui.ButtonSet.OK);
      
      var exportManager = new ExportManager();
      var results = exportManager.initiateExport('Variants', { 
        user: Session.getActiveUser().getEmail(),
        force: false 
      });
      
      if (results.success) {
        var processResults = exportManager.processExportQueue();
        this.showExportResults('Variants', processResults);
      } else {
        this.showExportResults('Variants', results);
      }
      
      if (exportManager.sessionId) {
        exportManager.cleanupCompletedExport(exportManager.sessionId);
      }
      
    } catch (error) {
      Logger.log('Variant export failed: ' + error.message);
      this.ui.alert('❌ Export Failed', error.message, this.ui.ButtonSet.OK);
    }
  }

  viewExportStatus() {
    try {
      var properties = PropertiesService.getScriptProperties();
      var allProperties = properties.getProperties();
      var exportSessions = [];
      
      for (var key in allProperties) {
        if (key.startsWith('export_state_')) {
          try {
            var state = JSON.parse(allProperties[key]);
            exportSessions.push(state);
          } catch (e) {
            // Ignore invalid entries
          }
        }
      }
      
      if (exportSessions.length === 0) {
        this.ui.alert('📊 Export Status', 'No recent export sessions found.', this.ui.ButtonSet.OK);
        return;
      }
      
      var latestSession = exportSessions[exportSessions.length - 1];
      var message = '📊 Latest Export Session:\n\n' +
                    'Session ID: ' + latestSession.sessionId + '\n' +
                    'Sheet: ' + latestSession.sheetName + '\n' +
                    'Status: ' + latestSession.status + '\n' +
                    'Queue Size: ' + (latestSession.queueSize || 'Unknown') + '\n';
      
      if (latestSession.completedAt) {
        message += 'Completed: ' + latestSession.completedAt + '\n';
      }
      
      this.ui.alert('📊 Export Status', message, this.ui.ButtonSet.OK);
      
    } catch (error) {
      Logger.log('Error viewing export status: ' + error.message);
      this.ui.alert('❌ Error', 'Could not retrieve export status: ' + error.message, this.ui.ButtonSet.OK);
    }
  }

  resumeExport() {
    try {
      var response = this.ui.alert(
        '🔄 Resume Export',
        'This will attempt to resume the most recent interrupted export.\n\n' +
        'Continue?',
        this.ui.ButtonSet.YES_NO
      );
      
      if (response !== this.ui.Button.YES) {
        return;
      }
      
      // Find the most recent export session
      var properties = PropertiesService.getScriptProperties();
      var allProperties = properties.getProperties();
      var latestSessionId = null;
      var latestTimestamp = 0;
      
      for (var key in allProperties) {
        if (key.startsWith('export_state_')) {
          try {
            var state = JSON.parse(allProperties[key]);
            var timestamp = new Date(state.timestamp || 0).getTime();
            if (timestamp > latestTimestamp) {
              latestTimestamp = timestamp;
              latestSessionId = state.sessionId;
            }
          } catch (e) {
            // Ignore invalid entries
          }
        }
      }
      
      if (!latestSessionId) {
        this.ui.alert('🔄 Resume Export', 'No export session found to resume.', this.ui.ButtonSet.OK);
        return;
      }
      
      this.ui.alert('🚀 Resuming Export', 'Attempting to resume export session: ' + latestSessionId, this.ui.ButtonSet.OK);
      
      var exportManager = new ExportManager();
      var results = exportManager.resumeExport(latestSessionId);
      
      this.showExportResults('Resumed Export', results);
      
    } catch (error) {
      Logger.log('Resume export failed: ' + error.message);
      this.ui.alert('❌ Resume Failed', error.message, this.ui.ButtonSet.OK);
    }
  }

  viewExportAuditReport() {
    try {
      var properties = PropertiesService.getScriptProperties();
      var allProperties = properties.getProperties();
      var auditReports = [];
      
      for (var key in allProperties) {
        if (key.startsWith('audit_report_')) {
          try {
            var report = JSON.parse(allProperties[key]);
            auditReports.push(report);
          } catch (e) {
            // Ignore invalid entries
          }
        }
      }
      
      if (auditReports.length === 0) {
        this.ui.alert('📋 Audit Report', 'No audit reports found.', this.ui.ButtonSet.OK);
        return;
      }
      
      var latestReport = auditReports[auditReports.length - 1];
      var message = '📋 Latest Audit Report:\n\n' +
                    'Session: ' + latestReport.sessionId + '\n' +
                    'Duration: ' + Math.round(latestReport.totalDuration / 1000) + ' seconds\n' +
                    'Total Logs: ' + latestReport.summary.totalLogs + '\n';
      
      if (latestReport.summary.performanceMetrics) {
        message += 'Operations: ' + latestReport.summary.performanceMetrics.totalOperations + '\n';
        if (latestReport.summary.performanceMetrics.totalOperations > 0) {
          message += 'Success Rate: ' + Math.round(latestReport.summary.performanceMetrics.successfulOperations / 
                                                   latestReport.summary.performanceMetrics.totalOperations * 100) + '%\n';
        }
      }
      
      if (latestReport.summary.logsByLevel) {
        message += '\nLog Levels:\n';
        for (var level in latestReport.summary.logsByLevel) {
          message += '- ' + level + ': ' + latestReport.summary.logsByLevel[level] + '\n';
        }
      }
      
      this.ui.alert('📋 Audit Report', message, this.ui.ButtonSet.OK);
      
    } catch (error) {
      Logger.log('Error viewing audit report: ' + error.message);
      this.ui.alert('❌ Error', 'Could not retrieve audit report: ' + error.message, this.ui.ButtonSet.OK);
    }
  }

  showExportResults(type, results) {
    try {
      var title = '📤 ' + type + ' Export Results';
      var message = '';
      
      if (results.success) {
        message = '✅ Export completed successfully!\n\n';
        
        if (results.summary) {
          message += 'Summary:\n';
          if (results.summary.stats) {
            message += '- Total items: ' + results.summary.stats.total + '\n';
            message += '- Completed: ' + results.summary.stats.completed + '\n';
            message += '- Failed: ' + results.summary.stats.failed + '\n';
            message += '- Success rate: ' + Math.round(results.summary.stats.successRate) + '%\n';
          }
          
          if (results.summary.totalRecords !== undefined) {
            message += '- Records processed: ' + results.summary.totalRecords + '\n';
            message += '- Changes detected: ' + results.summary.changesDetected + '\n';
          }
        }
        
        if (results.sessionId) {
          message += '\nSession ID: ' + results.sessionId;
        }
        
      } else {
        message = '❌ Export failed:\n\n' + (results.error || 'Unknown error');
        
        if (results.details && results.details.length > 0) {
          message += '\n\nDetails:\n';
          for (var i = 0; i < Math.min(results.details.length, 3); i++) {
            message += '- ' + results.details[i] + '\n';
          }
          if (results.details.length > 3) {
            message += '... and ' + (results.details.length - 3) + ' more issues';
          }
        }
      }
      
      this.ui.alert(title, message, this.ui.ButtonSet.OK);
      
    } catch (error) {
      Logger.log('Error showing export results: ' + error.message);
      this.ui.alert('❌ Error', 'Could not display export results: ' + error.message, this.ui.ButtonSet.OK);
    }
  }

  /**
   * Show setup wizard (for first-time setup)
   */
  showSetupWizard() {
    var message = `Welcome to Shopify Sheets Catalog Management!
This appears to be your first time using the system. 
The system has been automatically configured with your Shopify credentials:
• Shop: ${CONFIG.SHOPIFY_DOMAIN}
• API Version: ${CONFIG.SHOPIFY_API_VERSION}
Next steps:
1. Your access token has been securely stored
2. Configuration has been initialized
3. Required tabs have been created
Would you like to test the Shopify connection now?`;
    var response = this.ui.alert(
      'Setup Complete!', 
      message, 
      this.ui.ButtonSet.YES_NO
    );
    if (response === this.ui.Button.YES) {
      testShopifyConnection();
    }
  }
}

// ===== GLOBAL FUNCTIONS FOR MENU INTEGRATION =====
// These functions can be called directly from menu items

/**
 * Global wrapper functions for menu integration
 * These create a UIManager instance and call the appropriate method
 */

function exportToShopify() {
  var uiManager = new UIManager();
  uiManager.exportToShopify();
}

function exportProducts() {
  var uiManager = new UIManager();
  uiManager.exportProducts();
}

function exportVariants() {
  var uiManager = new UIManager();
  uiManager.exportVariants();
}

function viewExportStatus() {
  var uiManager = new UIManager();
  uiManager.viewExportStatus();
}

function resumeExport() {
  var uiManager = new UIManager();
  uiManager.resumeExport();
}

function viewExportAuditReport() {
  var uiManager = new UIManager();
  uiManager.viewExportAuditReport();
}

/**
 * Helper function to add export menu items to existing menu
 * Call this from Code_M2.gs onOpen() function like this:
 * 
 * // In your existing onOpen() function in Code_M2.gs:
 * var uiManager = new UIManager();
 * uiManager.createCustomMenu();
 * 
 * @param {Menu} menu - The existing menu object (optional - for backward compatibility)
 */
function addExportMenuItems(menu) {
  // For backward compatibility with ExportUI integration
  // Now just creates the full UIManager menu
  var uiManager = new UIManager();
  uiManager.createCustomMenu();
  return true;
}
