// server/utils/emailService.js
// Uses Brevo (formerly Sendinblue) HTTPS API — works on Render free tier,
// and can send to ANY email address without domain verification.

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const FROM_EMAIL = process.env.EMAIL_FROM_ADDRESS || "cc.collabcampus@gmail.com";
const FROM_NAME = process.env.EMAIL_FROM_NAME || "CollabCampus";

async function sendEmail({ to, subject, html, text }) {
  if (!BREVO_API_KEY) {
    console.warn("⚠️ BREVO_API_KEY not set. Cannot send email.");
    throw new Error("Email service not configured");
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": BREVO_API_KEY,
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify({
      sender: { name: FROM_NAME, email: FROM_EMAIL },
      to: [{ email: to }],
      subject,
      htmlContent: html,
      textContent: text,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("❌ Brevo API error:", data);
    throw new Error(data.message || "Failed to send email");
  }

  console.log("✅ Email sent via Brevo:", data.messageId);
  return data;
}

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (to, resetToken, resetUrl) => {
  return sendEmail({
    to,
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
            .token-box { background: #fff; border: 2px dashed #ddd; padding: 15px; margin: 20px 0; border-radius: 6px; text-align: center; }
            .token { font-family: monospace; font-size: 14px; color: #1f2937; word-break: break-all; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header"><h1>🔐 Password Reset Request</h1></div>
            <div class="content">
              <p>Hello,</p>
              <p>You requested to reset your password for your CollabCampus account.</p>
              <p>Click the button below to reset your password:</p>
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </div>
              <p>Or copy and paste this link into your browser:</p>
              <div class="token-box"><div class="token">${resetUrl}</div></div>
              <div class="warning">
                <strong>⚠️ Important:</strong> This link will expire in 1 hour. If you didn't request this, please ignore this email.
              </div>
              <p>Best regards,<br>The CollabCampus Team</p>
            </div>
            <div class="footer"><p>This is an automated email. Please do not reply.</p></div>
          </div>
        </body>
      </html>
    `,
    text: `Password Reset - CollabCampus\n\nClick this link: ${resetUrl}\n\nExpires in 1 hour.`,
  });
};

/**
 * Send OTP email for signup verification
 */
export const sendSignupOTPEmail = async (to, otp, name = "User") => {
  return sendEmail({
    to,
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
            .otp-code { font-family: monospace; font-size: 36px; font-weight: bold; color: #2563eb; letter-spacing: 10px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header"><h1>📧 Verify Your Email</h1></div>
            <div class="content">
              <p>Hello ${name},</p>
              <p>Thank you for signing up for CollabCampus! Enter the code below to verify your email:</p>
              <div class="otp-box">
                <div style="font-size: 14px; color: #666; margin-bottom: 10px;">Your verification code:</div>
                <div class="otp-code">${otp}</div>
              </div>
              <div class="warning">
                <strong>⚠️ Important:</strong> This OTP expires in 10 minutes. If you didn't sign up, ignore this email.
              </div>
              <p>Best regards,<br>The CollabCampus Team</p>
            </div>
            <div class="footer"><p>This is an automated email. Please do not reply.</p></div>
          </div>
        </body>
      </html>
    `,
    text: `Verify Your Email - CollabCampus\n\nHello ${name},\n\nYour OTP: ${otp}\n\nExpires in 10 minutes.`,
  });
};

/**
 * Test email configuration
 */
export const testEmailConnection = async () => {
  if (!BREVO_API_KEY) {
    return { success: false, message: "BREVO_API_KEY not configured" };
  }

  try {
    // Just verify the API key works by hitting the account endpoint
    const response = await fetch("https://api.brevo.com/v3/account", {
      headers: {
        "api-key": BREVO_API_KEY,
        "Accept": "application/json",
      },
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true, message: "Email service is configured correctly", email: data.email };
    } else {
      return { success: false, message: data.message || "Brevo API error" };
    }
  } catch (error) {
    return { success: false, message: `Error: ${error.message}` };
  }
};
