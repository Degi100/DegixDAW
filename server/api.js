// server/api.js
// Simple API server for file operations

import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

const PORT = 3001;

app.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
  console.log(`📝 Endpoint: POST http://localhost:${PORT}/api/save-markdown`);
});
