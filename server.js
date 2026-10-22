process.env.TZ = 'Asia/Jakarta'; // WIB, dipakai untuk menentukan jadwal "sedang dipinjam"
require('dotenv').config();

const path = require('path');
const express = require('express');
const session = require('express-session');
const H = require('./lib/helpers');

const app = express();
app.disable('x-powered-by');
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'frontend', 'views'));

// Fungsi bantu yang bisa dipanggil langsung dari template (.ejs)
Object.assign(app.locals, {
    h: H.h,
    json_encode: H.json_encode,
    strtoupper: H.strtoupper,
    substr: H.substr,
    str_replace: H.str_replace,
    intval: H.intval,
    isset: H.isset,
    empty: H.empty,
    strtotime: H.strtotime,
    date: H.date,
    ENT_QUOTES: H.ENT_QUOTES,
    room_photo_url: H.room_photo_url,
    vehicle_photo_url: H.vehicle_photo_url,
    render_booking_schedule: H.render_booking_schedule,
    booking_badge: H.booking_badge,
    auto_item_status: H.auto_item_status,
});

app.use(express.urlencoded({ extended: false }));
app.use('/assets', express.static(path.join(__dirname, '..', 'frontend', 'assets')));
app.use(session({
    secret: process.env.SESSION_SECRET || 'sipenjam-ganti-rahasia-ini',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: 'lax', maxAge: 8 * 60 * 60 * 1000 }, // 8 jam
}));

app.use(require('./routes/auth'));
app.use('/konfirmasi', require('./routes/confirm')); // konfirmasi cepat dari WhatsApp -- publik, tanpa login
app.use('/actions/booking', require('./routes/booking'));
app.use('/actions/room', require('./routes/room'));
app.use('/actions/vehicle', require('./routes/vehicle'));
app.use('/actions/employee', require('./routes/employee'));
app.use('/actions/user', require('./routes/user'));
app.use(require('./routes/pages'));

// 404
app.use((req, res) => res.status(404).send('Halaman tidak ditemukan.'));

// Error handler
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
    console.error(err);
    if (res.headersSent) return;
    let pesan = 'Terjadi kesalahan pada server.';
    if (err && err.code === 'ER_DUP_ENTRY') pesan = 'Data sudah ada (duplikat), misalnya email yang sama.';
    else if (err && (err.code === 'ECONNREFUSED' || err.code === 'ER_BAD_DB_ERROR' || err.code === 'ER_ACCESS_DENIED_ERROR')) {
        pesan = 'Koneksi database gagal. Periksa pengaturan DB_* di file .env dan pastikan MySQL menyala.';
    }
    res.status(500).send(`<p style="font-family:sans-serif;padding:2rem">${pesan}<br><br><a href="javascript:history.back()">&larr; Kembali</a></p>`);
});

const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, () => {
    console.log(`SIPENJAM berjalan di http://localhost:${PORT}`);
});