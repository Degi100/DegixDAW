#!/usr/bin/env node
// scripts/db/cleanup.js
// Database Cleanup Runner

import { executeSQLFile } from './sql-executor.js';
import { resolve } from 'path';

const CLEANUP_SCRIPTS = [
  '../sql/cleanup_issues.sql'
];

console.log('🧹 Running database cleanup...\n');
console.log('⚠️  WARNING: This will delete duplicate data!\n');

async function cleanup() {
  // Prompt for confirmation
  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const answer = await new Promise(resolve => {
    rl.question('Continue? (yes/no): ', resolve);
  });
  
  rl.close();

  if (answer.toLowerCase() !== 'yes') {
    console.log('❌ Cleanup cancelled');
    process.exit(0);
  }

  for (const script of CLEANUP_SCRIPTS) {
    const filePath = resolve(import.meta.dirname, script);
    await executeSQLFile(filePath);
  }
  
  console.log('\n✅ Cleanup completed!');
}

cleanup().catch(err => {
  console.error('❌ Cleanup failed:', err);
  process.exit(1);
});
