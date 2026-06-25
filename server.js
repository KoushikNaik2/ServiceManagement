import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import aiRoutes from './server/routes/ai.js';
import adminRoutes from './server/routes/admin.js';
import userRoutes from './server/routes/user.js';
import uploadRoutes from './server/routes/upload.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

// API Routes
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);
app.use('/api', uploadRoutes);

const KEY = process.env.GROQ_API_KEY || '';
app.get('/api/health', (_req, res) => res.json({
  status: 'ok',
  model: process.env.GROQ_MODEL || 'llama3-8b-8192',
  keySet: !!KEY,
  keyPrefix: KEY ? KEY.slice(0, 16) : 'MISSING'
}));

// --- PRODUCTION SETUP ---
// Serve static files from the React build folder (dist)
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// Handle React routing (MUST be after API routes)
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(distPath, 'index.html'));
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`\n🚀 ServicePoint Mission Control Live`);
  console.log(`🔗 API Endpoint: http://localhost:${PORT}/api`);
  console.log(`📡 Dashboard: http://localhost:${PORT}`);
  console.log(`🔑 Neural Link: ${KEY ? 'ACTIVE' : '⚠️  MISSING — check env vars'}\n`);
});
export default app;
