export type LabWork = {
  id: string
  title: string
  image: string // главное изображение /assets/...
  images?: string[] // дополнительные фото
  video?: string // видео процесса /assets/...
  tags?: string[]
  description: string // описание процесса создания
}

export type LabWorkReview = {
  id: string
  workId: string
  userId: string
  userName: string
  rating: number // от 1 до 5
  comment: string
  createdAt: number // timestamp
}

export const labArtist = {
  name: 'Анастасия',
  role: 'Художник ASKED LAB',
  avatar: '/assets/lab-anastasia.png',
  bio: [
    'Кастомы и ручная роспись одежды/аксессуаров.',
    'Работаю аэрографом и кистями, воплощу любую твою хотелку в жизнь. Могу еще и тату набить)',
    'Каждый кастом — уникален, согласование на каждом этапе.',
  ],
  links: [
    { label: 'Мой личный проект', href: 'https://t.me/zlyuchkikolyuchki' },
  ],
}

export const labWorks: LabWork[] = [
  {
    id: 'w1',
    title: 'Hoodie — Chrome Drips',
    image: '/assets/lab-work-1.jpg',
    images: ['/assets/lab-work-1-1.jpg', '/assets/lab-work-1-2.jpg', '/assets/lab-work-1-3.jpg'],
    video: '/assets/lab-work-1-process.mp4',
    tags: ['hoodie', 'airbrush'],
    description:
      'Работа выполнена аэрографом с использованием хромированных красок. Сначала нанес базовый слой, затем создал эффект капель с помощью трафарета и свободной техники. Финальный этап — закрепление и защита специальным лаком.',
  },
  {
    id: 'w2',
    title: 'Tee — Rune Lines',
    image: '/assets/lab-work-2.jpg',
    images: ['/assets/lab-work-2-1.jpg', '/assets/lab-work-2-2.jpg'],
    video: '/assets/lab-work-2-process.mp4',
    tags: ['tshirt'],
    description:
      'Ручная роспись акриловыми красками по ткани. Сначала нарисовал эскиз рунами, затем проработал детали кистями разного размера. Использовал специальные краски для текстиля, которые не смываются после стирки.',
  },
  {
    id: 'w3',
    title: 'Sneakers — Split Ink',
    image: '/assets/lab-work-3.jpg',
    images: ['/assets/lab-work-3-1.jpg', '/assets/lab-work-3-2.jpg', '/assets/lab-work-3-3.jpg'],
    video: '/assets/lab-work-3-process.mp4',
    tags: ['sneakers'],
    description:
      'Кастом кроссовок с эффектом разлитых чернил. Подготовил поверхность, нанес базовый цвет, затем создал эффект разлива с помощью жидких красок и техники "drip". Каждый кроссовок уникален.',
  },
  {
    id: 'w4',
    title: 'Cap — Minimal Tag',
    image: '/assets/lab-work-4.jpg',
    images: ['/assets/lab-work-4-1.jpg'],
    tags: ['cap'],
    description:
      'Минималистичный кастом кепки с вышивкой и ручной росписью. Комбинация техник: вышивка для основного логотипа и акриловая роспись для акцентов.',
  },
]

// Утилита для работы с отзывами
export const getReviewsForWork = (workId: string): LabWorkReview[] => {
  const stored = localStorage.getItem(`lab_reviews_${workId}`)
  return stored ? JSON.parse(stored) : []
}

export const addReviewForWork = (review: Omit<LabWorkReview, 'id' | 'createdAt'>) => {
  const reviews = getReviewsForWork(review.workId)
  const newReview: LabWorkReview = {
    ...review,
    id: `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: Date.now(),
  }
  reviews.push(newReview)
  localStorage.setItem(`lab_reviews_${review.workId}`, JSON.stringify(reviews))
  return newReview
}

