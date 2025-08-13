# Core Components

This directory contains the foundational components that provide core functionality across the entire system.

## Component Structure

### /api/
- `ApiClient.gs` - Shopify API wrapper with rate limiting and error handling
- `RateLimiter.gs` - API rate limiting and throttling logic
- `RequestBuilder.gs` - API request construction and validation

### /data/
- `DataManager.gs` - Data transformation and caching
- `HashCalculator.gs` - Row hash computation for change detection
- `DataTransformer.gs` - Data format conversion and normalization

### /validation/
- `ValidationEngine.gs` - Core validation framework
- `SchemaValidator.gs` - Schema-based validation rules
- `BusinessRules.gs` - Business logic validation

### /ui/
- `UIManager.gs` - Menu system and dialog management
- `DialogBuilder.gs` - Reusable dialog components
- `MenuBuilder.gs` - Custom menu creation

### /utils/
- `Logger.gs` - Audit trail and operation logging
- `ConfigManager.gs` - Configuration management
- `SecurityManager.gs` - Permissions and access control
- `ErrorHandler.gs` - Centralized error management

## Component Guidelines

1. **Single Responsibility** - Each component should have one clear purpose
2. **Dependency Injection** - Components should receive dependencies, not create them
3. **Interface-Based** - Components should implement clear interfaces
4. **Testable** - Components should be easily unit testable
5. **Documented** - Each component should have clear JSDoc documentation

## Usage Example

```javascript
// Initialize core components
const config = new ConfigManager();
const logger = new Logger(config);
const apiClient = new ApiClient(config, logger);
const dataManager = new DataManager(logger);

// Use components together
const products = await apiClient.getProducts();
const transformedData = dataManager.transformProducts(products);
logger.logOperation('import', 'products', products.length, 'success');
```
