// Halaman utama (port dari index.php + isi folder views/ versi PHP).
const express = require('express');
const db = require('../lib/db');
const H = require('../lib/helpers');
const routes = require('../config/routes');
const { wrap, requireLoginPage } = require('../lib/auth');

const router = express.Router();

const restrictedForPegawai = ['data-ruangan', 'data-kendaraan', 'data-pegawai', 'persetujuan', 'laporan', 'pengaturan', 'manajemen-pengguna'];
const restrictedForAdmin = ['ajukan-ruangan', 'ajukan-kendaraan', 'peminjaman-saya', 'peminjaman-ruangan', 'peminjaman-kendaraan'];

const adminNavs = [
  { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-pie' },
  { id: 'data-ruangan', label: 'Data Ruangan', icon: 'fa-door-open' },
  { id: 'data-kendaraan', label: 'Data Kendaraan', icon: 'fa-car' },
  { id: 'data-pegawai', label: 'Data Pegawai', icon: 'fa-users' },
  { id: 'persetujuan', label: 'Persetujuan Peminjaman', icon: 'fa-clipboard-check', badge: true },
  { id: 'riwayat', label: 'Riwayat Peminjaman', icon: 'fa-clock-rotate-left' },
  { id: 'laporan', label: 'Laporan', icon: 'fa-file-invoice' },
  { id: 'manajemen-pengguna', label: 'Manajemen Pengguna', icon: 'fa-user-gear' },
  { id: 'profil', label: 'Profil Saya', icon: 'fa-id-badge' },
  { id: 'pengaturan', label: 'Pengaturan System', icon: 'fa-sliders' },
];

const pegawaiNavs = [
  { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-pie' },
  { id: 'ajukan-ruangan', label: 'Ajukan Ruangan', icon: 'fa-plus-circle' },
  { id: 'ajukan-kendaraan', label: 'Ajukan Kendaraan', icon: 'fa-key' },
  { id: 'peminjaman-saya', label: 'Peminjaman Saya', icon: 'fa-list-check' },
  { id: 'riwayat', label: 'Riwayat Peminjaman', icon: 'fa-clock-rotate-left' },
  { id: 'profil', label: 'Profil Saya', icon: 'fa-id-badge' },
];

const PENDING_SQL = `
  SELECT (SELECT COUNT(*) FROM room_bookings WHERE status = 'Menunggu') +
         (SELECT COUNT(*) FROM vehicle_bookings WHERE status = 'Menunggu')`;

// Data pegawai untuk form pengajuan. Tidak ada data bawaan: bila biodata belum
// diisi manual (lewat Profil Saya / Data Pegawai), kolomnya dibiarkan kosong.
async function employeeForForm(currentUser) {
  return (await db.one('SELECT * FROM employees WHERE id = ? OR email = ?', [currentUser.employee_id || '', currentUser.email])) || {
    nip: '',
    department: '',
    name: currentUser.name,
  };
}

// ---------------------------------------------------------------------------
// Pengambil data untuk tiap halaman (setara blok <?php ... ?> di awal tiap view)
// ---------------------------------------------------------------------------
const loaders = {
  async dashboard() {
    const todayStr = H.date('Y-m-d');
    const num = async (sql, p) => Number(await db.val(sql, p)) || 0;

    const totalRuangan = await num('SELECT COUNT(*) FROM rooms');
    const totalKendaraan = await num('SELECT COUNT(*) FROM vehicles');
    const totalPegawai = await num('SELECT COUNT(*) FROM employees');
    const todayBookings =
      (await num('SELECT COUNT(*) FROM room_bookings WHERE booking_date = ?', [todayStr])) +
      (await num('SELECT COUNT(*) FROM vehicle_bookings WHERE departure_date = ?', [todayStr]));
    const pendingCount = await num(PENDING_SQL);
    const countStatus = (s) => num(
      `SELECT (SELECT COUNT(*) FROM room_bookings WHERE status = ?) + (SELECT COUNT(*) FROM vehicle_bookings WHERE status = ?)`,
      [s, s]);
    const approvedCount = await countStatus('Disetujui');
    const rejectedCount = await countStatus('Ditolak');
    const vehiclesInUseCount = await num(
      `SELECT COUNT(*) FROM vehicle_bookings WHERE status = 'Disetujui' AND departure_date <= ? AND return_date >= ?`,
      [todayStr, todayStr]);

    const recentBookings = await db.query(`
      (SELECT id, applicant_name, department, 'Ruangan' AS type,
              (SELECT room_name FROM rooms WHERE id = room_id) AS title,
              booking_date AS date, start_time, end_time, status, created_at
       FROM room_bookings)
      UNION ALL
      (SELECT id, applicant_name, department, 'Kendaraan' AS type,
              (SELECT CONCAT(brand, ' ', model) FROM vehicles WHERE id = vehicle_id) AS title,
              departure_date AS date, departure_time AS start_time, return_time AS end_time, status, created_at
       FROM vehicle_bookings)
      ORDER BY created_at DESC LIMIT 5`);

    return { totalRuangan, totalKendaraan, totalPegawai, todayBookings, pendingCount, approvedCount, rejectedCount, vehiclesInUseCount, recentBookings };
  },

  async 'data-ruangan'() {
    return {
      rooms: await db.query('SELECT * FROM rooms ORDER BY room_name ASC'),
      roomBookings: await H.get_active_bookings('room'),
    };
  },

  async 'data-kendaraan'() {
    return {
      vehicles: await db.query('SELECT * FROM vehicles ORDER BY brand ASC'),
      vehicleBookings: await H.get_active_bookings('vehicle'),
    };
  },

  async 'data-pegawai'() {
    return { employees: await db.query('SELECT * FROM employees ORDER BY name ASC') };
  },

  async 'ajukan-ruangan'(req, currentUser) {
    return {
      rooms: await db.query("SELECT * FROM rooms WHERE status != 'Tidak tersedia' ORDER BY room_name"),
      roomBookings: await H.get_active_bookings('room'),
      emp: await employeeForForm(currentUser),
      todayStr: H.date('Y-m-d'),
    };
  },

  async 'ajukan-kendaraan'(req, currentUser) {
    return {
      vehicles: await db.query("SELECT * FROM vehicles WHERE status != 'Servis' OR status IS NULL ORDER BY brand, model"),
      vehicleBookings: await H.get_active_bookings('vehicle'),
      emp: await employeeForForm(currentUser),
      todayStr: H.date('Y-m-d'),
    };
  },

  async 'peminjaman-saya'(req, currentUser) {
    const rooms = await db.query(`
      SELECT rb.*, 'Ruangan' AS type, r.room_name AS title
      FROM room_bookings rb JOIN rooms r ON rb.room_id = r.id
      WHERE user_id = ? ORDER BY rb.created_at DESC`, [currentUser.id]);
    const vehicles = await db.query(`
      SELECT vb.*, 'Kendaraan' AS type, CONCAT(v.brand, ' ', v.model, ' (', v.license_plate, ')') AS title,
             vb.departure_date AS booking_date, vb.departure_time AS start_time, vb.return_time AS end_time
      FROM vehicle_bookings vb JOIN vehicles v ON vb.vehicle_id = v.id
      WHERE user_id = ? ORDER BY vb.created_at DESC`, [currentUser.id]);
    return { myBookings: H.sortByCreatedDesc(rooms.concat(vehicles)) };
  },

  async persetujuan() {
    const rooms = await db.query(`
      SELECT rb.*, 'Ruangan' AS category, r.room_name AS title
      FROM room_bookings rb JOIN rooms r ON rb.room_id = r.id
      ORDER BY rb.created_at DESC`);
    const vehicles = await db.query(`
      SELECT vb.*, 'Kendaraan' AS category, CONCAT(v.brand, ' ', v.model, ' (', v.license_plate, ')') AS title,
             vb.departure_date AS booking_date, vb.departure_time AS start_time, vb.return_time AS end_time
      FROM vehicle_bookings vb JOIN vehicles v ON vb.vehicle_id = v.id
      ORDER BY vb.created_at DESC`);
    return { allRequests: H.sortByCreatedDesc(rooms.concat(vehicles)) };
  },

  async riwayat(req, currentUser) {
    const where = currentUser.role === 'pegawai' ? 'WHERE user_id = ?' : '';
    const params = currentUser.role === 'pegawai' ? [currentUser.id] : [];
    const rooms = await db.query(`
      SELECT rb.*, 'Ruangan' AS category, r.room_name AS title
      FROM room_bookings rb JOIN rooms r ON rb.room_id = r.id
      ${where} ORDER BY rb.created_at DESC`, params);
    const vehicles = await db.query(`
      SELECT vb.*, CASE WHEN v.vehicle_type = 'Mobil' THEN 'Mobil' ELSE 'Motor' END AS category,
             CONCAT(v.brand, ' ', v.model, ' (', v.license_plate, ')') AS title,
             vb.departure_date AS booking_date, vb.departure_time AS start_time, vb.return_time AS end_time
      FROM vehicle_bookings vb JOIN vehicles v ON vb.vehicle_id = v.id
      ${where} ORDER BY vb.created_at DESC`, params);
    return { allHistory: H.sortByCreatedDesc(rooms.concat(vehicles)) };
  },

  async laporan() {
    const rooms = await db.query('SELECT rb.*, r.room_name FROM room_bookings rb JOIN rooms r ON rb.room_id = r.id');
    const vehicles = await db.query('SELECT vb.*, v.brand FROM vehicle_bookings vb JOIN vehicles v ON vb.vehicle_id = v.id');
    return { allReports: rooms.concat(vehicles) };
  },

  async 'manajemen-pengguna'() {
    return { users: await db.query('SELECT * FROM users ORDER BY name ASC') };
  },

  async profil(req, currentUser) {
    // Biodata diisi manual oleh pemilik akun; tidak ada nilai bawaan.
    const emp = (await db.one('SELECT * FROM employees WHERE id = ? OR email = ?', [currentUser.employee_id || '', currentUser.email])) || {
      name: '', nip: '', position: '', department: '', phone: '',
    };
    return { emp };
  },

  async pengaturan() { return {}; },
};

// ---------------------------------------------------------------------------
router.get('/', requireLoginPage, wrap(async (req, res) => {
  const currentUser = req.session.user;
  let page = typeof req.query.page === 'string' ? req.query.page : 'dashboard';
  let accessError = false;
  let accessErrorMsg = null;

  // Access control
  if (currentUser.role === 'pegawai' && restrictedForPegawai.includes(page)) {
    page = 'dashboard';
    accessError = true;
  }
  if (currentUser.role === 'admin' && restrictedForAdmin.includes(page)) {
    page = 'dashboard';
    accessError = true;
    accessErrorMsg = 'Akun Admin tidak dapat mengajukan peminjaman. Admin hanya menyetujui peminjaman dan mengelola data.';
  }

  // Notifikasi (admin melihat semua)
  const notifications = await db.query(
    "SELECT * FROM notifications WHERE user_id = ? OR ? = 'admin' ORDER BY created_at DESC",
    [currentUser.id, currentUser.role]);
  const unreadCount = notifications.reduce((acc, n) => acc + (n.is_read ? 0 : 1), 0);

  const pendingCount = Number(await db.val(PENDING_SQL)) || 0;
  const navs = (currentUser.role === 'admin' ? adminNavs : pegawaiNavs)
    .map((n) => (n.badge ? { ...n, badge: pendingCount } : n));

  const key = routes[page] ? page : 'dashboard';
  const data = await loaders[key](req, currentUser);

  res.render('layout', {
    // data layout
    currentUser, page, query: req.query, notifications, unreadCount, navs,
    accessError, accessErrorMsg, viewFile: routes[key],
    // data halaman (pendingCount milik dashboard menimpa jika ada)
    pendingCount, ...data,
  });
}));

module.exports = router;
