import { prisma } from "../lib/prisma";

export async function createOrder(
  userId: string,
  deliveryAddress: {
    firstName: string;
    lastName: string;
    phone: string;
    address?: string;
    city?: string;
    postalCode?: string;
  },
  promoCode?: string
) {
  return await prisma.$transaction(async (tx) => {
    // Get cart items
    const cartItems = await tx.cartItem.findMany({
      where: { userId },
      include: {
        product: true,
      },
    });

    if (cartItems.length === 0) {
      throw new Error("CART_IS_EMPTY");
    }

    // Calculate totals
    const subtotal = cartItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );

    let total = subtotal;
    // TODO: Apply promo code if provided
    // For now, skip promo code logic

    // Create order
    const order = await tx.order.create({
      data: {
        userId,
        status: "pending",
        total,
        subtotal,
        shipping: 0,
        firstName: deliveryAddress.firstName,
        lastName: deliveryAddress.lastName,
        phone: deliveryAddress.phone,
        address: deliveryAddress.address,
        city: deliveryAddress.city,
        postalCode: deliveryAddress.postalCode,
        items: {
          create: cartItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.price,
            size: item.size,
            color: item.color,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // Clear cart
    await tx.cartItem.deleteMany({
      where: { userId },
    });

    return order;
  });
}

export async function updateOrderStatus(orderId: string, status: string) {
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
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  return order;
}
