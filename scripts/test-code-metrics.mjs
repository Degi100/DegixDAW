// Test script for codeMetricsService (plain JS version)
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile } from 'fs/promises';
import { join } from 'path';

const execAsync = promisify(exec);

async function getCurrentLOC() {
  try {
    const { stdout: filesOutput } = await execAsync('git ls-files');
    const files = filesOutput.trim().split('\n').filter(Boolean);

    const sourceFiles = files.filter(f =>
      /\.(ts|tsx|js|jsx|css|scss)$/.test(f)
    );

    if (sourceFiles.length === 0) return 0;

    const rootDir = process.cwd();

    const lineCounts = await Promise.all(
      sourceFiles.map(async (file) => {
        try {
          const filePath = join(rootDir, file);
          const content = await readFile(filePath, 'utf-8');
          return content.split('\n').length;
        } catch {
          return 0;
        }
      })
    );

    return lineCounts.reduce((sum, count) => sum + count, 0);
  } catch (error) {
    console.error('Failed to count LOC:', error);
    return 0;
  }
}

async function getFileCount() {
  try {
    const { stdout } = await execAsync('git ls-files | wc -l');
    return parseInt(stdout.trim(), 10) || 0;
  } catch (error) {
    console.error('Failed to count files:', error);
    return 0;
  }
}

async function getCommitCount() {
  try {
    const { stdout } = await execAsync('git rev-list --count HEAD');
    return parseInt(stdout.trim(), 10) || 0;
  } catch (error) {
    console.error('Failed to count commits:', error);
    return 0;
  }
}

async function getProjectAge() {
  try {
    const { stdout } = await execAsync('git log --reverse --format="%ai" | head -1');
    const firstCommitDate = new Date(stdout.trim());
    const now = new Date();
    const diffMs = now.getTime() - firstCommitDate.getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    return {
      days,
      startDate: firstCommitDate.toISOString().split('T')[0]
    };
  } catch (error) {
    console.error('Failed to get project age:', error);
    return { days: 0, startDate: new Date().toISOString().split('T')[0] };
  }
}

console.log('🧪 Testing Code Metrics Service...\n');

const [loc, files, commits, projectAge] = await Promise.all([
  getCurrentLOC(),
  getFileCount(),
  getCommitCount(),
  getProjectAge()
]);

console.log('📊 Results:');
console.log(`  LOC: ${loc.toLocaleString()}`);
console.log(`  Files: ${files}`);
console.log(`  Commits: ${commits}`);
console.log(`  Project Age: ${projectAge.days} days (since ${projectAge.startDate})`);
console.log('\n✅ Success!');
