#!/usr/bin/env node
// scripts/db/seed.js
// Database Seeder - Insert test data

import { executeSQLFile } from './sql-executor.js';
import { resolve } from 'path';

const SEED_FILES = [
  '../sql/seed_issues.sql'
];

console.log('🌱 Seeding database with test data...\n');

async function seed() {
  for (const seedFile of SEED_FILES) {
    const filePath = resolve(import.meta.dirname, seedFile);
    await executeSQLFile(filePath);
  }
  
  console.log('\n✅ Database seeded successfully!');
}

seed().catch(err => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
