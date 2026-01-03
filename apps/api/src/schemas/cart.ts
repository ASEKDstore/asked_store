import { z } from "zod";

export const updateCartSchema = z.object({
  variantId: z.string().uuid(),
  qty: z.number().int().min(0),
});




