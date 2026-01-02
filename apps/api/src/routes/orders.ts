import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { authGuard } from "../middleware/auth";
import { createOrderSchema } from "../schemas/orders";
import { createOrder } from "../services/ordersService";
import { handleZodError, sendError } from "../utils/errors";

export async function ordersRoutes(fastify: FastifyInstance) {
  // POST /orders
  fastify.post(
    "/orders",
    { preHandler: authGuard },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        if (!request.user) {
          return sendError(reply, 401, "UNAUTHORIZED");
        }

        const body = createOrderSchema.parse(request.body);
        const order = await createOrder(
          request.user.id,
          body.deliveryAddress,
          body.promoCode
        );

        return reply.code(201).send(order);
      } catch (error) {
        if (error instanceof Error && error.name === "ZodError") {
          return handleZodError(reply, error as any);
        }

        if (error instanceof Error) {
          if (error.message === "CART_IS_EMPTY") {
            return sendError(reply, 400, "CART_IS_EMPTY");
          }
          if (error.message === "INVALID_PROMO_CODE") {
            return sendError(reply, 400, "INVALID_PROMO_CODE");
          }
          if (error.message === "PROMO_CODE_NOT_STARTED") {
            return sendError(reply, 400, "PROMO_CODE_NOT_STARTED");
          }
          if (error.message === "PROMO_CODE_EXPIRED") {
            return sendError(reply, 400, "PROMO_CODE_EXPIRED");
          }
        }

        fastify.log.error(error);
        return sendError(reply, 500, "INTERNAL_SERVER_ERROR");
      }
    }
  );
}

