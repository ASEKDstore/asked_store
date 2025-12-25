import React from 'react'
import './MainManifest.css'

/**
 * Блок 6: Манифест
 * Изолированный компонент для отображения манифеста бренда
 */
export const MainManifest: React.FC = () => {
  return (
    <div className="main-block main-block-manifest">
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
      </section>
    </div>
  )
}

