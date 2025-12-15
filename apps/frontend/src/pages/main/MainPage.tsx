import { useEffect, useRef, useMemo } from 'react'
import { Banners } from '../../modules/banners/Banners'
import { HomeTiles } from '../../modules/tiles/HomeTiles'
import { ProductShowcaseCarousel } from '../../components/ProductShowcaseCarousel'
import { products } from '../../data/products'
import { TELEGRAM_CHANNEL_URL } from '../../config/links'
import { useProductSheet } from '../../context/ProductSheetContext'
import { useSafeNavigate } from '../../hooks/useSafeNavigate'
import './MainPage.css'

export const MainPage = () => {
  const safeNavigate = useSafeNavigate()
  const { openProduct } = useProductSheet()
  const featuresGridRef = useRef<HTMLDivElement>(null)
  const processGridRef = useRef<HTMLDivElement>(null)

  // Get products for showcase (first 6 featured or first 6 available)
  const productsToShow = useMemo(() => {
    const available = products.filter(p => p.available).slice(0, 6)
    return available.map(p => ({
      id: p.id,
      title: p.title,
      article: p.article,
      price: p.price,
      image: p.image,
    }))
  }, [])

  useEffect(() => {
    const grid = featuresGridRef.current
    if (!grid) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.2) {
            grid.classList.add('is-visible')
            observer.disconnect()
          }
        })
      },
      {
        threshold: 0.2,
        rootMargin: '0px 0px -50px 0px',
      }
    )

    observer.observe(grid)

    return () => {
      observer.disconnect()
    }
  }, [])

  useEffect(() => {
    const grid = processGridRef.current
    if (!grid) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.2) {
            grid.classList.add('is-visible')
            observer.disconnect()
          }
        })
      },
      {
        threshold: 0.2,
        rootMargin: '0px 0px -50px 0px',
      }
    )

    observer.observe(grid)

    return () => {
      observer.disconnect()
    }
  }, [])

  return (
    <div className="main-page">
      <Banners />
      
      <section className="home-manifest">
        <div className="manifest-card">
          <div className="manifest-kicker">ASKED / STORE / LAB</div>
          
          <h2 className="manifest-title">
            ASKED — это кастом, дропы и эксперименты.
          </h2>
          
          <p className="manifest-sub">
            Мы создаём вещи, которые не повторяются.
          </p>
        </div>
        
        <div className="home-divider" />
      </section>
      
      <section className="home-lab-teaser">
        <div 
          className="lab-teaser-card" 
          role="button" 
          tabIndex={0}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            safeNavigate('/app/lab')
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              e.stopPropagation()
              safeNavigate('/app/lab')
            }
          }}
        >
          <div className="lab-teaser-bg" />
          <div className="lab-teaser-glow" />

          <div className="lab-teaser-content">
            <div className="lab-kicker">ASKED LAB</div>
            <h2 className="lab-title">Место, где рождается кастом</h2>
            <p className="lab-sub">
              Художник, ручная роспись, согласование по шагам.
              Делаем уникальный дизайн под тебя.
            </p>

            <div className="lab-actions">
              <button
                className="lab-btn lab-btn-primary"
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  safeNavigate('/app/lab')
                }}
              >
                Перейти в LAB <span className="lab-arrow">→</span>
              </button>

              <button
                className="lab-btn lab-btn-secondary"
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  safeNavigate('/app/lab/order')
                }}
              >
                Заказать кастом
              </button>
            </div>

            <div className="lab-note">
              LAB MODE • CUSTOM • HANDMADE
            </div>
          </div>

          <div className="lab-teaser-figure" aria-hidden="true">
            <img src="/assets/lab-anastasia.png" alt="" />
          </div>
        </div>

        <div className="home-divider" />
      </section>
      
      <HomeTiles />
      
      <section className="home-features" id="about-asked">
        <div className="features-head">
          <div className="features-kicker">WHY ASKED</div>
          <h2 className="features-title">Чем отличается ASKED</h2>
          <p className="features-sub">
            Мы не делаем масс-маркет — мы собираем вещи как продукт: идея → процесс → результат.
          </p>
        </div>

        <div className="features-grid js-reveal" ref={featuresGridRef}>
          <div className="feature-card">
            <div className="feature-ico">🧪</div>
            <div className="feature-name">LAB кастомы</div>
            <div className="feature-desc">Ручная работа: аэрограф, кисти, фактура.</div>
          </div>

          <div className="feature-card">
            <div className="feature-ico">🧷</div>
            <div className="feature-name">Ограниченные дропы</div>
            <div className="feature-desc">Никаких бесконечных остатков — только тираж.</div>
          </div>

          <div className="feature-card">
            <div className="feature-ico">🖤</div>
            <div className="feature-name">Дизайн &gt; тренды</div>
            <div className="feature-desc">Форма и смысл важнее хайпа.</div>
          </div>

          <div className="feature-card">
            <div className="feature-ico">⚙️</div>
            <div className="feature-name">Сделано внутри ASKED</div>
            <div className="feature-desc">От идеи до вещи — один ДНК бренда.</div>
          </div>
        </div>

        <div className="home-divider" />
      </section>
      
      <section className="home-showcase">
        <div className="showcase-head">
          <div className="showcase-kicker">DROP NOW</div>
          <h2 className="showcase-title">Витрина товаров</h2>
          <p className="showcase-sub">Выбирай из актуального. Центральная карточка — в фокусе.</p>
        </div>

        <ProductShowcaseCarousel 
          products={productsToShow} 
          onOpen={openProduct} 
        />

        <div className="home-divider" />
      </section>
      
      <section className="home-process">
        <div className="process-head">
          <div className="process-kicker">PROCESS</div>
          <h2 className="process-title">Как создаётся вещь в ASKED</h2>
          <p className="process-sub">
            Мы собираем продукт по шагам — от идеи до результата.
          </p>
        </div>

        <div className="process-grid js-reveal-process" ref={processGridRef}>
          <div className="process-step">
            <div className="step-num">01</div>
            <div className="step-name">Идея / эскиз</div>
            <div className="step-desc">Концепт, референсы и стиль.</div>
          </div>

          <div className="process-step">
            <div className="step-num">02</div>
            <div className="step-name">Подбор базы</div>
            <div className="step-desc">Фасон, ткань, цвет, размер.</div>
          </div>

          <div className="process-step">
            <div className="step-num">03</div>
            <div className="step-name">Кастом / роспись</div>
            <div className="step-desc">Аэрограф, кисти, детали.</div>
          </div>

          <div className="process-step">
            <div className="step-num">04</div>
            <div className="step-name">Готовая вещь</div>
            <div className="step-desc">Финальная проверка и упаковка.</div>
          </div>
        </div>

        <div className="home-divider" />
      </section>
      
      <section className="home-social">
        <div className="social-head">
          <div className="social-kicker">CONNECT</div>
          <h2 className="social-title">Мы на связи</h2>
          <p className="social-sub">
            Дропы, процесс, кастомы и раздачи — в Telegram. По вопросам — в поддержку.
          </p>
        </div>

        <div className="social-grid">
          <a 
            className="social-card social-card-telegram" 
            href={TELEGRAM_CHANNEL_URL} 
            target="_blank" 
            rel="noreferrer"
          >
            <div className="social-card-top">
              <div className="social-badge">TELEGRAM</div>
              <div className="social-arrow">→</div>
            </div>

            <div className="social-card-title">Telegram-канал ASKED</div>
            <div className="social-card-desc">
              Новости дропов, процесс LAB, розыгрыши и важные апдейты.
            </div>

            <div className="social-mini">
              <span className="mini-pill">Дропы</span>
              <span className="mini-pill">LAB</span>
              <span className="mini-pill">Раздачи</span>
            </div>
          </a>

          <div className="social-side">
            <button 
              className="social-card social-card-small" 
              type="button" 
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                safeNavigate('/app/help')
              }}
            >
              <div className="social-card-top">
                <div className="social-badge">HELP</div>
                <div className="social-arrow">→</div>
              </div>
              <div className="social-card-title">Поддержка</div>
              <div className="social-card-desc">Оплата, доставка, вопросы по заказам.</div>
            </button>

            <button 
              className="social-card social-card-small" 
              type="button" 
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                safeNavigate('/app/collab')
              }}
            >
              <div className="social-card-top">
                <div className="social-badge">COLLAB</div>
                <div className="social-arrow">→</div>
              </div>
              <div className="social-card-title">Сотрудничество</div>
              <div className="social-card-desc">Коллабы, опт, партнёрства, идеи.</div>
            </button>
          </div>
        </div>

        <div className="social-live">
          <div className="live-title">Сейчас в ASKED</div>
          <div className="live-list">
            <div className="live-item">
              <div className="live-dot" />
              <div className="live-text">LAB: согласование эскиза нового кастома</div>
            </div>
            <div className="live-item">
              <div className="live-dot" />
              <div className="live-text">Дроп: подготовка карточек и фото</div>
            </div>
            <div className="live-item">
              <div className="live-dot" />
              <div className="live-text">Промо: скоро новые промокоды</div>
            </div>
          </div>
        </div>

        <div className="home-divider" />
      </section>
    </div>
  )
}

