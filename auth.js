// Login & logout (port dari login.php, login_action.php, logout_action.php).
const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../lib/db');
const { wrap, fromPhpHash } = require('../lib/auth');

const router = express.Router();

router.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/');
  res.render('login', { query: req.query });
});

router.post('/actions/login', wrap(async (req, res) => {
  const email = String(req.body.email || '').trim();
  const password = String(req.body.password || '');

  const user = await db.one('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [email]);

  // Memeriksa password hash terenkripsi (kompatibel dengan hash bcrypt dari PHP)
  if (user && bcrypt.compareSync(password, fromPhpHash(user.password_hash))) {
    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      employee_id: user.employee_id,
    };
    return req.session.save(() => res.redirect('/?page=dashboard'));
  }
  res.redirect('/login?error=1');
}));

router.get('/actions/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

module.exports = router;
