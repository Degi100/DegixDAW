#!/usr/bin/env node
// scripts/db/mark-done.js
// Mark completed issues as DONE

import { executeSQLFile } from './sql-executor.js';
import { resolve } from 'path';

const filePath = resolve(import.meta.dirname, '../sql/mark_issues_done.sql');

console.log('✅ Marking completed issues as DONE...\n');

executeSQLFile(filePath)
  .then(() => {
    console.log('\n🎉 Issues marked as done!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Failed:', err);
    process.exit(1);
  });
