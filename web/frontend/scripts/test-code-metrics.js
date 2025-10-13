// Test script for codeMetricsService
import { getCodeMetrics } from '../src/lib/services/analytics/codeMetricsService.ts';

console.log('🧪 Testing Code Metrics Service...\n');

const metrics = await getCodeMetrics();

console.log('📊 Results:');
console.log(`  LOC: ${metrics.loc.toLocaleString()}`);
console.log(`  Files: ${metrics.files}`);
console.log(`  Commits: ${metrics.commits}`);
console.log(`  Project Age: ${metrics.projectAge.days} days (since ${metrics.projectAge.startDate})`);
console.log('\n✅ Success!');
