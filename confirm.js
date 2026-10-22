// Konfirmasi cepat (Setujui/Tolak) langsung dari tautan WhatsApp, TANPA login.
// Token dibuat di routes/booking.js saat pengajuan baru dikirim (lib/confirmToken.js).
//
// Catatan desain: GET hanya menampilkan halaman ringkasan + tombol, bukan langsung
// memproses. Ini sengaja -- WhatsApp otomatis mem-fetch (GET) tautan untuk membuat
// preview/thumbnail saat pesan diterima, jadi kalau GET langsung menyetujui, pengajuan
// bisa ter-approve sendiri sebelum admin benar-benar menekan apa pun. Aksi sungguhan
// (ubah status) hanya terjadi saat admin menekan tombol di halaman (POST).
const express = require('express');
const db = require('../lib/db');
const H = require('../lib/helpers');
const token = require('../lib/confirmToken');
const { wrap } = require('../lib/auth');

const router = express.Router();

const tableOf = (type) => (type === 'room' ? 'room_bookings' : 'vehicle_bookings');
const LABEL_ADMIN = 'Admin (konfirmasi WhatsApp)';

async function ambilPengajuan(type, id) {
  if (type === 'room') {
    return db.one(
      `SELECT rb.*, 'Ruangan' AS category, r.room_name AS title
       FROM room_bookings rb JOIN rooms r ON rb.room_id = r.id WHERE rb.id = ?`, [id]);
  }
  return db.one(
    `SELECT vb.*, 'Kendaraan' AS category, CONCAT(v.brand, ' ', v.model, ' (', v.license_plate, ')') AS title,
            vb.departure_date AS booking_date, vb.departure_time AS start_time, vb.return_time AS end_time
     FROM vehicle_bookings vb JOIN vehicles v ON vb.vehicle_id = v.id WHERE vb.id = ?`, [id]);
}

const halamanStatus = (res, data) => res.render('confirm/status', data);

function halamanTidakValid(res, alasan) {
  if (alasan === 'expired') {
    return halamanStatus(res, {
      type: 'error',
      title: 'Tautan Kedaluwarsa',
      message: `Tautan konfirmasi ini sudah lewat dari ${token.TOKEN_DAYS} hari dan tidak berlaku lagi. Silakan proses pengajuan ini lewat panel admin SIPENJAM.`,
    });
  }
  return halamanStatus(res, {
    type: 'error',
    title: 'Tautan Tidak Valid',
    message: 'Tautan konfirmasi ini tidak ditemukan. Mungkin salah disalin, atau sudah tidak berlaku.',
  });
}

function halamanSudahDiproses(res, pengajuan) {
  const label = pengajuan && pengajuan.status === 'Disetujui' ? 'disetujui'
    : pengajuan && pengajuan.status === 'Ditolak' ? 'ditolak' : 'diproses';
  halamanStatus(res, {
    type: 'info',
    title: 'Sudah Diproses',
    message: `Pengajuan ini sudah ${label} sebelumnya (lewat panel admin atau tautan konfirmasi ini).`,
  });
}

/** Validasi token di URL. Jika valid & masih menunggu, siapkan req.bookingTokenRow + req.pengajuan. */
const muatToken = wrap(async (req, res, next) => {
  const info = await token.ambilToken(req.params.token);
  if (!info) return halamanTidakValid(res, 'notfound');
  if (info.expired) return halamanTidakValid(res, 'expired');

  const pengajuan = await ambilPengajuan(info.row.booking_type, info.row.booking_id);
  if (!pengajuan) {
    return halamanStatus(res, {
      type: 'error',
      title: 'Data Tidak Ditemukan',
      message: 'Pengajuan terkait tautan ini sudah tidak ada (mungkin sudah dihapus).',
    });
  }
  if (info.used || pengajuan.status !== 'Menunggu') return halamanSudahDiproses(res, pengajuan);

  req.bookingTokenRow = info.row;
  req.pengajuan = pengajuan;
  next();
});

// --- SETUJUI ----------------------------------------------------------------
router.get('/setujui/:token', muatToken, (req, res) => {
  res.render('confirm/approve', { pengajuan: req.pengajuan, token: req.params.token });
});

router.post('/setujui/:token', muatToken, wrap(async (req, res) => {
  const ok = await token.klaimToken(req.params.token);
  if (!ok) return halamanSudahDiproses(res, req.pengajuan);

  const { booking_type: type, booking_id: id } = req.bookingTokenRow;
  const table = tableOf(type);
  const upd = await db.query(
    `UPDATE ${table} SET status = 'Disetujui', approved_by = ? WHERE id = ? AND status = 'Menunggu'`,
    [LABEL_ADMIN, id]);
  if (!upd.affectedRows) return halamanSudahDiproses(res, req.pengajuan);

  if (req.pengajuan.user_id) {
    await H.push_notification(req.pengajuan.user_id, 'Pengajuan Disetujui',
      `Pengajuan peminjaman ${type === 'room' ? 'ruangan' : 'kendaraan'} Anda telah disetujui.`);
  }

  halamanStatus(res, {
    type: 'success',
    title: 'Peminjaman Disetujui',
    message: `Pengajuan "${req.pengajuan.title}" atas nama ${req.pengajuan.applicant_name} berhasil disetujui. Pemohon akan menerima notifikasi.`,
  });
}));

// --- TOLAK --------------------------------------------------------------
router.get('/tolak/:token', muatToken, (req, res) => {
  res.render('confirm/reject', { pengajuan: req.pengajuan, token: req.params.token, errorReason: null });
});

router.post('/tolak/:token', muatToken, wrap(async (req, res) => {
  const reason = String((req.body || {}).reason || '').trim();
  if (!reason) {
    return res.render('confirm/reject', {
      pengajuan: req.pengajuan, token: req.params.token, errorReason: 'Alasan penolakan wajib dipilih.',
    });
  }

  const ok = await token.klaimToken(req.params.token);
  if (!ok) return halamanSudahDiproses(res, req.pengajuan);

  const { booking_type: type, booking_id: id } = req.bookingTokenRow;
  const table = tableOf(type);
  const upd = await db.query(
    `UPDATE ${table} SET status = 'Ditolak', rejection_reason = ?, approved_by = ? WHERE id = ? AND status = 'Menunggu'`,
    [reason, LABEL_ADMIN, id]);
  if (!upd.affectedRows) return halamanSudahDiproses(res, req.pengajuan);

  if (req.pengajuan.user_id) {
    await H.push_notification(req.pengajuan.user_id, 'Pengajuan Ditolak', `Pengajuan peminjaman Anda ditolak. Alasan: ${reason}`);
  }

  halamanStatus(res, {
    type: 'error',
    title: 'Peminjaman Ditolak',
    message: `Pengajuan "${req.pengajuan.title}" atas nama ${req.pengajuan.applicant_name} telah ditolak. Alasan akan dikirim ke pemohon.`,
  });
}));

module.exports = router;
