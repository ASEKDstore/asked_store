export type OrderStatus = 'new' | 'in_progress' | 'done' | 'canceled'

export type DeliveryMethod = 'post' | 'cdek' | 'avito'

export interface OrderItem {
  productId?: string // For regular products
  labProductId?: string // For LAB products
  type?: 'product' | 'lab' // Type of item
  title: string
  article: string
  price: number
  qty: number
  size?: string
  artistName?: string // For LAB products
}

export interface OrderDelivery {
  fullName: string
  phone: string
  address: string
  method: DeliveryMethod
}

export interface Order {
  id: string
  createdAt: string
  user: {
    tgId: number
    name: string
    username?: string
    photo_url?: string
  }
  items: OrderItem[]
  totalPrice: number
  status: OrderStatus
  delivery: OrderDelivery
  comment?: string
  promoCode?: string
  discount?: number
}

export interface CreateOrderRequest {
  user: {
    tgId: number
    name: string
    username?: string
    photo_url?: string
  }
  items: OrderItem[]
  delivery: OrderDelivery
  comment?: string
  promoCode?: string
  discount?: number
}

