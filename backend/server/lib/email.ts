import nodemailer from "nodemailer";

let cachedTransporter: nodemailer.Transporter | null = null;

async function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error("SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS must be configured");
  }

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    auth: {
      user,
      pass,
    },
  });

  return cachedTransporter;
}

export async function sendOtpEmail(email: string, otpCode: string): Promise<void> {
  const transporter = await getTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || "no-reply@example.com";

  await transporter.sendMail({
    from,
    to: email,
    subject: "Your Login Verification Code",
    text: `Your verification code is: ${otpCode}. It will expire in 5 minutes.`,
    html: `<h3>Your Verification Code</h3><p>Your 6-digit verification code is: <strong>${otpCode}</strong></p><p>It will expire in 5 minutes.</p>`,
  });
}
