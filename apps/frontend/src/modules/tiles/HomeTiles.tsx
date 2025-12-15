import { useEffect, useState } from 'react'
import { useSafeNavigate } from '../../hooks/useSafeNavigate'
import './home-tiles.css'

export const HomeTiles = () => {
  const safeNavigate = useSafeNavigate()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true))
  }, [])

  return (
    <section className={`home-branch ${mounted ? 'is-mounted' : ''}`}>
      <div
        className="branch-card"
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          safeNavigate('/app/catalog')
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            e.stopPropagation()
            safeNavigate('/app/catalog')
          }
        }}
        aria-label="Перейти в ассортимент"
      >
        <div className="branch-top">
          <div className="branch-title">Ассортимент</div>
          <div className="branch-arrow">→</div>
        </div>

        <div className="branch-sub">
          Каталог, фильтры, новинки и дропы. Готовые вещи ASKED.
        </div>

        <div className="branch-chips">
          <span className="chip">Дропы</span>
          <span className="chip">Новинки</span>
          <span className="chip">В наличии</span>
        </div>
      </div>

      <div className="home-divider" />
    </section>
  )
}


