#!/bin/bash

# Pastikan dijalankan sebagai root
if [ "$EUID" -ne 0 ]; then
  echo "Silakan jalankan sebagai root"
  exit
fi

# 1. Install Certbot jika belum ada
if ! command -v certbot &> /dev/null; then
    echo "Menginstall Certbot..."
    apt update
    apt install -y certbot python3-certbot-nginx
fi

# Buat direktori webroot jika belum ada
mkdir -p /var/www/html

# 2. Pasang Konfigurasi Bootstrap (Hanya Port 80)
echo "Memasang konfigurasi bootstrap Nginx..."
cp nginx-bootstrap.conf /etc/nginx/sites-available/qr.ireng.uk
ln -sf /etc/nginx/sites-available/qr.ireng.uk /etc/nginx/sites-enabled/
nginx -t && systemctl restart nginx

# 3. Generate SSL Certificate menggunakan metode webroot
echo "Menghasilkan sertifikat SSL untuk qr.ireng.uk via webroot..."
certbot certonly --webroot -w /var/www/html -d qr.ireng.uk --non-interactive --agree-tos --register-unsafely-without-email

# Cek apakah sertifikat berhasil di-generate
if [ ! -f /etc/letsencrypt/live/qr.ireng.uk/fullchain.pem ]; then
    echo "Gagal menghasilkan sertifikat SSL. Silakan cek koneksi atau apakah domain sudah mengarah ke IP server ini."
    exit 1
fi

# 4. Pasang Konfigurasi Final (HTTPS)
echo "Mengatur konfigurasi Nginx Final (HTTPS)..."
cp nginx.conf /etc/nginx/sites-available/qr.ireng.uk
nginx -t && systemctl restart nginx

echo "SSL Berhasil di-generate dan Nginx telah di-restart dengan HTTPS!"
echo "Aplikasi Anda sekarang aktif di https://qr.ireng.uk"
