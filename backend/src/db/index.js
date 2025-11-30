const { createClient } = require('@supabase/supabase-js');

// Supabase client configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('ERROR: Supabase configuration missing!');
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file');
  process.exit(1);
}

console.log(`Connecting to Supabase at ${SUPABASE_URL}`);

// Create Supabase client with service role key for backend operations
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Helper functions to mimic Sequelize-like operations
const db = {
  // User operations
  users: {
    async create(data) {
      const { data: user, error } = await supabase
        .from('users')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return user;
    },
    async findOne(where) {
      let query = supabase.from('users').select('*');
      for (const [key, value] of Object.entries(where)) {
        query = query.eq(key, value);
      }
      const { data, error } = await query.single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    async findByPk(id) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    async update(data, where) {
      let query = supabase.from('users').update(data);
      for (const [key, value] of Object.entries(where)) {
        query = query.eq(key, value);
      }
      const { data: updated, error } = await query.select();
      if (error) throw error;
      return updated;
    }
  },

  // Attendance operations
  attendances: {
    async create(data) {
      const { data: attendance, error } = await supabase
        .from('attendances')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return attendance;
    },
    async findOne(options = {}) {
      let query = supabase.from('attendances').select('*');
      if (options.where) {
        for (const [key, value] of Object.entries(options.where)) {
          query = query.eq(key, value);
        }
      }
      if (options.order) {
        const [field, direction] = options.order[0];
        query = query.order(field, { ascending: direction === 'ASC' });
      }
      const { data, error } = await query.limit(1).single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    async findAll(options = {}) {
      let query = supabase.from('attendances').select('*, users(*)');
      if (options.where) {
        for (const [key, value] of Object.entries(options.where)) {
          if (key === 'userId') {
            query = query.eq('user_id', value);
          } else {
            query = query.eq(key, value);
          }
        }
      }
      if (options.order) {
        for (const [field, direction] of options.order) {
          const dbField = field === 'sessionNumber' ? 'session_number' : field;
          query = query.order(dbField, { ascending: direction === 'ASC' });
        }
      }
      if (options.limit) {
        query = query.limit(options.limit);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    async update(data, where) {
      let query = supabase.from('attendances').update(data);
      for (const [key, value] of Object.entries(where)) {
        query = query.eq(key, value);
      }
      const { data: updated, error } = await query.select();
      if (error) throw error;
      return updated;
    },
    async max(field, options = {}) {
      let query = supabase.from('attendances').select(field);
      if (options.where) {
        for (const [key, value] of Object.entries(options.where)) {
          if (key === 'userId') {
            query = query.eq('user_id', value);
          } else {
            query = query.eq(key, value);
          }
        }
      }
      query = query.order(field, { ascending: false }).limit(1);
      const { data, error } = await query;
      if (error) throw error;
      return data && data.length > 0 ? data[0][field] : null;
    }
  }
};

// Test connection
async function testConnection() {
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error && error.code !== 'PGRST116' && error.code !== '42P01') {
      throw error;
    }
    console.log('Supabase connection successful');
    return true;
  } catch (err) {
    console.error('Supabase connection error:', err.message);
    return false;
  }
}

module.exports = { supabase, db, testConnection };
