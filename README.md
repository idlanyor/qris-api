# QRIS API

API konversi QRIS berbasis Elysia.js dengan dokumentasi OpenAPI (Swagger) dan UI sederhana untuk uji coba.

## Fitur

- Endpoint `POST /convert` untuk mengonversi string QRIS dan menghitung CRC16.
- Dokumentasi OpenAPI/Swagger tersedia di `GET /docs`.
- UI sederhana untuk mencoba API tersedia di `GET /ui`.

## Prasyarat

- Node.js 18+ atau Bun.

## Instalasi

Menggunakan npm:

```bash
npm install
```

Jika Anda menggunakan Bun:

```bash
bun install
```

Pastikan dependensi Swagger terpasang:

```bash
npm install @elysiajs/swagger
```

atau dengan Bun:

```bash
bun add @elysiajs/swagger
```

## Menjalankan

Mode development (ts-node):

```bash
npm run start
```

Atau build + run (Node):

```bash
npm run build
node dist/app.js
```

Dengan Bun:

```bash
bun src/app.ts
```

Server akan berjalan pada `http://localhost:3000` (atau sesuai `PORT`).

- Dokumentasi: `http://localhost:3000/docs`
- UI Sederhana: `http://localhost:3000/ui`

## OpenAPI Schema

Skema untuk endpoint `/convert` telah ditambahkan menggunakan validator bawaan Elysia (`t`) agar tampil di Swagger UI.

### Request

POST `/convert`

Body JSON:

```json
{
  "qris": "<string QRIS>",
  "nominal": "10000"
}
```

Keterangan:

- `qris` (string): String QRIS asli.
- `nominal` (string): Nominal transaksi sebagai string angka.
  

### Response

```json
{
  "nominal": "10000",
  "merchantName": "Roy Antidonasi Creative"
}
```

## Endpoint Alternatif

- `GET /convert?qris=<...>&nominal=<...>` — alternatif GET dengan query param yang mengembalikan struktur yang sama.

## Preview QR

- `GET /qr?text=<string>` — menghasilkan gambar PNG QR dari string.
- `GET /qr?qris=<...>&nominal=<...>` — langsung membuat QR dari hasil konversi internal.

## Catatan

- Endpoint dokumentasi Swagger berada di `/docs` dengan plugin `@elysiajs/swagger`.
- UI sederhana di `/ui` tidak membutuhkan dependensi tambahan.
- Pastikan data QRIS valid sebelum dikonversi; saat ini validasi detail belum diimplementasikan.
