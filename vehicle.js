// CRUD kendaraan (port dari vehicle_action.php).
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
    const type = body.vehicle_type;
    const brand = String(body.brand || '').trim();
    const model = String(body.model || '').trim();
    const plate = String(body.license_plate || '').trim();
    const year = H.intval(body.year);
    const condition = body.condition;
    const status = body.status;

    if (id) {
      await db.query('UPDATE vehicles SET vehicle_type=?, brand=?, model=?, license_plate=?, year=?, `condition`=?, status=? WHERE id=?',
        [type, brand, model, plate, year, condition, status, id]);
    } else {
      id = H.generate_id('vh');
      await db.query('INSERT INTO vehicles (id, vehicle_type, brand, model, license_plate, year, `condition`, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [id, type, brand, model, plate, year, condition, status]);
    }

    // Foto (opsional): assets/images/vehicles/<id>.jpg|png|webp
    const photoError = H.save_media_upload('vehicles', id, req.file);
    return res.redirect('/?page=data-kendaraan&msg=success' + (photoError ? '&photo_error=' + photoError : ''));
  }

  if (action === 'delete') {
    await db.query('DELETE FROM vehicles WHERE id = ?', [body.id]);
    H.delete_media('vehicles', body.id);
    return res.redirect('/?page=data-kendaraan&msg=deleted');
  }

  res.redirect('/?page=data-kendaraan');
}));

module.exports = router;
