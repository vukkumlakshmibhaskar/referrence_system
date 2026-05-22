import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/utils/auth';
import pool from '@/lib/db';

export async function GET(request) {
  const user = getUserFromRequest(request);

  if (!user || user.role !== 'partner') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const client = await pool.connect();

    // Get partner details
    console.log('Fetching partner details for user id:', user.id);
    const partnerDetails = await client.query(
      'SELECT position FROM partner_details WHERE user_id = $1',
      [user.id]
    );
    console.log('Partner details result:', partnerDetails.rows);

    // Get all referral codes
    const referralCodeResult = await client.query(
      'SELECT id, code, is_active, discount_percent, my_share, created_at, start_date, end_date FROM referral_codes WHERE partner_id = $1 ORDER BY created_at DESC',
      [user.id]
    );

    // Get all students who registered using any of partner's referral codes
    let referredStudents = [];
    let transactions = [];
    let referralStats = { total: 0, active: 0, totalTransactions: 0 };

    if (referralCodeResult.rows.length > 0) {
      const codes = referralCodeResult.rows.map(r => r.code);

      // Get students from users table
      const studentsResult = await client.query(
        `SELECT id, name, email, referred_by_code, created_at FROM users
         WHERE referred_by_code = ANY($1) AND role = 'student'
         ORDER BY created_at DESC`,
        [codes]
      );

      referredStudents = studentsResult.rows.map(s => ({
        id: s.id,
        name: s.name,
        email: s.email,
        referredByCode: s.referred_by_code,
        registeredAt: new Date(s.created_at).toISOString().split('T')[0]
      }));

      // Get transactions from transactions table with referral code details for calculations
      const transactionsResult = await client.query(
        `SELECT 
          t.id, 
          t.transaction_id, 
          t.student_name, 
          t.email, 
          t.code, 
          t.class_name, 
          t.amount, 
          t.timestamp,
          rc.discount_percent,
          rc.my_share as partner_share_percent
         FROM transactions t
         JOIN referral_codes rc ON t.code = rc.code
         WHERE t.code = ANY($1)
         ORDER BY t.timestamp DESC`,
        [codes]
      );

      transactions = transactionsResult.rows.map(t => {
        const amount = parseFloat(t.amount) || 0;
        const discountPercent = parseFloat(t.discount_percent) || 0;
        const sharePercent = parseFloat(t.partner_share_percent) || 0;
        
        const studentDiscount = (amount * discountPercent) / 100;
        const partnerEarning = (amount * sharePercent) / 100;

        return {
          id: t.id,
          transactionId: t.transaction_id,
          studentName: t.student_name,
          email: t.email,
          code: t.code,
          className: t.class_name,
          amount: amount,
          discountPercent: discountPercent,
          sharePercent: sharePercent,
          studentDiscount: studentDiscount,
          partnerEarning: partnerEarning,
          timestamp: new Date(t.timestamp).toISOString()
        };
      });

      referralStats = {
        total: referredStudents.length,
        active: referredStudents.length,
        totalTransactions: transactions.length,
        totalEarnings: transactions.reduce((sum, t) => sum + t.partnerEarning, 0)
      };
    }

    // Get student count for each referral code (now including transactions)
    const referralCodes = referralCodeResult.rows.map(rc => {
      const studentCount = referredStudents.filter(s => s.referredByCode === rc.code).length;
      const codeTransactions = transactions.filter(t => t.code === rc.code);
      
      const totalAmount = codeTransactions.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
      const totalDiscount = codeTransactions.reduce((sum, t) => sum + (parseFloat(t.studentDiscount) || 0), 0);
      const totalEarnings = codeTransactions.reduce((sum, t) => sum + (parseFloat(t.partnerEarning) || 0), 0);

      return {
        id: rc.id,
        code: rc.code,
        is_active: rc.is_active,
        discount_percent: rc.discount_percent || 0,
        my_share: rc.my_share || 0,
        start_date: rc.start_date,
        end_date: rc.end_date,
        created_at: new Date(rc.created_at).toISOString().split('T')[0],
        students_referred: studentCount,
        transaction_count: codeTransactions.length,
        total_amount: totalAmount,
        total_discount: totalDiscount,
        total_earnings: totalEarnings
      };
    });

    client.release();

    const details = partnerDetails.rows[0] || {};

    const partnerData = {
      profile: {
        position: details?.position || 'N/A',
        name: user.name,
        email: user.email
      },
      referralCodes,
      referralStats,
      referredStudents,
      transactions,
      jobPostings: [],
      collaborations: [],
      metrics: {
        totalHires: 0,
        activePostings: 0,
        totalApplications: 0
      }
    };

    return NextResponse.json(partnerData);
  } catch (error) {
    console.error('Partner API error:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}