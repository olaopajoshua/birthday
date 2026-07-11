import { Resend } from "resend";
import { ENV } from "./_core/env";

const resend = ENV.resendApiKey ? new Resend(ENV.resendApiKey) : null;

export async function sendEmail(to: string, subject: string, htmlBody: string) {
  if (!resend) {
    console.log(`[Email] RESEND_API_KEY is not set. Skipping email to ${to}: ${subject}`);
    return;
  }

  const { error } = await resend.emails.send({
    from: ENV.emailFrom,
    to,
    subject,
    html: htmlBody,
  });

  if (error) {
    throw new Error(error.message);
  }
}
