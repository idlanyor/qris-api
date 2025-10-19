let clientPromise: Promise<any> | null = null;

export async function getRedisClient(): Promise<any | null> {
  if (clientPromise) return clientPromise.catch(() => null);
  const url = process.env.REDIS_URL;
  const host = process.env.REDIS_HOST;
  if (!url && !host) return null;
  clientPromise = (async () => {
    try {
      const redis = require('redis');
      const options: any = url
        ? { url }
        : { socket: { host: host, port: Number(process.env.REDIS_PORT || 6379) }, password: process.env.REDIS_PASSWORD };
      const client = redis.createClient(options);
      client.on('error', () => {});
      await client.connect();
      return client;
    } catch {
      return null;
    }
  })();
  return clientPromise.catch(() => null);
}

export async function redisRateLimit(pathname: string, ip: string, limit: number) {
  const client = await getRedisClient();
  if (!client) return null;
  try {
    const nowSec = Math.floor(Date.now() / 1000);
    const key = `rl:${pathname}:${ip}:${nowSec}`;
    // SET key 1 EX 1 NX, if exists then INCR
    const setRes = await client.set(key, '1', { EX: 1, NX: true });
    let count = 1;
    if (setRes === null) {
      count = await client.incr(key);
    }
    return { count, reset: nowSec + 1 };
  } catch {
    return null;
  }
}

