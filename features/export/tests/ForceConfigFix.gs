/**
 * Force Config Fix
 * Directly fixes the API version cell in the Config sheet
 */

function forceFixAPIVersion() {
  Logger.log('=== FORCE CONFIG FIX ===');
  Logger.log('Directly fixing API version cell');
  Logger.log('');
  
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var configSheet = ss.getSheetByName('Config');
    
    if (!configSheet) {
      Logger.log('❌ Config sheet not found');
      return;
    }
    
    // Step 1: Find and display current values
    Logger.log('1. ANALYZING CURRENT CONFIG SHEET...');
    var data = configSheet.getDataRange().getValues();
    
    for (var i = 0; i < data.length; i++) {
      if (data[i][0] === 'api_version') {
        Logger.log('   Found api_version at row ' + (i + 1));
        Logger.log('   Current value: ' + data[i][1]);
        Logger.log('   Type: ' + typeof data[i][1]);
        Logger.log('   Is Date: ' + (data[i][1] instanceof Date));
        
        // Step 2: Force set the correct value
        Logger.log('2. FORCE SETTING CORRECT VALUE...');
        var cell = configSheet.getRange(i + 1, 2);
        cell.setValue('2023-04');
        cell.setNumberFormat('@'); // Force text format
        
        Logger.log('   Set api_version to: 2023-04');
        Logger.log('   Applied text formatting');
        break;
      }
    }
    
    // Step 3: Verify the fix
    Logger.log('3. VERIFYING FIX...');
    var configManager = new ConfigManager();
    var apiVersion = configManager.getConfigValue('api_version');
    Logger.log('   Retrieved api_version: ' + apiVersion);
    Logger.log('   Type: ' + typeof apiVersion);
    
    // Step 4: Test API URL construction
    Logger.log('4. TESTING API URL...');
    var credentials = configManager.getShopifyCredentials();
    var baseUrl = 'https://' + credentials.shopDomain + '/admin/api/' + credentials.apiVersion;
    Logger.log('   Base URL: ' + baseUrl);
    
    var urlPattern = /^https:\/\/[a-zA-Z0-9-]+\.myshopify\.com\/admin\/api\/\d{4}-\d{2}$/;
    var validFormat = urlPattern.test(baseUrl);
    Logger.log('   URL Format Valid: ' + validFormat);
    
    // Step 5: Test API connectivity
    if (validFormat) {
      Logger.log('5. TESTING API CONNECTIVITY...');
      var testUrl = baseUrl + '/shop.json';
      
      var options = {
        method: 'GET',
        headers: {
          'X-Shopify-Access-Token': credentials.accessToken,
          'Content-Type': 'application/json'
        },
        muteHttpExceptions: true
      };
      
      var response = UrlFetchApp.fetch(testUrl, options);
      var statusCode = response.getResponseCode();
      
      Logger.log('   API Test: ' + statusCode);
      
      if (statusCode === 200) {
        Logger.log('🎉 API CONNECTIVITY RESTORED!');
        Logger.log('   Export functionality is now working');
        return { success: true, statusCode: statusCode };
      } else {
        Logger.log('⚠️ API returns ' + statusCode + ' - may be access token issue');
        Logger.log('   Response: ' + response.getContentText());
        return { success: false, statusCode: statusCode, response: response.getContentText() };
      }
    } else {
      Logger.log('❌ URL format still invalid after fix');
      return { success: false, error: 'URL format invalid' };
    }
    
  } catch (error) {
    Logger.log('❌ FORCE FIX FAILED: ' + error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Complete config sheet recreation
 */
function recreateConfigSheet() {
  Logger.log('=== RECREATE CONFIG SHEET ===');
  Logger.log('Completely recreating Config sheet from scratch');
  Logger.log('');
  
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Step 1: Delete existing Config sheet
    var existingSheet = ss.getSheetByName('Config');
    if (existingSheet) {
      Logger.log('1. DELETING EXISTING CONFIG SHEET...');
      ss.deleteSheet(existingSheet);
      Logger.log('   Existing Config sheet deleted');
    }
    
    // Step 2: Create new Config sheet
    Logger.log('2. CREATING NEW CONFIG SHEET...');
    var configSheet = ss.insertSheet('Config');
    
    // Step 3: Add configuration data
    Logger.log('3. ADDING CONFIGURATION DATA...');
    var configData = [
      ['Setting', 'Value', 'Description'],
      ['shop_domain', '1x0ah0-a8.myshopify.com', 'Your Shopify shop domain'],
      ['api_version', '2023-04', 'Shopify API version'],
      ['admin_emails', Session.getActiveUser().getEmail(), 'Comma-separated list of admin emails'],
      ['read_only_mode', 'FALSE', 'Enable read-only mode (TRUE/FALSE)'],
      ['volume_alert_threshold', '200', 'Alert when modifying more than X rows'],
      ['auto_backup_enabled', 'TRUE', 'Enable automatic backups before export'],
      ['max_batch_size', '250', 'Maximum batch size for API calls'],
      ['batch_size', '100', 'Default batch size for export operations'],
      ['rate_limit_delay', '200', 'Delay between API calls (ms)'],
      ['max_retries', '3', 'Maximum retry attempts for failed operations'],
      ['retry_base_delay', '1000', 'Base delay for retry attempts (ms)'],
      ['retry_max_delay', '10000', 'Maximum delay for retry attempts (ms)'],
      ['last_import_timestamp', '', 'Last successful import timestamp'],
      ['last_export_timestamp', '', 'Last successful export timestamp'],
      ['system_version', '2.0.0', 'System version'],
      ['setup_completed', 'TRUE', 'Initial setup completed']
    ];
    
    configSheet.getRange(1, 1, configData.length, 3).setValues(configData);
    
    // Step 4: Force text formatting on api_version
    Logger.log('4. APPLYING TEXT FORMATTING...');
    var apiVersionCell = configSheet.getRange(3, 2); // Row 3, Column 2 (api_version value)
    apiVersionCell.setNumberFormat('@'); // Force text format
    
    // Step 5: Format the sheet
    Logger.log('5. FORMATTING SHEET...');
    // Header formatting
    var headerRange = configSheet.getRange(1, 1, 1, 3);
    headerRange.setFontWeight('bold')
              .setBackground('#4285f4')
              .setFontColor('white');
    
    // Setting names (read-only)
    var settingsRange = configSheet.getRange(2, 1, configData.length - 1, 1);
    settingsRange.setBackground('#f8f9fa')
                 .setFontWeight('bold');
    
    // Descriptions (read-only)
    var descriptionsRange = configSheet.getRange(2, 3, configData.length - 1, 1);
    descriptionsRange.setBackground('#f8f9fa')
                     .setFontStyle('italic');
    
    Logger.log('   Config sheet recreated successfully');
    
    // Step 6: Test the fix
    Logger.log('6. TESTING NEW CONFIG...');
    var configManager = new ConfigManager();
    var apiVersion = configManager.getConfigValue('api_version');
    Logger.log('   API Version: ' + apiVersion);
    Logger.log('   Type: ' + typeof apiVersion);
    
    if (apiVersion === '2023-04') {
      Logger.log('✅ CONFIG SHEET RECREATION SUCCESSFUL');
      
      // Test API connectivity
      var credentials = configManager.getShopifyCredentials();
      var testUrl = 'https://' + credentials.shopDomain + '/admin/api/' + credentials.apiVersion + '/shop.json';
      
      var options = {
        method: 'GET',
        headers: {
          'X-Shopify-Access-Token': credentials.accessToken,
          'Content-Type': 'application/json'
        },
        muteHttpExceptions: true
      };
      
      var response = UrlFetchApp.fetch(testUrl, options);
      var statusCode = response.getResponseCode();
      
      Logger.log('   Final API Test: ' + statusCode);
      
      if (statusCode === 200) {
        Logger.log('🎉 COMPLETE SUCCESS - API WORKING!');
      } else {
        Logger.log('⚠️ Config fixed but API returns ' + statusCode);
      }
      
      return { success: true, apiWorking: statusCode === 200 };
    } else {
      Logger.log('❌ Config recreation failed - api_version still wrong');
      return { success: false };
    }
    
  } catch (error) {
    Logger.log('❌ CONFIG RECREATION FAILED: ' + error.message);
    return { success: false, error: error.message };
  }
}
