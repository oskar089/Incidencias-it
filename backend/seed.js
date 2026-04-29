require('dotenv').config();
const path = require('path');
const Database = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

// Database path
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'data', 'helpdesk.db');
const schemaPath = path.join(__dirname, 'src', 'db', 'schema.sql');

// Bcrypt cost factor (per spec section 6.1)
const SALT_ROUNDS = 12;

async function seed() {
  let db;
  
  try {
    // Connect to database
    db = new Database.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err.message);
        process.exit(1);
      }
    });
    
    console.log('Connected to database at', dbPath);
    
    // Promisify db methods
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
    
    // Initialize schema if needed
    const tableExists = await dbAsync.get(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='users'
    `);
    
    if (!tableExists) {
      if (require('fs').existsSync(schemaPath)) {
        const schema = require('fs').readFileSync(schemaPath, 'utf8');
        await dbAsync.exec(schema);
        console.log('Database schema initialized');
      }
    }
    
    // Seed users (idempotent - check first)
    const users = [
      { username: 'admin', password: 'admin123', role: 'admin' },
      { username: 'tecnico1', password: 'tecnico123', role: 'tecnico' },
      { username: 'cliente1', password: 'cliente123', role: 'client' }
    ];
    
    for (const user of users) {
      // Check if user exists
      const existing = await dbAsync.get('SELECT id FROM users WHERE username = ?', [user.username]);
      
      if (!existing) {
        const passwordHash = await bcrypt.hash(user.password, SALT_ROUNDS);
        await dbAsync.run(
          'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
          [user.username, passwordHash, user.role]
        );
        console.log(`Created user: ${user.username} (${user.role})`);
      } else {
        console.log(`User already exists: ${user.username}`);
      }
    }
    
    // Verify users
    const userCount = await dbAsync.get('SELECT COUNT(*) as count FROM users');
    console.log(`Users in database: ${userCount.count}`);
    
    // Seed tickets if none exist (idempotent)
    const ticketCount = await dbAsync.get('SELECT COUNT(*) as count FROM tickets');
    
    if (ticketCount.count > 0) {
      console.log(`Tickets already seeded (${ticketCount.count} tickets exist)`);
    } else {
      const tickets = [
        { title: 'Cannot access email', description: 'User cannot login to Outlook', status: 'open', priority: 'high', category: 'Email', reporter: 'juan@company.com', assignee: 'tecnico1' },
        { title: 'PC not turning on', description: 'Office 202 computer not responding', status: 'in_progress', priority: 'urgent', category: 'Hardware', reporter: 'maria@company.com', assignee: 'tecnico1' },
        { title: 'Unstable WiFi network', description: 'WiFi connection drops frequently on floor 3', status: 'open', priority: 'medium', category: 'Network', reporter: 'carlos@company.com', assignee: null },
        { title: 'Printer not printing', description: 'HP LaserJet printer not responding', status: 'resolved', priority: 'medium', category: 'Hardware', reporter: 'ana@company.com', assignee: 'tecnico1' },
        { title: 'Error opening SharePoint', description: 'SharePoint shows error 403', status: 'open', priority: 'high', category: 'Software', reporter: 'luis@company.com', assignee: null },
        { title: 'New software request', description: 'Need to install Adobe Creative Suite', status: 'open', priority: 'low', category: 'Software', reporter: 'sofia@company.com', assignee: null },
        { title: 'Recurring blue screen', description: 'BSOD appears every 2 hours on workstation 405', status: 'in_progress', priority: 'urgent', category: 'Hardware', reporter: 'pedro@company.com', assignee: 'tecnico1' },
        { title: 'Cannot access shared folder', description: 'Unable to access Finance folder', status: 'closed', priority: 'medium', category: 'Network', reporter: 'laura@company.com', assignee: 'tecnico1' },
        { title: 'Outlook very slow', description: 'Outlook takes more than 5 minutes to open', status: 'open', priority: 'medium', category: 'Email', reporter: 'diego@company.com', assignee: null },
        { title: 'VPN connection issue', description: 'Cannot connect to corporate VPN', status: 'open', priority: 'high', category: 'Network', reporter: 'valentina@company.com', assignee: null },
        { title: 'Mouse not working', description: 'USB mouse stopped responding', status: 'resolved', priority: 'low', category: 'Hardware', reporter: 'jorge@company.com', assignee: 'tecnico1' },
        { title: 'Windows update failed', description: 'Windows Update shows error 0x80070005', status: 'in_progress', priority: 'high', category: 'Software', reporter: 'camila@company.com', assignee: 'tecnico1' },
        { title: 'Remote access request', description: 'Need to configure remote access to server', status: 'open', priority: 'medium', category: 'Network', reporter: 'martin@company.com', assignee: null },
        { title: 'Sticky keyboard keys', description: 'Some keyboard keys not responding correctly', status: 'closed', priority: 'low', category: 'Hardware', reporter: 'florencia@company.com', assignee: 'tecnico1' },
        { title: 'Digital signature problem', description: 'Cannot sign documents digitally', status: 'open', priority: 'high', category: 'Software', reporter: 'nicolas@company.com', assignee: null },
        { title: 'Monitor flickering', description: 'Dell monitor flickers when connected via HDMI', status: 'open', priority: 'medium', category: 'Hardware', reporter: 'elena@company.com', assignee: null },
        { title: 'Cannot access company portal', description: 'Company portal returns 500 error', status: 'in_progress', priority: 'high', category: 'Software', reporter: 'roberto@company.com', assignee: 'tecnico1' },
        { title: 'Slow file server', description: 'File server response time over 10 seconds', status: 'open', priority: 'medium', category: 'Network', reporter: 'patricia@company.com', assignee: null },
        { title: 'Backup failed', description: 'Nightly backup job failed with error code 0x80780048', status: 'resolved', priority: 'high', category: 'Software', reporter: 'gabriel@company.com', assignee: 'tecnico1' },
        { title: 'Email quota exceeded', description: 'User mailbox has exceeded 50GB quota', status: 'open', priority: 'urgent', category: 'Email', reporter: 'monica@company.com', assignee: null }
      ];
      
      for (const ticket of tickets) {
        await dbAsync.run(`
          INSERT INTO tickets (title, description, status, priority, category, reporter, assignee, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `, [
          ticket.title,
          ticket.description,
          ticket.status,
          ticket.priority,
          ticket.category,
          ticket.reporter,
          ticket.assignee
        ]);
      }
      
      console.log(`Created ${tickets.length} seed tickets`);
    }
    
    // Final verification
    const finalUserCount = await dbAsync.get('SELECT COUNT(*) as count FROM users');
    const finalTicketCount = await dbAsync.get('SELECT COUNT(*) as count FROM tickets');
    
    console.log(`\nSeed completed successfully!`);
    console.log(`Final count - Users: ${finalUserCount.count}, Tickets: ${finalTicketCount.count}`);
    
    db.close();
    process.exit(0);
    
  } catch (error) {
    console.error('Seed failed:', error);
    if (db) db.close();
    process.exit(1);
  }
}

seed();
