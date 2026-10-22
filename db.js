// Koneksi MySQL (setara config/database.php + PDO di versi PHP).
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'sipenjam_db',
  charset: 'utf8mb4',
  dateStrings: true,        // DATE/TIME/DATETIME dikembalikan sebagai teks, sama seperti PDO di PHP
  waitForConnections: true,
  connectionLimit: 10,
});

const clean = (params) => params.map((v) => (v === undefined ? null : v));

/** Jalankan query, kembalikan array baris. */
async function query(sql, params = []) {
  const [rows] = await pool.query(sql, clean(params));
  return rows;
}

/** Kembalikan baris pertama (atau undefined). */
async function one(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0];
}

/** Kembalikan kolom pertama dari baris pertama (setara fetchColumn()). */
async function val(sql, params = []) {
  const row = await one(sql, params);
  return row ? Object.values(row)[0] : undefined;
}

module.exports = { pool, query, one, val };
