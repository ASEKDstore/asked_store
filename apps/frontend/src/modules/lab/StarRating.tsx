import './star-rating.css'

type Props = {
  rating: number
  maxRating?: number
  size?: 'small' | 'medium' | 'large'
}

export const StarRating: React.FC<Props> = ({ rating, maxRating = 5, size = 'medium' }) => {
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 >= 0.5
  const emptyStars = maxRating - fullStars - (hasHalfStar ? 1 : 0)

  return (
    <div className={`star-rating star-rating-${size}`}>
      {Array.from({ length: fullStars }).map((_, i) => (
        <span key={`full-${i}`} className="star star-full">
          ★
        </span>
      ))}
      {hasHalfStar && <span className="star star-half">★</span>}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <span key={`empty-${i}`} className="star star-empty">
          ★
        </span>
      ))}
      <span className="star-rating-value">{rating.toFixed(1)}</span>
    </div>
  )
}




