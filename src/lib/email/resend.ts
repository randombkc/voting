import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy");

export async function sendVerificationOtpEmail(email: string, otp: string) {
  const fromEmail = process.env.EMAIL_FROM || "noreply@perizia.example";

  try {
    const data = await resend.emails.send({
      from: `Voting System <${fromEmail}>`,
      to: email,
      subject: "Your Voting Verification Code",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Voting Verification Code</h2>
          <p>Please use the following 6-digit code to verify your email address and continue to the voting platform.</p>
          <div style="background-color: #f4f4f4; padding: 16px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 4px; border-radius: 8px; margin: 24px 0;">
            ${otp}
          </div>
          <p>This code will expire in 10 minutes. If you did not request this code, you can safely ignore this email.</p>
        </div>
      `,
    });

    return { success: true, data };
  } catch (error: unknown) {
    console.error("Failed to send verification email:", error);
    return { success: false, error: (error as Error).message };
  }
}
