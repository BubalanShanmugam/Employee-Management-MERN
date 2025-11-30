const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { models } = require('../../db');

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';

async function register(req, res) {
  try {
    const { name, email, password, role = 'employee', employeeId, department } = req.body;
    if (!name || !email || !password || !employeeId) return res.status(400).json({ message: 'Missing fields' });

    const existing = await models.User.findOne({ where: { email } });
    if (existing) return res.status(409).json({ message: 'Email already in use' });

    const hashed = await bcrypt.hash(password, 10);
    await models.User.create({ name, email, password: hashed, role, employeeId, department });

    // As requested: 204 No Content on successful register
    return res.status(204).send();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Missing credentials' });

    // Optional: allow frontend to indicate whether user intends to login as employee or manager
    // Accepts: req.body.loginAs or req.query.loginAs with values 'employee'|'manager'
    const requestedRole = (req.body && req.body.loginAs) || (req.query && req.query.loginAs) || null;

    const user = await models.User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    // If caller specified a desired login role, enforce it
    if (requestedRole) {
      const normalized = String(requestedRole).toLowerCase();
      if (normalized === 'employee' && user.role !== 'employee') {
        return res.status(403).json({ message: 'User is not an employee' });
      }
      if (normalized === 'manager' && user.role !== 'manager') {
        return res.status(403).json({ message: 'User is not a manager' });
      }
    }

    const payload = { id: user.id, role: user.role };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    return res.status(200).json({ message: 'Login successful', token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function me(req, res) {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const user = await models.User.findByPk(userId, { attributes: { exclude: ['password'] } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    return res.status(200).json({ message: 'User fetched', user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { register, login, me };
