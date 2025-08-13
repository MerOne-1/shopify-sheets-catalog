# Feature Components

This directory contains feature-specific components that implement the main business functionality.

## Feature Structure

### /import/
- `ProductImporter.gs` - Product data import logic
- `VariantImporter.gs` - Variant data import logic
- `MetafieldImporter.gs` - Metafield import functionality
- `InventoryImporter.gs` - Inventory data import
- `ImportCoordinator.gs` - Orchestrates all import operations

### /export/
- `ExportQueue.gs` - Batch processing and queue management
- `BatchProcessor.gs` - API batch operations
- `DiffCalculator.gs` - Change detection and comparison
- `ExportCoordinator.gs` - Orchestrates all export operations

### /backup/
- `BackupManager.gs` - Automatic backup creation
- `RestoreManager.gs` - One-click restore functionality
- `BackupStorage.gs` - Backup storage and indexing

### /inventory/
- `InventoryManager.gs` - Inventory quantity management
- `LocationMapper.gs` - Location mapping and management
- `InventoryValidator.gs` - Inventory-specific validation

### /metafields/
- `MetafieldManager.gs` - Metafield CRUD operations
- `TypeCoercion.gs` - Data type validation and conversion
- `MetafieldValidator.gs` - Metafield-specific validation
- `ConflictResolver.gs` - Handle duplicate namespace/key conflicts

### /images/
- `ImageManager.gs` - Simple image operations
- `AdvancedImageManager.gs` - Complex image operations
- `ImageDeduplicator.gs` - Prevent unnecessary uploads
- `PositionManager.gs` - Image ordering and positioning

## Feature Guidelines

1. **Business Logic Focus** - Features implement specific business requirements
2. **Core Component Usage** - Features should use core components for common functionality
3. **Error Handling** - Features should handle their specific error scenarios
4. **Performance Aware** - Features should be optimized for their specific use cases
5. **Configurable** - Features should be configurable through the ConfigManager

## Usage Example

```javascript
// Initialize feature with dependencies
const productImporter = new ProductImporter(apiClient, dataManager, logger);

// Use feature
const result = await productImporter.importProducts({
  batchSize: 100,
  includeMetafields: true,
  validateData: true
});

logger.logOperation('import', 'products', result.count, result.status);
```

## Feature Integration

Features are designed to work together through the core components:

```javascript
// Example: Import then Export workflow
const importResult = await importCoordinator.importAll();
const diffResult = await diffCalculator.calculateChanges();
const exportResult = await exportCoordinator.exportChanges(diffResult);
```
