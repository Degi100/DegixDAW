#!/usr/bin/env node
// scripts/db/show-sql.js
// Zeigt SQL-Dateien an für manuelles Copy-Paste in Supabase

import { readFileSync } from 'fs';
import { resolve } from 'path';

const sqlFile = process.argv[2];

if (!sqlFile) {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║  📋 SQL Script Viewer                                      ║
╚════════════════════════════════════════════════════════════╝

Usage: node scripts/db/show-sql.js <sql-file>

Available SQL files:
  • scripts/sql/social_connections_setup.sql
  • scripts/sql/fix_profiles_rls.sql  
  • scripts/sql/sync_profiles_auth_users.sql
  • scripts/sql/debug_profile_user_ids.sql

Example:
  node scripts/db/show-sql.js scripts/sql/sync_profiles_auth_users.sql
  `);
  process.exit(0);
}

try {
  const filePath = resolve(sqlFile);
  const sql = readFileSync(filePath, 'utf-8');
  const fileName = sqlFile.split(/[\\/]/).pop();

  console.log(`
╔════════════════════════════════════════════════════════════╗
║  📄 ${fileName.padEnd(56)} ║
╚════════════════════════════════════════════════════════════╝
  `);

  console.log('🔗 Open Supabase SQL Editor:');
  console.log('   https://supabase.com/dashboard/project/_/sql');
  console.log('');
  console.log('📋 Copy the SQL below and paste it into the editor:');
  console.log('');
  console.log('═'.repeat(60));
  console.log(sql);
  console.log('═'.repeat(60));
  console.log('');
  console.log('✨ Then click "Run" in Supabase SQL Editor');
  console.log('');

} catch (error) {
  console.error('❌ Error reading file:', error.message);
  process.exit(1);
}
