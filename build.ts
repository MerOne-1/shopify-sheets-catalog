#!/usr/bin/env node

/**
 * Build script to compile TypeScript to Google Apps Script compatible JavaScript
 * Removes imports/exports and creates .gs files
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const srcDir = './src';
const outputDir = './';

// Clean up old .gs files
const oldFiles = ['Code.gs', 'ConfigManager.gs', 'UIManager.gs', 'ApiClient.gs'];
oldFiles.forEach(file => {
  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
    console.log(`Removed old ${file}`);
  }
});

// Compile TypeScript
console.log('Compiling TypeScript...');
try {
  execSync('npx tsc --noEmit false --outDir ./temp', { stdio: 'inherit' });
} catch (error) {
  console.error('TypeScript compilation failed');
  process.exit(1);
}

// Process compiled files
const filesToProcess = [
  { src: 'temp/Code.js', dest: 'Code.gs' },
  { src: 'temp/core/ConfigManager.js', dest: 'ConfigManager.gs' },
  { src: 'temp/core/UIManager.js', dest: 'UIManager.gs' },
  { src: 'temp/core/ApiClient.js', dest: 'ApiClient.gs' }
];

filesToProcess.forEach(({ src, dest }) => {
  if (fs.existsSync(src)) {
    let content = fs.readFileSync(src, 'utf8');
    
    // Remove import/export statements
    content = content.replace(/^import.*$/gm, '');
    content = content.replace(/^export.*$/gm, '');
    content = content.replace(/export\s+/g, '');
    
    // Remove empty lines
    content = content.replace(/^\s*\n/gm, '');
    
    // Add CONFIG constant to Code.gs
    if (dest === 'Code.gs') {
      const configConstant = `
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
      content = configConstant + content;
    }
    
    fs.writeFileSync(dest, content);
    console.log(`Created ${dest}`);
  } else {
    console.warn(`Source file ${src} not found`);
  }
});

// Clean up temp directory
if (fs.existsSync('temp')) {
  fs.rmSync('temp', { recursive: true });
}

console.log('Build complete!');
