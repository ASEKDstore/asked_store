import React from 'react'
import { useSafeNavigate } from '../../hooks/useSafeNavigate'
import './MainLabCard.css'

/**
 * Блок 5: Карточка LAB
 * Изолированный компонент для отображения карточки LAB на главной странице
 */
export const MainLabCard: React.FC = () => {
  const safeNavigate = useSafeNavigate()

  const handleNavigate = (path: string) => {
    safeNavigate(path)
  }

  return (
    <div className="main-block main-block-lab-card">
      <section className="home-lab-teaser">
        <div 
          className="lab-teaser-card" 
          role="button" 
          tabIndex={0}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleNavigate('/app/lab')
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              e.stopPropagation()
              handleNavigate('/app/lab')
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
                  handleNavigate('/app/lab')
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
                  handleNavigate('/app/lab/order')
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
      </section>
    </div>
  )
}

