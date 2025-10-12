import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

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

// Start server
app.listen(PORT, () => {
  console.log(`🚀 DegixDAW Backend running on http://localhost:${PORT}`);
});
