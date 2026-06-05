import { Redis } from '@upstash/redis';
import fs from 'fs';
import path from 'path';

let redis: Redis | null = null;

function getRedis(): Redis {
  if (!redis) redis = Redis.fromEnv();
  return redis;
}

// Wrap all stored values so null is distinguishable from "key missing"
type Wrapper<T> = { v: T };

export async function readData<T>(key: string, defaultValue: T): Promise<T> {
  const client = getRedis();
  const wrapper = await client.get<Wrapper<T>>(key);

  if (wrapper !== null && wrapper !== undefined) {
    return wrapper.v;
  }

  // First-run: seed Redis from committed JSON files
  try {
    const filePath = path.join(process.cwd(), 'data', key);
    if (fs.existsSync(filePath)) {
      const fileData = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
      await client.set(key, { v: fileData });
      return fileData;
    }
  } catch {}

  return defaultValue;
}

export async function writeData<T>(key: string, data: T): Promise<void> {
  await getRedis().set(key, { v: data });
}
