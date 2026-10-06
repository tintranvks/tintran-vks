import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'vaults.json');

// Ensure data directory and storage file exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({}), 'utf-8');
}

// In-memory cache + SSE subscribers
interface VaultData {
  revision: number;
  updatedAt: string;
  events: any[];
}

const vaultsCache: Record<string, VaultData> = {};
const sseClients: Record<string, Response[]> = {};

// Load existing vaults from disk
try {
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  Object.assign(vaultsCache, JSON.parse(raw));
} catch (err) {
  console.warn('Could not read existing vaults.json:', err);
}

function persistVaultsToDisk() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(vaultsCache, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write vaults.json:', err);
  }
}

app.use(express.json({ limit: '10mb' }));

// CORS headers for all clients
app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// API: Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// API: Server-Sent Events (SSE) for Real-Time Instant Multi-Device Push
app.get('/api/sync/:vaultId/events-stream', (req: Request, res: Response) => {
  const vaultId = req.params.vaultId || 'default';

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  if (!sseClients[vaultId]) {
    sseClients[vaultId] = [];
  }
  sseClients[vaultId].push(res);

  // Send current state immediately on connect
  const current = vaultsCache[vaultId] || { revision: 0, updatedAt: new Date().toISOString(), events: [] };
  res.write(`data: ${JSON.stringify({ type: 'INIT', ...current })}\n\n`);

  req.on('close', () => {
    if (sseClients[vaultId]) {
      sseClients[vaultId] = sseClients[vaultId].filter((client) => client !== res);
    }
  });
});

// API: Get latest events for a vault
app.get('/api/sync/:vaultId', (req: Request, res: Response) => {
  const vaultId = req.params.vaultId || 'default';
  const data = vaultsCache[vaultId] || { revision: 0, updatedAt: new Date().toISOString(), events: [] };
  res.json(data);
});

// API: Push and merge events to vault
app.post('/api/sync/:vaultId', (req: Request, res: Response) => {
  const vaultId = req.params.vaultId || 'default';
  const { events = [], deviceId } = req.body;

  if (!Array.isArray(events)) {
    return res.status(400).json({ error: 'Events must be an array' });
  }

  const existingVault = vaultsCache[vaultId] || { revision: 0, updatedAt: new Date().toISOString(), events: [] };
  
  // Last-Write-Wins (LWW) Merge by event ID & updatedAt
  const eventMap = new Map<string, any>();
  existingVault.events.forEach((ev: any) => {
    if (ev && ev.id) eventMap.set(ev.id, ev);
  });

  events.forEach((incoming: any) => {
    if (!incoming || !incoming.id) return;
    if (!eventMap.has(incoming.id)) {
      eventMap.set(incoming.id, incoming);
    } else {
      const current = eventMap.get(incoming.id);
      const incTime = new Date(incoming.updatedAt || 0).getTime();
      const curTime = new Date(current.updatedAt || 0).getTime();
      if (incTime >= curTime) {
        eventMap.set(incoming.id, incoming);
      }
    }
  });

  const mergedEvents = Array.from(eventMap.values());
  const newRevision = (existingVault.revision || 0) + 1;
  const now = new Date().toISOString();

  vaultsCache[vaultId] = {
    revision: newRevision,
    updatedAt: now,
    events: mergedEvents,
  };

  persistVaultsToDisk();

  // Broadcast to all other devices in real-time via SSE
  const clients = sseClients[vaultId] || [];
  const ssePayload = JSON.stringify({
    type: 'UPDATE',
    revision: newRevision,
    updatedAt: now,
    sourceDeviceId: deviceId,
    events: mergedEvents,
  });

  clients.forEach((client) => {
    try {
      client.write(`data: ${ssePayload}\n\n`);
    } catch {
      // client disconnected
    }
  });

  res.json({
    success: true,
    revision: newRevision,
    updatedAt: now,
    events: mergedEvents,
  });
});

// Setup Frontend serving (Vite in dev, static files in prod)
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`> Chronos Real-Time Sync Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
