export type Banner = {
  id: string
  title: string
  subtitle?: string
  description: string
  image: string // путь из public/assets
  ctaText?: string
  // NEW:
  detailsImage?: string // фото для подстраницы (над описанием)
}

export const banners: Banner[] = [
  {
    id: 'drop-001',
    title: 'DROP 001',
    subtitle: 'Новый дроп • лимит',
    description:
      'Описание баннера: что за дроп, чем интересен, какие айтемы. Позже будет из админки.',
    image: '/assets/banner-1.jpg',
    ctaText: 'Подробнее',
    detailsImage: '/assets/banner-details-1.jpg',
  },
  {
    id: 'lab-custom',
    title: 'ASKED LAB',
    subtitle: 'Кастомы • ручная работа',
    description:
      'Описание баннера: кастомы, художник, как заказать. Позже будет из админки.',
    image: '/assets/banner-2.jpg',
    ctaText: 'Подробнее',
    detailsImage: '/assets/banner-details-2.jpg',
  },
  {
    id: 'promo-access',
    title: 'ACCESS',
    subtitle: 'Промокоды • бонусы',
    description:
      'Описание баннера: промо, условия, сроки. Позже будет из админки.',
    image: '/assets/banner-3.jpg',
    ctaText: 'Подробнее',
  },
]

