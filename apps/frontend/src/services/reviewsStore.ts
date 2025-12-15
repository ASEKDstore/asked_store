import type { Review, ReactionKey, ReviewReply } from '../types/review'

// Re-export Review type for use in other files
export type { Review }

const STORAGE_KEY = 'asked_reviews_v1'

// Миграция старых данных (likes -> reactions)
const migrateReview = (review: Review): Review => {
  if (!review.reactions && review.likes !== undefined) {
    review.reactions = {
      '🔥': 0,
      '🖤': 0,
      '👍': review.likes || 0,
      '💎': 0,
      '😂': 0,
      '😮‍💨': 0,
      '😡': 0,
      '✅': 0,
    }
    if (review.likedByMe) {
      review.myReactions = { '👍': true }
    }
  }
  if (!review.reactions) {
    review.reactions = {
      '🔥': 0,
      '🖤': 0,
      '👍': 0,
      '💎': 0,
      '😂': 0,
      '😮‍💨': 0,
      '😡': 0,
      '✅': 0,
    }
  }
  if (!review.myReactions) {
    review.myReactions = {}
  }
  if (!review.replies) {
    review.replies = []
  }
  return review
}

export const getReviews = (): Review[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      seedReviews()
      return getReviews()
    }
    const reviews: Review[] = JSON.parse(stored)
    // Миграция
    const migrated = reviews.map(migrateReview)
    if (JSON.stringify(reviews) !== JSON.stringify(migrated)) {
      saveReviews(migrated)
    }
    return migrated
  } catch {
    return []
  }
}

export const saveReviews = (reviews: Review[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews))
  } catch (err) {
    console.error('Failed to save reviews:', err)
  }
}

export const addReview = (review: Review): void => {
  const reviews = getReviews()
  reviews.unshift(review) // Новые сверху
  saveReviews(reviews)
}

export const toggleLike = (reviewId: string, userId: string = 'current_user'): void => {
  // Legacy функция, использует toggleReaction для '👍'
  toggleReaction(reviewId, '👍', { tgId: userId })
}

export const toggleReaction = (
  reviewId: string,
  emoji: ReactionKey,
  me: { tgId: string; name?: string; username?: string; avatarUrl?: string }
): void => {
  const reviews = getReviews()
  const review = reviews.find((r) => r.id === reviewId)
  if (!review) return

  const migrated = migrateReview(review)
  if (!migrated.reactions) {
    migrated.reactions = {
      '🔥': 0,
      '🖤': 0,
      '👍': 0,
      '💎': 0,
      '😂': 0,
      '😮‍💨': 0,
      '😡': 0,
      '✅': 0,
    }
  }
  if (!migrated.myReactions) {
    migrated.myReactions = {}
  }

  const isActive = migrated.myReactions[emoji] === true

  if (isActive) {
    // Снять реакцию
    migrated.reactions[emoji] = Math.max(0, (migrated.reactions[emoji] || 0) - 1)
    migrated.myReactions[emoji] = false
  } else {
    // Поставить реакцию
    migrated.reactions[emoji] = (migrated.reactions[emoji] || 0) + 1
    migrated.myReactions[emoji] = true
  }

  // Обновляем legacy likes для совместимости
  if (emoji === '👍') {
    migrated.likes = migrated.reactions['👍']
    migrated.likedByMe = migrated.myReactions['👍'] === true
  }

  saveReviews(reviews)
}

export const addReply = (reviewId: string, reply: ReviewReply): void => {
  const reviews = getReviews()
  const review = reviews.find((r) => r.id === reviewId)
  if (!review) return

  const migrated = migrateReview(review)
  if (!migrated.replies) {
    migrated.replies = []
  }

  migrated.replies.push(reply)
  saveReviews(reviews)
}

export const deleteReview = (reviewId: string, meTgId: string, isAdmin: boolean = false): boolean => {
  const reviews = getReviews()
  const review = reviews.find((r) => r.id === reviewId)
  if (!review) return false

  if (!isAdmin && review.user.tgId !== meTgId) {
    return false
  }

  const filtered = reviews.filter((r) => r.id !== reviewId)
  saveReviews(filtered)
  return true
}

export const deleteReply = (
  reviewId: string,
  replyId: string,
  meTgId: string,
  isAdmin: boolean = false
): boolean => {
  const reviews = getReviews()
  const review = reviews.find((r) => r.id === reviewId)
  if (!review) return false

  const migrated = migrateReview(review)
  if (!migrated.replies) return false

  const reply = migrated.replies.find((r) => r.id === replyId)
  if (!reply) return false

  if (!isAdmin && reply.user.tgId !== meTgId) {
    return false
  }

  migrated.replies = migrated.replies.filter((r) => r.id !== replyId)
  saveReviews(reviews)
  return true
}

