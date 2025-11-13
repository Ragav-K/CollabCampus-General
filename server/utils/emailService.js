// server/utils/emailService.js
import nodemailer from "nodemailer";

// Create reusable transporter object using SMTP transport
const createTransporter = () => {
  // Check if email is configured
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("⚠️  Email service not configured. Set EMAIL_HOST, EMAIL_USER, and EMAIL_PASS in .env");
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || "587"),
    secure: process.env.EMAIL_SECURE === "true", // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

/**
 * Send password reset email
 * @param {string} to - Recipient email address
 * @param {string} resetToken - Password reset token
 * @param {string} resetUrl - Full URL to reset password page with token
 */
export const sendPasswordResetEmail = async (to, resetToken, resetUrl) => {
  const transporter = createTransporter();
  
  if (!transporter) {
    console.error("Email service not configured. Cannot send password reset email.");
    throw new Error("Email service not configured");
  }

  const mailOptions = {
    from: `"CollabCampus" <${process.env.EMAIL_USER}>`,
    to: to,
    subject: "Password Reset Request - CollabCampus",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 12px 30px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .button:hover { background: #1d4ed8; }
            .token-box { background: #fff; border: 2px dashed #ddd; padding: 15px; margin: 20px 0; border-radius: 6px; text-align: center; }
            .token { font-family: monospace; font-size: 14px; color: #1f2937; word-break: break-all; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>You requested to reset your password for your CollabCampus account.</p>
              
              <p>Click the button below to reset your password:</p>
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </div>
              
              <p>Or copy and paste this link into your browser:</p>
              <div class="token-box">
                <div class="token">${resetUrl}</div>
              </div>
              
              <div class="warning">
                <strong>⚠️ Important:</strong> This link will expire in 1 hour. If you didn't request this password reset, please ignore this email.
              </div>
              
              <p>If the button doesn't work, you can also manually enter this reset token:</p>
              <div class="token-box">
                <div class="token">${resetToken}</div>
              </div>
              
              <p>Best regards,<br>The CollabCampus Team</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Password Reset Request - CollabCampus

Hello,

You requested to reset your password for your CollabCampus account.

Click this link to reset your password:
${resetUrl}

Or manually enter this reset token:
${resetToken}

⚠️ Important: This link will expire in 1 hour. If you didn't request this password reset, please ignore this email.

Best regards,
The CollabCampus Team
    `.trim(),
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Password reset email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Error sending password reset email:", error);
    throw error;
  }
};

/**
 * Send OTP email for signup verification
 * @param {string} to - Recipient email address
 * @param {string} otp - 6-digit OTP code
 * @param {string} name - User's name
 */
export const sendSignupOTPEmail = async (to, otp, name = "User") => {
  const transporter = createTransporter();
  
  if (!transporter) {
    console.error("Email service not configured. Cannot send OTP email.");
    throw new Error("Email service not configured");
  }

  const mailOptions = {
    from: `"CollabCampus" <${process.env.EMAIL_USER}>`,
    to: to,
    subject: "Verify Your Email - CollabCampus",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .otp-box { background: #fff; border: 3px solid #2563eb; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; }
            .otp-code { font-family: monospace; font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 8px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📧 Verify Your Email</h1>
            </div>
            <div class="content">
              <p>Hello ${name},</p>
              <p>Thank you for signing up for CollabCampus! To complete your registration, please verify your email address using the OTP code below:</p>
              
              <div class="otp-box">
                <div style="font-size: 14px; color: #666; margin-bottom: 10px;">Your verification code:</div>
                <div class="otp-code">${otp}</div>
              </div>
              
              <div class="warning">
                <strong>⚠️ Important:</strong> This OTP will expire in 10 minutes. If you didn't create an account, please ignore this email.
              </div>
              
              <p>Enter this code in the verification page to complete your signup.</p>
              
              <p>Best regards,<br>The CollabCampus Team</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Verify Your Email - CollabCampus

Hello ${name},

Thank you for signing up for CollabCampus! To complete your registration, please verify your email address using the OTP code below:

Your verification code: ${otp}

⚠️ Important: This OTP will expire in 10 minutes. If you didn't create an account, please ignore this email.

Enter this code in the verification page to complete your signup.

Best regards,
The CollabCampus Team
    `.trim(),
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Signup OTP email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Error sending signup OTP email:", error);
    throw error;
  }
};

/**
 * Test email configuration
 */
export const testEmailConnection = async () => {
  const transporter = createTransporter();
  
  if (!transporter) {
    return { success: false, message: "Email service not configured" };
  }

  try {
    await transporter.verify();
    return { success: true, message: "Email service is configured correctly" };
  } catch (error) {
    return { success: false, message: `Email service error: ${error.message}` };
  }
};

