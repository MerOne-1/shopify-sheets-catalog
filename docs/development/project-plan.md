# Shopify Sheets Catalog - Project Plan Overview

> **Note**: Detailed milestones and component architecture are now documented in `MILESTONES.md`

## Component-Based Architecture

This project follows a modular, component-based architecture for better maintainability and testing:

### Core Components
- **ConfigManager** - Configuration and settings management
- **ApiClient** - Shopify API wrapper with rate limiting
- **DataManager** - Data transformation and caching
- **ValidationEngine** - Comprehensive validation framework
- **SecurityManager** - Permissions and access control
- **Logger** - Audit trail and operation logging

### Feature Components
- **ProductImporter/VariantImporter** - Data import functionality
- **DiffCalculator** - Change detection and comparison
- **ExportQueue** - Batch processing and export management
- **MetafieldManager** - Metafield CRUD operations
- **ImageManager** - Image upload and management
- **BackupManager/RestoreManager** - Data backup and recovery

### Sheet Components
- **SheetManager** - Sheet creation and formatting
- **SchemaValidator** - Schema enforcement and validation
- **UIManager** - Menu system and user interface

## Development Approach

1. **Component-First Development** - Build and test components in isolation
2. **Progressive Integration** - Combine components incrementally
3. **Continuous Testing** - Unit and integration tests throughout
4. **Performance Focus** - Optimize for large datasets from the start

## Quick Reference

- **Detailed Milestones**: See `MILESTONES.md`
- **Component Architecture**: See `/src/` directory structure
- **Setup Instructions**: See `SETUP.md`
- **API Documentation**: See `/docs/` directory

## Key Decisions to Lock
1. **Column Lists**: Final names and order for each tab
2. **Metafield Strategy**: Auto-update vs error on existing keys
3. **Image Sources**: Shopify Files vs URLs vs Google Drive
4. **Volume Thresholds**: Alert levels for bulk operations
5. **Admin Roles**: Email list and permission levels
6. **Environments**: Sandbox and production setup

## Risk Mitigation
- **API Limits**: Batching, backoff, persistent queue
- **Schema Changes**: Frozen and protected schemas
- **Accidental Deletions**: Lock mechanisms and confirmations
- **Multi-user Conflicts**: Sync timestamps and workflow guidance
- **Mass Re-uploads**: De-duplication and no-op detection
