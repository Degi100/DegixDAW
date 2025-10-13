import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const execAsync = promisify(exec);

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

    // Get project root (two levels up from backend/src/)
    const projectRoot = path.resolve(__dirname, '..', '..');

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
    const firstCommitLine = firstCommitOutput.trim().split('\n')[0]; // Get first line
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
    };

    console.log(`   ✅ Total LOC: ${totalLOC.toLocaleString()}`);
    console.log(`   ✅ Files: ${filesCount}`);
    console.log(`   ✅ Commits: ${commitsCount}`);
    console.log(`   ✅ Age: ${projectAgeDays} days (since ${startDate})`);
    console.log(`   📊 Languages: TS=${languageStats.typescript} | JS=${languageStats.javascript} | SCSS=${languageStats.scss} | SQL=${languageStats.sql}`);

    res.json(metrics);
  } catch (error: any) {
    console.error('❌ [Analytics] Error calculating code metrics:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 DegixDAW Backend running on http://localhost:${PORT}`);
  console.log(`📊 Analytics API: http://localhost:${PORT}/api/analytics/code-metrics`);
});
