const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');

// Supabase config from environment
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

console.log('Connected to Supabase at', supabaseUrl);

// Seed default admin on startup
(async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@incidencias.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin12345';

    const { data: existingAdmin, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'admin')
      .limit(1);

    if (checkError) throw checkError;

    if (!existingAdmin || existingAdmin.length === 0) {
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(adminPassword, saltRounds);

      const { error: insertError } = await supabase
        .from('users')
        .insert({ username: adminEmail, password_hash: passwordHash, role: 'admin' });

      if (insertError) throw insertError;
      console.log(`Default admin user created: ${adminEmail}`);
    }
  } catch (error) {
    console.error('Error seeding default admin:', error.message);
  }
})();

// Supabase-based async helpers — same interface as before
const dbAsync = {
  // Get a single row
  async get(table, columns = '*', filters = {}) {
    let query = supabase.from(table).select(columns);
    for (const [key, value] of Object.entries(filters)) {
      query = query.eq(key, value);
    }
    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    return data; // null if not found
  },

  // Get all rows
  async all(table, columns = '*', filters = {}, options = {}) {
    let query = supabase.from(table).select(columns);
    for (const [key, value] of Object.entries(filters)) {
      query = query.eq(key, value);
    }
    if (options.orderBy) {
      query = query.order(options.orderBy, { ascending: options.ascending ?? false });
    }
    if (options.limit) {
      query = query.range(options.offset || 0, (options.offset || 0) + options.limit - 1);
    }
    if (options.gte) {
      for (const [key, value] of Object.entries(options.gte)) {
        query = query.gte(key, value);
      }
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  // Insert a row
  async run(table, data) {
    const { data: result, error } = await supabase
      .from(table)
      .insert(data)
      .select('id');
    if (error) throw error;
    return { lastID: result?.[0]?.id, changes: result?.length || 0 };
  },

  // Update rows
  async update(table, data, filters = {}) {
    let query = supabase.from(table).update(data);
    for (const [key, value] of Object.entries(filters)) {
      query = query.eq(key, value);
    }
    const { data: result, error } = await query.select();
    if (error) throw error;
    return { changes: result?.length || 0 };
  },

  // Delete rows
  async remove(table, filters = {}) {
    let query = supabase.from(table).delete();
    for (const [key, value] of Object.entries(filters)) {
      query = query.eq(key, value);
    }
    const { error } = await query;
    if (error) throw error;
    return { changes: 1 };
  },

  // Raw count query — returns { total: number }
  async count(table, filters = {}) {
    let query = supabase.from(table).select('id', { count: 'exact', head: true });
    for (const [key, value] of Object.entries(filters)) {
      query = query.eq(key, value);
    }
    const { count, error } = await query;
    if (error) throw error;
    return { total: count || 0 };
  },
};

module.exports = {
  db: supabase,
  async: dbAsync,
};
