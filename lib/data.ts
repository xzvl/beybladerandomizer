import { Redis } from '@upstash/redis';
import fs from 'fs';
import path from 'path';

let redis: Redis | null = null;

function getRedis(): Redis {
  if (!redis) {
    redis = Redis.fromEnv();
  }
  return redis;
}

export async function readData<T>(key: string, defaultValue: T): Promise<T> {
  const client = getRedis();
  const data = await client.get<T>(key);
  if (data !== null && data !== undefined) return data;

  // First-run fallback: seed from committed JSON files
  try {
    const filePath = path.join(process.cwd(), 'data', key);
    if (fs.existsSync(filePath)) {
      const fileData = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
      await client.set(key, JSON.stringify(fileData));
      return fileData;
    }
  } catch {}

  return defaultValue;
}

export async function writeData<T>(key: string, data: T): Promise<void> {
  await getRedis().set(key, JSON.stringify(data));
}
