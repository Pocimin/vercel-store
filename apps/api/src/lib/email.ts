import nodemailer from "nodemailer";
import { env } from "../env.js";

export async function sendEmail(to: string | null | undefined, subject: string, text: string) {
  if (!to) return;

  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    console.log(`[email:fallback] to=${to} subject=${subject}\n${text}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS
    }
  });

  await transporter.sendMail({
    from: env.SMTP_FROM,
    to,
    subject,
    text
  });
}
