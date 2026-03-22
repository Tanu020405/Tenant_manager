/**
 * mailer.js
 * Lazy-initialised Nodemailer transporter.
 * All SMTP config is read from env vars — missing config logs a warning,
 * never throws (so a broken SMTP setup never crashes the API).
 */

import nodemailer from "nodemailer";

let _transporter = null;

function getTransporter() {
    if (_transporter) return _transporter;

    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
        console.warn("[Mailer] SMTP credentials not configured — emails are disabled.");
        return null;
    }

    _transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT || 465),
        secure: process.env.SMTP_SECURE !== "false", // default true
        auth: { user: SMTP_USER, pass: SMTP_PASS },
    });

    return _transporter;
}

/**
 * Send an email. Fire-and-forget — errors are logged, never propagated.
 *
 * @param {{ to: string, subject: string, html: string, attachments?: object[] }} options
 */
export async function sendMail({ to, subject, html, attachments }) {
    if (!to) return;

    const transporter = getTransporter();
    if (!transporter) return;

    const from = process.env.SMTP_FROM || process.env.SMTP_USER;

    try {
        const info = await transporter.sendMail({ from, to, subject, html, attachments });
        console.log(`[Mailer] Sent "${subject}" to ${to} — messageId: ${info.messageId}`);
    } catch (err) {
        console.error(`[Mailer] Failed to send "${subject}" to ${to}:`, err.message);
    }
}
