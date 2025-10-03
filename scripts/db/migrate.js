#!/usr/bin/env node
// scripts/db/migrate.js
// Database Migration Runner

import { executeSQLFile } from './sql-executor.js';
import { resolve } from 'path';

const MIGRATIONS = [
  '../sql/supabase_setup.sql',
  '../sql/issues_table_setup.sql',
  '../sql/set_admin_flag.sql'
];

console.log('🔄 Running database migrations...\n');

async function migrate() {
  for (const migration of MIGRATIONS) {
    const filePath = resolve(import.meta.dirname, migration);
    await executeSQLFile(filePath);
  }
  
  console.log('\n✅ All migrations completed!');
}

migrate().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
