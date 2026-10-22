// Menyiapkan database: import skema + data awal, lalu membuat akun login awal.
// Jalankan sekali:  npm run setup   (aman dijalankan ulang)
process.env.TZ = 'Asia/Jakarta';
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

(async () => {
  const dbName = process.env.DB_NAME || 'sipenjam_db';
  let conn;
  try {
    conn = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
      multipleStatements: true,
    });
  } catch (e) {
    console.error('Gagal terhubung ke MySQL:', e.message);
    console.error('Pastikan MySQL menyala (Laragon: Start All) dan DB_* di file .env sudah benar.');
    process.exit(1);
  }

  // 1. Skema + data awal (ruangan, kendaraan)
  const sql = fs.readFileSync(path.join(__dirname, '..', 'database', 'sipenjam_db.sql'), 'utf8');
  try {
    await conn.query(sql);
    console.log('[1/2] Skema & data awal berhasil diimport.');
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') console.log('[1/2] Data awal sudah ada, dilewati.');
    else { console.error('Gagal import sipenjam_db.sql:', e.message); process.exit(1); }
  }

  // 2. Akun login awal (ditimpa bila sudah ada)
  await conn.query(`USE \`${dbName}\``);
  const akun = [
    ['usr-1', 'Administrator System', 'admin@kemenagbabel.go.id', 'admin123', 'admin', null],
    ['usr-2', 'Pegawai Subbag Kepegawaian', 'pegawai@kemenagbabel.go.id', 'pegawaikmb123', 'pegawai', null],
  ];
  for (const [id, name, email, pass, role, emp] of akun) {
    await conn.query(
      `INSERT INTO users (id, name, email, password_hash, role, employee_id) VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), email = VALUES(email), password_hash = VALUES(password_hash), role = VALUES(role), employee_id = COALESCE(users.employee_id, VALUES(employee_id))`,
      [id, name, email, bcrypt.hashSync(pass, 10), role, emp]);
  }
  console.log('[2/2] Akun login awal siap:');
  console.log('      Admin   : admin@kemenagbabel.go.id   / admin123');
  console.log('      Pegawai : pegawai@kemenagbabel.go.id / pegawaikmb123');
  console.log('\nSelesai. Jalankan aplikasi dengan:  npm start');
  await conn.end();
})();
