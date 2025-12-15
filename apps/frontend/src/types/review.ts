export type ReviewMedia = {
  id: string
  type: 'image' | 'video'
  url: string // для mock можно objectURL
  thumbUrl?: string // для видео превью (опционально)
}

export type ReactionKey = '🔥' | '🖤' | '👍' | '💎' | '😂' | '😮‍💨' | '😡' | '✅'

export type ReviewReply = {
  id: string
  user: {
    tgId: string
    name: string
    username?: string
    avatarUrl?: string
    isAdmin?: boolean // если это ответ от магазина
  }
  text: string
  createdAt: string
}

export type Review = {
  id: string
  user: {
    tgId: string
    name: string
    username?: string
    avatarUrl?: string
  }
  rating: 1 | 2 | 3 | 4 | 5
  text: string
  emojis?: string[] // выбранные эмодзи, например ["🔥","💎"]
  media?: ReviewMedia[] // фото/видео
  productId?: string // если отзыв про конкретный товар
  productTitle?: string
  createdAt: string // ISO
  likes: number // "полезно" (legacy, для совместимости)
  likedByMe?: boolean // (legacy, для совместимости)
  reactions?: Record<ReactionKey, number> // счётчики реакций
  myReactions?: Partial<Record<ReactionKey, boolean>> // что нажал текущий юзер
  replies?: ReviewReply[] // ответы/тред
  adminReply?: {
    text: string
    createdAt: string
  } // legacy, для совместимости
}

export type ReviewFormData = {
  rating: 1 | 2 | 3 | 4 | 5 | null
  text: string
  emojis: string[]
  media: File[]
  productId?: string
}

