import React from 'react'
import { MainBanners } from '../../modules/main/MainBanners'
import { MainManifest } from '../../modules/main/MainManifest'
import { MainLabCard } from '../../modules/main/MainLabCard'
import { MainFeatures } from '../../modules/main/MainFeatures'
import { MainShowcase } from '../../modules/main/MainShowcase'
import { MainProcess } from '../../modules/main/MainProcess'
import { MainSocial } from '../../modules/main/MainSocial'
import { MainTiles } from '../../modules/main/MainTiles'
import './MainPage.css'

/**
 * Главная страница
 * Собрана из изолированных блоков для стабильной работы без конфликтов
 * 
 * Структура блоков:
 * - Блок 1: Банеры (MainBanners) - отображаются через отдельный компонент
 * - Блок 2: Header (в AppLayout) - шапка сайта
 * - Блок 3: Бургер меню (в AppLayout через Header) - меню навигации
 * - Блок 4: Корзина (в AppLayout через Header) - мини-корзина
 * - Блок 5: Карточка LAB (MainLabCard) - карточка LAB на главной
 * - Блок 6: Манифест (MainManifest) - манифест бренда
 * - Блок 7: Особенности (MainFeatures) - особенности бренда
 * - Блок 8: Витрина товаров (MainShowcase) - витрина товаров
 * - Блок 9: Процесс (MainProcess) - процесс создания
 * - Блок 10: Социальные (MainSocial) - социальные ссылки и контакты
 * - Блок 11: Плитки (MainTiles) - плитки навигации
 */
export const MainPage: React.FC = () => {
  return (
    <div className="main-page">
      {/* Блок 1: Банеры */}
      <MainBanners />
      
      {/* Блок 6: Манифест */}
      <MainManifest />
      
      {/* Блок 5: Карточка LAB */}
      <MainLabCard />
      
      {/* Блок 11: Плитки */}
      <MainTiles />
      
      {/* Блок 7: Особенности */}
      <MainFeatures />
      
      {/* Блок 8: Витрина товаров */}
      <MainShowcase />
      
      {/* Блок 9: Процесс */}
      <MainProcess />
      
      {/* Блок 10: Социальные */}
      <MainSocial />
    </div>
  )
}
