import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { env } from "../config/env";
import { validateTelegramInitData, extractUserFromInitData } from "../utils/telegram";
import { JWTPayload } from "../types";
import { prisma } from "../lib/prisma";

const authTelegramSchema = z.object({
  initData: z.string().min(1),
});

export async function authRoutes(fastify: FastifyInstance) {
  // POST /auth/telegram
  fastify.post(
    "/telegram",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = authTelegramSchema.parse(request.body);

        // Валидация initData
        if (!validateTelegramInitData(body.initData)) {
          return reply.code(401).send({ error: "Invalid initData" });
        }

        // Извлечение пользователя из initData
        const telegramUser = extractUserFromInitData(body.initData);
        if (!telegramUser) {
          return reply.code(401).send({ error: "Invalid user data" });
        }

        // Upsert пользователя в БД
        const user = await prisma.user.upsert({
          where: {
            telegramId: String(telegramUser.id),
          },
          update: {
            username: telegramUser.username || null,
            firstName: telegramUser.first_name || null,
            lastName: telegramUser.last_name || null,
          },
          create: {
            telegramId: String(telegramUser.id),
            username: telegramUser.username || null,
            firstName: telegramUser.first_name || null,
            lastName: telegramUser.last_name || null,
            role: "USER",
          },
        });

        // Создание JWT токена
        const payload: JWTPayload = {
          userId: user.id,
          role: user.role,
        };

        const accessToken = jwt.sign(payload, env.JWT_SECRET, {
          expiresIn: "15m",
        });

        return reply.send({ accessToken });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.code(400).send({ error: "Invalid request body", details: error.errors });
        }

        fastify.log.error(error);
        return reply.code(500).send({ error: "Internal server error" });
      }
    }
  );
}

