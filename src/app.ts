import { Elysia, t } from 'elysia';
import { swagger } from '@elysiajs/swagger';
import QRCode from 'qrcode';
import { QrisController } from './controllers/qris.controller';
import QrisService from './services/qris.service';
import { QrisInput } from './types/qris.type';
import { readFileSync } from 'fs';
import { join } from 'path';
import { redisRateLimit } from './utils/redis.util';

const app = new Elysia();


const qrisController = new QrisController();
const qrisService = new QrisService();

app.use(
    swagger({
        documentation: {
            info: {
                title: 'QRIS Converter API',
                description: 'API untuk konversi QRIS dan kalkulasi CRC16',
                version: '1.0.0'
            },
            tags: [
                { name: 'QRIS', description: 'Operasi konversi QRIS' }
            ]
        },
        path: '/docs'
    })
);

app.post(
    '/convert',
    ({ body }) => {
        try {
            return qrisController.convert(body as QrisInput);
        } catch (e: any) {
            return new Response(JSON.stringify({ error: e?.message || 'Payload tidak valid' }), {
                status: 400,
                headers: { 'content-type': 'application/json' }
            });
        }
    },
    {
        detail: {
            summary: 'Konversi QRIS',
            tags: ['QRIS']
        },
        body: t.Object({
            qris: t.String({ description: 'String QRIS input' }),
            nominal: t.String({ description: 'Nominal transaksi dalam string angka', pattern: '^[0-9]{1,13}$' })
        }),
        response: t.Object({
            qris: t.String({ description: 'QRIS hasil konversi dengan nominal dan CRC16 terbaru' }),
            nominal: t.String({ description: 'Nominal transaksi' }),
            merchantName: t.String({ description: 'Nama merchant dari QRIS' })
        })
    }
);

app.get(
    '/convert',
    ({ query }) => {
        try {
            const { qris, nominal } = query as Record<string, string>;
            return qrisController.convert({ qris, nominal } as QrisInput);
        } catch (e: any) {
            return new Response(JSON.stringify({ error: e?.message || 'Payload tidak valid' }), {
                status: 400,
                headers: { 'content-type': 'application/json' }
            });
        }
    },
    {
        detail: {
            summary: 'Konversi QRIS (GET)',
            tags: ['QRIS']
        },
        query: t.Object({
            qris: t.String({ description: 'String QRIS input' }),
            nominal: t.String({ description: 'Nominal transaksi dalam string angka', pattern: '^[0-9]{1,13}$' })
        }),
        response: t.Object({
            qris: t.String({ description: 'QRIS hasil konversi dengan nominal dan CRC16 terbaru' }),
            nominal: t.String({ description: 'Nominal transaksi' }),
            merchantName: t.String({ description: 'Nama merchant dari QRIS' })
        })
    }
);

app.get('/qr', async ({ query }) => {
    const q = query as any;
    let content: string | undefined;
    if (typeof q?.text === 'string' && q.text.length > 0) {
        content = q.text;
    } else if (typeof q?.qris === 'string' && typeof q?.nominal === 'string') {
        content = qrisService.convert(q.qris, q.nominal);
    }
    if (!content) {
        return new Response(JSON.stringify({ error: 'Query `text` atau `qris` dan `nominal` wajib diisi' }), {
            status: 400,
            headers: { 'content-type': 'application/json' }
        });
    }
    try {
        const pngBuffer = await QRCode.toBuffer(content, { type: 'png', errorCorrectionLevel: 'M' });
        return new Response(pngBuffer, { headers: { 'content-type': 'image/png' } });
    } catch (e: any) {
        return new Response(JSON.stringify({ error: e?.message || 'Gagal membuat QR' }), {
            status: 500,
            headers: { 'content-type': 'application/json' }
        });
    }
}, {
    detail: { summary: 'Buat gambar QR dari string atau hasil konversi', tags: ['QRIS'] },
    query: t.Object({
        text: t.Optional(t.String({ description: 'String QRIS untuk diubah jadi QR image' })),
        qris: t.Optional(t.String({ description: 'QRIS input' })),
        nominal: t.Optional(t.String({ description: 'Nominal transaksi' }))
    })
});

app.get('/ui', () => {
    const html = readFileSync(join(process.cwd(), 'public', 'ui.html'), 'utf-8');
    return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } });
});

app.get('/ui.css', () => {
    const css = readFileSync(join(process.cwd(), 'public', 'ui.css'), 'utf-8');
    return new Response(css, { headers: { 'content-type': 'text/css; charset=utf-8' } });
});
app.get('/ui.js', () => {
    const js = readFileSync(join(process.cwd(), 'public', 'ui.js'), 'utf-8');
    return new Response(js, { headers: { 'content-type': 'application/javascript; charset=utf-8' } });
});
app.get('/ui/ui.css', () => {
    const css = readFileSync(join(process.cwd(), 'public', 'ui.css'), 'utf-8');
    return new Response(css, { headers: { 'content-type': 'text/css; charset=utf-8' } });
});
app.get('/ui/ui.js', () => {
    const js = readFileSync(join(process.cwd(), 'public', 'ui.js'), 'utf-8');
    return new Response(js, { headers: { 'content-type': 'application/javascript; charset=utf-8' } });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`QRIS API is running on http://localhost:${PORT}`);
    console.log(`Docs: http://localhost:${PORT}/docs`);
    console.log(`UI:   http://localhost:${PORT}/ui`);
});
// Simple in-memory rate limiter: 10 requests per second per IP for selected paths
const RATE_LIMIT_RPS = 10;
type RateRec = { ts: number; count: number };
const rateMap = new Map<string, RateRec>();
const limitedPaths = new Set<string>(['/convert', '/qr']);

function getClientIp(req: Request): string {
    const xf = req.headers.get('x-forwarded-for');
    if (xf) return xf.split(',')[0].trim();
    const xr = req.headers.get('x-real-ip');
    if (xr) return xr.trim();
    return 'unknown';
}

app.onRequest(async ({ request }) => {
    try {
        const pathname = new URL(request.url).pathname;
        if (!limitedPaths.has(pathname)) return;
        const ip = getClientIp(request);
        const rl = await redisRateLimit(pathname, ip, RATE_LIMIT_RPS);
        if (rl && rl.count > RATE_LIMIT_RPS) {
            return new Response(JSON.stringify({ error: 'Rate limit exceeded (10 req/s)' }), {
                status: 429,
                headers: {
                    'content-type': 'application/json',
                    'x-ratelimit-limit': String(RATE_LIMIT_RPS),
                    'x-ratelimit-remaining': String(Math.max(0, RATE_LIMIT_RPS - rl.count)),
                    'x-ratelimit-reset': String(rl.reset)
                }
            });
        }
        if (!rl) {
            // Fallback in-memory
            const now = Date.now();
            const rec = rateMap.get(ip);
            if (!rec || now - rec.ts >= 1000) {
                rateMap.set(ip, { ts: now, count: 1 });
                return;
            }
            rec.count += 1;
            if (rec.count > RATE_LIMIT_RPS) {
                return new Response(JSON.stringify({ error: 'Rate limit exceeded (10 req/s)' }), {
                    status: 429,
                    headers: { 'content-type': 'application/json' }
                });
            }
        }
        return;
    } catch {
        return;
    }
});
