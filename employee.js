// CRUD pegawai (port dari employee_action.php).
const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../lib/db');
const H = require('../lib/helpers');
const { wrap, requireAdmin, input } = require('../lib/auth');

const router = express.Router();

router.all('/', requireAdmin, wrap(async (req, res) => {
  const body = input(req);
  const action = body.action || '';

  if (action === 'save') {
    const id = body.id || '';
    const name = String(body.name || '').trim();
    const nip = String(body.nip || '').trim();
    const email = String(body.email || '').trim();
    const phone = String(body.phone || '').trim();
    const position = String(body.position || '').trim();
    const department = String(body.department || '').trim();
    const password = String(body.password || '');

    if (id) {
      await db.query('UPDATE employees SET name=?, nip=?, email=?, phone=?, position=?, department=? WHERE id=?',
        [name, nip, email, phone, position, department, id]);
    } else {
      const empId = H.generate_id('emp');
      await db.query('INSERT INTO employees (id, nip, name, position, department, phone, email) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [empId, nip, name, position, department, phone, email]);

      // Akun login TIDAK dibuat otomatis. Hanya dibuat bila admin mengisi password secara manual.
      if (password) {
        await db.query("INSERT INTO users (id, name, email, password_hash, role, employee_id) VALUES (?, ?, ?, ?, 'pegawai', ?)",
          [H.generate_id('usr'), name, email, bcrypt.hashSync(password, 10), empId]);
      }
    }
    return res.redirect('/?page=data-pegawai&msg=success');
  }

  if (action === 'delete') {
    await db.query('DELETE FROM employees WHERE id = ?', [body.id]);
    return res.redirect('/?page=data-pegawai&msg=deleted');
  }

  res.redirect('/?page=data-pegawai');
}));

module.exports = router;
