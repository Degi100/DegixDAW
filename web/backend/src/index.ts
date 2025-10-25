import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const execAsync = promisify(exec);

// Initialize Supabase Admin Client (with Service Role Key for admin operations)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'DegixDAW Backend is running' });
});

// API routes
app.get('/api', (req: Request, res: Response) => {
  res.json({ message: 'Welcome to DegixDAW API' });
});

// ============================================================================
// ANALYTICS - Code Metrics (LOC Counter)
// ============================================================================

/**
 * GET /api/analytics/code-metrics
 * Returns real code metrics via Git commands
 */
app.get('/api/analytics/code-metrics', async (req: Request, res: Response) => {
  try {
    console.log('📊 [Analytics] Calculating code metrics...');

    // Get project root (three levels up from web/backend/src/)
    const projectRoot = path.resolve(__dirname, '..', '..', '..');

    // 1. Count files
    const { stdout: filesOutput } = await execAsync('git ls-files', { cwd: projectRoot });
    const allFiles = filesOutput.trim().split('\n').filter(Boolean);

    // Filter only text source files (exclude binary, images, etc)
    const sourceFiles = allFiles.filter((f) =>
      /\.(ts|tsx|js|jsx|cpp|h|css|scss|json|md|sql|yml|yaml|toml|txt|bat|sh|html|xml)$/.test(f)
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
    const firstCommitLine = firstCommitOutput.trim().split('\n')[0]; // Get first line
    const firstCommitDate = new Date(firstCommitLine);
    const startDate = firstCommitDate.toISOString().split('T')[0]; // YYYY-MM-DD
    const projectAgeDays = Math.floor((Date.now() - firstCommitDate.getTime()) / (1000 * 60 * 60 * 24));

    // 4. Count Lines of Code (LOC) with Language Breakdown + Detailed Breakdown
    let totalLOC = 0;
    const languageStats = {
      typescript: 0,
      javascript: 0,
      cpp: 0,
      scss: 0,
      css: 0,
      sql: 0,
      json: 0,
      markdown: 0,
      other: 0,
    };

    // Detailed breakdown for tooltips
    const breakdown = {
      typescript: { frontend: 0, backend: 0, packages: 0, desktop: 0 },
      javascript: { frontend: 0, backend: 0, packages: 0, desktop: 0 },
      cpp: { files: 0, loc: 0 },
      scss: { files: 0, loc: 0 },
      css: { files: 0, loc: 0 },
      sql: { files: 0, loc: 0 },
      json: { packageLock: 0, configs: 0, other: 0, files: 0 },
      markdown: { readme: 0, docs: 0, other: 0, files: 0 },
      other: { yml: 0, toml: 0, bat: 0, sh: 0, html: 0, xml: 0, txt: 0, files: 0 }
    };

    for (const file of sourceFiles) {
      try {
        const filePath = path.join(projectRoot, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const lines = content.split('\n').length;
        totalLOC += lines;

        // Categorize by language with detailed breakdown
        if (file.match(/\.(ts|tsx)$/)) {
          languageStats.typescript += lines;
          if (file.startsWith('web/frontend/')) breakdown.typescript.frontend += lines;
          else if (file.startsWith('web/backend/')) breakdown.typescript.backend += lines;
          else if (file.startsWith('packages/')) breakdown.typescript.packages += lines;
          else if (file.startsWith('desktop/')) breakdown.typescript.desktop += lines;
        }
        else if (file.match(/\.(js|jsx)$/)) {
          languageStats.javascript += lines;
          if (file.startsWith('web/frontend/')) breakdown.javascript.frontend += lines;
          else if (file.startsWith('web/backend/')) breakdown.javascript.backend += lines;
          else if (file.startsWith('packages/')) breakdown.javascript.packages += lines;
          else if (file.startsWith('desktop/')) breakdown.javascript.desktop += lines;
        }
        else if (file.match(/\.(cpp|h)$/)) {
          languageStats.cpp += lines;
          breakdown.cpp.files++;
          breakdown.cpp.loc += lines;
        }
        else if (file.match(/\.scss$/)) {
          languageStats.scss += lines;
          breakdown.scss.files++;
          breakdown.scss.loc += lines;
        }
        else if (file.match(/\.css$/)) {
          languageStats.css += lines;
          breakdown.css.files++;
          breakdown.css.loc += lines;
        }
        else if (file.match(/\.sql$/)) {
          languageStats.sql += lines;
          breakdown.sql.files++;
          breakdown.sql.loc += lines;
        }
        else if (file.match(/\.json$/)) {
          languageStats.json += lines;
          breakdown.json.files++;
          if (file.includes('package-lock.json')) breakdown.json.packageLock += lines;
          else if (file.match(/(tsconfig|package|vite\.config|eslint)\.json/)) breakdown.json.configs += lines;
          else breakdown.json.other += lines;
        }
        else if (file.match(/\.md$/)) {
          languageStats.markdown += lines;
          breakdown.markdown.files++;
          if (file.match(/README\.md$/i)) breakdown.markdown.readme += lines;
          else if (file.match(/CLAUDE\.md$/i)) breakdown.markdown.docs += lines;
          else breakdown.markdown.other += lines;
        }
        else {
          languageStats.other += lines;
          breakdown.other.files++;
          if (file.match(/\.(yml|yaml)$/)) breakdown.other.yml += lines;
          else if (file.match(/\.toml$/)) breakdown.other.toml += lines;
          else if (file.match(/\.bat$/)) breakdown.other.bat += lines;
          else if (file.match(/\.sh$/)) breakdown.other.sh += lines;
          else if (file.match(/\.html$/)) breakdown.other.html += lines;
          else if (file.match(/\.xml$/)) breakdown.other.xml += lines;
          else if (file.match(/\.txt$/)) breakdown.other.txt += lines;
        }
      } catch (err: any) {
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
      breakdown, // Detailed breakdown for tooltips
    };

    console.log(`   ✅ Total LOC: ${totalLOC.toLocaleString()}`);
    console.log(`   ✅ Files: ${filesCount}`);
    console.log(`   ✅ Commits: ${commitsCount}`);
    console.log(`   ✅ Age: ${projectAgeDays} days (since ${startDate})`);
    console.log(`   📊 Languages: TS=${languageStats.typescript} | JS=${languageStats.javascript} | C++=${languageStats.cpp} | SCSS=${languageStats.scss} | SQL=${languageStats.sql}`);

    res.json(metrics);
  } catch (error: any) {
    console.error('❌ [Analytics] Error calculating code metrics:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// INVITATIONS - Email Invite for Non-Registered Users
// ============================================================================

/**
 * POST /api/invitations/email
 * Sends email invitation to non-registered user
 * Body: { email, projectId, projectName, inviterName, role, permissions }
 */
app.post('/api/invitations/email', async (req: Request, res: Response) => {
  try {
    const { email, projectId, projectName, inviterName, role, permissions } = req.body;

    console.log(`📧 [Invitations] Sending email invite to ${email} for project ${projectName}`);

    // Validate required fields
    if (!email || !projectId || !projectName || !inviterName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Use Supabase Auth Admin API to invite user
    // This will send them a signup email with a magic link
    // User will be redirected to /welcome after clicking the link
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      // Redirect URL after signup - /welcome page for invited users
      redirectTo: `${process.env.FRONTEND_URL}/welcome?invited=true&project_id=${projectId}`,
      data: {
        // Store metadata about the invitation
        invited_to_project: projectId,
        invited_by: inviterName,
        project_name: projectName,
        role: role,
        permissions: permissions,
      }
    });

    if (error) {
      console.error('❌ [Invitations] Supabase invite error:', error.message);
      return res.status(500).json({ error: error.message });
    }

    console.log(`✅ [Invitations] Email sent successfully to ${email}`);
    res.json({
      success: true,
      message: `Invitation sent to ${email}`,
      userId: data.user?.id
    });

  } catch (error: any) {
    console.error('❌ [Invitations] Error sending email invite:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 DegixDAW Backend running on http://localhost:${PORT}`);
  console.log(`📊 Analytics API: http://localhost:${PORT}/api/analytics/code-metrics`);
  console.log(`📧 Invitations API: http://localhost:${PORT}/api/invitations/email`);
});
