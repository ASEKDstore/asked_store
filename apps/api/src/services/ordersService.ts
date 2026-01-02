import { prisma } from "../lib/prisma";
import { OrderStatus } from "@prisma/client";

export async function createOrder(
  userId: string,
  deliveryAddress: Record<string, unknown>,
  promoCode?: string
) {
  return await prisma.$transaction(async (tx) => {
    // Get cart
    const cart = await tx.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new Error("CART_IS_EMPTY");
    }

    // Calculate total
    let totalAmount = cart.items.reduce(
      (sum, item) => sum + item.variant.price * item.qty,
      0
    );

    // Apply promo code if provided
    if (promoCode) {
      const promo = await tx.promoCode.findUnique({
        where: { code: promoCode },
      });

      if (!promo || !promo.isActive) {
        throw new Error("INVALID_PROMO_CODE");
      }

      const now = new Date();
      if (promo.startsAt && now < promo.startsAt) {
        throw new Error("PROMO_CODE_NOT_STARTED");
      }

      if (promo.endsAt && now > promo.endsAt) {
        throw new Error("PROMO_CODE_EXPIRED");
      }

      if (promo.discountType === "PERCENT") {
        totalAmount = Math.round(totalAmount * (1 - promo.value / 100));
      } else {
        totalAmount = Math.max(0, totalAmount - promo.value);
      }
    }

    // Create order
    const order = await tx.order.create({
      data: {
        userId,
        status: OrderStatus.NEW,
        totalAmount,
        deliveryAddress,
        items: {
          create: cart.items.map((item) => ({
            variantSnapshot: {
              id: item.variant.id,
              sku: item.variant.sku,
              size: item.variant.size,
              color: item.variant.color,
              price: item.variant.price,
              product: {
                id: item.variant.product.id,
                title: item.variant.product.title,
                slug: item.variant.product.slug,
              },
            },
            qty: item.qty,
            lineAmount: item.variant.price * item.qty,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    // Clear cart
    await tx.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return order;
  });
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const order = await prisma.order.update({
    where: { id: orderId },
    data: { status },
    include: {
      user: {
        select: {
          id: true,
          telegramId: true,
          firstName: true,
          lastName: true,
        },
      },
      items: true,
    },
  });

  return order;
}



