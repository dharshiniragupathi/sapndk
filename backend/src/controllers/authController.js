const pool = require('../config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const findUserByLoginEmail = async (email) => {
  const direct = await pool.query(
    'SELECT * FROM users WHERE LOWER(email) = $1',
    [email]
  );
  if (direct.rows.length > 0) return direct.rows[0];

  if (!email.endsWith('@avp.ac.in')) return null;

  const alias = await pool.query(
    `SELECT u.*
     FROM users u
     JOIN students s ON s.user_id = u.id
     WHERE LOWER(
       REGEXP_REPLACE(COALESCE(u.name, ''), '[^a-z0-9]+', '', 'gi') || '@avp.ac.in'
     ) = $1
     LIMIT 1`,
    [email]
  );

  return alias.rows[0] || null;
};

const login = async (req, res) => {
  const rawEmail = String(req.body?.email || '');
  const email = rawEmail.trim().toLowerCase();
  const password = String(req.body?.password || '');

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const user = await findUserByLoginEmail(email);

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const storedPassword = user.password || '';
    const isBcryptHash = storedPassword.startsWith('$2a$') || storedPassword.startsWith('$2b$') || storedPassword.startsWith('$2y$');

    let isPasswordValid = false;
    if (isBcryptHash) {
      isPasswordValid = await bcrypt.compare(password, storedPassword);
    } else {
      // Temporary fallback for legacy plain-text passwords.
      isPasswordValid = password === storedPassword;
    }

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Auto-upgrade legacy plain-text password to bcrypt hash after successful login.
    if (!isBcryptHash) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, user.id]);
    }
    if (user.role === 'student' && !email.endsWith('@avp.ac.in')) {
      return res.status(403).json({
        message: 'Students must login using @avp.ac.in domain'
      });
    }
    if (user.role === 'staff' && !email.endsWith('@avp.bitsathy.ac.in')) {
      return res.status(403).json({
        message: 'Staff must login using @avp.bitsathy.ac.in domain'
      });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role
      },
      role: user.role
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Login failed' });
  }
};

const getMe = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({ user: result.rows[0] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch profile' });
  }
};

const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'currentPassword and newPassword are required' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ message: 'New password must be at least 8 characters' });
  }

  try {
    const userResult = await pool.query(
      'SELECT id, password FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = userResult.rows[0];
    const storedPassword = user.password || '';
    const isBcryptHash = storedPassword.startsWith('$2a$') || storedPassword.startsWith('$2b$') || storedPassword.startsWith('$2y$');

    let isCurrentPasswordValid = false;
    if (isBcryptHash) {
      isCurrentPasswordValid = await bcrypt.compare(currentPassword, storedPassword);
    } else {
      // Temporary fallback for legacy plain-text passwords.
      isCurrentPasswordValid = currentPassword === storedPassword;
    }

    if (!isCurrentPasswordValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ message: 'New password must be different from current password' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, req.user.id]);

    return res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to change password' });
  }
};

module.exports = { login, getMe, changePassword };
