/**
 * ApiClient Component
 * Handles all Shopify API communication with rate limiting and error handling
 */

class ApiClient {
  constructor() {
    this.configManager = new ConfigManager();
    this.credentials = null;
    this.lastRequestTime = 0;
  }

  /**
   * Get Shopify API credentials
   */
  getCredentials() {
    if (!this.credentials) {
      this.credentials = this.configManager.getShopifyCredentials();
    }
    return this.credentials;
  }

  /**
   * Make authenticated request to Shopify API with rate limiting
   */
  makeRequest(endpoint, method = 'GET', payload = null, retryCount = 0) {
    const credentials = this.getCredentials();
    const url = `https://${credentials.shopDomain}/admin/api/${credentials.apiVersion}/${endpoint}`;
    
    // Rate limiting - ensure minimum delay between requests
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const rateLimit = parseInt(this.configManager.getConfigValue('rate_limit_delay')) || CONFIG.RATE_LIMIT_DELAY;
    
    if (timeSinceLastRequest < rateLimit) {
      Utilities.sleep(rateLimit - timeSinceLastRequest);
    }
    
    const options = {
      method: method,
      headers: {
        'X-Shopify-Access-Token': credentials.accessToken,
        'Content-Type': 'application/json'
      }
    };
    
    if (payload && (method === 'POST' || method === 'PUT')) {
      options.payload = JSON.stringify(payload);
    }
    
    try {
      Logger.log(`Making ${method} request to: ${endpoint}`);
      this.lastRequestTime = Date.now();
      
      const response = UrlFetchApp.fetch(url, options);
      const responseCode = response.getResponseCode();
      const responseText = response.getContentText();
      
      // Handle rate limiting (429)
      if (responseCode === 429) {
        const retryAfter = parseInt(response.getHeaders()['Retry-After']) || 2;
        Logger.log(`Rate limited. Waiting ${retryAfter} seconds...`);
        Utilities.sleep(retryAfter * 1000);
        
        if (retryCount < CONFIG.MAX_RETRIES) {
          return this.makeRequest(endpoint, method, payload, retryCount + 1);
        } else {
          throw new Error('Max retries exceeded for rate limiting');
        }
      }
      
      // Handle other HTTP errors
      if (responseCode >= 400) {
        Logger.log(`API Error ${responseCode}: ${responseText}`);
        throw new Error(`Shopify API Error ${responseCode}: ${responseText}`);
      }
      
      return JSON.parse(responseText);
      
    } catch (error) {
      Logger.log(`Request failed: ${error.message}`);
      
      // Retry on network errors
      if (retryCount < CONFIG.MAX_RETRIES && error.message.includes('network')) {
        Logger.log(`Retrying... (${retryCount + 1}/${CONFIG.MAX_RETRIES})`);
        Utilities.sleep(1000 * (retryCount + 1)); // Exponential backoff
        return this.makeRequest(endpoint, method, payload, retryCount + 1);
      }
      
      throw error;
    }
  }

