import { useState } from 'react'
import { StarRating } from './StarRating'
import { addReviewForWork, type LabWorkReview } from '../../data/lab'
import { useUser } from '../../context/UserContext'
import './review-form.css'

type Props = {
  workId: string
  onReviewAdded: (review: LabWorkReview) => void
}

export const ReviewForm: React.FC<Props> = ({ workId, onReviewAdded }) => {
  const { user } = useUser()
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      alert('Пожалуйста, войдите в систему для оставления отзыва')
      return
    }

    if (rating === 0) {
      alert('Пожалуйста, выберите оценку')
      return
    }

    if (!comment.trim()) {
      alert('Пожалуйста, оставьте комментарий')
      return
    }

    setIsSubmitting(true)

    try {
      const userName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || 'USER'
      const review = addReviewForWork({
        workId,
        userId: String(user.id),
        userName,
        rating,
        comment: comment.trim(),
      })

      onReviewAdded(review)
      setRating(0)
      setComment('')
      setHoverRating(0)
    } catch (error) {
      console.error('Ошибка при добавлении отзыва:', error)
      alert('Не удалось добавить отзыв')
    } finally {
      setIsSubmitting(false)
    }
  }

  const displayRating = hoverRating || rating

  return (
    <form className="review-form" onSubmit={handleSubmit}>
      <h3 className="review-form-title">Оставить отзыв</h3>

      <div className="review-form-rating">
        <label className="review-form-label">Оценка</label>
        <div
          className="review-form-stars"
          onMouseLeave={() => setHoverRating(0)}
        >
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className={`review-form-star ${star <= displayRating ? 'active' : ''}`}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
            >
              ★
            </button>
          ))}
          {rating > 0 && <span className="review-form-rating-value">{rating}</span>}
        </div>
      </div>

      <div className="review-form-comment">
        <label className="review-form-label" htmlFor="review-comment">
          Комментарий
        </label>
        <textarea
          id="review-comment"
          className="review-form-textarea"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Поделитесь своими впечатлениями..."
          rows={4}
          required
        />
      </div>

      <button
        type="submit"
        className="review-form-submit"
        disabled={isSubmitting || rating === 0 || !comment.trim()}
      >
        {isSubmitting ? 'Отправка...' : 'Отправить отзыв'}
      </button>
    </form>
  )
}


