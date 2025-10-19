document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form');
  const output = document.getElementById('output');
  const resetBtn = document.getElementById('reset');
  const qrBox = document.getElementById('qr-box');

  resetBtn.addEventListener('click', () => {
    form.reset();
    output.textContent = 'Belum ada hasil';
    qrBox.classList.remove('glow');
    qrBox.innerHTML = '<span style="color:#94a3b8">Belum ada QR</span>';
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    output.textContent = 'Memproses...';
    const qris = document.getElementById('qris').value.trim();
    const nominal = document.getElementById('nominal').value.trim();
    // Validasi dasar agar tidak mengirim data kosong atau nominal tidak valid
    if (!qris) {
      output.textContent = 'Mohon isi QRIS';
      return;
    }
    if (!nominal || !/^\d+$/.test(nominal)) {
      output.textContent = 'Nominal harus berupa angka tanpa spasi/titik/koma';
      return;
    }
    const payload = { qris, nominal };

    try {
      const res = await fetch('/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const raw = await res.text();
      let data;
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch (parseErr) {
        // Jika bukan JSON valid, tampilkan raw text sebagai error
        throw new Error(`Response bukan JSON valid: ${raw?.slice(0, 140) || '(kosong)'}`);
      }

      if (!res.ok) {
        const msg = (data && (data.error || data.message)) || `HTTP ${res.status}`;
        output.textContent = `Terjadi kesalahan: ${msg}`;
        qrBox.classList.remove('ring-2', 'ring-violet-400', 'shadow-lg');
        qrBox.innerHTML = '<span style="color:#ef4444">Error</span>';
        return;
      }

      output.textContent = JSON.stringify(data, null, 2);
      // Hanya render QR jika sukses
      const params = new URLSearchParams({ qris, nominal });
      const img = new Image();
      img.alt = 'QR Preview';
      img.style.maxWidth = '100%';
      img.style.height = 'auto';
      img.src = '/qr?' + params.toString();
      img.onerror = () => {
        qrBox.classList.remove('ring-2', 'ring-violet-400', 'shadow-lg');
        qrBox.innerHTML = '<span style="color:#ef4444">Gagal memuat gambar QR</span>';
      };
      qrBox.innerHTML = '';
      qrBox.appendChild(img);
      qrBox.classList.add('ring-2', 'ring-violet-400', 'shadow-lg');
    } catch (err) {
      const msg = (err && err.message) ? err.message : String(err);
      output.textContent = 'Terjadi kesalahan: ' + msg;
      qrBox.classList.remove('ring-2', 'ring-violet-400', 'shadow-lg');
      qrBox.innerHTML = '<span style="color:#ef4444">Error</span>';
    }
  });
});
