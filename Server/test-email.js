import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

async function test() {
  console.log("Starting test...");
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
  
  console.log("Host:", SMTP_HOST);
  console.log("Port:", SMTP_PORT);
  console.log("User:", SMTP_USER);
  console.log("From:", SMTP_FROM);
  
  if (!SMTP_HOST) return console.log("Missing SMTP_HOST");

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 465),
    secure: process.env.SMTP_SECURE !== "false",
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  try {
    console.log("Sending mail...");
    const info = await transporter.sendMail({
      from: SMTP_FROM || SMTP_USER,
      to: SMTP_USER,
      subject: "Test Email from Debugger 2",
      html: "<p>If you see this, SMTP is working perfectly!</p>"
    });
    console.log(`[Mailer] SUCCESS! Sent to ${SMTP_USER} — messageId: ${info.messageId}`);
  } catch (err) {
    console.error(`[Mailer] FAILED:`, err.message);
  }
}

test();
