import "server-only";

export interface OutgoingEmail {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Sends an email through Resend when RESEND_API_KEY is set.
 * When it isn't (local/demo), it logs the message to the server console so
 * flows like password reset are fully testable without an email provider.
 * To use another provider (SendGrid, SES, Postmark…), swap the fetch below.
 */
export async function sendEmail(email: OutgoingEmail): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "StoreLink <onboarding@resend.dev>";

  if (!key) {
    // In production, NEVER log message bodies — they can contain PII and
    // one-time password-reset links (account-takeover tokens). Fail loudly so
    // a missing key is caught, not silently dumped into server logs.
    if (process.env.NODE_ENV === "production") {
      console.error("sendEmail: RESEND_API_KEY is not set — cannot send mail.");
      throw new Error("Email is not configured.");
    }
    // Dev/demo only: print so flows like password reset are testable locally.
    console.log(
      `\n[email:dev] (no RESEND_API_KEY set — not actually sent)\n  To: ${email.to}\n  Subject: ${email.subject}\n  ${email.text.replace(/\n/g, "\n  ")}\n`
    );
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: email.to,
      subject: email.subject,
      text: email.text,
      ...(email.html ? { html: email.html } : {}),
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error("sendEmail failed:", res.status, body);
    throw new Error("Could not send the email.");
  }
}
