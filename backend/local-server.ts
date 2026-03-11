/**
 * Local development server — mirrors the Lambda API without AWS.
 * All requests are treated as a single hardcoded user (no real auth).
 * Data is persisted to .dev-data.json in this directory.
 */

import express, { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const PORT = 3001;
const DATA_FILE = join(__dirname, '.dev-data.json');
const DEV_USER_ID = 'local-dev-user';

// ─── In-memory store backed by JSON file ────────────────────────────────────

interface StoreRow {
  PK: string;
  SK: string;
  [key: string]: unknown;
}

function loadData(): StoreRow[] {
  if (!existsSync(DATA_FILE)) return [];
  try {
    return JSON.parse(readFileSync(DATA_FILE, 'utf-8')) as StoreRow[];
  } catch {
    return [];
  }
}

function saveData(rows: StoreRow[]): void {
  writeFileSync(DATA_FILE, JSON.stringify(rows, null, 2));
}

let store: StoreRow[] = loadData();

const db = {
  get(PK: string, SK: string): StoreRow | undefined {
    return store.find(r => r.PK === PK && r.SK === SK);
  },
  put(item: StoreRow): void {
    const idx = store.findIndex(r => r.PK === item.PK && r.SK === item.SK);
    if (idx >= 0) store[idx] = item;
    else store.push(item);
    saveData(store);
  },
  delete(PK: string, SK: string): void {
    store = store.filter(r => !(r.PK === PK && r.SK === SK));
    saveData(store);
  },
  query(PK: string, SKPrefix: string): StoreRow[] {
    return store.filter(r => r.PK === PK && r.SK.startsWith(SKPrefix));
  },
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function strip(item: StoreRow): Record<string, unknown> {
  const { PK, SK, ...rest } = item;
  return rest;
}

function today(): string {
  return new Date().toISOString().split('T')[0];
}

// ─── Express app ────────────────────────────────────────────────────────────

const app = express();
app.use(express.json());

// CORS — allow the Vite dev server
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  next();
});
app.options('*', (_req: Request, res: Response) => res.sendStatus(204));

// ─── Applications ────────────────────────────────────────────────────────────

app.get('/applications', (_req: Request, res: Response) => {
  const items = db.query(`USER#${DEV_USER_ID}`, 'APP#');
  res.json(items.map(strip));
});

app.post('/applications', (req: Request, res: Response) => {
  const body = req.body as Record<string, unknown>;
  if (!body.company || !body.title || !body.status || !body.method || !body.dateApplied) {
    res.status(400).json({ message: 'Missing required fields' });
    return;
  }
  const id = randomUUID();
  const item: StoreRow = {
    PK: `USER#${DEV_USER_ID}`,
    SK: `APP#${id}`,
    id,
    userId: DEV_USER_ID,
    company: body.company,
    title: body.title,
    status: body.status,
    method: body.method,
    dateApplied: body.dateApplied,
    lastUpdated: today(),
    ...(body.link ? { link: body.link } : {}),
    ...(body.notes ? { notes: body.notes } : {}),
  };
  db.put(item);
  res.status(201).json(strip(item));
});

app.put('/applications/:id', (req: Request, res: Response) => {
  const existing = db.get(`USER#${DEV_USER_ID}`, `APP#${req.params.id}`);
  if (!existing) { res.status(404).json({ message: 'Not found' }); return; }
  const updated: StoreRow = { ...existing, ...req.body as StoreRow, lastUpdated: today(), PK: existing.PK, SK: existing.SK };
  db.put(updated);
  res.json(strip(updated));
});

app.delete('/applications/:id', (req: Request, res: Response) => {
  const existing = db.get(`USER#${DEV_USER_ID}`, `APP#${req.params.id}`);
  if (!existing) { res.status(404).json({ message: 'Not found' }); return; }
  db.delete(`USER#${DEV_USER_ID}`, `APP#${req.params.id}`);
  res.sendStatus(204);
});

// ─── Interviews ──────────────────────────────────────────────────────────────

