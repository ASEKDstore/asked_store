import crypto from "crypto";
import { env } from "../config/env";
import { TelegramUser } from "../types";

interface ParsedInitData {
  hash: string;
  data: Record<string, string>;
}

export function parseInitData(initData: string): ParsedInitData {
  const params = new URLSearchParams(initData);
  const data: Record<string, string> = {};
  let hash = "";

  for (const [key, value] of params.entries()) {
    if (key === "hash") {
      hash = value;
    } else {
      data[key] = value;
    }
  }

  return { hash, data };
}

export function validateTelegramInitData(initData: string): boolean {
  try {
    const { hash, data } = parseInitData(initData);

    if (!hash || Object.keys(data).length === 0) {
      return false;
    }

    // Сортируем ключи и собираем data_check_string
    const dataCheckString = Object.keys(data)
      .sort()
      .map((key) => `${key}=${data[key]}`)
      .join("\n");

    // Создаем secret_key из TELEGRAM_BOT_TOKEN
    const secretKey = crypto.createHash("sha256").update(env.TELEGRAM_BOT_TOKEN).digest();

    // Вычисляем HMAC_SHA256
    const computedHash = crypto
      .createHmac("sha256", secretKey)
      .update(dataCheckString)
      .digest("hex");

    // Сравниваем hash
    return computedHash === hash;
  } catch (error) {
    return false;
  }
}

export function extractUserFromInitData(initData: string): TelegramUser | null {
  try {
    const { data } = parseInitData(initData);
    const userStr = data.user;

    if (!userStr) {
      return null;
    }

    const user = JSON.parse(userStr) as TelegramUser;
    return user;
  } catch (error) {
    return null;
  }
}

