#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const USER_ID = 'd2d084ff-ff67-4842-922a-408c21191c36';

const issues = [
  { title: '🔧 FileBrowser.tsx (688→150 LOC)', description: '688 Zeilen, 11x useState\nExtract: Components + Hooks + Utils', category: 'refactoring', priority: 'high', labels: ['refactoring'], status: 'in_progress', created_by: USER_ID },
  { title: '🔧 CodeGrowthChart.tsx (641 LOC)', description: 'Config-basiert, Extract ChartTooltip', category: 'refactoring', priority: 'medium', labels: ['refactoring'], status: 'open', created_by: USER_ID },
  { title: '🔧 useConversations.ts (604 LOC)', description: 'Split: List + Actions + Realtime', category: 'refactoring', priority: 'high', labels: ['refactoring'], status: 'open', created_by: USER_ID },
  { title: '🔧 useMessages.ts (603 LOC)', description: 'Split: List + Actions + Realtime', category: 'refactoring', priority: 'high', labels: ['refactoring'], status: 'open', created_by: USER_ID },
  { title: '🔧 SendFileModal.tsx (446 LOC)', description: 'Extract: Upload + Select + Preview', category: 'refactoring', priority: 'medium', labels: ['refactoring'], status: 'open', created_by: USER_ID }
];

for (const issue of issues) {
  const { error } = await supabase.from('issues').insert(issue);
  console.log(error ? `❌ ${issue.title}` : `✅ ${issue.title}`);
}
console.log('\n✅ View: http://localhost:5173/admin/issues\n');
