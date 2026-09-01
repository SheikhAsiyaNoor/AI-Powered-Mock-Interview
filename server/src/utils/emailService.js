const nodemailer = require("nodemailer");

/**
 * Creates and returns a Nodemailer transporter configured for Gmail / SMTP.
 */
const createTransporter = () => {
  const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_SERVICE } = process.env;

  const cleanPass = (EMAIL_PASS || "").replace(/['"\s]/g, "").trim();
  const cleanUser = (EMAIL_USER || "").replace(/['"]/g, "").trim();

  if (!cleanUser || !cleanPass) {
    return null;
  }

  // Standard Gmail Service Configuration
  if (EMAIL_SERVICE === "gmail" || cleanUser.endsWith("@gmail.com") || (EMAIL_HOST && EMAIL_HOST.includes("gmail.com"))) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: cleanUser,
        pass: cleanPass
      }
    });
  }

  // Custom SMTP Host Configuration
  if (EMAIL_HOST) {
    return nodemailer.createTransport({
      host: EMAIL_HOST,
      port: Number(EMAIL_PORT) || 587,
      secure: Number(EMAIL_PORT) === 465,
      auth: {
        user: cleanUser,
        pass: cleanPass
      }
    });
  }

  return null;
};

const getClientUrl = () => {
  const url = (process.env.CLIENT_URL || "http://localhost:3000").trim().replace(/['"]/g, "").replace(/\/+$/, "");
  return url;
};

const getSenderEmail = () => {
  const emailUser = (process.env.EMAIL_USER || "").replace(/['"]/g, "").trim();
  if (process.env.EMAIL_FROM) {
    return process.env.EMAIL_FROM.replace(/['"]/g, "").trim();
  }
  if (emailUser) {
    return `"AI Mock Interview" <${emailUser}>`;
  }
  return '"AI Mock Interview Platform" <noreply@aimockinterview.com>';
};

/**
 * Send Account Verification Email via Gmail
 */
const sendVerificationEmail = async ({ to, name, token }) => {
  const clientUrl = getClientUrl();
  const verificationUrl = `${clientUrl}/verify-email?token=${encodeURIComponent(token)}`;
  const sender = getSenderEmail();
  const transporter = createTransporter();

  const subject = "Verify your email address - AI Mock Interview";
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
    .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 36px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .header { text-align: center; margin-bottom: 28px; }
    .badge { display: inline-block; background: #2563eb; color: #ffffff; font-weight: 700; font-size: 16px; border-radius: 12px; padding: 10px 16px; margin-bottom: 12px; }
    .title { font-size: 22px; font-weight: 700; color: #0f172a; margin: 0 0 8px 0; }
    .subtitle { font-size: 14px; color: #64748b; margin: 0; }
    .content { font-size: 15px; line-height: 1.6; color: #334155; margin: 24px 0; }
    .button-wrap { text-align: center; margin: 32px 0; }
    .btn { display: inline-block; background: #2563eb; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 9999px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 14px rgba(37,99,235,0.3); }
    .note { font-size: 12px; color: #64748b; background: #f1f5f9; padding: 14px; border-radius: 10px; margin-top: 24px; word-break: break-all; }
    .footer { text-align: center; margin-top: 32px; font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="badge">AI Mock Interview</div>
      <h1 class="title">Verify Your Email Address</h1>
      <p class="subtitle">Welcome onboard, ${name || "Candidate"}!</p>
    </div>
    <div class="content">
      <p>Thank you for registering on the <strong>AI-Powered Mock Interview & Peer Arena Platform</strong>.</p>
      <p>To activate your candidate profile and begin practicing with AI voice simulators and peer coding challenges, please verify your email address by clicking the button below:</p>
      <div class="button-wrap">
        <a href="${verificationUrl}" class="btn" target="_blank">Verify Email Address</a>
      </div>
      <p>This verification link will expire in <strong>24 hours</strong>. If you did not create an account, you can safely ignore this email.</p>
      <div class="note">
        <strong>Direct Link:</strong><br/>
        <a href="${verificationUrl}" style="color: #2563eb;">${verificationUrl}</a>
      </div>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} AI-Powered Mock Interview Platform. All rights reserved.
    </div>
  </div>
</body>
</html>
  `;

  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: sender,
        to,
        subject,
        html: htmlContent
      });
      console.log(`[EmailService] Verification email sent via Gmail to ${to} (Message ID: ${info.messageId})`);
      return { success: true, messageId: info.messageId, previewUrl: verificationUrl };
    } catch (err) {
      console.error(`[EmailService] Failed to send email via Gmail to ${to}:`, err.message);
      return { success: false, error: err.message };
    }
  }

  console.warn(`[EmailService] Gmail credentials not configured. Skipped email delivery to ${to}`);
  return { success: false, reason: "Gmail credentials not configured" };
};

/**
 * Send Password Reset Email via Gmail
 */
const sendPasswordResetEmail = async ({ to, name, token }) => {
  const clientUrl = getClientUrl();
  const resetUrl = `${clientUrl}/reset-password?token=${encodeURIComponent(token)}`;
  const sender = getSenderEmail();
  const transporter = createTransporter();

  const subject = "Password Reset Request - AI Mock Interview";
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
    .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 36px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .header { text-align: center; margin-bottom: 28px; }
    .badge { display: inline-block; background: #dc2626; color: #ffffff; font-weight: 700; font-size: 16px; border-radius: 12px; padding: 10px 16px; margin-bottom: 12px; }
    .title { font-size: 22px; font-weight: 700; color: #0f172a; margin: 0 0 8px 0; }
    .subtitle { font-size: 14px; color: #64748b; margin: 0; }
    .content { font-size: 15px; line-height: 1.6; color: #334155; margin: 24px 0; }
    .button-wrap { text-align: center; margin: 32px 0; }
    .btn { display: inline-block; background: #2563eb; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 9999px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 14px rgba(37,99,235,0.3); }
    .warning { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; padding: 14px; border-radius: 10px; font-size: 13px; margin-top: 20px; }
    .note { font-size: 12px; color: #64748b; background: #f1f5f9; padding: 14px; border-radius: 10px; margin-top: 20px; word-break: break-all; }
    .footer { text-align: center; margin-top: 32px; font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="badge">🔒 Security Alert</div>
      <h1 class="title">Reset Your Password</h1>
      <p class="subtitle">Hello, ${name || "Candidate"}</p>
    </div>
    <div class="content">
      <p>We received a request to reset the password for your AI Mock Interview account.</p>
      <p>Click the secure button below to choose a new password:</p>
      <div class="button-wrap">
        <a href="${resetUrl}" class="btn" target="_blank">Reset My Password</a>
      </div>
      <div class="warning">
        ⚠️ <strong>Important:</strong> This password reset link is valid for <strong>15 minutes only</strong> and can only be used once.
      </div>
      <p style="font-size: 13px; color: #64748b; margin-top: 20px;">If you did not request a password reset, please ignore this email or update your security settings if you suspect unauthorized activity.</p>
      <div class="note">
        <strong>Direct Link:</strong><br/>
        <a href="${resetUrl}" style="color: #2563eb;">${resetUrl}</a>
      </div>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} AI-Powered Mock Interview Platform. All rights reserved.
    </div>
  </div>
</body>
</html>
  `;

  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: sender,
        to,
        subject,
        html: htmlContent
      });
      console.log(`[EmailService] Password reset email sent via Gmail to ${to} (Message ID: ${info.messageId})`);
      return { success: true, messageId: info.messageId, previewUrl: resetUrl };
    } catch (err) {
      console.error(`[EmailService] Failed to send password reset email via Gmail to ${to}:`, err.message);
      return { success: false, error: err.message };
    }
  }

  console.warn(`[EmailService] Gmail credentials not configured. Skipped password reset email delivery to ${to}`);
  return { success: false, reason: "Gmail credentials not configured" };
};

/**
 * Send Security Notice Email when Password has been changed
 */
const sendPasswordChangedConfirmation = async ({ to, name }) => {
  const sender = getSenderEmail();
  const transporter = createTransporter();
  const subject = "Security Alert: Your password has been changed";

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
    .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 36px; }
    .badge { display: inline-block; background: #059669; color: #ffffff; font-weight: 700; font-size: 14px; border-radius: 10px; padding: 8px 14px; margin-bottom: 12px; }
    .title { font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 12px 0; }
    .content { font-size: 14px; line-height: 1.6; color: #334155; }
  </style>
</head>
<body>
  <div class="container">
    <div class="badge">✓ Password Updated</div>
    <h1 class="title">Your Password Was Successfully Changed</h1>
    <div class="content">
      <p>Hello ${name || "Candidate"},</p>
      <p>This email confirms that the password for your AI Mock Interview account was recently updated on <strong>${new Date().toUTCString()}</strong>.</p>
      <p>All previous active sessions have been automatically invalidated for your security.</p>
      <p>If you did not make this change, please contact platform administrators immediately or reset your password.</p>
    </div>
  </div>
</body>
</html>
  `;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: sender,
        to,
        subject,
        html: htmlContent
      });
    } catch (err) {
      console.error(`[EmailService] Failed to send password changed notice via Gmail:`, err.message);
    }
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendPasswordChangedConfirmation
};
