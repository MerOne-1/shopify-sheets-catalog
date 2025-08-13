# Shopify Sheets Catalog Management System

A comprehensive Google Sheets workbook that controls the entire lifecycle of a Shopify catalog with Google Apps Script automation.

## Product Goal
Complete Shopify catalog management through Google Sheets:
- Products & Variants (create, edit, archive)
- Metafields (product & variant) in bulk
- Images (product & variant): add, order, alt text, targeted deletion
- Inventory by location
- Bulk Import (fast read, ≥10k variants)
- Dry-run (diff + validations) before export
- Differential Export (send only changes)
- Security & Traceability: permissions, logs, automatic backups, 1-click restore

## Success Indicators
- Initial import of 10k variants in < 10 minutes
- Reliable dry-run (0 diff after "clean" import)
- Idempotent diff export with resume-on-failure
- Operational restore in < 2 minutes

## Project Structure
```
/src/
  /core/             # Core system components
    /api/            # API client and rate limiting
    /data/           # Data management and transformation
    /validation/     # Validation engine and rules
    /ui/             # UI components and dialogs
    /utils/          # Utility components (Logger, Config, Security)
  /features/         # Feature-specific components
    /import/         # Import functionality
    /export/         # Export functionality
    /backup/         # Backup and restore
    /inventory/      # Inventory management
    /metafields/     # Metafield operations
    /images/         # Image management
  /sheets/           # Sheet management components
    /schemas/        # Schema definitions
    /formatters/     # Sheet formatting
    /validators/     # Sheet-specific validation
/docs/               # Documentation
/tests/              # Test cases and sample data
/config/             # Configuration templates
MILESTONES.md        # Detailed development milestones
```

## Development Phases
1. **Foundations** - Workbook structure, Config, basic menus
2. **Import-only** - Read + hash computation
3. **Dry-run & validations** - Blocking errors + warnings
4. **Minimal diff export** - Price & stock + queue + resume
5. **Metafields** - Full CRUD operations
6. **Images** - Simple → advanced management
7. **Backups/Restore & security** - Complete data protection
8. **QA at scale & docs** - Performance testing and documentation

## Getting Started
1. Set up Google Apps Script project
2. Configure Shopify API credentials
3. Create Google Sheets workbook with required tabs
4. Deploy and test with sandbox store

## Key Features
- **Bulk Operations**: Handle 10k+ variants efficiently
- **Differential Sync**: Only sync changes to minimize API calls
- **Data Validation**: Comprehensive validation before export
- **Backup System**: Automatic backups with 1-click restore
- **Audit Trail**: Complete operation logging
- **Security**: Admin-only exports with read-only mode
