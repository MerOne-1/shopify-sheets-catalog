/**
 * TypeScript interfaces and type definitions for Shopify Sheets Catalog Management System
 * Provides type safety for all components and data structures
 */

// Configuration constants
export const CONFIG = {
  VERSION: '1.0.0',
  SHOPIFY_API_VERSION: '2023-04',
  SHOPIFY_DOMAIN: '1x0ah0-a8.myshopify.com',
  MAX_BATCH_SIZE: 250,
  IMPORT_CHUNK_SIZE: 50,
  RATE_LIMIT_DELAY: 500,
  MAX_RETRIES: 3
} as const;

// Configuration interfaces
export interface ShopifyCredentials {
  shopDomain: string;
  accessToken: string;
  apiVersion: string;
}

export interface ConfigValidation {
  isValid: boolean;
  errors: string[];
}

export interface SystemConfig {
  shop_domain: string;
  api_version: string;
  admin_emails: string;
  read_only_mode: string;
  volume_alert_threshold: string;
  auto_backup_enabled: string;
  max_batch_size: string;
  rate_limit_delay: string;
  last_import_timestamp: string;
  last_export_timestamp: string;
  system_version: string;
  setup_completed: string;
}

// API Response interfaces
export interface ShopifyShop {
  id: number;
  name: string;
  domain: string;
  email: string;
  created_at: string;
  updated_at: string;
}

// Shopify Resource interfaces
export interface ShopifyResource {
  id: number;
  created_at?: string;
  updated_at?: string;
}

export interface ShopifyProduct extends ShopifyResource {
  title: string;
  handle: string;
  body_html?: string;
  vendor?: string;
  product_type?: string;
  tags?: string;
  status: 'active' | 'archived' | 'draft';
  published_scope?: string;
  published_at?: string;
  template_suffix?: string;
  seo_title?: string;
  seo_description?: string;
  variants?: ShopifyVariant[];
}

export interface ShopifyVariant extends ShopifyResource {
  product_id: number;
  title: string;
  option1?: string;
  option2?: string;
  option3?: string;
  sku?: string;
  barcode?: string;
  price: string;
  compare_at_price?: string;
  cost?: string;
  weight?: number;
  weight_unit?: string;
  inventory_item_id?: number;
  inventory_policy?: 'deny' | 'continue';
  inventory_management?: string;
  fulfillment_service?: string;
  requires_shipping?: boolean;
  taxable?: boolean;
  tax_code?: string;
}

export interface ShopifyInventoryLevel {
  inventory_item_id: number;
  location_id: number;
  available: number;
  updated_at?: string;
  variant_id?: number;
  sku?: string;
}

export interface ShopifyLocation {
  id: number;
  name: string;
  address1?: string;
  city?: string;
  country?: string;
  active: boolean;
}

export interface ShopifyMetafield extends ShopifyResource {
  namespace: string;
  key: string;
  value: string;
  type: string;
  description?: string;
  owner_id: number;
  owner_resource: 'product' | 'variant' | 'customer' | 'order';
  product_id?: number; // For variant metafields
}

// Import/Export interfaces
export interface ImportOptions {
  sinceId?: number;
  updatedAtMin?: string;
  productIds?: number[];
  variantIds?: number[];
  inventoryItemIds?: number[];
  locationIds?: number[];
  productsOnly?: boolean;
  variantsOnly?: boolean;
}

export interface ImportResult {
  success: boolean;
  recordsProcessed: number;
  duration: number;
  errors: string[];
}

export interface BulkImportResult {
  success: boolean;
  totalDuration: number;
  results: {
    products: ImportResult;
    variants: ImportResult;
    inventory: ImportResult;
    metafields: ImportResult;
  };
  errors: string[];
}

// Additional utility interfaces
export interface DialogResult {
  buttonPressed: string;
  inputText?: string;
}

export interface ChoiceDialogResult {
  choice: string;
  cancelled: boolean;
}

export interface OperationResults {
  success: boolean;
  message: string;
  data?: any;
}

export interface ErrorRange {
  sheet: string;
  row: number;
  column: string;
  message: string;
}

export interface BatchResult {
  processed: number;
  errors: ErrorRange[];
  warnings: string[];
}

export interface ConnectionTestResult {
  success: boolean;
  shopName?: string;
  error?: string;
}
  updated_at: string;
}

interface ShopifyProduct {
  id: number;
  title: string;
  body_html?: string;
  vendor?: string;
  product_type?: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
  template_suffix?: string;
  status: 'active' | 'archived' | 'draft';
  published_scope?: string;
  tags?: string;
  handle: string;
  variants?: ShopifyVariant[];
  options?: ShopifyProductOption[];
  images?: ShopifyImage[];
  image?: ShopifyImage;
}

interface ShopifyVariant {
  id: number;
  product_id: number;
  title: string;
  price: string;
  sku?: string;
  position: number;
  inventory_policy: 'deny' | 'continue';
  compare_at_price?: string;
  fulfillment_service: string;
  inventory_management?: string;
  option1?: string;
  option2?: string;
  option3?: string;
  created_at: string;
  updated_at: string;
  taxable: boolean;
  barcode?: string;
  grams: number;
  image_id?: number;
  weight: number;
  weight_unit: 'g' | 'kg' | 'oz' | 'lb';
  inventory_item_id: number;
  inventory_quantity: number;
  old_inventory_quantity: number;
  requires_shipping: boolean;
  admin_graphql_api_id: string;
}

interface ShopifyProductOption {
  id: number;
  product_id: number;
  name: string;
  position: number;
  values: string[];
}

interface ShopifyImage {
  id: number;
  product_id: number;
  position: number;
  created_at: string;
  updated_at: string;
  alt?: string;
  width: number;
  height: number;
  src: string;
  variant_ids: number[];
}

interface ShopifyMetafield {
  id: number;
  namespace: string;
  key: string;
  value: string;
  value_type: string;
  description?: string;
  owner_id: number;
  owner_resource: string;
  created_at: string;
  updated_at: string;
}

interface ShopifyLocation {
  id: number;
  name: string;
  address1?: string;
  address2?: string;
  city?: string;
  zip?: string;
  province?: string;
  country?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
  country_code?: string;
  country_name?: string;
  province_code?: string;
  legacy: boolean;
  active: boolean;
  admin_graphql_api_id: string;
}

interface ShopifyInventoryLevel {
  inventory_item_id: number;
  location_id: number;
  available: number;
  updated_at: string;
  admin_graphql_api_id: string;
  // Extended properties
  variant_id?: number;
  location_name?: string;
}

// UI interfaces
interface DialogResult<T = string> {
  success: boolean;
  value: T | null;
}

interface ChoiceDialogResult {
  success: boolean;
  choice: number;
  value: string | null;
}

interface OperationResults {
  summary?: string;
  success?: string[];
  errors?: string[];
  warnings?: string[];
}

interface ErrorRange {
  row: number;
  col: number;
  error?: string;
}

// API operation interfaces
interface ApiOperation {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  payload?: any;
}

interface BatchResult {
  success: boolean;
  operation: ApiOperation;
  result?: any;
  error?: string;
}

interface ConnectionTestResult {
  success: boolean;
  shop?: ShopifyShop;
  error?: string;
}

// Import/Export interfaces
interface ImportOptions {
  batchSize?: number;
  includeMetafields?: boolean;
  validateData?: boolean;
}

interface ImportResult {
  count: number;
  status: 'success' | 'error' | 'partial';
  errors?: string[];
  warnings?: string[];
}

// Export types for use in other files
type ShopifyResource = ShopifyProduct | ShopifyVariant | ShopifyMetafield | ShopifyImage;
