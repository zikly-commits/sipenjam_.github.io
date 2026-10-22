// Notifikasi WhatsApp ke admin menggunakan Fonnte.
// Dokumentasi API: https://docs.fonnte.com/
const fs = require('fs');
const path = require('path');

function config() {
  return {
    enabled: String(process.env.WA_ENABLED ?? 'true').toLowerCase() !== 'false',
    token: (process.env.FONNTE_TOKEN || '').trim(),
    adminNumbers: (process.env.WA_ADMIN_NUMBERS || '').split(',').map((s) => s.trim()).filter(Boolean),
    appUrl: (process.env.APP_URL || 'http://localhost:3000').replace(/\/+$/, ''),
    timeout: Number(process.env.WA_TIMEOUT || 8) * 1000,
  };
}

/** Normalkan nomor ke format 62xxxxxxxxxx. Mengembalikan '' jika tidak valid. */
function normalizeNumber(number) {
  let n = String(number).replace(/\D+/g, '');
  if (n === '') return '';
  if (n.startsWith('0')) n = '62' + n.slice(1);
  else if (n.startsWith('8')) n = '62' + n;
  return n.length >= 10 && n.length <= 15 ? n : '';
}

/** Catat error ke logs/whatsapp.log (tidak mengganggu alur aplikasi). */
function waLog(text) {
  try {
    const dir = path.join(__dirname, '..', 'logs');
    fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(path.join(dir, 'whatsapp.log'), `[${new Date().toISOString()}] ${text}\n`);
  } catch (e) { /* abaikan */ }
  console.error('[WhatsApp] ' + text);
}

/**
 * Kirim pesan WhatsApp lewat Fonnte.
 * Mengembalikan { ok, response } -- tidak pernah melempar error.
 */
async function kirimWhatsApp(targets, message) {
  const cfg = config();
  if (!cfg.enabled || cfg.token === '') {
    return { ok: false, response: 'Dilewati: FONNTE_TOKEN belum diisi / WA_ENABLED=false' };
  }

  const numbers = [...new Set(targets.map(normalizeNumber).filter(Boolean))];
  if (!numbers.length) {
    waLog('Dilewati: tidak ada nomor admin yang valid di WA_ADMIN_NUMBERS (.env)');
    return { ok: false, response: 'Tidak ada nomor admin yang valid' };
  }

  const form = new FormData();
  form.append('target', numbers.join(','));
  form.append('message', message);
  form.append('countryCode', '62');

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), cfg.timeout);
  try {
    const res = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: { Authorization: cfg.token },
      body: form,
      signal: ctrl.signal,
    });
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch (e) { /* bukan JSON */ }
    if (!json || !json.status) {
      waLog('Fonnte menolak: ' + text);
      return { ok: false, response: text };
    }
    return { ok: true, response: text };
  } catch (e) {
    const reason = e.name === 'AbortError' ? 'timeout' : (e.cause && e.cause.code) || e.message;
    waLog('Gagal menghubungi Fonnte: ' + reason);
    return { ok: false, response: String(reason) };
  } finally {
    clearTimeout(timer);
  }
}

/** Format tanggal Y-m-d => "14 Oktober 2026". */
function waTanggal(dateStr) {
  const bulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(dateStr));
  return m ? `${Number(m[3])} ${bulan[Number(m[2]) - 1]} ${m[1]}` : String(dateStr);
}

/** Bangun tautan konfirmasi cepat (setujui/tolak) dari sebuah token. */
function tautanKonfirmasi(token) {
  const cfg = config();
  return {
    approveUrl: `${cfg.appUrl}/konfirmasi/setujui/${token}`,
    rejectUrl: `${cfg.appUrl}/konfirmasi/tolak/${token}`,
  };
}

/**
 * Susun pesan pengajuan baru. detail: array pasangan [label, nilai].
 * actionLinks (opsional): { approveUrl, rejectUrl } dari tautanKonfirmasi() --
 * jika diisi, admin bisa menyetujui/menolak langsung dari WhatsApp tanpa login.
 */
function susunPesan(jenis, detail, actionLinks) {
  const cfg = config();
  const lines = [`*PENGAJUAN ${jenis} BARU*`, '_SIPENJAM - Kanwil Kemenag Babel_', ''];
  for (const [label, value] of detail) {
    const v = String(value ?? '').trim();
    if (v !== '') lines.push(`*${label}:* ${v}`);
  }
  if (actionLinks && actionLinks.approveUrl && actionLinks.rejectUrl) {
    lines.push('', '*Konfirmasi cepat (langsung dari sini, tanpa login):*');
    lines.push(`✅ Setujui: ${actionLinks.approveUrl}`);
    lines.push(`❌ Tolak: ${actionLinks.rejectUrl}`);
    lines.push('', 'Atau buka panel admin:', `${cfg.appUrl}/?page=persetujuan`);
  } else {
    lines.push('', 'Menunggu persetujuan Anda:', `${cfg.appUrl}/?page=persetujuan`);
  }
  return lines.join('\n');
}

/** Kirim notifikasi pengajuan baru ke semua nomor admin. */
function kirimNotifWhatsAppAdmin(jenis, detail, actionLinks) {
  return kirimWhatsApp(config().adminNumbers, susunPesan(jenis, detail, actionLinks));
}

module.exports = {
  kirimWhatsApp, kirimNotifWhatsAppAdmin, normalizeNumber, waTanggal, susunPesan, config, tautanKonfirmasi,
};
