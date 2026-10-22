// Akun pengguna & profil (port dari user_action.php).
const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../lib/db');
const H = require('../lib/helpers');
const { wrap, requireLogin, input } = require('../lib/auth');

const router = express.Router();
router.use(requireLogin);

router.all('/', wrap(async (req, res) => {
  const currentUser = req.currentUser;
  const body = input(req);
  const action = body.action || '';
  const isAdmin = currentUser.role === 'admin';

  if (action === 'create' && isAdmin) {
    const hash = bcrypt.hashSync(String(body.password || ''), 10);
    await db.query('INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
      [H.generate_id('usr'), String(body.name || '').trim(), String(body.email || '').trim(), hash, body.role]);
    return res.redirect('/?page=manajemen-pengguna&msg=success');
  }

  if (action === 'reset_password' && isAdmin) {
    const hash = bcrypt.hashSync(String(body.new_password || ''), 10);
    await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, body.id]);
    return res.redirect('/?page=manajemen-pengguna&msg=success');
  }

  if (action === 'delete' && isAdmin) {
    await db.query('DELETE FROM users WHERE id = ?', [body.id]);
    return res.redirect('/?page=manajemen-pengguna&msg=deleted');
  }

  if (action === 'update_profile') {
    // Nama lengkap diisi manual; bila dikosongkan, nama akun yang sudah ada dipertahankan (kolom users.name wajib terisi).
    const name = String(body.name || '').trim() || currentUser.name;
    const nip = String(body.nip || '').trim();
    const email = String(body.email || '').trim();
    const phone = String(body.phone || '').trim();
    const position = String(body.position || '').trim();
    const department = String(body.department || '').trim();
    const newPass = String(body.password || '').trim();

    if (newPass) {
      await db.query('UPDATE users SET name = ?, email = ?, password_hash = ? WHERE id = ?',
        [name, email, bcrypt.hashSync(newPass, 10), currentUser.id]);
    } else {
      await db.query('UPDATE users SET name = ?, email = ? WHERE id = ?', [name, email, currentUser.id]);
    }

    // Biodata diisi manual. Bila akun belum punya data pegawai, buat saat pertama kali disimpan.
    if (currentUser.employee_id) {
      await db.query('UPDATE employees SET name = ?, nip = ?, email = ?, phone = ?, position = ?, department = ? WHERE id = ?',
        [name, nip, email, phone, position, department, currentUser.employee_id]);
    } else {
      const empId = H.generate_id('emp');
      await db.query('INSERT INTO employees (id, nip, name, position, department, phone, email) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [empId, nip, name, position, department, phone, email]);
      await db.query('UPDATE users SET employee_id = ? WHERE id = ?', [empId, currentUser.id]);
      req.session.user.employee_id = empId;
    }

    req.session.user.name = name;
    req.session.user.email = email;
    return req.session.save(() => res.redirect('/?page=profil&msg=success'));
  }

  res.redirect('/');
}));

module.exports = router;
