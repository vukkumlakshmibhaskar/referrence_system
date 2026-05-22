import pool from '@/lib/db';

export async function verifyReferralCode(code) {
  if (!code) {
    return { valid: false, reason: 'Referral code is required.' };
  }

  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT
         id,
         partner_id,
         code,
         is_active,
         discount_percent,
         my_share,
         start_date,
         end_date
       FROM referral_codes
       WHERE code = $1`,
      [code]
    );

    if (result.rows.length === 0) {
      return { valid: false, reason: 'Referral code not found.' };
    }

    const referralCode = result.rows[0];

    if (!referralCode.is_active) {
      return { valid: false, reason: 'Referral code is inactive.' };
    }

    const now = new Date();
    if (referralCode.start_date && new Date(referralCode.start_date) > now) {
      return { valid: false, reason: 'Referral code is not yet active.' };
    }

    if (referralCode.end_date && new Date(referralCode.end_date) < now) {
      return { valid: false, reason: 'Referral code has expired.' };
    }

    return { valid: true, referralCode };
  } catch (error) {
    console.error('Error verifying referral code:', error);
    return {
      valid: false,
      reason: error.message,
    };
  } finally {
    client.release();
  }
}
