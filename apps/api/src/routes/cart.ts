import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { authGuard } from "../middleware/auth";
import { updateCartSchema } from "../schemas/cart";
import { getCart, updateCartItem } from "../services/cartService";
import { handleZodError, sendError } from "../utils/errors";

export async function cartRoutes(fastify: FastifyInstance) {
  // GET /cart
  fastify.get(
    "/cart",
    { preHandler: authGuard },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        if (!request.user) {
          return sendError(reply, 401, "UNAUTHORIZED");
        }

        const cart = await getCart(request.user.id);
        return reply.send(cart);
      } catch (error) {
        fastify.log.error(error);
        return sendError(reply, 500, "INTERNAL_SERVER_ERROR");
      }
    }
  );

  // PUT /cart
  fastify.put(
    "/cart",
    { preHandler: authGuard },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        if (!request.user) {
          return sendError(reply, 401, "UNAUTHORIZED");
        }

        const body = updateCartSchema.parse(request.body);
        const cart = await updateCartItem(
          request.user.id,
          body.productId,
          body.quantity,
          body.size,
          body.color
        );
        return reply.send(cart);
      } catch (error) {
        if (error instanceof Error && error.name === "ZodError") {
          return handleZodError(reply, error as any);
        }

        if (error instanceof Error) {
          if (error.message === "PRODUCT_NOT_FOUND") {
            return sendError(reply, 404, "PRODUCT_NOT_FOUND");
          }
          if (error.message === "PRODUCT_NOT_ACTIVE") {
            return sendError(reply, 400, "PRODUCT_NOT_ACTIVE");
          }
          if (error.message === "INSUFFICIENT_STOCK") {
            return sendError(reply, 400, "INSUFFICIENT_STOCK");
          }
        }

        fastify.log.error(error);
        return sendError(reply, 500, "INTERNAL_SERVER_ERROR");
      }
    }
  );
}
