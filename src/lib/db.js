import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'referral_system',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Bhaskar@66',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

export default pool;