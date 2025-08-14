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
        .addItem('Export Changes', 'exportChanges')
        .addItem('Export All', 'exportAll')
        .addItem('Resume Export', 'resumeExport'))
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
