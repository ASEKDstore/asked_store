import { prisma } from "../lib/prisma";

export async function getCart(userId: string) {
  let cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: {
                include: {
                  images: {
                    orderBy: { sortOrder: "asc" },
                    take: 1,
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: {
        userId,
      },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  include: {
                    images: {
                      orderBy: { sortOrder: "asc" },
                      take: 1,
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  const items = cart.items.map((item) => ({
    id: item.id,
    variantId: item.variantId,
    qty: item.qty,
    variant: {
      id: item.variant.id,
      sku: item.variant.sku,
      size: item.variant.size,
      color: item.variant.color,
      price: item.variant.price,
      stock: item.variant.stock,
      product: {
        id: item.variant.product.id,
        title: item.variant.product.title,
        slug: item.variant.product.slug,
        image: item.variant.product.images[0]?.url || null,
      },
    },
    lineTotal: item.variant.price * item.qty,
  }));

  const total = items.reduce((sum, item) => sum + item.lineTotal, 0);

  return {
    id: cart.id,
    items,
    total,
    itemCount: items.reduce((sum, item) => sum + item.qty, 0),
  };
}

export async function updateCartItem(userId: string, variantId: string, qty: number) {
  // Get or create cart
  let cart = await prisma.cart.findUnique({
    where: { userId },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId },
    });
  }

  // Check variant exists and is active
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
  });

  if (!variant) {
    throw new Error("VARIANT_NOT_FOUND");
  }

  if (!variant.isActive) {
    throw new Error("VARIANT_NOT_ACTIVE");
  }

  if (qty === 0) {
    // Remove item
    await prisma.cartItem.deleteMany({
      where: {
        cartId: cart.id,
        variantId,
      },
    });
  } else {
    // Check stock
    if (qty > variant.stock) {
      throw new Error("INSUFFICIENT_STOCK");
    }

    // Upsert item
    await prisma.cartItem.upsert({
      where: {
        cartId_variantId: {
          cartId: cart.id,
          variantId,
        },
      },
      update: {
        qty,
      },
      create: {
        cartId: cart.id,
        variantId,
        qty,
      },
    });
  }

  return getCart(userId);
}




