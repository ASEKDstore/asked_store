import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { flyToCart } from '../../utils/flyToCart'
import type { UIProduct } from '../../api/productsApi'
import './product-grid-card.css'

type Props = {
  product: UIProduct
}

export const ProductGridCard: React.FC<Props> = ({ product }) => {
  const navigate = useNavigate()
  const { addItem } = useCart()
  const [showSizes, setShowSizes] = useState(false)

  const handleCardClick = () => {
    if (!product?.id) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[ProductGridCard] Cannot navigate: product.id is missing', product)
      }
      return
    }
    navigate(`/app/product/${product.id}`)
  }

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation()

    if (product.sizes.length === 1) {
      // Если один размер - добавляем сразу
      addItem(product, { size: product.sizes[0] })
      flyToCart({ imageUrl: product.image, fromEl: e.currentTarget as HTMLElement })
    } else {
      // Если несколько размеров - показываем выбор
      setShowSizes(true)
    }
  }

  const handleSizeSelect = (size: string, e: React.MouseEvent) => {
    e.stopPropagation()
    addItem(product, { size })
    flyToCart({ imageUrl: product.image, fromEl: e.currentTarget as HTMLElement })
    setShowSizes(false)
  }

  return (
    <div 
      className="product-grid-card" 
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleCardClick()
        }
      }}
    >
      <div className="product-grid-card-image-wrapper">
        <div
          className="product-grid-card-image"
          style={{ backgroundImage: `url(${product.image})` }}
        />
        <div className={`product-grid-card-badge ${product.available ? 'in-stock' : 'sold-out'}`}>
          {product.available ? 'IN STOCK' : 'SOLD OUT'}
        </div>
      </div>

      <div className="product-grid-card-info">
        <div className="product-grid-card-article">{product.article}</div>
        <div className="product-grid-card-title">{product.title}</div>
        <div className="product-grid-card-price">
          {product.price.toLocaleString('ru-RU')} ₽
        </div>
      </div>

      <div className="product-grid-card-actions">
        {showSizes ? (
          <div className="product-grid-card-sizes show" onClick={(e) => e.stopPropagation()}>
            {product.sizes.map((size) => (
              <button
                key={size}
                className="product-grid-size-btn"
                onClick={(e) => handleSizeSelect(size, e)}
              >
                {size}
              </button>
            ))}
          </div>
        ) : (
          <button
            className="product-grid-card-add-btn"
            onClick={handleQuickAdd}
            disabled={!product.available}
          >
            В корзину
          </button>
        )}
      </div>
    </div>
  )
}

