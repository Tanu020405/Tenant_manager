/**
 * mailer.js
 * Sends transactional emails using nodemailer with SMTP
 */

import nodemailer from "nodemailer";

// Create SMTP transporter from environment variables
const createTransporter = () => {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = process.env;
    
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
        console.warn("[Mailer] WARNING: SMTP credentials missing in .env");
        console.warn("[Mailer] Required: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE");
        return null;
    }

    return nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT || 465),
        secure: SMTP_SECURE !== "false", // Default to true for port 465
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS,
        },
    });
};

export async function sendMail({ to, subject, html, attachments }) {
    if (!to) return Promise.resolve();

    const transporter = createTransporter();
    if (!transporter) {
        console.warn(`[Mailer] Email NOT sent to ${to} — SMTP not configured`);
        return Promise.resolve();
    }

    const senderEmail = process.env.SMTP_USER || "noreply@propconnect.com";
    const senderName = "PropConnect";

    const mailOptions = {
        from: `${senderName} <${senderEmail}>`,
        to: to,
        subject: subject,
        html: html,
        attachments: attachments || [],
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`[Mailer] Successfully sent "${subject}" to ${to} — MessageId: ${info.messageId}`);
        return info;
    } catch (err) {
        console.error(`[Mailer] Failed to send email to ${to}:`, err.message);
        throw err;
    }
}
