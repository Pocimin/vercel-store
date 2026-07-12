import { z } from "zod";

const blankToUndefined = (value: unknown) => value === "" ? undefined : value;
const optionalUrl = z.preprocess(blankToUndefined, z.string().url().optional());
const optionalString = z.preprocess(blankToUndefined, z.string().optional());

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_HOST: z.string().default("0.0.0.0"),
  API_PORT: z.coerce.number().int().positive().default(4000),
  PUBLIC_WEB_URL: z.string().url().default("http://localhost:3000"),
  PUBLIC_API_URL: optionalUrl,
  PUBLIC_TURNSTILE_SITE_KEY: optionalString,
  DATABASE_URL: z.string().min(1),
  SESSION_SECRET: z.string().min(24),
  INTERNAL_SERVICE_TOKEN: z.string().min(24),
  SCRIPT_SIGNING_SECRET: z.string().min(24),
  SCRIPT_RAW_ROOT: z.string().default("storage/raw"),
  SCRIPT_ARTIFACT_ROOT: z.string().default("storage/builds"),
  PROMETHEUS_ROOT: z.string().default("../Prometheus-master"),
  PROMETHEUS_PRESET: z.string().default("Medium"),
  SMTP_HOST: optionalString,
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: optionalString,
  SMTP_PASS: optionalString,
  SMTP_FROM: z.string().default("nznt's hub <no-reply@nznt.store>"),
  DISCORD_ADMIN_WEBHOOK_URL: optionalUrl,
  DISCORD_CLIENT_ID: optionalString,
  DISCORD_CLIENT_SECRET: optionalString,
  DISCORD_REDIRECT_URI: optionalUrl,
  TURNSTILE_SECRET_KEY: optionalString,
  VONALIA_API_KEY: optionalString,
  VONALIA_TEAM_ID: optionalString,
  VONALIA_WEEKLY_TEAM_ID: optionalString,
  VONALIA_MONTHLY_TEAM_ID: optionalString,
  VONALIA_LIFETIME_TEAM_ID: optionalString
});

export const env = envSchema.parse(process.env);
