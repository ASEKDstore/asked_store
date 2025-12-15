import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getLabArtists, getLabProducts, type LabArtist, type LabProduct } from '../api/labApi'
import { LabIntroLoader } from '../modules/lab/LabIntroLoader'
import './lab.css'

export const LabPage = () => {
  const [mounted, setMounted] = useState(false)
  const [artist, setArtist] = useState<LabArtist | null>(null)
  const [products, setProducts] = useState<LabProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [introDone, setIntroDone] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true))
    
    // ВРЕМЕННО: для тестирования можно сбросить флаг
    // Раскомментируйте следующую строку, чтобы принудительно показать интро:
    // sessionStorage.removeItem('asked_lab_intro_seen')
    
    // Проверяем, показывали ли интро в этой сессии
    const introSeen = sessionStorage.getItem('asked_lab_intro_seen')
    if (introSeen === '1' || introSeen === 'true') {
      setIntroDone(true)
      console.log('[LAB INTRO] Already seen in this session, skipping intro')
    } else {
      console.log('[LAB INTRO] First time, will show intro')
    }
    
    loadLabData()
  }, [])

  const loadLabData = async () => {
    try {
      setLoading(true)
      const [artistsData, productsData] = await Promise.all([
        getLabArtists(),
        getLabProducts(),
      ])
      
      // Get first artist (API already returns only active artists)
      const firstArtist = artistsData[0] || null
      setArtist(firstArtist)
      
      // If artist exists, filter products by artistId
      if (firstArtist) {
        const artistProducts = productsData.filter(p => p.artistId === firstArtist.id)
        setProducts(artistProducts)
      } else {
        setProducts(productsData)
      }
    } catch (error) {
      console.error('Failed to load LAB data:', error)
    } finally {
      setLoading(false)
    }
  }

  // ВСЕГДА рендерим страницу, не используем return null
  // Показываем интро один раз за сессию
  const showIntro = !introDone
  
  // Диагностика
  useEffect(() => {
    console.log('[LAB INTRO] State:', { introDone, showIntro, loading })
  }, [introDone, showIntro, loading])
  
  const handleIntroDone = () => {
    console.log('[LAB INTRO] Done, saving flag')
    sessionStorage.setItem('asked_lab_intro_seen', '1')
    setIntroDone(true)
  }

  return (
    <div className={`lab-root ${mounted ? 'is-mounted' : ''}`} aria-busy={loading || showIntro}>
      {/* Вау-интро LAB (показывается один раз за сессию) */}
      <LabIntroLoader 
        active={showIntro} 
        minMs={5000}
        maxMs={8000}
        onDone={handleIntroDone}
        dataReady={!loading}
      />

      {/* Контент страницы - всегда рендерится, но может быть скрыт под loader */}
      {loading ? (
        // Показываем placeholder во время загрузки (скрыт под loader)
        <div style={{ opacity: 0, pointerEvents: 'none' }}>
          <div style={{ padding: '48px', textAlign: 'center', color: '#f5f5f5' }}>
            Загрузка...
          </div>
        </div>
      ) : !artist ? (
        // Нет художников
        <div style={{ padding: '48px', textAlign: 'center', color: '#f5f5f5' }}>
          Художники LAB пока не добавлены
        </div>
      ) : (
        // Основной контент
        <>
      {/* Блок "Сейчас в работе" */}
      {artist.currentWork && (
        <div className="lab-current-work">
          <div className="lab-current-work-content">
            <div className="lab-current-work-label">Сейчас в работе</div>
            <div className="lab-current-work-text">{artist.currentWork}</div>
          </div>
        </div>
      )}

      <div className="lab-hero">
        <div className="lab-float"></div>
        <div className="lab-artist-figure">
          {artist.avatar ? (
            <img src={artist.avatar} alt={`${artist.name} — ASKED LAB`} />
          ) : (
            <img src="/assets/lab-anastasia.png" alt={`${artist.name} — ASKED LAB`} />
          )}
        </div>
        <div className="lab-card glow">
          <div className="lab-artist">
            <div className="lab-artist-info">
              <div className="lab-name">{artist.name}</div>
              <div className="lab-bio">
                <p style={{ whiteSpace: 'pre-line' }}>{artist.bio}</p>
              </div>
              {artist.links.length > 0 && (
                <div className="lab-links">
                  {artist.links.map((link, idx) => (
                    <a
                      key={idx}
                      href={link.url}
                      className="lab-link"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {link.title}
                    </a>
                  ))}
                </div>
              )}
              <button
                className="lab-cta"
                onClick={() => navigate('/app/lab/order')}
              >
                Заказать кастом
              </button>
            </div>
          </div>
        </div>
      </div>

      {products.length > 0 && (
        <div className="lab-works-section">
          <h2 className="lab-works-title">Готовые работы</h2>
          <div className="lab-works-scroll">
            {products.map((product) => (
              <div
                key={product.id}
                className="lab-work-card"
                onClick={() => navigate(`/app/lab/product/${product.id}`)}
                style={{ cursor: 'pointer' }}
              >
                <div className="lab-work-image">
                  {product.images && product.images.length > 0 ? (
                    <img src={product.images[0]} alt={product.title} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.1)' }} />
                  )}
                </div>
                <div className="lab-work-title">{product.title}</div>
                {product.tags && product.tags.length > 0 && (
                  <div className="lab-work-tags">
                    {product.tags.map((tag, idx) => (
                      <span key={idx} className="lab-work-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <div className="lab-work-price" style={{ marginTop: '8px', fontSize: '14px', fontWeight: 600 }}>
                  {product.price.toLocaleString('ru-RU')} ₽
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
        </>
      )}
    </div>
  )
}
