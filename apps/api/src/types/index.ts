import { FastifyRequest } from "fastify";

export interface JWTPayload {
  userId: string;
  role: string;
}

export interface AuthenticatedRequest extends FastifyRequest {
  user: {
    userId: string;
    role: string;
  };
}

export interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
}

