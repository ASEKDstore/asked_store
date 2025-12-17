import React from 'react'
import './Footer.css'

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="app-footer">
      <div className="app-footer-content">
        <div className="app-footer-brand">
          <span className="app-footer-name">ASKED</span>
          <span className="app-footer-year">© {currentYear}</span>
        </div>
        <div className="app-footer-links">
          <a href="/app/help" className="app-footer-link">Помощь</a>
          <a href="/app/collab" className="app-footer-link">Сотрудничество</a>
          <a href="https://t.me/asked_store" target="_blank" rel="noopener noreferrer" className="app-footer-link">
            Telegram
          </a>
        </div>
      </div>
    </footer>
  )
}

