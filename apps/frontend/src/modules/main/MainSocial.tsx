import React from 'react'
import { useSafeNavigate } from '../../hooks/useSafeNavigate'
import { TELEGRAM_CHANNEL_URL } from '../../config/links'
import './MainSocial.css'

/**
 * Блок 10: Социальные (Social)
 * Изолированный компонент для отображения социальных ссылок и контактов
 */
export const MainSocial: React.FC = () => {
  const safeNavigate = useSafeNavigate()

  return (
    <div className="main-block main-block-social">
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
      </section>
    </div>
  )
}

