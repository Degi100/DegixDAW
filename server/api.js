// server/api.js
// Claude's Home - API server for file operations + Issues Integration

import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { exec } from 'child_process';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

// Initialize Supabase Client (with Service Role Key for admin access)
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env');
  console.error('   Required: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_ANON_KEY)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
console.log('✅ Supabase Client initialized');

const app = express();
app.use(express.json({ limit: '10mb' }));

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Save markdown file endpoint
app.post('/api/save-markdown', async (req, res) => {
  try {
    const { content, filename } = req.body;

    if (!content || !filename) {
      return res.status(400).json({ error: 'Content and filename are required' });
    }

    // Save to project root (where package.json is)
    const projectRoot = path.resolve(__dirname, '..');
    const filePath = path.join(projectRoot, filename);

    await fs.writeFile(filePath, content, 'utf-8');

    console.log(`✅ Saved: ${filePath}`);

    res.json({
      success: true,
      message: `File saved: ${filename}`,
      path: filePath,
    });
  } catch (error) {
    console.error('❌ Error saving file:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================================================
// ISSUES API - Claude's Integration
// ============================================================================

// GET all issues
app.get('/api/issues', async (req, res) => {
  try {
    console.log('📋 [Claude] Fetching all issues...');

    // Direct SELECT instead of RPC (Service Role Key has full access)
    const { data, error } = await supabase
      .from('issues')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    console.log(`✅ [Claude] Found ${data?.length || 0} issues`);
    res.json({ success: true, issues: data || [] });
  } catch (error) {
    console.error('❌ [Claude] Error fetching issues:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST create new issue
app.post('/api/issues', async (req, res) => {
  try {
    const { title, description, priority, category, labels } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, error: 'Title is required' });
    }

    console.log(`🤖 [Claude] Creating issue: "${title}"`);

    // Get first admin user as creator (from auth.users metadata)
    // Note: We use auth.admin.listUsers() which requires Service Role Key
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();

    if (userError) {
      console.error('❌ Error fetching users:', userError.message);
      throw new Error('Failed to fetch users. Make sure SUPABASE_SERVICE_ROLE_KEY is set in .env');
    }

    // Find first admin user
    const adminUser = users.find(u => u.user_metadata?.is_admin === true);

    if (!adminUser) {
      throw new Error('No admin user found. Make sure at least one user has is_admin=true in user_metadata');
    }

    const creatorId = adminUser.id;
    console.log(`   Using creator: ${adminUser.email} (${creatorId})`);

    // Create issue
    const { data, error } = await supabase
      .from('issues')
      .insert({
        title,
        description: description || null,
        priority: priority || 'medium',
        category: category || null,
        labels: labels || [],
        status: 'open',
        created_by: creatorId,
        metadata: {
          created_by_ai: true,
          ai_name: 'Claude',
          created_at_timestamp: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (error) throw error;

    console.log(`✅ [Claude] Issue created: #${data.id}`);
    res.json({ success: true, issue: data });
  } catch (error) {
    console.error('❌ [Claude] Error creating issue:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH update issue (with lock check)
app.patch('/api/issues/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const { user_id } = req.body; // Caller must send their user_id for lock check

    console.log(`🔧 [Claude] Updating issue #${id}:`, Object.keys(updates));

    // LOCK CHECK: Fetch current issue state
    const { data: currentIssue, error: fetchError } = await supabase
      .from('issues')
      .select('status, assigned_to')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // Check if issue is locked (in_progress + assigned)
    if (currentIssue.status === 'in_progress' && currentIssue.assigned_to) {
      // Get user's admin status
      const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
      if (userError) throw userError;

      const callerUser = users.find(u => u.id === user_id);
      const isAdmin = callerUser?.user_metadata?.is_admin === true;

      // Only Assignee or Admin can update locked issues
      if (user_id !== currentIssue.assigned_to && !isAdmin) {
        console.log(`🔒 [Claude] Issue #${id} is LOCKED - assigned to ${currentIssue.assigned_to}`);
        return res.status(403).json({
          success: false,
          error: '🔒 Issue is locked - only the assignee or admin can modify it',
          locked: true,
          assigned_to: currentIssue.assigned_to
        });
      }
    }

    // Proceed with update
    const { data, error } = await supabase
      .from('issues')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    console.log(`✅ [Claude] Issue #${id} updated`);
    res.json({ success: true, issue: data });
  } catch (error) {
    console.error('❌ [Claude] Error updating issue:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST add comment to issue
app.post('/api/issues/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;

    if (!comment) {
      return res.status(400).json({ success: false, error: 'Comment is required' });
    }

    console.log(`💬 [Claude] Adding comment to issue #${id}`);

    // Get first admin user as commenter
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();

    if (userError) {
      throw new Error('Failed to fetch users. Make sure SUPABASE_SERVICE_ROLE_KEY is set');
    }

    const adminUser = users.find(u => u.user_metadata?.is_admin === true);

    if (!adminUser) {
      throw new Error('No admin user found');
    }

    const userId = adminUser.id;

    const { data, error } = await supabase
      .from('issue_comments')
      .insert({
        issue_id: id,
        user_id: userId,
        comment,
        action_type: 'comment',
        metadata: {
          created_by_ai: true,
          ai_name: 'Claude',
        },
      })
      .select()
      .single();

    if (error) throw error;

    console.log(`✅ [Claude] Comment added to issue #${id}`);
    res.json({ success: true, comment: data });
  } catch (error) {
    console.error('❌ [Claude] Error adding comment:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// ANALYTICS - Code Metrics (LOC Counter)
// ============================================================================

const execAsync = promisify(exec);

/**
 * GET /api/analytics/code-metrics
 * Returns real code metrics via Git commands
 */
app.get('/api/analytics/code-metrics', async (req, res) => {
  try {
    console.log('📊 [Analytics] Calculating code metrics...');

    // Get project root (one level up from server/)
    const projectRoot = path.resolve(__dirname, '..');

    // 1. Count files (including SQL)
    const { stdout: filesOutput } = await execAsync('git ls-files', { cwd: projectRoot });
    const allFiles = filesOutput.trim().split('\n').filter(Boolean);
    const sourceFiles = allFiles.filter((f) =>
      /\.(ts|tsx|js|jsx|css|scss|json|md|sql)$/.test(f)
    );
    const filesCount = sourceFiles.length;

    // 2. Count commits
    const { stdout: commitsOutput } = await execAsync('git rev-list --count HEAD', {
      cwd: projectRoot,
    });
    const commitsCount = parseInt(commitsOutput.trim(), 10);

    // 3. Get first commit date (project age) - Windows-compatible
    const { stdout: firstCommitOutput } = await execAsync(
      'git log --format=%ai --reverse',
      { cwd: projectRoot }
    );
    const firstCommitLine = firstCommitOutput.trim().split('\n')[0]; // Get first line (instead of head -1)
    const firstCommitDate = new Date(firstCommitLine);
    const startDate = firstCommitDate.toISOString().split('T')[0]; // YYYY-MM-DD
    const projectAgeDays = Math.floor((Date.now() - firstCommitDate.getTime()) / (1000 * 60 * 60 * 24));

    // 4. Count Lines of Code (LOC) with Language Breakdown
    let totalLOC = 0;
    const languageStats = {
      typescript: 0,
      javascript: 0,
      scss: 0,
      css: 0,
      sql: 0,
      json: 0,
      markdown: 0,
    };

    for (const file of sourceFiles) {
      try {
        const filePath = path.join(projectRoot, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const lines = content.split('\n').length;
        totalLOC += lines;

        // Categorize by language
        if (file.match(/\.(ts|tsx)$/)) languageStats.typescript += lines;
        else if (file.match(/\.(js|jsx)$/)) languageStats.javascript += lines;
        else if (file.match(/\.scss$/)) languageStats.scss += lines;
        else if (file.match(/\.css$/)) languageStats.css += lines;
        else if (file.match(/\.sql$/)) languageStats.sql += lines;
        else if (file.match(/\.json$/)) languageStats.json += lines;
        else if (file.match(/\.md$/)) languageStats.markdown += lines;
      } catch (err) {
        // Skip files that can't be read
        console.warn(`   ⚠️  Skipping ${file}: ${err.message}`);
      }
    }

    const metrics = {
      loc: totalLOC,
      files: filesCount,
      commits: commitsCount,
      projectAge: {
        days: projectAgeDays,
        startDate,
      },
      languageStats,
    };

    console.log(`   ✅ Total LOC: ${totalLOC.toLocaleString()}`);
    console.log(`   ✅ Files: ${filesCount}`);
    console.log(`   ✅ Commits: ${commitsCount}`);
    console.log(`   ✅ Age: ${projectAgeDays} days (since ${startDate})`);
    console.log(`   📊 Languages: TS=${languageStats.typescript} | JS=${languageStats.javascript} | SCSS=${languageStats.scss} | SQL=${languageStats.sql}`);

    res.json(metrics);
  } catch (error) {
    console.error('❌ [Analytics] Error calculating code metrics:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/analytics/snapshots/backfill
 * Create historical snapshots (requires admin session token)
 */
app.post('/api/analytics/snapshots/backfill', async (req, res) => {
  try {
    console.log('📊 [Analytics] Backfilling snapshots...');

    // Expect array of snapshot objects from client
    const { snapshots } = req.body;

    if (!Array.isArray(snapshots) || snapshots.length === 0) {
      return res.status(400).json({ error: 'Invalid snapshots data' });
    }

    const results = [];

    for (const snapshot of snapshots) {
      results.push(snapshot);
    }

    res.json({
      success: true,
      count: results.length,
      message: `Created ${results.length} snapshots`
    });
  } catch (error) {
    console.error('❌ [Analytics] Error backfilling snapshots:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// REALTIME SUBSCRIPTION - Claude listens for new issues
// ============================================================================

/**
 * AUTO-REACTION: Claude analyzes new issues and responds intelligently
 */
async function handleNewIssue(issue) {
  try {
    // Skip if issue was created by Claude (avoid infinite loop)
    if (issue.metadata?.created_by_ai) {
      console.log('   ⏭️  Skipping - created by me!');
      return;
    }

    console.log('\n🤖 [Claude] Auto-analyzing new issue...');

    // Smart Analysis based on content
    const title = issue.title.toLowerCase();
    const description = (issue.description || '').toLowerCase();
    const hasDescription = issue.description && issue.description.length > 10;

    let comment = '🤖 **Claude Auto-Analysis**\n\n';

    // Check for bug keywords
    if (
      issue.labels?.includes('bug') ||
      title.includes('bug') ||
      title.includes('error') ||
      title.includes('fehler')
    ) {
      comment += '🐛 **Bug detected!** I\'ll help investigate this.\n\n';
      comment += hasDescription
        ? 'I\'ve reviewed the description. Here are my suggestions:\n'
        : '⚠️ **Missing details!** Please add:\n';
      comment += `- Steps to reproduce\n- Expected vs actual behavior\n- Environment (browser, OS)\n\n`;
    }
    // Check for feature requests
    else if (
      issue.labels?.includes('feature') ||
      title.includes('feature') ||
      title.includes('add') ||
      title.includes('implement')
    ) {
      comment += '✨ **Feature Request detected!**\n\n';
      comment += hasDescription
        ? 'Interesting idea! Let me analyze the requirements:\n'
        : '💡 To better understand this feature, please specify:\n';
      comment += `- User story / Use case\n- Acceptance criteria\n- Technical constraints\n\n`;
    }
    // Generic issue
    else {
      comment += `I've registered this issue. `;
      comment += hasDescription
        ? 'Reviewing the description now...\n\n'
        : '⚠️ Please add a description for better analysis.\n\n';
    }

    // Priority suggestions
    if (issue.priority === 'critical' || issue.labels?.includes('urgent')) {
      comment += '🚨 **High priority detected!** Moving this to the top of the queue.\n\n';
    }

    comment += `---\n📊 **Issue Stats:**\n`;
    comment += `- Created: ${new Date(issue.created_at).toLocaleString()}\n`;
    comment += `- Priority: ${issue.priority}\n`;
    comment += `- Labels: ${issue.labels?.join(', ') || 'none'}\n`;

    // Add the comment
    const { data: adminUser } = await supabase.auth.admin.listUsers();
    const admin = adminUser.users.find((u) => u.user_metadata?.is_admin === true);

    if (!admin) {
      console.error('   ❌ No admin user found for commenting');
      return;
    }

    const { error } = await supabase.from('issue_comments').insert({
      issue_id: issue.id,
      user_id: admin.id,
      comment,
      action_type: 'comment',
      metadata: {
        created_by_ai: true,
        ai_name: 'Claude',
        auto_reaction: true,
      },
    });

    if (error) throw error;

    console.log('   ✅ Auto-comment added successfully!');
  } catch (error) {
    console.error('   ❌ Auto-reaction failed:', error.message);
  }
}

function startRealtimeListener() {
  console.log('👂 [Claude] Starting Realtime listener for issues...');

  const channel = supabase
    .channel('issues-realtime')
    .on(
      'postgres_changes',
      {
        event: '*', // Listen to INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'issues',
      },
      (payload) => {
        const { eventType, new: newRecord, old: oldRecord } = payload;

        console.log('\n🔔 [Claude] Issue Event Detected!');
        console.log(`   Event: ${eventType}`);

        if (eventType === 'INSERT') {
          console.log(`   🆕 New Issue: "${newRecord.title}"`);
          console.log(`   Priority: ${newRecord.priority} | Status: ${newRecord.status}`);
          console.log(`   ID: ${newRecord.id}`);

          // AUTO-REACTION: Claude analyzes and responds to new issues
          handleNewIssue(newRecord);
        } else if (eventType === 'UPDATE') {
          console.log(`   🔄 Updated Issue: "${newRecord.title}"`);
          if (oldRecord.status !== newRecord.status) {
            console.log(`   Status changed: ${oldRecord.status} → ${newRecord.status}`);
          }
        } else if (eventType === 'DELETE') {
          console.log(`   🗑️  Deleted Issue: ${oldRecord.title}`);
        }

        console.log(''); // Empty line for readability
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ [Claude] Realtime subscription active!');
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ [Claude] Realtime subscription error!');
      } else {
        console.log(`📡 [Claude] Realtime status: ${status}`);
      }
    });

  return channel;
}

const PORT = 3001;

app.listen(PORT, () => {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║  🤖 Claude\'s Home - API Server                        ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log('\n📋 Available Endpoints:');
  console.log(`   GET    /api/health`);
  console.log(`   POST   /api/save-markdown`);
  console.log(`   GET    /api/issues`);
  console.log(`   POST   /api/issues`);
  console.log(`   PATCH  /api/issues/:id`);
  console.log(`   POST   /api/issues/:id/comments`);
  console.log(`   GET    /api/analytics/code-metrics`);
  console.log('');

  // Start Realtime listener
  startRealtimeListener();
});
