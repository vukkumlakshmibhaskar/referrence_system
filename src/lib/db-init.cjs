const { Pool } = require('pg');
const { loadEnvConfig } = require('@next/env');

loadEnvConfig(process.cwd());

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'referral_system',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

async function initDatabase() {
  const client = await pool.connect();
  try {
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        name VARCHAR(255) NOT NULL,
        is_verified BOOLEAN DEFAULT false,
        is_approved BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Users table created');

    // Create student_details table
    await client.query(`
      CREATE TABLE IF NOT EXISTS student_details (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        student_id VARCHAR(50),
        course VARCHAR(100),
        year INTEGER
      )
    `);
    console.log('Student details table created');

    // Create partner_details table
    await client.query(`
      CREATE TABLE IF NOT EXISTS partner_details (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        position VARCHAR(100),
        commission_rate DECIMAL(5,2) DEFAULT 20.00
      )
    `);
    console.log('Partner details table created');

    // Add commission_rate column to partner_details if not exists
    await client.query(`
      ALTER TABLE partner_details ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2) DEFAULT 20.00
    `);
    console.log('Added commission_rate column to partner_details');

    // Create referral_codes table
    await client.query(`
      CREATE TABLE IF NOT EXISTS referral_codes (
        id SERIAL PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        partner_id INTEGER REFERENCES users(id),
        is_active BOOLEAN DEFAULT true,
        discount_percent DECIMAL(5,2) DEFAULT 0,
        my_share DECIMAL(5,2) DEFAULT 0,
        start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        end_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Referral codes table created');

    // Add start_date column to referral_codes if not exists
    await client.query(`
      ALTER TABLE referral_codes ADD COLUMN IF NOT EXISTS start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    `);
    console.log('Added start_date column to referral_codes');

    // Add end_date column to referral_codes if not exists
    await client.query(`
      ALTER TABLE referral_codes ADD COLUMN IF NOT EXISTS end_date TIMESTAMP
    `);
    console.log('Added end_date column to referral_codes');

    // Add created_by column to referral_codes if not exists
    await client.query(`
      ALTER TABLE referral_codes ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id)
    `);
    console.log('Added created_by column to referral_codes');

    // Add referred_by_code column to users if not exists
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by_code VARCHAR(50)
    `);
    console.log('Added referred_by_code column to users');

    // Add is_verified column to users if not exists
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false
    `);
    console.log('Added is_verified column to users');

    // Add is_approved column to users if not exists
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT true
    `);
    console.log('Added is_approved column to users');

    // Create otp_verification table
    await client.query(`
      CREATE TABLE IF NOT EXISTS otp_verification (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        otp VARCHAR(10) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('OTP verification table created');

    // Create transactions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        transaction_id VARCHAR(255) UNIQUE NOT NULL,
        student_name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        code VARCHAR(50) NOT NULL,
        class_name VARCHAR(100) NOT NULL,
        amount DECIMAL(12, 2) DEFAULT 0,
        details JSONB,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Transactions table created');

    // Add details column to transactions if not exists
    await client.query(`
      ALTER TABLE transactions ADD COLUMN IF NOT EXISTS details JSONB
    `);
    console.log('Added details column to transactions');

    // Add amount column to transactions if not exists
    await client.query(`
      ALTER TABLE transactions ADD COLUMN IF NOT EXISTS amount DECIMAL(12, 2) DEFAULT 0
    `);
    console.log('Added amount column to transactions');

    // Insert demo users if not exist
    const demoUsers = [
      { email: 'admin@example.com', password: 'admin123', role: 'admin', name: 'Admin User' },
      { email: 'partner@example.com', password: 'partner123', role: 'partner', name: 'Partner User', position: 'HR Manager' }
    ];

    for (const user of demoUsers) {
      const existing = await client.query('SELECT id FROM users WHERE email = $1', [user.email]);
      if (existing.rows.length === 0) {
        const result = await client.query(
          'INSERT INTO users (email, password, role, name, is_verified) VALUES ($1, $2, $3, $4, true) RETURNING id',
          [user.email, user.password, user.role, user.name]
        );
        const userId = result.rows[0].id;

        if (user.role === 'partner') {
          await client.query(
            'INSERT INTO partner_details (user_id, position) VALUES ($1, $2)',
            [userId, user.position]
          );
        }
        console.log(`Inserted user: ${user.email}`);
      }
    }
    // Create partner_invitations table
    await client.query(`
      CREATE TABLE IF NOT EXISTS partner_invitations (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        token VARCHAR(255) UNIQUE NOT NULL,
        commission_rate DECIMAL(5,2) DEFAULT 20.00,
        status VARCHAR(50) DEFAULT 'pending',
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Partner invitations table created');

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

initDatabase();
