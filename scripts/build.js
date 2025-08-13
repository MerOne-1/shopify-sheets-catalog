const fs = require('fs');
const path = require('path');

console.log('Building TypeScript to Google Apps Script...');

// Clean old .gs files
const oldFiles = ['Code.gs', 'ConfigManager.gs', 'UIManager.gs', 'ApiClient.gs'];
oldFiles.forEach(file => {
  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
    console.log(`Removed ${file}`);
  }
});

// Read TypeScript files and convert to .gs
const files = [
  { src: 'src/Code.ts', dest: 'Code.gs' },
  { src: 'src/core/ConfigManager.ts', dest: 'ConfigManager.gs' },
  { src: 'src/core/UIManager.ts', dest: 'UIManager.gs' },
  { src: 'src/core/ApiClient.ts', dest: 'ApiClient.gs' },
  // Milestone 1 - Import functionality
  { src: 'src/features/ImportOrchestrator.ts', dest: 'ImportOrchestrator.gs' }
];

files.forEach(({ src, dest }) => {
  if (fs.existsSync(src)) {
    let content = fs.readFileSync(src, 'utf8');
    
    // Remove TypeScript-specific syntax
    content = content.replace(/^import.*$/gm, '');
    content = content.replace(/^export\s+/gm, '');
    content = content.replace(/export\s+/g, '');
    content = content.replace(/: void/g, '');
    content = content.replace(/: string/g, '');
    content = content.replace(/: number/g, '');
    content = content.replace(/: boolean/g, '');
    content = content.replace(/: any/g, '');
    content = content.replace(/const /g, 'var ');
    content = content.replace(/let /g, 'var ');
    // Remove TypeScript type casting
    content = content.replace(/\(error as Error\)/g, 'error');
    content = content.replace(/\(uiError as Error\)/g, 'uiError');
    
    // Clean up empty lines
    content = content.replace(/^\s*\n/gm, '');
    
    // Add CONFIG for Code.gs
    if (dest === 'Code.gs') {
      const config = `
// Configuration constants
var CONFIG = {
  VERSION: '1.0.0',
  SHOPIFY_API_VERSION: '2023-04',
  SHOPIFY_DOMAIN: '1x0ah0-a8.myshopify.com',
  MAX_BATCH_SIZE: 250,
  IMPORT_CHUNK_SIZE: 50,
  RATE_LIMIT_DELAY: 500,
  MAX_RETRIES: 3
};

`;
      content = config + content;
    }
    
    fs.writeFileSync(dest, content);
    console.log(`Created ${dest}`);
  }
});

console.log('Build complete!');
