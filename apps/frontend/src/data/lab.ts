// Типы для Lab Works и Reviews
// Данные загружаются из API через labApi.ts

export type LabWork = {
  id: string
  title: string
  image: string
  images?: string[]
  video?: string
  tags?: string[]
  description: string
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

// Утилиты для работы с отзывами (локальное хранилище)
// В будущем должны быть перенесены в API
export const getReviewsForWork = (workId: string): LabWorkReview[] => {
  try {
    const stored = localStorage.getItem(`lab_reviews_${workId}`)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export const addReviewForWork = (review: Omit<LabWorkReview, 'id' | 'createdAt'>) => {
  try {
    const reviews = getReviewsForWork(review.workId)
    const newReview: LabWorkReview = {
      ...review,
      id: `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
    }
    reviews.push(newReview)
    localStorage.setItem(`lab_reviews_${review.workId}`, JSON.stringify(reviews))
    return newReview
  } catch (error) {
    console.error('Failed to add review:', error)
    throw error
  }
}
