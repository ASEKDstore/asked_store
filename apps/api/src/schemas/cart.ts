import { z } from "zod";

export const updateCartSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(0),
  size: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
});