export const seedReviews = (): void => {
  const reviews: Review[] = [
    {
      id: 'r-001',
      user: {
        tgId: 'tg-001',
        name: 'Алексей',
        username: 'alex_asked',
        avatarUrl: 'https://i.pravatar.cc/150?img=1',
      },
      rating: 5,
      text: 'Отличный худи! Качество на высоте, материал приятный к телу. Заказал чёрный, пришёл быстро. Рекомендую! 🔥',
      emojis: ['🔥', '💎'],
      media: [
        {
          id: 'm-001',
          type: 'image',
          url: '/assets/product-1.jpg',
        },
      ],
      productId: 'p-001',
      productTitle: 'ASKED Hoodie Black',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      likes: 12,
      likedByMe: false,
    },
    {
      id: 'r-002',
      user: {
        tgId: 'tg-002',
        name: 'Мария',
        username: 'maria_style',
        avatarUrl: 'https://i.pravatar.cc/150?img=5',
      },
      rating: 5,
      text: 'Супер качество! Носила уже месяц, не выцветает, не растягивается. Размер сел идеально. 💎',
      emojis: ['💎', '😍'],
      media: [
        {
          id: 'm-002',
          type: 'image',
          url: '/assets/product-2.jpg',
        },
        {
          id: 'm-003',
          type: 'image',
          url: '/assets/product-3.jpg',
        },
      ],
      productId: 'p-002',
      productTitle: 'ASKED Hoodie Grey',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      likes: 8,
      likedByMe: true,
      reactions: { '🔥': 3, '🖤': 1, '👍': 8, '💎': 2, '😂': 0, '😮‍💨': 0, '😡': 0, '✅': 0 },
      myReactions: { '👍': true },
      replies: [],
    },
    {
      id: 'r-003',
      user: {
        tgId: 'tg-003',
        name: 'Дмитрий',
        username: 'dmitry_tg',
        avatarUrl: 'https://i.pravatar.cc/150?img=12',
      },
      rating: 4,
      text: 'Хороший худи, но размер немного мал. Качество отличное, материал плотный. В целом доволен.',
      emojis: ['✅'],
      productId: 'p-001',
      productTitle: 'ASKED Hoodie Black',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      likes: 5,
      likedByMe: false,
      reactions: { '🔥': 0, '🖤': 0, '👍': 5, '💎': 0, '😂': 0, '😮‍💨': 1, '😡': 0, '✅': 1 },
      myReactions: {},
      replies: [
        {
          id: 'reply-001',
          user: {
            tgId: 'admin',
            name: 'ASKED',
            isAdmin: true,
          },
          text: 'Спасибо за отзыв! По поводу размера — рекомендуем брать на размер больше, если предпочитаете свободный крой.',
          createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ],
      adminReply: {
        text: 'Спасибо за отзыв! По поводу размера — рекомендуем брать на размер больше, если предпочитаете свободный крой.',
        createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      },
    },
    {
      id: 'r-004',
      user: {
        tgId: 'tg-004',
        name: 'Елена',
        username: 'elena_fashion',
        avatarUrl: 'https://i.pravatar.cc/150?img=9',
      },
      rating: 5,
      text: 'Лучший худи в моём гардеробе! Качество премиум, стиль огонь 🔥🔥🔥',
      emojis: ['🔥', '🔥', '🔥'],
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      likes: 15,
      likedByMe: false,
      reactions: { '🔥': 8, '🖤': 3, '👍': 15, '💎': 4, '😂': 2, '😮‍💨': 0, '😡': 0, '✅': 0 },
      myReactions: {},
      replies: [],
    },
    {
      id: 'r-005',
      user: {
        tgId: 'tg-005',
        name: 'Иван',
        username: 'ivan_asked',
        avatarUrl: 'https://i.pravatar.cc/150?img=15',
      },
      rating: 3,
      text: 'Нормально, но ожидал большего за такую цену. Материал хороший, но дизайн простоват.',
      emojis: ['😮‍💨'],
      productId: 'p-003',
      productTitle: 'ASKED Hoodie White',
      createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
      likes: 2,
      likedByMe: false,
      reactions: { '🔥': 0, '🖤': 0, '👍': 2, '💎': 0, '😂': 0, '😮‍💨': 3, '😡': 1, '✅': 0 },
      myReactions: {},
      replies: [],
    },
    {
      id: 'r-006',
      user: {
        tgId: 'tg-006',
        name: 'Анна',
        username: 'anna_style',
        avatarUrl: 'https://i.pravatar.cc/150?img=20',
      },
      rating: 5,
      text: 'Потрясающее качество! Заказала серый, пришёл идеально. Размер сел как надо. Очень довольна покупкой! 💎😍',
      emojis: ['💎', '😍'],
      media: [
        {
          id: 'm-004',
          type: 'image',
          url: '/assets/product-2.jpg',
        },
      ],
      productId: 'p-002',
      productTitle: 'ASKED Hoodie Grey',
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      likes: 9,
      likedByMe: false,
      reactions: { '🔥': 2, '🖤': 1, '👍': 9, '💎': 5, '😂': 0, '😮‍💨': 0, '😡': 0, '✅': 0 },
      myReactions: {},
      replies: [],
    },
    {
      id: 'r-007',
      user: {
        tgId: 'tg-007',
        name: 'Сергей',
        username: 'sergey_tg',
        avatarUrl: 'https://i.pravatar.cc/150?img=25',
      },
      rating: 2,
      text: 'Не понравилось. Размер не подошёл, качество среднее. Вернул.',
      emojis: ['😡'],
      productId: 'p-001',
      productTitle: 'ASKED Hoodie Black',
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      likes: 1,
      likedByMe: false,
      reactions: { '🔥': 0, '🖤': 0, '👍': 1, '💎': 0, '😂': 0, '😮‍💨': 0, '😡': 2, '✅': 0 },
      myReactions: {},
      replies: [],
    },
    {
      id: 'r-008',
      user: {
        tgId: 'tg-008',
        name: 'Ольга',
        username: 'olga_fashion',
        avatarUrl: 'https://i.pravatar.cc/150?img=30',
      },
      rating: 5,
      text: 'Отличный магазин! Быстрая доставка, качественные вещи. Обязательно закажу ещё! 🔥💎',
      emojis: ['🔥', '💎'],
      createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
      likes: 11,
      likedByMe: false,
      reactions: { '🔥': 6, '🖤': 2, '👍': 11, '💎': 3, '😂': 1, '😮‍💨': 0, '😡': 0, '✅': 0 },
      myReactions: {},
      replies: [],
    },
  ]

  saveReviews(reviews)
}

