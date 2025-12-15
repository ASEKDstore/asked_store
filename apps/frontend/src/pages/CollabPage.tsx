import { useNavigate } from 'react-router-dom'
import './collab.css'

export const CollabPage = () => {
  const navigate = useNavigate()

  return (
    <div className="collab-page">
      <div className="collab-container">
        <button className="collab-back-btn" onClick={() => navigate(-1)}>
          ← Назад
        </button>
        
        <div className="collab-content">
          <h1 className="collab-title">Сотрудничество</h1>
          <p className="collab-text">
            Коллабы, опт, партнёрства, идеи.
          </p>
          <p className="collab-text">
            Мы открыты к сотрудничеству с брендами, художниками и креативными людьми.
          </p>
          <p className="collab-text">
            Свяжитесь с нами через Telegram для обсуждения возможностей.
          </p>
        </div>
      </div>
    </div>
  )
}



