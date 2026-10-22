// Pengajuan, persetujuan, penolakan, dan riwayat peminjaman (port dari booking_action.php).
const express = require('express');
const db = require('../lib/db');
const H = require('../lib/helpers');
const wa = require('../lib/whatsapp');
const confirmToken = require('../lib/confirmToken');
const { wrap, requireLogin, input } = require('../lib/auth');

const router = express.Router();
router.use(requireLogin);

const tableOf = (type) => (type === 'room' ? 'room_bookings' : 'vehicle_bookings');

router.all('/', wrap(async (req, res) => {
  const currentUser = req.currentUser;
  const body = input(req);
  const action = body.action || '';

  // Admin tidak boleh mengajukan peminjaman (hanya menyetujui & mengelola data)
  if (['submit_room', 'submit_vehicle'].includes(action) && currentUser.role === 'admin') {
    return res.redirect('/?page=dashboard');
  }

  // 1. Pengajuan ruangan
  if (action === 'submit_room') {
    const { room_id: roomId, date, start_time: start, end_time: end } = body;

    // Validasi bentrok
    const conflict = await db.val(
      `SELECT COUNT(*) FROM room_bookings
       WHERE room_id = ? AND booking_date = ? AND status != 'Ditolak'
         AND (? < end_time AND ? > start_time)`,
      [roomId, date, start, end]);
    if (Number(conflict) > 0) return res.redirect('/?page=ajukan-ruangan&error=conflict');

    const id = H.generate_id('rb');
    await db.query(
      `INSERT INTO room_bookings (id, user_id, applicant_name, nip, department, room_id, activity_name, booking_date, start_time, end_time, participants, purpose, notes, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Menunggu')`,
      [id, currentUser.id, body.applicant_name, body.nip, body.department, roomId, body.activity_name,
        date, start, end, H.intval(body.participants), body.purpose, body.notes]);

    // Notifikasi internal ke admin
    await H.push_notification('usr-1', 'Pengajuan Ruangan Baru',
      `Pengajuan ${body.activity_name} oleh ${body.applicant_name} menunggu persetujuan.`);

    const roomName = (await db.val('SELECT room_name FROM rooms WHERE id = ?', [roomId])) || 'Ruangan';

    // Token konfirmasi cepat (setujui/tolak langsung dari WhatsApp, tanpa login)
    const token = await confirmToken.buatToken('room', id);
    const links = wa.tautanKonfirmasi(token);

    // KIRIM NOTIFIKASI WHATSAPP (FONNTE) KE ADMIN -- tidak ditunggu agar form tetap cepat
    wa.kirimNotifWhatsAppAdmin('RUANGAN', [
      ['Pemohon', body.applicant_name],
      ['NIP', body.nip],
      ['Unit Kerja', body.department],
      ['Ruangan', roomName],
      ['Kegiatan', body.activity_name],
      ['Tanggal', wa.waTanggal(date)],
      ['Waktu', `${String(start).slice(0, 5)} - ${String(end).slice(0, 5)} WIB`],
      ['Peserta', `${H.intval(body.participants)} orang`],
      ['Keperluan', body.purpose],
    ], links).catch(() => {});

    return res.redirect('/?page=riwayat&msg=success');
  }

  // 2. Pengajuan kendaraan
  if (action === 'submit_vehicle') {
    const vehicleId = body.vehicle_id;
    const { departure_date: depDate, departure_time: depTime, return_date: retDate, return_time: retTime } = body;
    const newStart = `${depDate} ${depTime}`;
    const newEnd = `${retDate} ${retTime}`;

    const conflict = await db.val(
      `SELECT COUNT(*) FROM vehicle_bookings
       WHERE vehicle_id = ? AND status != 'Ditolak'
         AND (? < CONCAT(return_date, ' ', return_time) AND ? > CONCAT(departure_date, ' ', departure_time))`,
      [vehicleId, newStart, newEnd]);
    if (Number(conflict) > 0) return res.redirect('/?page=ajukan-kendaraan&error=conflict');

    const id = H.generate_id('vb');
    await db.query(
      `INSERT INTO vehicle_bookings (id, user_id, applicant_name, nip, department, vehicle_id, departure_date, departure_time, return_date, return_time, destination, purpose, passengers, driver, notes, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Menunggu')`,
      [id, currentUser.id, body.applicant_name, body.nip, body.department, vehicleId, depDate, depTime,
        retDate, retTime, body.destination, body.purpose, H.intval(body.passengers), body.driver, body.notes]);

    await H.push_notification('usr-1', 'Pengajuan Kendaraan Baru',
      `Pengajuan peminjaman kendaraan oleh ${body.applicant_name} menunggu persetujuan.`);

    const vehicleName = (await db.val("SELECT CONCAT(brand, ' ', model) FROM vehicles WHERE id = ?", [vehicleId])) || 'Kendaraan';

    // Token konfirmasi cepat (setujui/tolak langsung dari WhatsApp, tanpa login)
    const token = await confirmToken.buatToken('vehicle', id);
    const links = wa.tautanKonfirmasi(token);

    wa.kirimNotifWhatsAppAdmin('KENDARAAN', [
      ['Pemohon', body.applicant_name],
      ['NIP', body.nip],
      ['Unit Kerja', body.department],
      ['Kendaraan', vehicleName],
      ['Tujuan', body.destination],
      ['Berangkat', `${wa.waTanggal(depDate)} ${String(depTime).slice(0, 5)} WIB`],
      ['Kembali', `${wa.waTanggal(retDate)} ${String(retTime).slice(0, 5)} WIB`],
      ['Penumpang', `${H.intval(body.passengers)} orang`],
      ['Sopir', body.driver],
      ['Keperluan', body.purpose],
    ], links).catch(() => {});

    return res.redirect('/?page=riwayat&msg=success');
  }

  // 3. Setujui (admin)
  if (action === 'approve' && currentUser.role === 'admin') {
    const table = tableOf(body.type);
    await db.query(`UPDATE ${table} SET status = 'Disetujui', approved_by = ? WHERE id = ?`, [currentUser.name, body.id]);
    const userId = await db.val(`SELECT user_id FROM ${table} WHERE id = ?`, [body.id]);
    if (userId) {
      await H.push_notification(userId, 'Pengajuan Disetujui',
        `Pengajuan peminjaman ${body.type === 'room' ? 'ruangan' : 'kendaraan'} Anda telah disetujui.`);
    }
    return res.redirect('/?page=persetujuan&msg=success');
  }

  // 4. Tolak (admin)
  if (action === 'reject' && currentUser.role === 'admin') {
    const table = tableOf(body.type);
    await db.query(`UPDATE ${table} SET status = 'Ditolak', rejection_reason = ?, approved_by = ? WHERE id = ?`,
      [body.reason, currentUser.name, body.id]);
    const userId = await db.val(`SELECT user_id FROM ${table} WHERE id = ?`, [body.id]);
    if (userId) {
      await H.push_notification(userId, 'Pengajuan Ditolak', `Pengajuan peminjaman Anda ditolak. Alasan: ${body.reason}`);
    }
    return res.redirect('/?page=persetujuan&msg=success');
  }

  // 5. Hapus riwayat (hanya yang sudah diproses)
  if (action === 'delete') {
    const table = tableOf(body.type);
    if (currentUser.role === 'admin') {
      await db.query(`DELETE FROM ${table} WHERE id = ? AND status != 'Menunggu'`, [body.id]);
    } else {
      // pegawai hanya boleh menghapus riwayat miliknya sendiri
      await db.query(`DELETE FROM ${table} WHERE id = ? AND user_id = ? AND status != 'Menunggu'`, [body.id, currentUser.id]);
    }
    return res.redirect('/?page=riwayat&msg=deleted');
  }

  // 6. Tandai semua notifikasi terbaca
  if (action === 'mark_notif_read') {
    await db.query("UPDATE notifications SET is_read = 1 WHERE user_id = ? OR ? = 'admin'", [currentUser.id, currentUser.role]);
    return res.redirect(req.get('referer') || '/');
  }

  res.redirect('/');
}));

module.exports = router;
