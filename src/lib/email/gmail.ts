import nodemailer from "nodemailer";

const gmailUser = process.env.GMAIL_USER?.trim();
const gmailAppPassword = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, "");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: gmailUser,
    pass: gmailAppPassword,
  },
});

export async function sendVerificationOtpEmail(email: string, otp: string) {
  const fromEmail = process.env.EMAIL_FROM?.trim() || gmailUser;

  if (!fromEmail || !gmailUser || !gmailAppPassword) {
    console.error("Gmail SMTP env vars are missing.");
    return { success: false, error: "Email configuration is missing." };
  }

  try {
    const info = await transporter.sendMail({
      from: `Voting Platform <${fromEmail}>`,
      to: email,
      subject: "Your Voting Verification Code",
      text: `Your voting verification code is ${otp}. This code is for verification for the voting platform. It expires in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #111827;">
          <h2 style="margin-bottom: 12px;">Your Voting Verification Code</h2>
          <p style="margin-bottom: 16px;">Use the following code to verify your email and continue to the voting platform.</p>
          <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 32px; font-weight: 700; letter-spacing: 4px; border-radius: 8px; margin: 20px 0;">
            ${otp}
          </div>
          <p style="margin: 0;">This code expires in 10 minutes.</p>
        </div>
      `,
    });

    return { success: true, data: info };
  } catch (error: unknown) {
    console.error("Failed to send verification email:", error);
    return { success: false, error: (error as Error).message };
  }
}
