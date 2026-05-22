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

// Professional Email Base Template
const getEmailTemplate = (content, previewText) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
        body { margin: 0; padding: 0; background-color: #f4f7f9; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; -webkit-font-smoothing: antialiased; }
        .wrapper { width: 100%; table-layout: fixed; background-color: #f4f7f9; padding-bottom: 40px; }
        .main { background-color: #ffffff; margin: 0 auto; width: 100%; max-width: 600px; border-spacing: 0; color: #1e293b; border-radius: 12px; overflow: hidden; margin-top: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        .header { background-color: #0f172a; padding: 32px; text-align: center; }
        .header-text { color: #ffffff; font-size: 24px; font-weight: 700; margin: 0; letter-spacing: -0.025em; }
        .content { padding: 40px 48px; }
        .footer { padding: 32px; text-align: center; color: #64748b; font-size: 14px; line-height: 1.5; }
        .button { display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff !important; font-weight: 600; text-decoration: none; border-radius: 8px; margin: 24px 0; transition: background-color 0.2s; }
        .otp-badge { background-color: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0; }
        .otp-code { font-size: 36px; font-weight: 700; color: #0f172a; letter-spacing: 0.2em; font-family: monospace; }
        h2 { font-size: 22px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 16px; }
        p { margin: 0 0 16px; line-height: 1.6; color: #475569; }
        .divider { height: 1px; background-color: #e2e8f0; margin: 32px 0; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <table class="main" width="100%">
          <tr>
            <td class="header">
              <h1 class="header-text">Referral System</h1>
            </td>
          </tr>
          <tr>
            <td class="content">
              ${content}
            </td>
          </tr>
          <tr>
            <td class="footer">
              <p style="margin-bottom: 8px;">&copy; 2024 Referral System. All rights reserved.</p>
              <p>You received this email because of activity related to your account.</p>
            </td>
          </tr>
        </table>
      </div>
    </body>
    </html>
  `;
};

// Generate a 6-digit OTP
export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP email
export async function sendOTPEmail(to, otp) {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const content = `
    <h2>Verify your identity</h2>
    <p>Please use the following verification code to complete your registration. This code will expire in 10 minutes.</p>
    <div class="otp-badge">
      <div class="otp-code">${otp}</div>
    </div>
    <p>If you didn't request this code, you can safely ignore this email.</p>
  `;

  try {
    await transporter.sendMail({
      from: `"Referral System" <${from}>`,
      to: to,
      subject: 'Verification Code: ' + otp,
      html: getEmailTemplate(content)
    });
    return { success: true };
  } catch (error) {
    console.error('Email error:', error);
    return { success: false, error: error.message };
  }
}

// Send welcome email
export async function sendWelcomeEmail(to, name, role) {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const loginUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/login`;
  
  const roleInfo = {
    admin: { title: 'Administrator', desc: 'You have full access to manage the partner network and system settings.' },
    partner: { title: 'Strategic Partner', desc: 'You can now create referral codes and track your earning statistics.' },
    student: { title: 'Student', desc: 'Welcome! You can now track your course enrollments and referral history.' }
  };

  const info = roleInfo[role] || { title: role, desc: 'Welcome to our platform!' };

  const content = `
    <h2>Welcome to the Network, ${name}!</h2>
    <p>Your account has been successfully created and verified. You have been assigned the following role:</p>
    <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 16px; margin: 24px 0;">
      <p style="font-weight: 600; color: #0f172a; margin-bottom: 4px;">${info.title}</p>
      <p style="margin: 0; font-size: 14px;">${info.desc}</p>
    </div>
    <p>Click the button below to sign in to your dashboard and get started.</p>
    <div style="text-align: center;">
      <a href="${loginUrl}" class="button">Go to Dashboard</a>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"Referral System" <${from}>`,
      to: to,
      subject: 'Welcome to Referral System',
      html: getEmailTemplate(content)
    });
    return { success: true };
  } catch (error) {
    console.error('Welcome email error:', error);
    return { success: false, error: error.message };
  }
}

// Send partner invitation email
export async function sendInvitationEmail(to, inviteToken, commissionRate) {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const inviteLink = `${baseUrl}/register?token=${inviteToken}`;

  const content = `
    <h2>Strategic Partnership Invitation</h2>
    <p>We are pleased to invite you to join our <strong>Referral System Partner Network</strong>.</p>
    <p>As a partner, you'll gain access to exclusive tools to manage your referrals and track performance in real-time.</p>
    <div style="background-color: #eff6ff; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center;">
      <p style="margin-bottom: 8px; font-size: 14px; color: #1d4ed8; text-transform: uppercase; font-weight: 600; letter-spacing: 0.05em;">Your Commission Rate</p>
      <p style="font-size: 32px; font-weight: 700; color: #1e3a8a; margin: 0;">${commissionRate}%</p>
    </div>
    <p>Please accept this invitation by completing your registration via the secure link below. Note that this invitation will expire in 48 hours.</p>
    <div style="text-align: center;">
      <a href="${inviteLink}" class="button">Accept & Register</a>
    </div>
    <p style="font-size: 12px; color: #64748b; margin-top: 24px;">Link not working? Copy this into your browser:<br/>${inviteLink}</p>
  `;

  try {
    await transporter.sendMail({
      from: `"Referral System" <${from}>`,
      to: to,
      subject: 'Invitation to Join our Partner Network',
      html: getEmailTemplate(content)
    });
    return { success: true };
  } catch (error) {
    console.error('Invitation email error:', error);
    return { success: false, error: error.message };
  }
}

// Send password reset OTP email
export async function sendPasswordResetOTPEmail(to, otp) {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const content = `
    <h2 style="color: #dc2626;">Reset your password</h2>
    <p>We received a request to reset the password for your account. Use the code below to securely update your credentials.</p>
    <div class="otp-badge" style="border-color: #fca5a5; background-color: #fef2f2;">
      <div class="otp-code" style="color: #dc2626;">${otp}</div>
    </div>
    <p style="color: #b91c1c; font-weight: 600;">Security Warning:</p>
    <p style="font-size: 14px;">This code will expire in 10 minutes. If you did not request a password reset, please secure your account immediately and ignore this message.</p>
  `;

  try {
    await transporter.sendMail({
      from: `"Referral System" <${from}>`,
      to: to,
      subject: 'Security: Password Reset Code ' + otp,
      html: getEmailTemplate(content)
    });
    return { success: true };
  } catch (error) {
    console.error('Password reset email error:', error);
    return { success: false, error: error.message };
  }
}
