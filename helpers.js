// Fungsi bantu (port dari includes/helpers.php) + fungsi gaya-PHP yang dipakai template.
const fs = require('fs');
const path = require('path');
const db = require('./db');

// ---------------------------------------------------------------------------
// Umum
// ---------------------------------------------------------------------------
function generate_id(prefix) {
  return prefix + '-' + Date.now();
}

const ENT_QUOTES = 3;

/** Setara htmlspecialchars() PHP. */
function h(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/** Setara json_encode(), aman dipakai di dalam atribut HTML/onclick. */
function json_encode(value) {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/'/g, '\\u0027');
}

const strtoupper = (s) => String(s ?? '').toUpperCase();
const substr = (s, start, len) => String(s ?? '').substr(start, len);
const str_replace = (a, b, s) => String(s ?? '').split(a).join(b);
const intval = (v) => parseInt(v, 10) || 0;
const isset = (v) => v !== undefined && v !== null;
const empty = (v) =>
  v === undefined || v === null || v === '' || v === 0 || v === '0' || v === false ||
  (Array.isArray(v) && v.length === 0);

/** 'YYYY-MM-DD[ HH:MM[:SS]]' -> detik epoch (waktu lokal server). */
function strtotime(str) {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/.exec(String(str));
  if (m) {
    return Math.floor(new Date(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0)).getTime() / 1000);
  }
  const t = Date.parse(str);
  return Number.isNaN(t) ? 0 : Math.floor(t / 1000);
}

const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_SHORT = MONTHS_LONG.map((m) => m.slice(0, 3));

/** Setara date() PHP (subset: d j m n Y y H i s F M). */
function date(fmt, ts) {
  const d = ts === undefined ? new Date() : new Date(ts * 1000);
  const p2 = (n) => String(n).padStart(2, '0');
  const map = {
    d: p2(d.getDate()), j: String(d.getDate()), m: p2(d.getMonth() + 1), n: String(d.getMonth() + 1),
    Y: String(d.getFullYear()), y: String(d.getFullYear()).slice(-2),
    H: p2(d.getHours()), i: p2(d.getMinutes()), s: p2(d.getSeconds()),
    F: MONTHS_LONG[d.getMonth()], M: MONTHS_SHORT[d.getMonth()],
  };
  return String(fmt).replace(/[djmnYyHisFM]/g, (c) => map[c]);
}

/** Tanggal & jam sekarang "Y-m-d H:i:s". */
const nowString = () => date('Y-m-d H:i:s');

/** Simpan notifikasi internal ke tabel notifications. */
async function push_notification(userId, title, message) {
  await db.query('INSERT INTO notifications (id, user_id, title, message) VALUES (?, ?, ?, ?)', [
    generate_id('notif'), userId, title, message,
  ]);
}

// ---------------------------------------------------------------------------
// Foto ruangan & kendaraan (file di assets/images/rooms|vehicles/<id>.jpg|png|webp)
// ---------------------------------------------------------------------------
const MEDIA_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];
const MEDIA_MAX_BYTES = 5 * 1024 * 1024;
const FRONTEND = path.join(__dirname, '..', '..', 'frontend');

const media_safe_id = (id) => String(id ?? '').replace(/[^A-Za-z0-9_-]/g, '');
const media_dir = (type) => path.join(FRONTEND, 'assets', 'images', type);

function media_url(type, id, placeholder) {
  const safeId = media_safe_id(id);
  if (safeId !== '') {
    for (const ext of MEDIA_EXTENSIONS) {
      const file = path.join(media_dir(type), `${safeId}.${ext}`);
      if (fs.existsSync(file)) {
        return `assets/images/${type}/${safeId}.${ext}?v=${Math.floor(fs.statSync(file).mtimeMs / 1000)}`;
      }
    }
  }
  return 'assets/images/' + placeholder;
}

const room_photo_url = (room) => media_url('rooms', room.id, 'placeholder-room.svg');
const vehicle_photo_url = (v) =>
  media_url('vehicles', v.id, v.vehicle_type === 'Motor' ? 'placeholder-motor.svg' : 'placeholder-car.svg');

