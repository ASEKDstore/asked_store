import { useParams, useNavigate } from 'react-router-dom'
import { labWorks, getReviewsForWork, type LabWorkReview } from '../data/lab'
import { useEffect, useState } from 'react'
import { StarRating } from '../modules/lab/StarRating'
import { ReviewForm } from '../modules/lab/ReviewForm'
import './lab-work-details.css'

export const LabWorkDetailsPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const work = labWorks.find((w) => w.id === id)

  const [mounted, setMounted] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [reviews, setReviews] = useState<LabWorkReview[]>([])

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true))
  }, [])

  useEffect(() => {
    if (work) {
      setSelectedImage(work.image)
      setReviews(getReviewsForWork(work.id))
    }
  }, [work])

  const handleReviewAdded = (newReview: LabWorkReview) => {
    setReviews([...reviews, newReview])
  }

  if (!work)
    return (
      <div style={{ padding: '32px 16px', textAlign: 'center', color: '#f5f5f5' }}>
        Работа не найдена
      </div>
    )

  const allImages = [work.image, ...(work.images || [])]

  return (
    <div className={`lab-work-details-root ${mounted ? 'is-mounted' : ''}`}>
      <div
        className="lab-work-details-hero"
        style={{ backgroundImage: `url(${selectedImage || work.image})` }}
      />

      <div className="lab-work-details-card">
        <div className="lab-work-details-handle" />

        {work.tags && work.tags.length > 0 && (
          <div className="lab-work-tags">
            {work.tags.map((tag) => (
              <span key={tag} className="lab-work-tag">
                {tag}
              </span>
            ))}
          </div>
        )}

        <h1 className="lab-work-title">{work.title}</h1>

        {/* Счетчик отзывов */}
        {reviews.length > 0 && (
          <div className="lab-work-reviews-count">
            {reviews.length} {reviews.length === 1 ? 'отзыв' : reviews.length < 5 ? 'отзыва' : 'отзывов'}
          </div>
        )}

        {/* Галерея изображений */}
        {allImages.length > 1 && (
          <div className="lab-work-gallery">
            {allImages.map((img, idx) => (
              <button
                key={idx}
                className={`lab-work-gallery-item ${selectedImage === img ? 'active' : ''}`}
                onClick={() => setSelectedImage(img)}
                style={{ backgroundImage: `url(${img})` }}
              />
            ))}
          </div>
        )}

        {/* Видео процесса */}
        {work.video && (
          <div className="lab-work-video">
            <video controls className="lab-work-video-player">
              <source src={work.video} type="video/mp4" />
              Ваш браузер не поддерживает видео.
            </video>
          </div>
        )}

        {/* Описание процесса создания */}
        <div className="lab-work-section">
          <h2 className="lab-work-section-title">Процесс создания</h2>
          <div className="lab-work-description">{work.description}</div>
        </div>

        {/* Форма отзыва */}
        <div className="lab-work-section">
          <ReviewForm workId={work.id} onReviewAdded={handleReviewAdded} />
        </div>

        {/* Список отзывов */}
        {reviews.length > 0 && (
          <div className="lab-work-section">
            <h2 className="lab-work-section-title">Отзывы ({reviews.length})</h2>
            <div className="lab-work-reviews-list">
              {reviews
                .sort((a, b) => b.createdAt - a.createdAt)
                .map((review) => (
                  <div key={review.id} className="lab-work-review-item">
                    <div className="lab-work-review-header">
                      <div className="lab-work-review-user">{review.userName}</div>
                      <StarRating rating={review.rating} size="small" />
                    </div>
                    <div className="lab-work-review-comment">{review.comment}</div>
                    <div className="lab-work-review-date">
                      {new Date(review.createdAt).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        <button className="lab-work-back-btn" onClick={() => navigate('/app/lab')}>
          ← Назад к работам
        </button>
      </div>
    </div>
  )
}

