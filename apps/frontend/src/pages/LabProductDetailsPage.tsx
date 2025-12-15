import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getLabProducts, getLabArtists, type LabProduct, type LabArtist } from '../api/labApi'
import './lab-product-details.css'

export const LabProductDetailsPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [mounted, setMounted] = useState(false)
  const [product, setProduct] = useState<LabProduct | null>(null)
  const [artist, setArtist] = useState<LabArtist | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true))
    loadProductData()
  }, [id])

  const loadProductData = async () => {
    try {
      setLoading(true)
      const products = await getLabProducts()
      const foundProduct = products.find(p => p.id === id)
      
      if (foundProduct) {
        setProduct(foundProduct)
        if (foundProduct.images && foundProduct.images.length > 0) {
          setSelectedImage(foundProduct.images[0])
        }
        
        // Load artist info
        const artists = await getLabArtists()
        const foundArtist = artists.find(a => a.id === foundProduct.artistId)
        if (foundArtist) {
          setArtist(foundArtist)
        }
      }
    } catch (error) {
      console.error('Failed to load LAB product:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="lab-product-details-root">
        <div style={{ padding: '48px', textAlign: 'center', color: '#f5f5f5' }}>
          Загрузка...
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="lab-product-details-root">
        <div style={{ padding: '48px', textAlign: 'center', color: '#f5f5f5' }}>
          Товар не найден
        </div>
      </div>
    )
  }

  const allImages = product.images && product.images.length > 0 ? product.images : []

  return (
    <div className={`lab-product-details-root ${mounted ? 'is-mounted' : ''}`}>
      <div className="lab-product-details-container">
        {/* Back button */}
        <button
          className="lab-product-back-btn"
          onClick={() => navigate('/app/lab')}
        >
          ← Назад
        </button>

        {/* Main content */}
        <div className="lab-product-details-content">
          {/* Gallery */}
          {allImages.length > 0 && (
            <div className="lab-product-gallery">
              <div className="lab-product-main-image">
                <img
                  src={selectedImage || allImages[0]}
                  alt={product.title}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/assets/placeholder.jpg'
                  }}
                />
              </div>
              {allImages.length > 1 && (
                <div className="lab-product-thumbnails">
                  {allImages.map((image, idx) => (
                    <button
                      key={idx}
                      className={`lab-product-thumb ${selectedImage === image ? 'is-active' : ''}`}
                      onClick={() => setSelectedImage(image)}
                    >
                      <img
                        src={image}
                        alt={`${product.title} ${idx + 1}`}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/assets/placeholder.jpg'
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Info */}
          <div className="lab-product-info">
            <div className="lab-product-header">
              <h1 className="lab-product-title">{product.title}</h1>
              {artist && (
                <div className="lab-product-artist">
                  Художник: <strong>{artist.name}</strong>
                </div>
              )}
            </div>

            <div className="lab-product-price">
              {product.price.toLocaleString('ru-RU')} ₽
            </div>

            {product.description && (
              <div className="lab-product-description">
                <h3>Описание</h3>
                <p style={{ whiteSpace: 'pre-line' }}>{product.description}</p>
              </div>
            )}

            {product.tags && product.tags.length > 0 && (
              <div className="lab-product-tags">
                {product.tags.map((tag, idx) => (
                  <span key={idx} className="lab-product-tag">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="lab-product-actions">
              <button
                className="lab-product-cta"
                onClick={() => navigate('/app/lab/order', {
                  state: {
                    labProductId: product.id,
                    artistName: artist?.name,
                  }
                })}
              >
                Заказать кастом
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