  /**
   * Test API connection
   */
  testConnection() {
    try {
      const response = this.makeRequest('shop.json');
      Logger.log('Shopify connection successful!');
      Logger.log(`Connected to: ${response.shop.name} (${response.shop.domain})`);
      
      return {
        success: true,
        shop: response.shop
      };
    } catch (error) {
      Logger.log(`Shopify connection failed: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get all products with pagination
   */
  getAllProducts(fields = null, limit = 250) {
    let allProducts = [];
    let pageInfo = null;
    let hasNextPage = true;
    
    while (hasNextPage) {
      let endpoint = `products.json?limit=${limit}`;
      
      if (fields) {
        endpoint += `&fields=${fields}`;
      }
      
      if (pageInfo) {
        endpoint += `&page_info=${pageInfo}`;
      }
      
      const response = this.makeRequest(endpoint);
      const products = response.products || [];
      
      allProducts = allProducts.concat(products);
      
      // Check for next page using Link header
      const linkHeader = response.headers && response.headers.Link;
      if (linkHeader && linkHeader.includes('rel="next"')) {
        const nextMatch = linkHeader.match(/page_info=([^&>]+).*rel="next"/);
        pageInfo = nextMatch ? nextMatch[1] : null;
        hasNextPage = !!pageInfo;
      } else {
        hasNextPage = false;
      }
      
      Logger.log(`Fetched ${products.length} products. Total: ${allProducts.length}`);
      
      // Show progress to user
      SpreadsheetApp.getActiveSpreadsheet().toast(
        `Imported ${allProducts.length} products...`, 
        'Import Progress', 
        2
      );
    }
    
    return allProducts;
  }

  /**
   * Get all variants across all products
   */
  getAllVariants(fields = null) {
    const products = this.getAllProducts('id,variants', 250);
    let allVariants = [];
    
    products.forEach(product => {
      if (product.variants && product.variants.length > 0) {
        product.variants.forEach(variant => {
          variant.product_id = product.id; // Add product reference
          allVariants.push(variant);
        });
      }
    });
    
    Logger.log(`Total variants found: ${allVariants.length}`);
    return allVariants;
  }

  /**
   * Get metafields for a resource
   */
  getMetafields(resourceType, resourceId) {
    const endpoint = `${resourceType}/${resourceId}/metafields.json`;
    const response = this.makeRequest(endpoint);
    return response.metafields || [];
  }

  /**
   * Get all locations
   */
  getAllLocations() {
    const response = this.makeRequest('locations.json');
    return response.locations || [];
  }

  /**
   * Get inventory levels for all locations
   */
  getAllInventoryLevels() {
    // First get all locations
    const locations = this.getAllLocations();
    
    // Then get all variants with inventory_item_id
    const variants = this.getAllVariants('id,inventory_item_id');
    let allInventoryLevels = [];
    
    variants.forEach(variant => {
      if (variant.inventory_item_id) {
        locations.forEach(location => {
          try {
            const endpoint = `inventory_levels.json?inventory_item_ids=${variant.inventory_item_id}&location_ids=${location.id}`;
            const response = this.makeRequest(endpoint);
            
            if (response.inventory_levels && response.inventory_levels.length > 0) {
              response.inventory_levels.forEach(level => {
                level.variant_id = variant.id;
                level.location_name = location.name;
                allInventoryLevels.push(level);
              });
            }
          } catch (error) {
            Logger.log(`Error fetching inventory for variant ${variant.id} at location ${location.id}: ${error.message}`);
          }
        });
      }
    });
    
    return allInventoryLevels;
  }

  /**
   * Create or update a product
   */
  createOrUpdateProduct(productData, isUpdate = false) {
    const endpoint = isUpdate ? `products/${productData.id}.json` : 'products.json';
    const method = isUpdate ? 'PUT' : 'POST';
    const payload = { product: productData };
    
    const response = this.makeRequest(endpoint, method, payload);
    return response.product;
  }

  /**
   * Create or update a variant
   */
  createOrUpdateVariant(variantData, productId, isUpdate = false) {
    const endpoint = isUpdate ? 
      `variants/${variantData.id}.json` : 
      `products/${productId}/variants.json`;
    const method = isUpdate ? 'PUT' : 'POST';
    const payload = { variant: variantData };
    
    const response = this.makeRequest(endpoint, method, payload);
    return response.variant;
  }

  /**
   * Create or update a metafield
   */
  createOrUpdateMetafield(resourceType, resourceId, metafieldData, isUpdate = false) {
    const endpoint = isUpdate ?
      `metafields/${metafieldData.id}.json` :
      `${resourceType}/${resourceId}/metafields.json`;
    const method = isUpdate ? 'PUT' : 'POST';
    const payload = { metafield: metafieldData };
    
    const response = this.makeRequest(endpoint, method, payload);
    return response.metafield;
  }

  /**
   * Update inventory level
   */
  updateInventoryLevel(inventoryItemId, locationId, quantity) {
    const endpoint = 'inventory_levels/set.json';
    const payload = {
      location_id: locationId,
      inventory_item_id: inventoryItemId,
      available: quantity
    };
    
    const response = this.makeRequest(endpoint, 'POST', payload);
    return response.inventory_level;
  }

  /**
   * Delete a resource
   */
  deleteResource(resourceType, resourceId) {
    const endpoint = `${resourceType}/${resourceId}.json`;
    return this.makeRequest(endpoint, 'DELETE');
  }

  /**
   * Batch operations helper
   */
  processBatch(operations, batchSize = null) {
    const maxBatchSize = batchSize || parseInt(this.configManager.getConfigValue('max_batch_size')) || CONFIG.MAX_BATCH_SIZE;
    const results = [];
    
    for (let i = 0; i < operations.length; i += maxBatchSize) {
      const batch = operations.slice(i, i + maxBatchSize);
      
      batch.forEach(operation => {
        try {
          const result = this.makeRequest(operation.endpoint, operation.method, operation.payload);
          results.push({
            success: true,
            operation: operation,
            result: result
          });
        } catch (error) {
          results.push({
            success: false,
            operation: operation,
            error: error.message
          });
        }
      });
      
      // Progress update
      SpreadsheetApp.getActiveSpreadsheet().toast(
        `Processed ${Math.min(i + maxBatchSize, operations.length)} of ${operations.length} operations...`,
        'Batch Progress',
        2
      );
    }
    
    return results;
  }
}