app.get('/interviews', (_req: Request, res: Response) => {
  res.json(db.query(`USER#${DEV_USER_ID}`, 'INT#').map(strip));
});

app.post('/interviews', (req: Request, res: Response) => {
  const body = req.body as Record<string, unknown>;
  if (!body.company || !body.type || !body.date) {
    res.status(400).json({ message: 'Missing required fields' });
    return;
  }
  const id = randomUUID();
  const item: StoreRow = {
    PK: `USER#${DEV_USER_ID}`,
    SK: `INT#${id}`,
    id,
    userId: DEV_USER_ID,
    company: body.company,
    ...(body.title ? { title: body.title } : {}),
    type: body.type,
    date: body.date,
    time: body.time,
    tentative: body.tentative ?? false,
    ...(body.notes ? { notes: body.notes } : {}),
  };
  db.put(item);
  res.status(201).json(strip(item));
});

app.put('/interviews/:id', (req: Request, res: Response) => {
  const existing = db.get(`USER#${DEV_USER_ID}`, `INT#${req.params.id}`);
  if (!existing) { res.status(404).json({ message: 'Not found' }); return; }
  const updated: StoreRow = { ...existing, ...req.body as StoreRow, PK: existing.PK, SK: existing.SK };
  db.put(updated);
  res.json(strip(updated));
});

app.delete('/interviews/:id', (req: Request, res: Response) => {
  const existing = db.get(`USER#${DEV_USER_ID}`, `INT#${req.params.id}`);
  if (!existing) { res.status(404).json({ message: 'Not found' }); return; }
  db.delete(`USER#${DEV_USER_ID}`, `INT#${req.params.id}`);
  res.sendStatus(204);
});

// ─── Profile ─────────────────────────────────────────────────────────────────

function getOrCreateProfile(): StoreRow {
  const existing = db.get(`USER#${DEV_USER_ID}`, 'PROFILE');
  if (existing) return existing;
  const profile: StoreRow = {
    PK: `USER#${DEV_USER_ID}`,
    SK: 'PROFILE',
    userId: DEV_USER_ID,
    displayName: 'Dev User',
    isPublic: false,
    shareToken: randomUUID(),
  };
  db.put(profile);
  return profile;
}

app.get('/profile', (_req: Request, res: Response) => {
  res.json(strip(getOrCreateProfile()));
});

app.put('/profile', (req: Request, res: Response) => {
  const profile = getOrCreateProfile();
  const body = req.body as { displayName?: string; isPublic?: boolean };
  const wasPublic = profile.isPublic as boolean;
  const updated: StoreRow = { ...profile, ...body };
  db.put(updated);

  const shareToken = profile.shareToken as string;
  if (updated.isPublic && !wasPublic) {
    db.put({ PK: `SHARE#${shareToken}`, SK: 'PROFILE', userId: DEV_USER_ID, shareToken });
  } else if (!updated.isPublic && wasPublic) {
    db.delete(`SHARE#${shareToken}`, 'PROFILE');
  }

  res.json(strip(updated));
});

// ─── Public view ─────────────────────────────────────────────────────────────

app.get('/public/:shareToken', (req: Request, res: Response) => {
  const shareEntry = db.get(`SHARE#${req.params.shareToken}`, 'PROFILE');
  if (!shareEntry) { res.status(404).json({ message: 'Not found' }); return; }

  const userId = shareEntry.userId as string;
  const profile = db.get(`USER#${userId}`, 'PROFILE');
  if (!profile || !profile.isPublic) { res.status(404).json({ message: 'Profile is not public' }); return; }

  res.json({
    displayName: profile.displayName || '',
    applications: db.query(`USER#${userId}`, 'APP#').map(strip),
    interviews: db.query(`USER#${userId}`, 'INT#').map(strip),
  });
});

// ─── Start ───────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n  Job Trail local API running at http://localhost:${PORT}`);
  console.log(`  User ID: ${DEV_USER_ID}`);
  console.log(`  Data file: ${DATA_FILE}\n`);
});
