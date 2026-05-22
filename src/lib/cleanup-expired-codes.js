const { Pool } = require('pg');

// Ensure you have environment variables configured for database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'referral_system',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

async function cleanupExpiredReferralCodes() {
  const client = await pool.connect();
  try {
    const now = new Date();
    const result = await client.query(
      `UPDATE referral_codes
       SET is_active = FALSE
       WHERE end_date IS NOT NULL AND end_date < $1 AND is_active = TRUE
       RETURNING id, code, end_date`,
      [now]
    );

    if (result.rows.length > 0) {
      console.log(`Deactivated ${result.rows.length} expired referral codes:`);
      result.rows.forEach(row => {
        console.log(`  ID: ${row.id}, Code: ${row.code}, Expired on: ${row.end_date}`);
      });
    } else {
      console.log('No expired referral codes found to delete.');
    }
  } catch (error) {
    console.error('Error cleaning up expired referral codes:', error);
  } finally {
    client.release();
    await pool.end(); // End the pool connection after cleanup
  }
}

// Execute the cleanup function
cleanupExpiredReferralCodes();
