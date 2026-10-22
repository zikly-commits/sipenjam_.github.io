# SIPENJAM (versi Node.js)
Sistem Informasi Peminjaman Ruangan & Kendaraan Dinas — Kanwil Kemenag Prov. Bangka Belitung.
Node.js + Express + EJS + MySQL + Tailwind CSS (CDN). Tampilan, menu, dan alur sama seperti versi PHP.
Notifikasi pengajuan baru dikirim langsung ke WhatsApp admin lewat **Fonnte**.

## Kebutuhan
- **Node.js 18 atau lebih baru** (https://nodejs.org)
- **MySQL** (Laragon: klik *Start All*)
- Koneksi internet (Tailwind, Font Awesome, Chart.js dimuat dari CDN)

## Menjalankan
```bash
cd sipenjam-node/backend
npm install        # pasang dependensi (sekali saja)
npm run setup      # buat database sipenjam_db + data awal + akun login (aman diulang)
npm start          # jalankan aplikasi
```
Buka **http://localhost:3000**

Akun awal:
| Peran   | Email                        | Password   |
|---------|------------------------------|------------|
| Admin   | admin@kemenagbabel.go.id     | admin123   |
| Pegawai | pegawai@kemenagbabel.go.id   | pegawaikmb123 |

Ganti password bawaan setelah login pertama jika aplikasi dipakai di server yang bisa diakses orang lain.
Selama pengembangan bisa memakai `npm run dev` (restart otomatis saat file berubah).

## Pengaturan (file `.env`)
| Kunci | Keterangan |
|-------|------------|
| `PORT` | Port aplikasi (default 3000) |
| `SESSION_SECRET` | Teks acak untuk mengamankan sesi login — **ganti** |
| `DB_HOST` `DB_PORT` `DB_USER` `DB_PASS` `DB_NAME` | Koneksi MySQL (Laragon: root, tanpa password) |
| `WA_ENABLED` | `true` / `false` untuk menyalakan/mematikan notifikasi WhatsApp |
| `FONNTE_TOKEN` | Token **device** Fonnte (dashboard Fonnte → Device → Token) |
| `WA_ADMIN_NUMBERS` | Nomor WhatsApp admin penerima, pisahkan dengan koma. Format `0812…`, `62812…`, atau `+62812…` |
| `APP_URL` | Alamat aplikasi untuk tautan di pesan (ganti saat sudah online) |
| `WA_TIMEOUT` | Batas waktu request ke Fonnte (detik) |
| `CONFIRM_TOKEN_DAYS` | Masa berlaku (hari) tautan konfirmasi cepat di pesan WhatsApp, default 3 |

File `.env.example` adalah contoh tanpa data rahasia.

## Notifikasi WhatsApp (Fonnte)
Saat pegawai mengajukan peminjaman ruangan atau kendaraan, semua nomor di `WA_ADMIN_NUMBERS` menerima pesan berisi
data pengajuan dan tautan ke halaman *Persetujuan*. Pengiriman berjalan di latar belakang: jika Fonnte gagal atau
lambat, pengajuan tetap tersimpan dan pegawai tidak menunggu.

Untuk mengecek token & nomor tanpa membuat pengajuan:
```bash
npm run test:wa
```
Perintah ini mengirim pesan tes dan menampilkan jawaban asli dari Fonnte (`invalid token`, `device disconnected`, dst).
Alasan gagal juga dicatat di `logs/whatsapp.log`.

Catatan: device Fonnte harus berstatus **Connected**. Sebaiknya nomor device (pengirim) berbeda dari nomor admin (penerima).

## Konfirmasi Cepat (Setujui/Tolak tanpa buka web)
Setiap pesan WhatsApp pengajuan baru kini juga berisi dua tautan: **✅ Setujui** dan **❌ Tolak**. Admin cukup
mengetuk salah satunya dari HP, tanpa login ke panel admin sama sekali.

- Tautan **Setujui** membuka halaman ringkas berisi detail pengajuan + satu tombol konfirmasi. Status baru berubah
  menjadi *Disetujui* setelah tombol itu ditekan (bukan saat tautan sekadar dibuka) — ini disengaja, karena WhatsApp
  otomatis mengambil (fetch) tautan untuk membuat pratinjau pesan, jadi tautan tidak boleh langsung memproses apa pun.
- Tautan **Tolak** membuka form alasan penolakan (pilihan sama seperti di panel admin), lalu memproses setelah dikirim.
- Setiap tautan hanya berlaku untuk satu pengajuan, hanya bisa dipakai sekali, dan kedaluwarsa otomatis setelah
  `CONFIRM_TOKEN_DAYS` hari (default 3). Setelah pengajuan diproses lewat tautan ini (atau lewat panel admin
  terlebih dahulu), tautan yang sama akan menampilkan halaman "Sudah Diproses".
- Pengajuan yang disetujui/ditolak lewat tautan ini tercatat dengan `approved_by = "Admin (konfirmasi WhatsApp)"` dan
  pemohon tetap menerima notifikasi seperti biasa.

## Struktur folder
```
sipenjam-node/
├── README.md
├── .gitignore
├── .vscode/
│
├── frontend/                  # Semua yang tampil di browser
│   ├── views/
│   │   ├── layout.ejs         # Kerangka halaman (sidebar, navbar, toast)
│   │   ├── login.ejs
│   │   ├── partials/          # sidebar, navbar
│   │   ├── pages/             # Isi tiap halaman
│   │   └── confirm/           # Halaman konfirmasi cepat (setujui/tolak/status) -- publik, tanpa layout
│   └── assets/
│       ├── css/               # base.css, app.css
│       ├── js/                # app.js, login.js, views/ (skrip tiap halaman)
│       └── images/            # logo, placeholder, foto rooms|vehicles/<id>.jpg|png|webp
│
└── backend/                   # Semua yang jalan di server
    ├── server.js              # Titik masuk: Express, sesi, rute
    ├── package.json
    ├── .env / .env.example    # Pengaturan (DB, Fonnte, dll.)
    ├── config/routes.js       # Peta ?page=... => file di frontend/views/pages/
    ├── routes/
    │   ├── pages.js           # Halaman utama + pengambil data tiap halaman
    │   ├── auth.js            # Login / logout
    │   ├── confirm.js         # Konfirmasi cepat setujui/tolak dari WhatsApp -- publik, tanpa login
    │   └── booking.js, room.js, vehicle.js, employee.js, user.js   # Pemrosesan form
    ├── lib/
    │   ├── db.js              # Koneksi MySQL
    │   ├── helpers.js         # Fungsi bantu (jadwal, foto, status, format)
    │   ├── auth.js            # Pengecekan login/peran
    │   ├── whatsapp.js        # Kirim notifikasi via Fonnte
    │   └── confirmToken.js    # Token sekali-pakai untuk konfirmasi cepat
    ├── database/              # sipenjam_db.sql (skema + data awal)
    ├── scripts/               # setup-db.js, test-wa.js
    └── logs/                  # whatsapp.log
```

Catatan: `npm install`, `npm start`, `npm run setup`, dan file `.env` semuanya ada di folder `backend/`.
