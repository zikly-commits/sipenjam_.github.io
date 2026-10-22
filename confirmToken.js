// Token konfirmasi sekali-pakai untuk menyetujui/menolak peminjaman langsung dari
// tautan WhatsApp, tanpa perlu login ke web. Dibuat saat pengajuan baru dikirim
// (lihat routes/booking.js) dan divalidasi/diklaim di routes/confirm.js.
const crypto = require('crypto');
const db = require('./db');

const TOKEN_DAYS = Number(process.env.CONFIRM_TOKEN_DAYS || 3);

/** Buat token baru untuk sebuah pengajuan. bookingType: 'room' | 'vehicle'. */
async function buatToken(bookingType, bookingId) {
  const token = crypto.randomBytes(32).toString('hex'); // 256-bit, tidak bisa ditebak
  await db.query(
    `INSERT INTO booking_confirm_tokens (token, booking_type, booking_id, expires_at)
     VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL ? DAY))`,
    [token, bookingType, bookingId, TOKEN_DAYS]);
  return token;
}

/**
 * Ambil & periksa status token.
 * Mengembalikan null jika token tidak ditemukan, atau { row, used, expired }.
 */
async function ambilToken(token) {
  const row = await db.one('SELECT * FROM booking_confirm_tokens WHERE token = ?', [token]);
  if (!row) return null;
  return {
    row,
    used: !!row.used_at,
    expired: new Date(row.expires_at).getTime() < Date.now(),
  };
}

/**
 * Klaim token secara atomik supaya tidak bisa dipakai dua kali (mis. dua admin
 * menekan tombol konfirmasi hampir bersamaan). Mengembalikan true jika berhasil.
 */
async function klaimToken(token) {
  const result = await db.query(
    `UPDATE booking_confirm_tokens SET used_at = NOW() WHERE token = ? AND used_at IS NULL AND expires_at > NOW()`,
    [token]);
  return result.affectedRows > 0;
}

module.exports = { buatToken, ambilToken, klaimToken, TOKEN_DAYS };