function delete_media(type, id) {
  const safeId = media_safe_id(id);
  if (safeId === '') return;
  for (const ext of MEDIA_EXTENSIONS) {
    const file = path.join(media_dir(type), `${safeId}.${ext}`);
    try { if (fs.existsSync(file)) fs.unlinkSync(file); } catch (e) { /* abaikan */ }
  }
}

/**
 * Simpan foto unggahan (objek file dari multer) untuk sebuah ID.
 * Mengembalikan null jika tidak ada file / berhasil, atau kode error ('size', 'format', 'save').
 */
function save_media_upload(type, id, file) {
  if (!file || !file.buffer || file.size === 0) return null;
  if (file.size > MEDIA_MAX_BYTES) return 'size';

  const b = file.buffer;
  let ext = null;
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) ext = 'jpg';
  else if (b.length > 8 && b.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) ext = 'png';
  else if (b.length > 12 && b.slice(0, 4).toString('ascii') === 'RIFF' && b.slice(8, 12).toString('ascii') === 'WEBP') ext = 'webp';
  if (!ext) return 'format';

  const safeId = media_safe_id(id);
  const dir = media_dir(type);
  try {
    if (safeId === '') return 'save';
    fs.mkdirSync(dir, { recursive: true });
    delete_media(type, safeId); // ganti foto lama
    fs.writeFileSync(path.join(dir, `${safeId}.${ext}`), b);
  } catch (e) {
    return 'save';
  }
  return null;
}

// ---------------------------------------------------------------------------
// Jadwal peminjaman yang sedang / akan berlangsung
// ---------------------------------------------------------------------------
/**
 * Ambil peminjaman (Menunggu / Disetujui / Ditolak) yang belum berakhir.
 * type: 'room' | 'vehicle'. Hasil: { id_item: [ {start, end, status, now}, ... ] }
 */
async function get_active_bookings(type) {
  let sql;
  if (type === 'room') {
    sql = `SELECT room_id AS item_id, status,
                  CONCAT(booking_date, ' ', start_time) AS start_dt,
                  CONCAT(booking_date, ' ', end_time)   AS end_dt
           FROM room_bookings
           WHERE status IN ('Menunggu', 'Disetujui', 'Ditolak')
             AND CONCAT(booking_date, ' ', end_time) >= ?
           ORDER BY start_dt`;
  } else {
    sql = `SELECT vehicle_id AS item_id, status,
                  CONCAT(departure_date, ' ', departure_time) AS start_dt,
                  CONCAT(return_date, ' ', return_time)       AS end_dt
           FROM vehicle_bookings
           WHERE status IN ('Menunggu', 'Disetujui', 'Ditolak')
             AND CONCAT(return_date, ' ', return_time) >= ?
           ORDER BY start_dt`;
  }
  const nowStr = nowString();
  const rows = await db.query(sql, [nowStr]);
  const result = {};
  for (const row of rows) {
    (result[row.item_id] = result[row.item_id] || []).push({
      start: row.start_dt.substr(0, 16),
      end: row.end_dt.substr(0, 16),
      status: row.status,
      now: row.status !== 'Ditolak' && row.start_dt <= nowStr && row.end_dt >= nowStr,
    });
  }
  return result;
}

const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

function fmtDate(dt) {
  const t = strtotime(dt);
  return date('j', t) + ' ' + BULAN[Number(date('n', t)) - 1] + ' ' + date('Y', t);
}

/** Mis. "13 Okt 2026, 09:00 - 11:30" atau "13 Okt 2026 08:00 - 15 Okt 2026 17:00". */
function format_booking_range(start, end) {
  if (start.substr(0, 10) === end.substr(0, 10)) {
    return fmtDate(start) + ', ' + start.substr(11, 5) + ' - ' + end.substr(11, 5);
  }
  return fmtDate(start) + ' ' + start.substr(11, 5) + ' - ' + fmtDate(end) + ' ' + end.substr(11, 5);
}

