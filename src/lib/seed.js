import pool from './db';

export async function seedDatabase() {
  const client = await pool.connect();
  try {
    // Check if admin already exists
    const adminExists = await client.query(
      "SELECT id FROM users WHERE role = 'admin' LIMIT 1"
    );

    if (adminExists.rows.length > 0) {
      console.log('Database already seeded');
      return; // <-- Just return. The finally block below will handle client.release()
    }

    console.log('Seeding database with default users...');

    // Seed admin user
    const adminResult = await client.query(
      'INSERT INTO users (email, password, role, name, is_verified) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      ['admin@example.com', 'admin123', 'admin', 'Admin User', true]
    );
    console.log('Admin user seeded: admin@example.com / admin123');

    // Seed partner user
    const partnerResult = await client.query(
      'INSERT INTO users (email, password, role, name, is_verified) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      ['partner@example.com', 'partner123', 'partner', 'Partner User', true]
    );
    const partnerId = partnerResult.rows[0].id;
    await client.query(
      'INSERT INTO partner_details (user_id, position) VALUES ($1, $2)',
      [partnerId, 'HR Manager']
    );
    console.log('Partner user seeded: partner@example.com / partner123');

    console.log('Database seeding completed');
  } catch (error) {
    console.error('Seed error:', error.message);
  } finally {
    client.release(); // This now safely executes exactly once per function call
  }
}