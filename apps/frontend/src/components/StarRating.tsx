import { useState } from 'react'
import './star-rating.css'

type Props = {
  rating: number // 0-5 для interactive, 1-5 для readonly
  readOnly?: boolean
  size?: 'small' | 'medium' | 'large'
  onChange?: (rating: 1 | 2 | 3 | 4 | 5) => void
}

export const StarRating = ({ rating, readOnly = false, size = 'medium', onChange }: Props) => {
  const [hoveredRating, setHoveredRating] = useState<number | null>(null)

  const displayRating = hoveredRating !== null ? hoveredRating : rating
  const stars = [1, 2, 3, 4, 5] as const

  const handleClick = (value: 1 | 2 | 3 | 4 | 5) => {
    if (!readOnly && onChange) {
      onChange(value)
    }
  }

  const handleMouseEnter = (value: number) => {
    if (!readOnly) {
      setHoveredRating(value)
    }
  }

  const handleMouseLeave = () => {
    if (!readOnly) {
      setHoveredRating(null)
    }
  }

  return (
    <div className={`star-rating star-rating--${size} ${readOnly ? 'star-rating--readonly' : ''}`}>
      {stars.map((value) => (
        <button
          key={value}
          type="button"
          className={`star-rating-star ${value <= displayRating ? 'is-filled' : ''}`}
          onClick={() => handleClick(value)}
          onMouseEnter={() => handleMouseEnter(value)}
          onMouseLeave={handleMouseLeave}
          disabled={readOnly}
          aria-label={`${value} звезд${value === 1 ? 'а' : value < 5 ? 'ы' : ''}`}
          aria-pressed={value <= rating}
        >
          ★
        </button>
      ))}
    </div>
  )
}



