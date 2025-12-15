export interface Banner {
  id: string
  title: string
  subtitle?: string
  description: string
  image: string // Основное изображение (URL)
  ctaText?: string // Текст кнопки
  detailsImage?: string | null // Детальное изображение (URL)
  active?: boolean
  order?: number
  createdAt: string
  updatedAt: string
}

export interface CreateBannerRequest {
  title: string
  subtitle?: string
  description: string
  image: string // Основное изображение (URL)
  ctaText?: string // Текст кнопки
  detailsImage?: string | null // Детальное изображение (URL)
  active?: boolean
  order?: number
}

export interface UpdateBannerRequest extends Partial<CreateBannerRequest> {}

