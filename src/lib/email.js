import nodemailer from 'nodemailer';

// Create transporter from environment variables
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Generate a 6-digit OTP
export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP email
export async function sendOTPEmail(to, otp) {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  try {
    const info = await transporter.sendMail({
      from: `"Referral System" <${from}>`,
      to: to,
      subject: 'Your Verification OTP',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px; }
            .container { max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; }
            .header { text-align: center; margin-bottom: 20px; }
            .header h1 { color: #667eea; }
            .otp-box { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
            .otp { font-size: 32px; font-weight: bold; color: white; letter-spacing: 5px; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Referral System</h1>
            </div>
            <p>Your verification OTP is:</p>
            <div class="otp-box">
              <div class="otp">${otp}</div>
            </div>
            <p>This OTP will expire in 10 minutes.</p>
            <p>If you didn't request this, please ignore this email.</p>
            <div class="footer">
              <p>© 2024 Referral System. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    console.log('Email sent: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email error:', error);
    return { success: false, error: error.message };
  }
}

// Send welcome email
export async function sendWelcomeEmail(to, name, role) {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  const roleMessage = {
    admin: 'You have been granted full admin access to manage the referral system.',
    partner: 'You can now create referral codes and track student registrations.',
    student: 'You can now register and track your enrolled courses.'
  };

  try {
    const info = await transporter.sendMail({
      from: `"Referral System" <${from}>`,
      to: to,
      subject: 'Welcome to Referral System',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px; }
            .container { max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; }
            .header { text-align: center; margin-bottom: 20px; }
            .header h1 { color: #667eea; }
            .content { margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome, ${name}!</h1>
            </div>
            <div class="content">
              <p>Your account has been created successfully.</p>
              <p><strong>Role:</strong> ${role}</p>
              <p>${roleMessage[role] || ''}</p>
              <p>Please login to continue:</p>
              <p><a href="${process.env.BASE_URL || 'http://localhost:3000'}/login" style="color: #667eea;">Login Now</a></p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Welcome email error:', error);
    return { success: false, error: error.message };
  }
}