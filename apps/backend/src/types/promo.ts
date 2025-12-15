export type PromoType = 'percent' | 'fixed'

export interface Promo {
  id: string
  code: string
  type: PromoType
  value: number
  active: boolean
  usageLimit: number | null
  usedCount: number
  expiresAt: string | null
  createdAt: string
}

export interface CreatePromoRequest {
  code: string
  type: PromoType
  value: number
  active?: boolean
  usageLimit?: number | null
  expiresAt?: string | null
}

export interface GeneratePromosRequest {
  prefix?: string
  count: number
  type: PromoType
  value: number
  usageLimit?: number | null
  expiresAt?: string | null
}

export interface ApplyPromoRequest {
  code: string
  cartTotal: number
}



