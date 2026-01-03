import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  TELEGRAM_BOT_TOKEN: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  PORT: z.string().optional().default("3000"),
  NODE_ENV: z.enum(["development", "production", "test"]).optional().default("development"),
  ADMIN_TELEGRAM_IDS: z.string().optional().default(""),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missing = error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("\n");
      throw new Error(`Missing or invalid environment variables:\n${missing}`);
    }
    throw error;
  }
}

export const env = validateEnv();

// Helper to check if Telegram ID is admin
export function isAdminTelegramId(telegramId: string): boolean {
  const adminIds = env.ADMIN_TELEGRAM_IDS.split(",")
    .map((id) => id.trim())
    .filter((id) => id.length > 0);
  return adminIds.includes(telegramId);
}
