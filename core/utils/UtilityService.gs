/**
 * UtilityService Component
 * Handles utility functions and system operations
 */
class UtilityService {
  constructor() {
    // No initialization needed
  }

  /**
   * Clear application logs
   * @return {Object} Result object with success status
   */
  clearLogs() {
    try {
      // Apps Script doesn't have console.clear(), so we simulate it
      Logger.log('=== LOGS CLEARED ===');
      return { success: true, message: 'Application logs have been cleared (simulated)' };
    } catch (error) {
      Logger.log('Clear logs error: ' + error.message);
      throw error;
    }
  }

  /**
   * Get system information
   * @return {Object} System information
   */
  getSystemInfo() {
    try {
      var configManager = new ConfigManager();
      return {
        version: configManager.get('system_version') || '2.0.0',
        setupCompleted: configManager.get('setup_completed') === 'TRUE',
        readOnlyMode: configManager.get('read_only_mode') === 'TRUE',
        lastActivity: configManager.get('last_import_timestamp') || configManager.get('last_export_timestamp')
      };
    } catch (error) {
      Logger.log('Error getting system info: ' + error.message);
      throw error;
    }
  }

  /**
   * Validate system health
   * @return {Object} Health check results
   */
  healthCheck() {
    try {
      var results = {
        configManager: false,
        apiClient: false,
        sheets: false,
        credentials: false
      };

      // Test ConfigManager
      try {
        var configManager = new ConfigManager();
        configManager.get('system_version');
        results.configManager = true;
      } catch (error) {
        Logger.log('ConfigManager health check failed: ' + error.message);
      }

      // Test ApiClient
      try {
        var apiClient = new ApiClient();
        results.apiClient = true;
      } catch (error) {
        Logger.log('ApiClient health check failed: ' + error.message);
      }

      // Test Sheets access
      try {
        var ss = SpreadsheetApp.getActiveSpreadsheet();
        ss.getName();
        results.sheets = true;
      } catch (error) {
        Logger.log('Sheets health check failed: ' + error.message);
      }

      // Test credentials
      try {
        var configManager = new ConfigManager();
        configManager.getShopifyCredentials();
        results.credentials = true;
      } catch (error) {
        Logger.log('Credentials health check failed: ' + error.message);
      }

      return {
        success: Object.values(results).every(Boolean),
        details: results
      };
    } catch (error) {
      Logger.log('Health check error: ' + error.message);
      throw error;
    }
  }
}
