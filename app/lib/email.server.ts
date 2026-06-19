import { Resend } from "resend";
import { env, hasResend } from "./env.server";

const resend = hasResend ? new Resend(env.RESEND_API_KEY) : null;

type SendArgs = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

/**
 * Sends an email via Resend, or logs to the console in dev when no key is set.
 * This lets magic-link / OTP / receipts work locally without an email provider.
 */
export async function sendEmail({ to, subject, html, text }: SendArgs) {
  if (!resend) {
    console.log("\n📧 [email stub] (set RESEND_API_KEY to send for real)");
    console.log(`   to:      ${to}`);
    console.log(`   subject: ${subject}`);
    console.log(`   text:    ${text ?? stripHtml(html)}\n`);
    return { id: "stubbed", stubbed: true as const };
  }

  const { data, error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to,
    subject,
    html,
    text: text ?? stripHtml(html),
  });

  if (error) throw new Error(`Failed to send email: ${error.message}`);
  return { id: data?.id ?? "", stubbed: false as const };
}

function stripHtml(html: string) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
