export type Product = {
  id: string
  article: string // АРТИКУЛ
  title: string
  price: number
  oldPrice?: number // Старая цена (если есть скидка)
  image: string
  images?: string[] // Галерея фото
  description: string
  sizes: string[]
  category: 'hoodie' | 'tshirt' | 'pants' | 'custom' | 'accessories' | 'headwear'
  tags: string[]
  available: boolean
  inStock?: boolean // Альтернативное название для available
}

export const products: Product[] = [
  {
    id: 'p-001',
    article: 'ASK-001-BLK',
    title: 'ASKED Hoodie Black',
    price: 8990,
    oldPrice: 11990,
    image: '/assets/product-1.jpg',
    images: [
      '/assets/product-1.jpg',
      '/assets/product-1.jpg',
      '/assets/product-1.jpg',
      '/assets/product-1.jpg',
    ],
    description:
      'Классический худи чёрного цвета с минималистичным дизайном. Премиум качество ткани, удобный крой, идеально для повседневной носки.',
    sizes: ['S', 'M', 'L', 'XL'],
    category: 'hoodie',
    tags: ['drop001', 'classic'],
    available: true,
  },
  {
    id: 'p-002',
    article: 'ASK-002-GRY',
    title: 'ASKED Hoodie Grey',
    price: 8990,
    image: '/assets/product-2.jpg',
    images: [
      '/assets/product-2.jpg',
      '/assets/product-2.jpg',
      '/assets/product-2.jpg',
    ],
    description:
      'Серый худи с фирменным логотипом ASKED. Универсальный цвет, который подходит к любому образу. Комфорт и стиль в одном изделии.',
    sizes: ['S', 'M', 'L', 'XL'],
    category: 'hoodie',
    tags: ['drop001', 'classic'],
    available: true,
  },
  {
    id: 'p-003',
    article: 'ASK-003-WHT',
    title: 'ASKED Hoodie White',
    price: 8990,
    oldPrice: 10990,
    image: '/assets/product-3.jpg',
    images: [
      '/assets/product-3.jpg',
      '/assets/product-3.jpg',
      '/assets/product-3.jpg',
      '/assets/product-3.jpg',
      '/assets/product-3.jpg',
    ],
    description:
      'Белый худи для тех, кто ценит чистоту линий и минимализм. Яркий акцент в гардеробе, который не останется незамеченным.',
    sizes: ['S', 'M', 'L', 'XL'],
    category: 'hoodie',
    tags: ['drop001', 'limited'],
    available: true,
  },
  {
    id: 'p-004',
    article: 'ASK-004-LAB',
    title: 'ASKED LAB Custom',
    price: 14990,
    image: '/assets/product-4.jpg',
    description:
      'Эксклюзивный кастомный худи от ASKED LAB. Уникальный дизайн, ограниченная серия. Для тех, кто ищет что-то особенное.',
    sizes: ['M', 'L', 'XL'],
    category: 'custom',
    tags: ['lab', 'limited'],
    available: true,
  },
  {
    id: 'p-005',
    article: 'ASK-005-TEE',
    title: 'ASKED T-Shirt Black',
    price: 4990,
    image: '/assets/product-1.jpg',
    images: [
      '/assets/product-1.jpg',
      '/assets/product-1.jpg',
      '/assets/product-1.jpg',
    ],
    description: 'Классическая футболка чёрного цвета с минималистичным дизайном.',
    sizes: ['S', 'M', 'L'],
    category: 'tshirt',
    tags: ['drop001'],
    available: true,
  },
  {
    id: 'p-006',
    article: 'ASK-006-PNT',
    title: 'ASKED Pants Black',
    price: 11990,
    image: '/assets/product-2.jpg',
    description: 'Классические брюки чёрного цвета с удобным кроем.',
    sizes: ['M', 'L', 'XL'],
    category: 'pants',
    tags: ['drop001'],
    available: false,
  },
]

