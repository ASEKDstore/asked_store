import React, { useEffect, useRef } from 'react'
import './MainFeatures.css'

/**
 * Блок 7: Особенности (Features)
 * Изолированный компонент для отображения особенностей бренда
 */
export const MainFeatures: React.FC = () => {
  const featuresGridRef = useRef<HTMLDivElement>(null)

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

  return (
    <div className="main-block main-block-features">
      <section className="home-features" id="about-asked">
        <div className="features-head">
          <div className="features-kicker">WHY ASKED</div>
          <h2 className="features-title">Чем отличается ASKED</h2>
          <p className="features-sub">
            Мы не делаем масс-маркет — мы собираем вещи как продукт: идея → процесс → результат.
          </p>
        </div>

        <div className="features-grid" ref={featuresGridRef}>
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
      </section>
    </div>
  )
}

