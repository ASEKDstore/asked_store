// Тип баннера (используется в компонентах)
// Данные теперь загружаются из API /api/banners
export type Banner = {
  id: string
  title: string
  subtitle?: string
  description: string
  image: string
  ctaText?: string
  detailsImage?: string
  isActive?: boolean
  order?: number
}

