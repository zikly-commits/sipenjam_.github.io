// CRUD ruangan (port dari room_action.php).
const express = require('express');
const multer = require('multer');
const db = require('../lib/db');
const H = require('../lib/helpers');
const { wrap, requireAdmin, input } = require('../lib/auth');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

router.all('/', requireAdmin, upload.single('photo'), wrap(async (req, res) => {
  const body = input(req);
  const action = body.action || '';

  if (action === 'save') {
    let id = body.id || '';
    const name = String(body.room_name || '').trim();
    const capacity = H.intval(body.capacity);
    const status = body.status;
    const location = String(body.location || '').trim();
    const facilities = String(body.facilities || '').trim();

    if (id) {
      await db.query('UPDATE rooms SET room_name=?, capacity=?, status=?, location=?, facilities=? WHERE id=?',
        [name, capacity, status, location, facilities, id]);
    } else {
      id = H.generate_id('rm');
      await db.query('INSERT INTO rooms (id, room_name, capacity, status, location, facilities) VALUES (?, ?, ?, ?, ?, ?)',
        [id, name, capacity, status, location, facilities]);
    }

    // Foto (opsional): assets/images/rooms/<id>.jpg|png|webp
    const photoError = H.save_media_upload('rooms', id, req.file);
    return res.redirect('/?page=data-ruangan&msg=success' + (photoError ? '&photo_error=' + photoError : ''));
  }

  if (action === 'delete') {
    await db.query('DELETE FROM rooms WHERE id = ?', [body.id]);
    H.delete_media('rooms', body.id);
    return res.redirect('/?page=data-ruangan&msg=deleted');
  }

  res.redirect('/?page=data-ruangan');
}));

module.exports = router;
