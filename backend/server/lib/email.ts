import nodemailer from "nodemailer";

let cachedTransporter: nodemailer.Transporter | null = null;

async function getTransporter() {
  if (cachedTransporter) return cachedTransporter;
  
  const testAccount = await nodemailer.createTestAccount();
  console.log("Ethereal Email Setup:", testAccount.user, testAccount.pass);
  
  cachedTransporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
  
  return cachedTransporter;
}

export async function sendOtpEmail(email: string, otpCode: string): Promise<string | false> {
  try {
    console.log(`[MFA] OTP for ${email}: ${otpCode}`);

    const transporter = await getTransporter();
    
    let info = await transporter.sendMail({
      from: '"Doctor Portal" <no-reply@doctorportal.com>',
      to: email,
      subject: "Your Login Verification Code",
      text: `Your verification code is: ${otpCode}. It will expire in 5 minutes.`,
      html: `<h3>Your Verification Code</h3><p>Your 6-digit verification code is: <strong>${otpCode}</strong></p><p>It will expire in 5 minutes.</p>`,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log("Message sent: %s", info.messageId);
    console.log("Preview URL: %s", previewUrl);
    
    // Fallback for returning a string or false 
    return previewUrl || false;
  } catch (error) {
    console.error("Error sending OTP email:", error);
    return false;
  }
}
