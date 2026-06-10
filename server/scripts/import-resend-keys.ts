import { Resend } from 'resend';
import { ENV } from '../_core/env';
import { readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

interface ResendKey {
  id: string;
  created_at: string;
  name: string;
  token: string;
  permission: string;
  domain: string;
  creator: string;
}

function parseCSV(csvContent: string): ResendKey[] {
  const lines = csvContent.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(h => h.trim());
  const keys: ResendKey[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const keyObj: Partial<ResendKey> = {};
    
    headers.forEach((header, index) => {
      const key = header as keyof ResendKey;
      keyObj[key] = values[index] || '';
    });
    
    if (keyObj.token && keyObj.token.length > 10) {
      keys.push(keyObj as ResendKey);
    }
  }
  
  return keys;
}

function readCSVFromDownloads(filename: string): ResendKey[] {
  const downloadsPath = join(homedir(), 'Downloads', filename);
  const csvContent = readFileSync(downloadsPath, 'utf-8');
  return parseCSV(csvContent);
}

async function validateKey(token: string): Promise<boolean> {
  try {
    const resend = new Resend(token);
    await resend.apiKeys.list();
    return true;
  } catch (error) {
    console.log(`❌ Key ${token.substring(0, 10)}... is invalid`);
    return false;
  }
}

async function validateAllKeys(keys: ResendKey[]): Promise<void> {
  console.log('=== Validating API Keys ===\n');
  
  for (const key of keys) {
    const isValid = await validateKey(key.token);
    console.log(`Key: ${key.name}`);
    console.log(`Status: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
    console.log(`Domain: ${key.domain}`);
    console.log(`Permissions: ${key.permission}`);
    console.log(`Created: ${key.created_at}`);
    console.log(`Creator: ${key.creator}\n`);
  }
}

function displayKeys(keys: ResendKey[]): void {
  console.log('=== Resend API Keys from CSV ===\n');
  console.log(`Total keys: ${keys.length}\n`);
  
  keys.forEach((key, index) => {
    console.log(`${index + 1}. ${key.name}`);
    console.log(`   ID: ${key.id}`);
    console.log(`   Token: ${key.token.substring(0, 20)}...`);
    console.log(`   Domain: ${key.domain}`);
    console.log(`   Permissions: ${key.permission}`);
    console.log(`   Created: ${key.created_at}`);
    console.log(`   Creator: ${key.creator}\n`);
  });
}

function suggestEnvironmentUpdate(keys: ResendKey[]): void {
  console.log('=== Suggested Environment Variable Updates ===\n');
  
  const prodKey = keys.find(k => 
    k.name.toLowerCase().includes('prod') || 
    k.name.toLowerCase().includes('production')
  );
  
  const devKey = keys.find(k => 
    k.name.toLowerCase().includes('dev') || 
    k.name.toLowerCase().includes('development')
  );
  
  const stagingKey = keys.find(k => 
    k.name.toLowerCase().includes('staging')
  );
  
  if (prodKey) {
    console.log('Production key found:');
    console.log(`RESEND_API_KEY=${prodKey.token}`);
    console.log(`RESEND_MASTER_API_KEY=${prodKey.token}\n`);
  }
  
  if (devKey) {
    console.log('Development key found:');
    console.log(`RESEND_DEV_API_KEY=${devKey.token}\n`);
  }
  
  if (stagingKey) {
    console.log('Staging key found:');
    console.log(`RESEND_STAGING_API_KEY=${stagingKey.token}\n`);
  }
  
  if (!prodKey && !devKey && !stagingKey) {
    console.log('No environment-specific keys found. Available keys:');
    keys.forEach(key => {
      console.log(`- ${key.name}: ${key.token.substring(0, 20)}...`);
    });
  }
}

async function importToDatabase(keys: ResendKey[]): Promise<void> {
  console.log('=== Import Keys to Database ===');
  console.log('⚠️ Database import would require schema changes');
  console.log('Consider creating a resend_keys table with these columns:');
  console.log('- id (primary key)');
  console.log('- created_at (timestamp)');
  console.log('- name (string)');
  console.log('- token (encrypted)');
  console.log('- domain (string)');
  console.log('- permission (string)');
  console.log('- creator (string)');
  console.log('- is_active (boolean)');
  console.log('- environment (enum: dev, staging, prod)');
}

async function main() {
  const filename = process.argv[2];
  const action = process.argv[3];

  if (!filename) {
    console.log('Usage: pnpm tsx server/scripts/import-resend-keys.ts <csv-filename> [action]');
    console.log('Actions:');
    console.log('  list      - Display all keys');
    console.log('  validate  - Validate all keys');
    console.log('  env       - Suggest environment variable updates');
    console.log('  import    - Show database import schema');
    console.log('  all       - Run all operations');
    process.exit(1);
  }

  try {
    console.log(`Reading CSV from Downloads/${filename}...\n`);
    const keys = readCSVFromDownloads(filename);
    
    if (keys.length === 0) {
      console.log('No keys found in CSV file');
      process.exit(1);
    }

    switch (action) {
      case 'list':
        displayKeys(keys);
        break;
      case 'validate':
        await validateAllKeys(keys);
        break;
      case 'env':
        suggestEnvironmentUpdate(keys);
        break;
      case 'import':
        await importToDatabase(keys);
        break;
      case 'all':
        displayKeys(keys);
        console.log('\n');
        await validateAllKeys(keys);
        console.log('\n');
        suggestEnvironmentUpdate(keys);
        console.log('\n');
        await importToDatabase(keys);
        break;
      default:
        displayKeys(keys);
        console.log('\n');
        await validateAllKeys(keys);
        console.log('\n');
        suggestEnvironmentUpdate(keys);
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { parseCSV, readCSVFromDownloads, validateKey, displayKeys, suggestEnvironmentUpdate };