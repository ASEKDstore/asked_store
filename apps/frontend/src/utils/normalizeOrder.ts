export type LineItem = {
  productId?: string | null
  labProductId?: string | null
  type?: string | null
  title?: string
  article?: string
  price?: number
  qty?: number
  size?: string | null
  artistName?: string | null
}

/**
 * Safely extract line items array from order
 * Handles various order.items formats:
 * - itemsList (from normalized backend response)
 * - items as array (rare case)
 * - items.items (nested in JSON object)
 * - items as JSON string
 */
export function getOrderLineItems(order: any): LineItem[] {
  // 1) if backend already returns itemsList
  if (Array.isArray(order?.itemsList)) {
    return order.itemsList
  }

  // 2) if order.items is already an array (rare case)
  if (Array.isArray(order?.items)) {
    return order.items
  }

  // 3) if order.items is JSON object with nested items[]
  if (Array.isArray(order?.items?.items)) {
    return order.items.items
  }

  // 4) if order.items is JSON string
  if (typeof order?.items === 'string') {
    try {
      const parsed = JSON.parse(order.items)
      if (Array.isArray(parsed?.items)) {
        return parsed.items
      }
    } catch {
      // Ignore parse errors
    }
  }

  // Return empty array as safe fallback
  return []
}

