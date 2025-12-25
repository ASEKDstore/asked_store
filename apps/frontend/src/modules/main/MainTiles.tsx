import React from 'react'
import { HomeTiles } from '../tiles/HomeTiles'
import './MainTiles.css'

/**
 * Блок 11: Плитки (Tiles)
 * Изолированный компонент для отображения плиток навигации
 */
export const MainTiles: React.FC = () => {
  return (
    <div className="main-block main-block-tiles">
      <HomeTiles />
    </div>
  )
}

