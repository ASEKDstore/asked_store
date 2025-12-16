import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useUser } from '../../context/UserContext'
import { useCart } from '../../context/CartContext'
import { isAdminId } from '../../config/admins'
import { MiniCartDrawer } from '../cart/MiniCartDrawer'
import './header.css'

export const Header: React.FC = () => {
  const { user, displayName, initials } = useUser()
  const { totalQty } = useCart()
  const [open, setOpen] = useState(false)
  const [miniCartOpen, setMiniCartOpen] = useState(false)
  const navigate = useNavigate()

  const isAdmin = isAdminId(user?.id)

  const toggleMenu = () => setOpen((v) => !v)

  const goProfile = () => {
    navigate('/app/profile', { state: { modal: true } })
    setOpen(false)
  }

  // Блокируем скролл body при открытом меню
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
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
          {user?.photoUrl || user?.photo_url ? (
            <img
              src={user.photoUrl || user.photo_url || ''}
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
        </ul>
      </nav>

      <MiniCartDrawer open={miniCartOpen} onClose={() => setMiniCartOpen(false)} />
    </>
  )
}

