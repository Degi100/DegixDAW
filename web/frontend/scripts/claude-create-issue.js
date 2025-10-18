#!/usr/bin/env node
/**
 * Claude Single Issue Creator - CLI Version
 *
 * Usage:
 *   node scripts/claude-create-issue.js "Title" "Description" [category] [priority] [labels] [status]
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const [title, description, category = 'feature', priority = 'medium', labelsStr = '', status = 'open'] = process.argv.slice(2);

if (!title || !description) {
  console.error('❌ Usage: node scripts/claude-create-issue.js "Title" "Description" [category] [priority] [labels] [status]\n');
  process.exit(1);
}

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const { data: userId } = await supabase.rpc('get_user_id_by_email', { user_email: process.env.VITE_SUPER_ADMIN_EMAIL });

if (!userId) {
  console.error('❌ User not found');
  process.exit(1);
}

const labels = labelsStr ? labelsStr.split(',').map(l => l.trim()) : [];
const issue = { title, description, category, priority, labels, status, created_by: userId };

const { error } = await supabase.from('issues').insert(issue);
console.log(error ? `❌ ${error.message}` : `✅ ${title}\n🌐 http://localhost:5173/admin/issues`);
