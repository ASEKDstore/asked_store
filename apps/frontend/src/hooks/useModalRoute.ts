import { useLocation, useNavigate } from 'react-router-dom'

export function useModalRoute() {
  const location = useLocation()
  const navigate = useNavigate()
  
  const isModal = location.state?.modal === true
  
  const closeModal = () => {
    if (isModal) {
      navigate(-1)
    } else {
      navigate('/app')
    }
  }
  
  return { isModal, closeModal }
}



