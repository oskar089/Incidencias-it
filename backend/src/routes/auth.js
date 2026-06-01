const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db/connection');

const router = express.Router();

// JWT Secret from environment
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const SALT_ROUNDS = 12;

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, nombre, role } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Check if user exists
    const existingUser = await db.async.get('users', 'id', { username: email });
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const result = await db.async.run('users', {
      username: email,
      password_hash: passwordHash,
      role: role || 'client'
    });

    // Get created user
    const user = await db.async.get('users', 'id, username, role', { id: result.lastID });

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      access_token: token,
      token_type: 'bearer',
      user: {
        id: user.id,
        email: user.username,
        role: user.role,
        nombre: nombre || user.username
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await db.async.get('users', 'id, username, password_hash, role', { username: email });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      access_token: token,
      token_type: 'bearer',
      user: {
        id: user.id,
        email: user.username,
        role: user.role,
        nombre: user.username
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// Middleware to require admin role
function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// GET /api/auth/users - Admin: list all users
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await db.async.all('users', 'id, username, role', {}, { orderBy: 'id', ascending: true });
    res.json({ users });
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/users - Admin: create user with role
router.post('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { email, password, nombre, role } = req.body;

    // Validate input
    if (!email || !password || !role) {
      return res.status(400).json({ error: 'Email, password and role are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const validRoles = ['admin', 'tecnico', 'visor'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: `Role must be one of: ${validRoles.join(', ')}` });
    }

    // Check if user exists
    const existingUser = await db.async.get('users', 'id', { username: email });
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const result = await db.async.run('users', {
      username: email,
      password_hash: passwordHash,
      role
    });

    // Get created user
    const user = await db.async.get('users', 'id, username, role', { id: result.lastID });

    res.status(201).json({
      user: {
        id: user.id,
        email: user.username,
        role: user.role,
        nombre: nombre || user.username
      }
    });
  } catch (error) {
    console.error('Admin create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/auth/users/:id - Admin: delete a user
router.delete('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    // Do not allow deleting yourself
    if (userId === req.user.userId) {
      return res.status(400).json({ error: 'No puedes eliminarte a ti mismo' });
    }

    // Check if user exists
    const user = await db.async.get('users', 'id', { id: userId });
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    await db.async.remove('users', { id: userId });
    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = { router, authenticateToken };
