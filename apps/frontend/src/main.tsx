import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { UserProvider } from './context/UserContext'
import { CartProvider } from './context/CartContext'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <UserProvider>
      <CartProvider>
        <App />
      </CartProvider>
    </UserProvider>
  </StrictMode>,
)





