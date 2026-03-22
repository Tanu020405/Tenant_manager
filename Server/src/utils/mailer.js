/**
 * mailer.js
 * Sends email using Brevo HTTP API to bypass Render's SMTP block entirely!
 */

export async function sendMail({ to, subject, html, attachments }) {
    if (!to) return;

    const API_KEY = process.env.BREVO_API_KEY || "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";
    
    // We can still optionally use the .env fallbacks from before
    const senderEmail = process.env.SMTP_USER || "tanishqsingh233001@gmail.com";
    const senderName = "PropConnect";

    const body = {
        sender: { name: senderName, email: senderEmail },
        to: [{ email: to }],
        subject: subject,
        htmlContent: html,
    };

    if (attachments && attachments.length > 0) {
        body.attachment = attachments.map(att => ({
            name: att.filename,
            // Brevo expects a base64 string for attachments
            content: att.content.toString("base64")
        }));
    }

    try {
        const response = await fetch("https://api.brevo.com/v3/smtp/email", {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "api-key": API_KEY
            },
            body: JSON.stringify(body)
        });

        const result = await response.json();
        
        if (!response.ok) {
            console.error(`[Mailer] Failed via Brevo API:`, result);
        } else {
            console.log(`[Mailer] Successfully sent "${subject}" to ${to} via Brevo HTTP! MessageId:`, result?.messageId || "N/A");
        }
    } catch (err) {
        console.error(`[Mailer] Network failure sending email via Brevo:`, err.message);
    }
}
