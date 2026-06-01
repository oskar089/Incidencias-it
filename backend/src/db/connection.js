const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');

// Get database path from environment or use default
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '..', '..', 'data', 'helpdesk.db');

// Ensure the data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to database at', dbPath);
  }
});

// Read and execute schema.sql if tables don't exist, then seed default admin
const schemaPath = path.join(__dirname, 'schema.sql');
const SALT_ROUNDS = 12;

db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='users'", async (err, row) => {
  if (err) {
    console.error('Error checking schema:', err.message);
  } else if (!row && fs.existsSync(schemaPath)) {
    // Schema doesn't exist, create it
    const schema = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schema, async (err) => {
      if (err) {
        console.error('Error initializing schema:', err.message);
      } else {
        console.log('Database schema initialized');
        await seedDefaultAdmin();
      }
    });
  } else {
    console.log('Database schema already exists');
    // Ensure at least one admin exists on every startup
    await seedDefaultAdmin();
  }
});

async function seedDefaultAdmin() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@incidencias.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin12345';

    const existingAdmin = await new Promise((resolve, reject) => {
      db.get('SELECT id FROM users WHERE role = ?', ['admin'], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash(adminPassword, SALT_ROUNDS);
      await new Promise((resolve, reject) => {
        db.run('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
          [adminEmail, passwordHash, 'admin'],
          function(err) { if (err) reject(err); else resolve(this); }
        );
      });
      console.log(`Default admin user created: ${adminEmail}`);
    }
  } catch (error) {
    console.error('Error seeding default admin:', error.message);
  }
}

// Promisify db methods for async/await usage
const dbAsync = {
  run: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  },
  get: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },
  all: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },
  exec: (sql) => {
    return new Promise((resolve, reject) => {
      db.exec(sql, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
};

// Export the database instance with async helpers
module.exports = {
  db,
  async: dbAsync
};
