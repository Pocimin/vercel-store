import { z } from "zod";

export const scriptHandshakeSchema = z.object({
  key: z.string().min(8),
  scriptFile: z.string().min(1),
  scriptVersion: z.string().optional(),
  game: z.string().optional(),
  executor: z.string().optional(),
  hwid: z.string().min(4),
  robloxUserId: z.string().optional(),
  robloxUsername: z.string().optional()
});

export const scriptHeartbeatSchema = z.object({
  sessionId: z.string().min(1),
  stats: z.record(z.string(), z.unknown()).optional(),
  currentTask: z.string().optional(),
  earnings: z.number().optional()
});

export const monitoringHandshakeSchema = scriptHandshakeSchema
  .omit({ key: true })
  .extend({ monitoringCode: z.string().min(16) });

export const scriptEventSchema = z.object({
  sessionId: z.string().min(1),
  type: z.string().min(1),
  payload: z.record(z.string(), z.unknown()).optional()
});

export type ScriptHandshake = z.infer<typeof scriptHandshakeSchema>;
export type ScriptHeartbeat = z.infer<typeof scriptHeartbeatSchema>;
export type ScriptEvent = z.infer<typeof scriptEventSchema>;

export type ScriptCommand =
  | { type: "kick"; reason: string }
  | { type: "stop"; reason: string }
  | { type: "config"; flags: Record<string, unknown> };
