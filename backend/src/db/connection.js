const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

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

// Read and execute schema.sql if tables don't exist
const schemaPath = path.join(__dirname, 'schema.sql');
db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='users'", (err, row) => {
  if (err) {
    console.error('Error checking schema:', err.message);
  } else if (!row && fs.existsSync(schemaPath)) {
    // Schema doesn't exist, create it
    const schema = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schema, (err) => {
      if (err) {
        console.error('Error initializing schema:', err.message);
      } else {
        console.log('Database schema initialized');
      }
    });
  } else {
    console.log('Database schema already exists');
  }
});

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
