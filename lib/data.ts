import fs from 'fs';
import path from 'path';

const GH_OWNER = 'xzvl';
const GH_REPO = 'beybladerandomizer';
const GH_BRANCH = 'main';

function ghHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  };
}

async function ghGet(repoPath: string): Promise<{ sha: string; content: string } | null> {
  const res = await fetch(
    `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${repoPath}?ref=${GH_BRANCH}`,
    { headers: ghHeaders() }
  );
  if (!res.ok) return null;
  const json = await res.json();
  return { sha: json.sha, content: json.content };
}

async function ghPut(repoPath: string, base64Content: string, sha?: string): Promise<void> {
  const body: Record<string, unknown> = {
    message: `data: update ${repoPath}`,
    content: base64Content,
    branch: GH_BRANCH,
  };
  if (sha) body.sha = sha;
  await fetch(
    `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${repoPath}`,
    { method: 'PUT', headers: ghHeaders(), body: JSON.stringify(body) }
  );
}

// --- Public API ---

export async function readData<T>(filename: string, defaultValue: T): Promise<T> {
  if (!process.env.GITHUB_TOKEN) {
    return localRead(filename, defaultValue);
  }
  const file = await ghGet(`data/${filename}`);
  if (!file) return defaultValue;
  try {
    const text = Buffer.from(file.content.replace(/\s/g, ''), 'base64').toString('utf-8');
    return JSON.parse(text) as T;
  } catch {
    return defaultValue;
  }
}

export async function writeData<T>(filename: string, data: T): Promise<void> {
  if (!process.env.GITHUB_TOKEN) {
    return localWrite(filename, data);
  }
  const existing = await ghGet(`data/${filename}`);
  const base64 = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');
  await ghPut(`data/${filename}`, base64, existing?.sha);
}

export async function uploadImage(id: string, ext: string, buffer: Buffer): Promise<string> {
  const filename = `${id}.${ext}`;
  if (!process.env.GITHUB_TOKEN) {
    const dir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, filename), buffer);
    return `/uploads/${filename}`;
  }
  await ghPut(`public/uploads/${filename}`, buffer.toString('base64'));
  return `/uploads/${filename}`;
}

// --- Local dev fallbacks (no GITHUB_TOKEN) ---

function localRead<T>(filename: string, defaultValue: T): T {
  const filePath = path.join(process.cwd(), 'data', filename);
  if (!fs.existsSync(filePath)) return defaultValue;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
  } catch {
    return defaultValue;
  }
}

function localWrite<T>(filename: string, data: T): void {
  const dir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, filename), JSON.stringify(data, null, 2));
}
