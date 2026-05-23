import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

async function testSMTP() {
  console.log("Testing SMTP credentials...\n");
  
  const config = {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE !== "false",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  };

  console.log("Config:");
  console.log(`  Host: ${config.host}`);
  console.log(`  Port: ${config.port}`);
  console.log(`  Secure: ${config.secure}`);
  console.log(`  User: ${config.auth.user}`);
  console.log(`  Pass: ${config.auth.pass.substring(0, 5)}...`);
  console.log("\nTesting connection...\n");

  const transporter = nodemailer.createTransport(config);

  try {
    await transporter.verify();
    console.log("✅ SMTP credentials are VALID!\n");

    // Try sending a test email
    console.log("Sending test email...");
    const info = await transporter.sendMail({
      from: `PropConnect <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER, // Send to yourself
      subject: "Test Email from PropConnect",
      html: "<h1>Success!</h1><p>If you see this, SMTP is working perfectly!</p>",
    });

    console.log(`✅ Email sent successfully!`);
    console.log(`   Message ID: ${info.messageId}`);
  } catch (err) {
    console.error("❌ SMTP Error:");
    console.error(`   ${err.message}`);
    console.error("\nFix options:");
    console.error("1. Check Gmail App Password (remove spaces)");
    console.error("2. Enable 2-Factor Authentication on Google Account");
    console.error("3. Verify SMTP_USER and SMTP_PASS in .env");
  }
}

testSMTP();
