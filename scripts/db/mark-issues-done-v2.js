#!/usr/bin/env node
// scripts/db/mark-issues-done-v2.js
// Mark issues as DONE using Supabase Client API (works!)

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing credentials in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Issues completed in v0.1.1 & v0.2.0 & v0.3.0
const COMPLETED_ISSUES = [
  '404 bei "Zurück zur Anmeldung"',
  'Add User schlägt fehl',
  'Doppelter Toast bei Login',
  'Datenbank scripte automatisch',  // v0.2.0 - DB Automation
  'Toast-Sprache einheitlich',  // v0.2.0 - Quick Win 1
  'Toast Text anpassen',  // v0.2.0 - Quick Win 2
  'Begrüßung Format ändern',  // v0.2.0 - Quick Win 3
  'abgeschossene issues done',  // v0.3.0 - DONE Issues sortieren
  'Kategorie hinzufuegen'  // v0.3.0 - Kategorie-Management
];

async function markIssuesAsDone() {
  console.log('🔄 Marking issues as DONE...\n');

  try {
    // 1. Preview: Show issues before update
    console.log('📋 Issues to mark as DONE:');
    const { data: previewIssues, error: previewError } = await supabase
      .from('issues')
      .select('id, title, status, priority')
      .in('title', COMPLETED_ISSUES);

    if (previewError) throw previewError;

    if (!previewIssues || previewIssues.length === 0) {
      console.log('⚠️  No matching issues found!');
      return;
    }

    previewIssues.forEach((issue, idx) => {
      console.log(`  ${idx + 1}. [${issue.status.toUpperCase()}] ${issue.title}`);
    });

    console.log(`\n✨ Found ${previewIssues.length} issue(s)\n`);

    // 2. Update to DONE
    console.log('🔄 Updating status to DONE...');
    const { data: updatedIssues, error: updateError } = await supabase
      .from('issues')
      .update({ 
        status: 'done',
        updated_at: new Date().toISOString()
      })
      .in('title', COMPLETED_ISSUES)
      .select('id, title, status, priority, updated_at');

    if (updateError) throw updateError;

    // 3. Show results
    console.log('\n✅ Successfully updated!\n');
    updatedIssues.forEach((issue, idx) => {
      console.log(`  ${idx + 1}. [${issue.status.toUpperCase()}] ${issue.title}`);
      console.log(`     Priority: ${issue.priority} | Updated: ${new Date(issue.updated_at).toLocaleString('de-DE')}`);
    });

    // 4. Show statistics
    const { data: stats, error: statsError } = await supabase
      .from('issues')
      .select('status');

    if (!statsError && stats) {
      const statusCounts = stats.reduce((acc, issue) => {
        acc[issue.status] = (acc[issue.status] || 0) + 1;
        return acc;
      }, {});

      console.log('\n📊 Issue Statistics:');
      Object.entries(statusCounts).forEach(([status, count]) => {
        const emoji = {
          'open': '🔵',
          'in-progress': '🟡',
          'done': '✅',
          'closed': '⚪'
        }[status] || '⚫';
        console.log(`  ${emoji} ${status}: ${count}`);
      });
    }

    console.log('\n🎉 Done! Issues marked as completed.\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

markIssuesAsDone();
