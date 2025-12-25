import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ModalPortal } from '../../components/ModalPortal'
import { pushLayer, popLayer } from '../../shared/layerManager'
import './HeaderMenu.css'

type Props = {
  isOpen: boolean
  onClose: () => void
  isAdmin: boolean
}

export const HeaderMenu: React.FC<Props> = ({ isOpen, onClose, isAdmin }) => {
  // Layer management
  useEffect(() => {
    if (!isOpen) return
    pushLayer('HeaderMenu')
    return () => {
      popLayer('HeaderMenu')
    }
  }, [isOpen])

  // Закрытие по ESC
  useEffect(() => {
    if (!isOpen) return
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  return (
    <ModalPortal isOpen={isOpen}>
      <div className="header-menu-overlay" onClick={onClose} aria-hidden={!isOpen} />
      <nav className={`header-menu ${isOpen ? 'is-open' : ''}`} aria-hidden={!isOpen}>
        <div className="header-menu-header">
          <button
            className="header-menu-close"
            onClick={onClose}
            aria-label="Закрыть меню"
          >
            ← Назад
          </button>
        </div>
        <ul>
          <li>
            <Link to="/app" onClick={onClose}>
              Главная
            </Link>
          </li>
          <li>
            <Link to="/app/catalog" onClick={onClose}>
              Ассортимент
            </Link>
          </li>
          <li>
            <Link to="/app/lab" onClick={onClose}>
              ASKED LAB
            </Link>
          </li>
          <li>
            <Link to="/app/reviews" onClick={onClose}>
              Отзывы
            </Link>
          </li>
          <li>
            <Link to="/app/cart" onClick={onClose}>
              Корзина
            </Link>
          </li>
          <li className="header-menu-divider" />
          <li>
            <Link to="/app/about" onClick={onClose}>
              О нас
            </Link>
          </li>
          <li>
            <Link to="/app/help" onClick={onClose}>
              Помощь
            </Link>
          </li>
          <li>
            <Link to="/app/docs" onClick={onClose}>
              Документы
            </Link>
          </li>
          <li>
            <Link to="/app/partners" onClick={onClose}>
              Сотрудничество
            </Link>
          </li>
          {isAdmin && (
            <>
              <li className="header-menu-divider" />
              <li className="header-menu-admin">
                <Link to="/app/admin" onClick={onClose}>
                  Админка
                </Link>
              </li>
            </>
          )}
        </ul>
      </nav>
    </ModalPortal>
  )
}

