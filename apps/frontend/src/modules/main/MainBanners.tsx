import React from 'react'
import { Banners } from '../banners/Banners'
import './MainBanners.css'

/**
 * Блок 1: Банеры
 * Изолированный компонент для отображения баннеров на главной странице
 */
export const MainBanners: React.FC = () => {
  return (
    <div className="main-block main-block-banners">
      <Banners />
    </div>
  )
}

