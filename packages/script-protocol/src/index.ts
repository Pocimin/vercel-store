import { z } from "zod";

export const scriptHandshakeSchema = z.object({
  key: z.string().min(8).max(128),
  scriptFile: z.string().min(1).max(128),
  scriptVersion: z.string().max(64).optional(),
  game: z.string().max(64).optional(),
  executor: z.string().max(64).optional(),
  hwid: z.string().min(4).max(256),
  robloxUserId: z.string().max(64).optional(),
  robloxUsername: z.string().max(64).optional()
});

export const scriptHeartbeatSchema = z.object({
  sessionId: z.string().min(1),
  sessionToken: z.string().length(64),
  stats: z.record(z.string().max(64), z.unknown()).optional(),
  currentTask: z.string().max(256).optional(),
  earnings: z.number().finite().optional()
});

export const monitoringHandshakeSchema = scriptHandshakeSchema
  .omit({ key: true })
  .extend({ monitoringCode: z.string().min(16).max(128) });

export const scriptEventSchema = z.object({
  sessionId: z.string().min(1),
  sessionToken: z.string().length(64),
  type: z.string().min(1).max(64),
  payload: z.record(z.string().max(64), z.unknown()).optional()
});

export type ScriptHandshake = z.infer<typeof scriptHandshakeSchema>;
export type ScriptHeartbeat = z.infer<typeof scriptHeartbeatSchema>;
export type ScriptEvent = z.infer<typeof scriptEventSchema>;

export type ScriptCommand =
  | { type: "kick"; reason: string }
  | { type: "stop"; reason: string }
  | { type: "config"; flags: Record<string, unknown> };
