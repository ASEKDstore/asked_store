import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { getProductsQuerySchema } from "../schemas/products";
import { getProducts, getProductBySlug } from "../services/productsService";
import { handleZodError, sendError } from "../utils/errors";

export async function productsRoutes(fastify: FastifyInstance) {
  // GET /products
  fastify.get(
    "/products",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const query = getProductsQuerySchema.parse(request.query);
        const result = await getProducts(query);
        return reply.send(result);
      } catch (error) {
        if (error instanceof Error && error.name === "ZodError") {
          return handleZodError(reply, error as any);
        }
        fastify.log.error(error);
        return sendError(reply, 500, "INTERNAL_SERVER_ERROR");
      }
    }
  );

  // GET /products/:slug
  fastify.get(
    "/products/:slug",
    async (request: FastifyRequest<{ Params: { slug: string } }>, reply: FastifyReply) => {
      try {
        const { slug } = request.params;
        const product = await getProductBySlug(slug);

        if (!product) {
          return sendError(reply, 404, "PRODUCT_NOT_FOUND");
        }

        return reply.send(product);
      } catch (error) {
        fastify.log.error(error);
        return sendError(reply, 500, "INTERNAL_SERVER_ERROR");
      }
    }
  );
}

