import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useUser } from '../../context/UserContext'
import { useCart } from '../../context/CartContext'
import { MiniCartDrawer } from '../cart/MiniCartDrawer'
import './header.css'

export const Header: React.FC = () => {
  const { user, displayName, initials } = useUser()
  const { totalQty } = useCart()
  const [open, setOpen] = useState(false)
  const [miniCartOpen, setMiniCartOpen] = useState(false)
  const navigate = useNavigate()

  // Get admin IDs from env variable and convert to number[]
  const adminIds: number[] = (import.meta.env.VITE_ADMIN_TG_IDS ?? '')
    .split(',')
    .map((s: string) => Number(s.trim()))
    .filter((n: number) => Number.isFinite(n) && n > 0)

  // Check if user is admin by tgId
  const isAdmin = Boolean(user.tgId && typeof user.tgId === 'number' && adminIds.includes(user.tgId))

  const toggleMenu = () => setOpen((v) => !v)

  const goProfile = () => {
    navigate('/app/profile', { state: { modal: true } })
    setOpen(false)
  }

  // Блокируем скролл .app-scroll при открытом меню
  useEffect(() => {
    const scrollElement = document.querySelector('.app-scroll') as HTMLElement | null
    if (scrollElement) {
      if (open) {
        scrollElement.classList.add('scroll-lock')
      } else {
        scrollElement.classList.remove('scroll-lock')
      }
    }
    return () => {
      if (scrollElement) {
        scrollElement.classList.remove('scroll-lock')
      }
    }
  }, [open])

  return (
    <>
      <header className="header">
        <button
          className="header-logo-btn"
          onClick={() => navigate('/app')}
          aria-label="Главная"
        >
          <div className="header-logo-mark" />
        </button>

        <button className="header-profile-btn" onClick={goProfile} aria-label="Профиль">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={displayName}
              className="header-profile-img"
            />
          ) : (
            <div className="header-profile-initials">{initials}</div>
          )}
          {isAdmin && (
            <span className="header-admin-badge">ADMIN</span>
          )}
        </button>

        <div className="header-right">
          <button
            className="header-cart-btn"
            aria-label="Корзина"
            onClick={() => setMiniCartOpen(true)}
          >
            <span className="header-cart-icon">🛒</span>
            {totalQty > 0 && (
              <span className="header-cart-badge" data-cart-badge="true">
                {totalQty}
              </span>
            )}
          </button>

          <button
            className={`header-burger ${open ? 'header-burger--open' : ''}`}
            onClick={toggleMenu}
            aria-label="Меню"
            aria-expanded={open}
          >
            <div className="header-burger-lines">
              <span />
              <span />
              <span />
            </div>
          </button>
        </div>
      </header>

      <div
        className={`header-menu-overlay ${open ? 'is-open' : ''}`}
        onClick={toggleMenu}
      />

      <nav className={`header-menu ${open ? 'is-open' : ''}`}>
        <ul>
          <li>
            <Link to="/app" onClick={toggleMenu}>
              Главная
            </Link>
          </li>
          <li>
            <Link to="/app/catalog" onClick={toggleMenu}>
              Ассортимент
            </Link>
          </li>
          <li>
            <Link to="/app/lab" onClick={toggleMenu}>
              ASKED LAB
            </Link>
          </li>
          <li>
            <Link to="/app/reviews" onClick={toggleMenu}>
              Отзывы
            </Link>
          </li>
          <li>
            <Link to="/app/cart" onClick={toggleMenu}>
              Корзина
            </Link>
          </li>
          <li className="header-menu-divider" />
          <li>
            <Link to="/app/about" onClick={toggleMenu}>
              О нас
            </Link>
          </li>
          <li>
            <Link to="/app/help" onClick={toggleMenu}>
              Помощь
            </Link>
          </li>
          <li>
            <Link to="/app/docs" onClick={toggleMenu}>
              Документы
            </Link>
          </li>
          <li>
            <Link to="/app/partners" onClick={toggleMenu}>
              Сотрудничество
            </Link>
          </li>
          {isAdmin && (
            <>
              <li className="header-menu-divider" />
              <li className="header-menu-admin">
                <Link to="/app/admin" onClick={toggleMenu}>
                  Админка
                </Link>
              </li>
            </>
          )}
        </ul>
      </nav>

      <MiniCartDrawer open={miniCartOpen} onClose={() => setMiniCartOpen(false)} />
    </>
  )
}

