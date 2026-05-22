// src/app/api/save-transaction/route.js

import pool from '@/lib/db';

let transactionsTableReady;

function jsonResponse(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

function ensureTransactionsTable() {
  if (!transactionsTableReady) {
    transactionsTableReady = pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        transaction_id VARCHAR(255) UNIQUE NOT NULL,
        student_name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        code VARCHAR(50) NOT NULL,
        class_name VARCHAR(100) NOT NULL,
        amount DECIMAL(12, 2),
        details JSONB,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `).then(() => {
      // Ensure columns exist in case the table was created before migration
      return Promise.all([
        pool.query('ALTER TABLE transactions ADD COLUMN IF NOT EXISTS details JSONB'),
        pool.query('ALTER TABLE transactions ADD COLUMN IF NOT EXISTS amount DECIMAL(12, 2)')
      ]);
    }).catch((error) => {
      transactionsTableReady = undefined;
      throw error;
    });
  }

  return transactionsTableReady;
}

export async function POST(req) {
  try {
    const payload = await req.json();
    const { transactionId, studentName, email, code, amount } = payload;
    const className = payload.className || payload.class;

    // Basic validation
    if (!transactionId || !studentName || !code || !className) {
      return jsonResponse({ message: 'Missing required fields: transactionId, studentName, code, className' }, 400);
    }

    await ensureTransactionsTable();

    // Save to database (Primary storage including full JSON details)
    const query = `
      INSERT INTO transactions (transaction_id, student_name, email, code, class_name, amount, details)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const finalAmount = amount || 0;
    const details = { ...payload, amount: finalAmount };
    const values = [transactionId, studentName, email || null, code, className, finalAmount, details];

    const result = await pool.query(query, values);
    const newTransaction = result.rows[0];

    return jsonResponse({ message: 'Transaction saved successfully', transaction: newTransaction }, 200);

  } catch (error) {
    console.error('Error in save-transaction API:', error);

    // Check for unique constraint violation (transactionId already exists)
    if (error.code === '23505') {
      return jsonResponse({ message: 'Transaction ID already exists' }, 409);
    }

    if (error.code === '42P01') {
      transactionsTableReady = undefined;
      return jsonResponse({ message: 'Transactions table does not exist. Run node src/lib/db-init.cjs and retry.' }, 500);
    }

    return jsonResponse({ message: 'Internal Server Error' }, 500);
  }
}
