import nodemailer from "nodemailer";
import { env } from "../env.js";

export async function sendEmail(to: string | null | undefined, subject: string, text: string) {
  if (!to) return;

  if (env.RESEND_API_KEY) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: env.SMTP_FROM,
          to: [to],
          subject,
          text
        })
      });
      if (!response.ok) {
        console.error(`[email:resend] ${response.status} ${await response.text()}`);
      } else {
        console.log(`[email:resend] queued for ${to}`);
      }
    } catch (error) {
      console.error(`[email:resend] failed: ${error instanceof Error ? error.message : String(error)}`);
    }
    return;
  }

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

export async function sendLicenseKeyEmail(to: string | null | undefined, key: string, plan: string, expiresAt: Date | string) {
  if (!to) return;
  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);
  const expiresLabel = expiresAt instanceof Date ? expiresAt.toISOString() : String(expiresAt);
  const text = [
    "Your nznt license is ready! Lisensi nznt-mu sudah siap!",
    "",
    `Plan / Paket: ${planLabel}`,
    `License key / Kunci lisensi: ${key}`,
    `Expires / Berlaku sampai: ${expiresLabel}`,
    "",
    "How to use / Cara pakai:",
    "- Put this key in getgenv().NZNT_LICENSE_KEY or nznt_license_key.txt",
    "- Enter the key in your script executor before running nznt",
    "",
    "Keep this key private - do not share it.",
    "Jaga kerahasiaan kunci ini - jangan dibagikan ke siapa pun.",
    "",
    "Thank you for supporting nznt's hub. / Terima kasih sudah mendukung nznt's hub."
  ].join("\n");
  return sendEmail(to, "Your nznt license key is ready", text);
}
