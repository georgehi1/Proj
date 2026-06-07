// Outbound email.
//
// When RESEND_API_KEY is set we send via Resend's REST API (no extra
// dependency). Otherwise we fall back to logging the message, so the send
// flow works end-to-end in local dev and tests without a provider — the
// caller still records the communication and updates state as if sent.

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || "Homefix Renovations <onboarding@resend.dev>";

export const emailConfigured = Boolean(RESEND_API_KEY);

export type EmailAttachment = { filename: string; content: Buffer };

export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  attachments?: EmailAttachment[];
};

export async function sendEmail({ to, subject, text, attachments }: EmailMessage): Promise<void> {
  if (!emailConfigured) {
    console.info(
      `[email:dev] would send to=${to} subject="${subject}" attachments=${attachments?.length ?? 0} ` +
        `(set RESEND_API_KEY to actually send)`
    );
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${RESEND_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: [to],
      subject,
      text,
      attachments: attachments?.map((a) => ({
        filename: a.filename,
        content: a.content.toString("base64"),
      })),
    }),
  });

  if (!res.ok) {
    throw new Error(`Email send failed (${res.status}): ${await res.text()}`);
  }
}