/** Blok HTML jadwal untuk kartu ruangan/kendaraan (tampil tepat di bawah foto). */
function render_booking_schedule(bookings, max = 3, manualStatus = null, okStatus = 'Tersedia') {
  const active = bookings.filter((b) => b.status !== 'Ditolak');
  const rejected = bookings.filter((b) => b.status === 'Ditolak');
  let html = '';

  if (active.length) {
    html += '<div class="mx-3 mt-3 p-2 rounded-lg bg-amber-50 border border-amber-200">';
    html += '<p class="text-[10px] font-bold text-amber-800 mb-1"><i class="fas fa-calendar-xmark mr-1"></i>Jadwal sudah dipinjam:</p>';
    html += '<ul class="space-y-1">';
    for (const b of active.slice(0, max)) {
      const label = b.status === 'Menunggu' ? 'Menunggu persetujuan' : (b.now ? 'Sedang dipinjam' : 'Dipinjam');
      const color = b.now ? 'text-rose-700' : 'text-amber-900';
      html += `<li class="text-[10px] leading-snug ${color}">`
        + `<span class="font-semibold">${h(format_booking_range(b.start, b.end))}</span>`
        + ` <span class="opacity-75">(${label})</span></li>`;
    }
    html += '</ul>';
    if (active.length > max) {
      html += `<p class="text-[10px] text-amber-700 mt-1">+${active.length - max} jadwal lainnya</p>`;
    }
    html += '</div>';
  } else if (manualStatus !== null && manualStatus !== okStatus) {
    html += '<div class="mx-3 mt-3 p-2 rounded-lg bg-slate-100 border border-slate-300">'
      + '<p class="text-[10px] font-bold text-slate-700"><i class="fas fa-circle-info mr-1"></i>Status: '
      + h(manualStatus) + ' (diatur admin, jadwal belum tercatat)</p></div>';
  }

  if (rejected.length) {
    html += '<div class="mx-3 mt-2 p-2 rounded-lg bg-slate-50 border border-slate-200">';
    html += '<p class="text-[10px] font-bold text-slate-600 mb-1"><i class="fas fa-circle-xmark mr-1"></i>Pengajuan ditolak (jadwal ini tetap kosong):</p>';
    html += '<ul class="space-y-1">';
    for (const b of rejected.slice(0, max)) {
      html += '<li class="text-[10px] leading-snug text-slate-500">'
        + `<span class="font-semibold line-through">${h(format_booking_range(b.start, b.end))}</span>`
        + ' <span class="opacity-75">(Ditolak)</span></li>';
    }
    html += '</ul>';
    if (rejected.length > max) {
      html += `<p class="text-[10px] text-slate-500 mt-1">+${rejected.length - max} lainnya</p>`;
    }
    html += '</div>';
  }
  return html;
}

/** Label status kartu: [teks, kelas warna] atau null bila tidak perlu badge. */
function booking_badge(bookings, manualStatus, okStatus = 'Tersedia') {
  if (manualStatus !== okStatus) {
    const text = manualStatus === 'Digunakan' ? 'Sedang Digunakan'
      : manualStatus === 'Dipinjam' ? 'Sedang Dipinjam'
        : manualStatus === 'Servis' ? 'Sedang Servis' : manualStatus;
    return [text, 'bg-slate-700 text-white'];
  }
  const list = bookings.filter((b) => b.status !== 'Ditolak');
  if (list.some((b) => b.now)) return ['Sedang Dipinjam', 'bg-rose-600 text-white'];
  if (list.length) return ['Ada Jadwal Dipinjam', 'bg-amber-500 text-slate-950'];
  return null;
}

/** Status otomatis ruangan/kendaraan berdasarkan jadwal; status manual admin diutamakan. */
function auto_item_status(bookings, manualStatus, type) {
  if (manualStatus !== 'Tersedia') return manualStatus;
  if (bookings.some((b) => b.now)) return type === 'room' ? 'Digunakan' : 'Dipinjam';
  return 'Tersedia';
}

/** Urutkan terbaru dulu berdasarkan created_at. */
const sortByCreatedDesc = (arr) => arr.sort((a, b) => strtotime(b.created_at) - strtotime(a.created_at));

module.exports = {
  generate_id, ENT_QUOTES, h, json_encode, strtoupper, substr, str_replace, intval, isset, empty,
  strtotime, date, nowString, push_notification,
  media_safe_id, room_photo_url, vehicle_photo_url, delete_media, save_media_upload,
  get_active_bookings, format_booking_range, render_booking_schedule, booking_badge, auto_item_status,
  sortByCreatedDesc,
};
