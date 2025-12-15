import { useNavigate } from 'react-router-dom'
import './help.css'

export const HelpPage = () => {
  const navigate = useNavigate()

  return (
    <div className="help-page">
      <div className="help-container">
        <button className="help-back-btn" onClick={() => navigate(-1)}>
          ← Назад
        </button>
        
        <div className="help-content">
          <h1 className="help-title">Поддержка</h1>
          <p className="help-text">
            Оплата, доставка, вопросы по заказам.
          </p>
          <p className="help-text">
            Если у вас возникли вопросы, свяжитесь с нами через Telegram или напишите на почту.
          </p>
        </div>
      </div>
    </div>
  )
}



