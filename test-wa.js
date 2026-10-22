// Tes kirim WhatsApp lewat Fonnte (menampilkan jawaban asli dari Fonnte).
// Jalankan:  npm run test:wa
require('dotenv').config();
const wa = require('../lib/whatsapp');

(async () => {
  const cfg = wa.config();
  console.log('Token terisi :', cfg.token && !cfg.token.startsWith('ISI_') ? 'YA' : 'BELUM');
  console.log('Nomor admin  :', cfg.adminNumbers.join(', ') || '(kosong)');
  console.log('Dinormalkan  :', cfg.adminNumbers.map(wa.normalizeNumber).join(', ') || '(kosong)');
  console.log('\nMengirim pesan tes...');
  const r = await wa.kirimWhatsApp(cfg.adminNumbers, 'Tes notifikasi SIPENJAM (Node.js)');
  console.log('Hasil        :', r.ok ? 'DITERIMA FONNTE' : 'GAGAL');
  console.log('Respon Fonnte:', r.response);
  if (!r.ok) console.log('\nCatatan: periksa token device, status device (Connected), dan nomor admin. Detail ada di logs/whatsapp.log');
})();
