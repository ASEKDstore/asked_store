import { useState, useEffect } from 'react'
import { ProfileContent } from './ProfileContent'
import './ProfilePage.css'

export const ProfilePage: React.FC = () => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className={`profile-root ${mounted ? 'is-mounted' : ''}`}>
      <ProfileContent />
    </div>
  )
}
