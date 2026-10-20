import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import incidentsRouter from './routes/incidents.js';
import statsRouter from './routes/stats.js';
import staffRouter from './routes/staff.js';
import authRouter from './routes/auth.js';
import { errorHandler } from './middleware/errorHandler.js';
import { isConnected } from './config/supabase.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.NODE_ENV === 'production' && process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : '*',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Staff-Role', 'X-Staff-Id']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'CivicShield Municipal Dispatcher API',
    version: '1.0.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: {
      supabaseConfigured: isConnected,
      mode: isConnected ? 'Supabase PostgreSQL (Live)' : 'Dual-Mode (Memory + Seed Fallback)'
    }
  });
});

const resolveModule = (moduleValue) => {
  let resolved = moduleValue;
  while (resolved && typeof resolved === 'object' && 'default' in resolved) resolved = resolved.default;
  return resolved;
};
app.use('/api/auth', resolveModule(authRouter));
app.use('/api/incidents', resolveModule(incidentsRouter));
app.use('/api/dashboard/stats', resolveModule(statsRouter));
app.use('/api/staff', resolveModule(staffRouter));
app.use(resolveModule(errorHandler));

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Endpoint '${req.method} ${req.originalUrl}' not found on CivicShield API.`
  });
});

if (process.env.NETLIFY !== 'true') {
  app.listen(PORT, () => {
    console.log(`CivicShield API running at http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
  });
}

export default app;
