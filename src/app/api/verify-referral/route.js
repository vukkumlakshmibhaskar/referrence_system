import { NextResponse } from 'next/server';
import { verifyReferralCode } from '@/lib/referral';

export async function POST(request) {
  try {
    const body = await request.json();
    const { referralCode } = body;

    const verificationResult = await verifyReferralCode(referralCode);

    if (verificationResult.valid) {
      const { my_share, ...referralCodeDetails } = verificationResult.referralCode;
      return NextResponse.json({
        valid: true,
        message: 'Referral code is valid.',
        referralCodeDetails: {
          ...referralCodeDetails,
          discount_percent: verificationResult.referralCode.discount_percent,
        },
      });
    } else {
      return NextResponse.json({
        valid: false,
        message: verificationResult.reason,
      }, { status: 400 });
    }
  } catch (error) {
    console.error('API Error during referral code verification:', error);
    return NextResponse.json({
      valid: false,
      message: 'An unexpected error occurred.',
    }, { status: 500 });
  }
}
