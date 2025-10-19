import { Elysia, t } from 'elysia';
import { swagger } from '@elysiajs/swagger';
import QRCode from 'qrcode';
import { QrisController } from './controllers/qris.controller';
import QrisService from './services/qris.service';
import { QrisInput } from './types/qris.type';

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
    ({ body }) => qrisController.convert(body as QrisInput),
    {
        detail: {
            summary: 'Konversi QRIS',
            tags: ['QRIS']
        },
        body: t.Object({
            qris: t.String({ description: 'String QRIS input' }),
            nominal: t.String({ description: 'Nominal transaksi dalam string angka' })
        }),
        response: t.Object({
            qris: t.String({ description: 'QRIS hasil konversi dengan nominal dan CRC16 terbaru' }),
            nominal: t.String({ description: 'Nominal transaksi' }),
            merchantName: t.String({ description: 'Nama merchant dari QRIS' })
        })
    }
);

// Alternative GET endpoint for conversion using query params
app.get(
    '/convert',
    ({ query }) => {
        const { qris, nominal } = query as Record<string, string>;
        return qrisController.convert({ qris, nominal } as QrisInput);
    },
    {
        detail: {
            summary: 'Konversi QRIS (GET)',
            tags: ['QRIS']
        },
        query: t.Object({
            qris: t.String({ description: 'String QRIS input' }),
            nominal: t.String({ description: 'Nominal transaksi dalam string angka' })
        }),
        response: t.Object({
            qris: t.String({ description: 'QRIS hasil konversi dengan nominal dan CRC16 terbaru' }),
            nominal: t.String({ description: 'Nominal transaksi' }),
            merchantName: t.String({ description: 'Nama merchant dari QRIS' })
        })
    }
);

// Generate QR image (PNG) from QRIS string
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
    const html = `<!doctype html>
    <html lang="id">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>QRIS Converter UI</title>
        <style>
            :root { font-family: system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif; }
            body { margin: 0; padding: 24px; background: #0f172a; color: #e2e8f0; }
            .container { max-width: 840px; margin: 0 auto; }
            h1 { font-size: 1.6rem; margin-bottom: 8px; }
            .desc { color: #94a3b8; margin-bottom: 16px; }
            .card { background: #0b1220; border: 1px solid #1f2937; border-radius: 12px; padding: 18px; }
            label { display: block; font-weight: 600; margin-bottom: 6px; }
            input, textarea, select { width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #334155; background: #0a0f1e; color: #e2e8f0; }
            textarea { min-height: 120px; }
            .row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
            .actions { margin-top: 16px; display: flex; gap: 10px; }
            button { background: #2563eb; color: white; border: none; padding: 10px 14px; border-radius: 8px; cursor: pointer; }
            button.secondary { background: #334155; }
            pre { background: #0a0f1e; border: 1px solid #334155; padding: 12px; border-radius: 8px; overflow: auto; }
            .link { color: #93c5fd; text-decoration: none; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>QRIS Converter</h1>
            <p class="desc">UI sederhana untuk mencoba endpoint <code>/convert</code>. Dokumentasi OpenAPI tersedia di <a class="link" href="/docs" target="_blank">/docs</a>.</p>
            <div class="card">
                <form id="form">
                    <label for="qris">QRIS String</label>
                    <textarea id="qris" name="qris" placeholder="Masukkan data QRIS" required></textarea>
                    <div class="row">
                        <div>
                            <label for="nominal">Nominal</label>
                            <input id="nominal" name="nominal" type="text" placeholder="contoh: 10000" required />
                        </div>
                    </div>
                    <div class="actions">
                        <button type="submit">Convert</button>
                        <button type="button" id="reset" class="secondary">Reset</button>
                    </div>
                </form>
                <div style="margin-top: 16px;">
                    <label>Hasil</label>
                    <div style="display:grid; grid-template-columns: 1fr 280px; gap: 12px; align-items: start;">
                        <pre id="output">Belum ada hasil</pre>
                        <div>
                            <div style="font-weight:600; margin-bottom:6px;">QR Preview</div>
                            <div id="qr-box" style="background:#0a0f1e; border:1px solid #334155; border-radius:8px; padding:8px; display:flex; align-items:center; justify-content:center; min-height:260px;">
                                <span style="color:#94a3b8">Belum ada QR</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <script>
        const form = document.getElementById('form');
        const output = document.getElementById('output');
        const resetBtn = document.getElementById('reset');
        const qrBox = document.getElementById('qr-box');
        resetBtn.addEventListener('click', () => {
            form.reset();
            output.textContent = 'Belum ada hasil';
            qrBox.innerHTML = '<span style="color:#94a3b8">Belum ada QR</span>';
        });
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            output.textContent = 'Memproses...';
            const qris = document.getElementById('qris').value.trim();
            const nominal = document.getElementById('nominal').value.trim();
            const payload = { qris, nominal };

            try {
                const res = await fetch('/convert', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                output.textContent = JSON.stringify(data, null, 2);
                const params = new URLSearchParams({ qris, nominal });
                const img = new Image();
                img.alt = 'QR Preview';
                img.style.maxWidth = '100%';
                img.style.height = 'auto';
                img.src = '/qr?' + params.toString();
                qrBox.innerHTML = '';
                qrBox.appendChild(img);
            } catch (err) {
                output.textContent = 'Terjadi kesalahan: ' + (err?.message || err);
                qrBox.innerHTML = '<span style="color:#ef4444">Error</span>';
            }
        });
        </script>
    </body>
    </html>`;
    return new Response(html, {
        headers: { 'content-type': 'text/html; charset=utf-8' }
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`QRIS API is running on http://localhost:${PORT}`);
    console.log(`Docs: http://localhost:${PORT}/docs`);
    console.log(`UI:   http://localhost:${PORT}/ui`);
});
