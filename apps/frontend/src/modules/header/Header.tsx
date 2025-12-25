import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../../context/UserContext'
import { useCart } from '../../context/CartContext'
import { MiniCartDrawer } from '../cart/MiniCartDrawer'
import { useProductSheet } from '../../context/ProductSheetContext'
import { HeaderMenu } from './HeaderMenu'
import './header.css'

export const Header: React.FC = () => {
  const { user, displayName, initials } = useUser()
  const { totalQty } = useCart()
  const { isOpen: isProductSheetOpen } = useProductSheet()
  const [menuOpen, setMenuOpen] = useState(false)
  const [miniCartOpen, setMiniCartOpen] = useState(false)
  const navigate = useNavigate()

  // Get admin IDs from env variable and convert to number[]
  const adminIds: number[] = (import.meta.env.VITE_ADMIN_TG_IDS ?? '')
    .split(',')
    .map((s: string) => Number(s.trim()))
    .filter((n: number) => Number.isFinite(n) && n > 0)

  // Check if user is admin by tgId
  const isAdmin = Boolean(user.tgId && typeof user.tgId === 'number' && adminIds.includes(user.tgId))

  // Закрываем меню при открытии корзины
  useEffect(() => {
    if (miniCartOpen) {
      setMenuOpen(false)
    }
  }, [miniCartOpen])

  // Закрываем меню и корзину при открытии ProductSheet
  useEffect(() => {
    if (isProductSheetOpen) {
      setMenuOpen(false)
      setMiniCartOpen(false)
    }
  }, [isProductSheetOpen])

  const toggleMenu = () => {
    setMenuOpen((prev) => {
      const newValue = !prev
      // Закрываем корзину при открытии меню
      if (newValue) {
        setMiniCartOpen(false)
      }
      return newValue
    })
  }

  const goProfile = () => {
    navigate('/app/profile', { state: { modal: true } })
    setMenuOpen(false)
  }

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
            onClick={() => {
              setMenuOpen(false)
              setMiniCartOpen(true)
            }}
          >
            <span className="header-cart-icon">🛒</span>
            {totalQty > 0 && (
              <span className="header-cart-badge" data-cart-badge="true">
                {totalQty}
              </span>
            )}
          </button>

          <button
            className={`header-burger ${menuOpen ? 'header-burger--open' : ''}`}
            onClick={toggleMenu}
            aria-label="Меню"
            aria-expanded={menuOpen}
          >
            <div className="header-burger-lines">
              <span />
              <span />
              <span />
            </div>
          </button>
        </div>
      </header>

      <HeaderMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} isAdmin={isAdmin} />
      <MiniCartDrawer open={miniCartOpen} onClose={() => setMiniCartOpen(false)} />
    </>
  )
}

