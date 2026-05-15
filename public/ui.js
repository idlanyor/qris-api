document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form');
  const output = document.getElementById('output');
  const resetBtn = document.getElementById('reset');
  const qrBox = document.getElementById('qr-box');
  const qrUpload = document.getElementById('qrUpload');
  const qrisInput = document.getElementById('qris');

  const clearStatus = () => {
    qrBox.classList.remove('qr-success', 'qr-error');
    output.classList.remove('text-danger', 'text-info');
    output.classList.add('text-info');
  };

  qrUpload.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const originalPlaceholder = qrisInput.placeholder;
    qrisInput.value = '';
    qrisInput.placeholder = 'Membaca QR Code dari gambar...';
    qrisInput.disabled = true;

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('/decode', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal decode QR');
      }

      qrisInput.value = data.text;
      
      // Chaining: Otomatis jalankan konversi jika nominal sudah terisi
      // Jika nominal belum terisi, setidaknya kita arahkan fokus ke nominal
      const nominalInput = document.getElementById('nominal');
      if (nominalInput.value.trim()) {
        form.requestSubmit();
      } else {
        nominalInput.focus();
      }
    } catch (err) {
      alert('Gagal membaca gambar: ' + err.message);
    } finally {
      qrisInput.placeholder = originalPlaceholder;
      qrisInput.disabled = false;
      qrUpload.value = ''; // Reset input file agar bisa pilih file yang sama lagi
    }
  });

  resetBtn.addEventListener('click', () => {
    form.reset();
    output.textContent = 'Belum ada hasil';
    clearStatus();
    qrBox.innerHTML = '<span class="text-muted">Belum ada QR</span>';
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    output.textContent = 'Memproses...';
    clearStatus();

    const qris = document.getElementById('qris').value.trim();
    const nominal = document.getElementById('nominal').value.trim();
    
    // Validasi dasar
    if (!qris) {
      output.textContent = 'Mohon isi QRIS';
      output.classList.replace('text-info', 'text-danger');
      qrBox.classList.add('qr-error');
      return;
    }
    if (!nominal || !/^\d+$/.test(nominal)) {
      output.textContent = 'Nominal harus berupa angka tanpa spasi/titik/koma';
      output.classList.replace('text-info', 'text-danger');
      qrBox.classList.add('qr-error');
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
        throw new Error(`Response bukan JSON valid: ${raw?.slice(0, 140) || '(kosong)'}`);
      }

      if (!res.ok) {
        const msg = (data && (data.error || data.message)) || `HTTP ${res.status}`;
        output.textContent = `Terjadi kesalahan: ${msg}`;
        output.classList.replace('text-info', 'text-danger');
        qrBox.classList.add('qr-error');
        qrBox.innerHTML = '<span class="text-danger fw-bold">Error</span>';
        return;
      }

      output.textContent = JSON.stringify(data, null, 2);
      
      // Render QR
      const params = new URLSearchParams({ qris, nominal });
      const img = new Image();
      img.alt = 'QR Preview';
      img.className = 'img-fluid shadow-sm rounded';
      img.src = '/qr?' + params.toString();
      
      img.onerror = () => {
        qrBox.classList.add('qr-error');
        qrBox.innerHTML = '<span class="text-danger">Gagal memuat gambar QR</span>';
      };
      
      img.onload = () => {
        qrBox.innerHTML = '';
        qrBox.appendChild(img);
        qrBox.classList.add('qr-success');
      };
    } catch (err) {
      const msg = (err && err.message) ? err.message : String(err);
      output.textContent = 'Terjadi kesalahan: ' + msg;
      output.classList.replace('text-info', 'text-danger');
      qrBox.classList.add('qr-error');
      qrBox.innerHTML = '<span class="text-danger fw-bold">Error</span>';
    }
  });
});
