/**
 * StatsService Component
 * Handles statistics gathering and reporting for import/export operations
 */
class StatsService {
  constructor() {
    this.ss = SpreadsheetApp.getActiveSpreadsheet();
  }

  /**
   * Get comprehensive import statistics
   * @return {Object} Statistics object with counts and configuration status
   */
  getImportStats() {
    try {
      var stats = {
        products: 0,
        variants: 0,
        configured: false,
        lastImport: null,
        totalRecords: 0
      };
      
      // Check Products sheet
      var productsSheet = this.ss.getSheetByName('Products');
      if (productsSheet) {
        stats.products = Math.max(0, productsSheet.getLastRow() - 1);
      }
      
      // Check Variants sheet
      var variantsSheet = this.ss.getSheetByName('Variants');
      if (variantsSheet) {
        stats.variants = Math.max(0, variantsSheet.getLastRow() - 1);
      }
      
      // Check Configuration
      var configSheet = this.ss.getSheetByName('Configuration');
      if (configSheet) {
        stats.configured = true;
        
        // Try to get last import timestamp
        try {
          var configManager = new ConfigManager();
          stats.lastImport = configManager.get('last_import_timestamp');
        } catch (error) {
          Logger.log('Could not retrieve last import timestamp: ' + error.message);
        }
      }
      
      stats.totalRecords = stats.products + stats.variants;
      
      return stats;
    } catch (error) {
      Logger.log('Error getting import stats: ' + error.message);
      throw error;
    }
  }

  /**
   * Get export statistics
   * @return {Object} Export statistics
   */
  getExportStats() {
    try {
      var stats = {
        lastExport: null,
        exportCount: 0,
        successfulExports: 0,
        failedExports: 0
      };

      try {
        var configManager = new ConfigManager();
        stats.lastExport = configManager.get('last_export_timestamp');
        stats.exportCount = parseInt(configManager.get('total_exports') || '0');
        stats.successfulExports = parseInt(configManager.get('successful_exports') || '0');
        stats.failedExports = parseInt(configManager.get('failed_exports') || '0');
      } catch (error) {
        Logger.log('Could not retrieve export stats: ' + error.message);
      }

      return stats;
    } catch (error) {
      Logger.log('Error getting export stats: ' + error.message);
      throw error;
    }
  }

  /**
   * Get comprehensive system statistics
   * @return {Object} Combined import and export statistics
   */
  getSystemStats() {
    try {
      var importStats = this.getImportStats();
      var exportStats = this.getExportStats();
      
      return {
        import: importStats,
        export: exportStats,
        system: {
          configured: importStats.configured,
          totalRecords: importStats.totalRecords,
          lastActivity: importStats.lastImport || exportStats.lastExport
        }
      };
    } catch (error) {
      Logger.log('Error getting system stats: ' + error.message);
      throw error;
    }
  }

  /**
   * Format statistics for display
   * @param {Object} stats - Statistics object
   * @return {string} Formatted statistics string
   */
  formatStats(stats) {
    try {
      var lines = [];
      
      if (stats.import) {
        lines.push('📥 IMPORT STATISTICS:');
        lines.push(`Products: ${stats.import.products}`);
        lines.push(`Variants: ${stats.import.variants}`);
        lines.push(`Total Records: ${stats.import.totalRecords}`);
        lines.push(`Last Import: ${stats.import.lastImport || 'Never'}`);
        lines.push('');
      }
      
      if (stats.export) {
        lines.push('📤 EXPORT STATISTICS:');
        lines.push(`Total Exports: ${stats.export.exportCount}`);
        lines.push(`Successful: ${stats.export.successfulExports}`);
        lines.push(`Failed: ${stats.export.failedExports}`);
        lines.push(`Last Export: ${stats.export.lastExport || 'Never'}`);
        lines.push('');
      }
      
      if (stats.system) {
        lines.push('⚙️ SYSTEM STATUS:');
        lines.push(`Configuration: ${stats.system.configured ? '✅ Ready' : '❌ Not configured'}`);
        lines.push(`Last Activity: ${stats.system.lastActivity || 'Never'}`);
      }
      
      return lines.join('\n');
    } catch (error) {
      Logger.log('Error formatting stats: ' + error.message);
      return 'Error formatting statistics: ' + error.message;
    }
  }
}
