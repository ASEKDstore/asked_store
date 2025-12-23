# ASKED Store Frontend — Диагностический отчёт
**Версия:** v1.16.7  
**Дата:** 2025-12-23  
**Цель:** Анализ структуры перед перестройкой

---

## 1. Структура директорий `apps/frontend/src`

```
src/
├── admin/                          # Админ-панель
│   ├── AdminGuard.tsx             # Guard для защиты роутов
│   ├── AdminLayout.tsx            # Главный layout админки
│   └── AdminLayout.css            # Стили админки (изолированный скролл)
│
├── api/                            # API клиенты
│   ├── adminApi.ts                # API для админки
│   ├── http.ts                    # HTTP утилиты
│   ├── labApi.ts                  # API для LAB
│   └── productsApi.ts             # API товаров (public + UI mapping)
│
├── components/                     # Переиспользуемые компоненты
│   ├── layout/
│   │   ├── AppShell.tsx           # Унифицированный shell (header/footer/main)
│   │   ├── AppShell.css
│   │   ├── Page.tsx
│   │   └── Page.css
│   ├── ProductSheet/              # Модальное окно товара
│   │   ├── ProductSheet.tsx
│   │   ├── ProductSheetWrapper.tsx # Синхронизация с URL
│   │   ├── ProductRouteHandler.tsx # Deep link handler
│   │   └── product-sheet.css
│   ├── BottomSheet.tsx            # Bottom drawer (profile)
│   ├── BackgroundLayer.tsx        # Fixed фон
│   ├── Footer/                    # Footer компонент
│   ├── Header/ (модуль в modules/)
│   └── ... (много других компонентов)
│
├── context/                        # React Context провайдеры
│   ├── AuthContext.tsx            # Аутентификация
│   ├── CartContext.tsx            # Корзина (localStorage)
│   ├── ProductSheetContext.tsx    # Состояние ProductSheet
│   └── UserContext.tsx            # Данные пользователя
│
├── hooks/                          # Кастомные хуки
│   ├── useTgViewport.ts           # Telegram viewport height management
│   ├── useTelegramWebApp.ts       # Детекция Telegram WebApp
│   ├── useTelegramAuth.ts         # Telegram аутентификация
│   ├── useTelegramInit.ts
│   ├── useTelegramSession.ts
│   ├── useSafeNavigate.ts         # Safe navigation wrapper
│   ├── useModalRoute.ts           # Модальные роуты
│   ├── useSwipeBack.ts            # Свайп назад
│   ├── useLoadingProgress.ts
│   └── useMaintenanceMode.ts
│
├── layouts/                        # Layout компоненты
│   ├── AppLayout.tsx              # Главный layout (Header + Outlet + Footer)
│   └── AppLayout.css
│
├── modules/                        # Функциональные модули
│   ├── header/
│   │   ├── Header.tsx             # Главный header (меню, корзина)
│   │   └── header.css
│   ├── products/
│   │   ├── ProductGridCard.tsx    # Карточка товара в сетке
│   │   ├── ProductCarousel.tsx    # Карусель товаров
│   │   └── *.css
│   ├── cart/
│   │   ├── MiniCartDrawer.tsx     # Дровер корзины
│   │   └── mini-cart.css
│   ├── banners/
│   ├── tiles/
│   └── lab/                        # LAB модуль (кастомизация)
│
├── pages/                          # Страницы приложения
│   ├── main/
│   │   ├── MainPage.tsx           # Главная страница
│   │   └── MainPage.css
│   ├── CatalogPage.tsx            # Каталог товаров
│   ├── CartPage.tsx               # Страница корзины
│   ├── CheckoutPage.tsx           # Оформление заказа
│   ├── ProfilePage.tsx
│   ├── admin/                      # Страницы админки (15+ файлов)
│   │   ├── OrdersAdminPage.tsx
│   │   ├── ProductsAdminPage.tsx
│   │   ├── AdminPages.css         # Общие стили админ-страниц
│   │   └── ...
│   └── ... (много других страниц)
│
├── services/                       # Бизнес-логика
│   ├── reviewsStore.ts            # Store для отзывов
│   ├── telegramAuth.ts            # Telegram аутентификация
│   └── telegram/
│
├── store/                          # Глобальное состояние
│   └── productsStore.ts           # Store для товаров (localStorage)
│
├── types/                          # TypeScript типы
│   ├── adminProduct.ts
│   ├── order.ts
│   ├── review.ts
│   └── user.ts
│
├── utils/                          # Утилиты
│   ├── navigation.ts              # Safe navigation
│   ├── flyToCart.ts               # Анимация "летит в корзину"
│   ├── telegram.ts
│   └── ...
│
├── config/                         # Конфигурация
│   ├── admins.ts
│   └── links.ts
│
├── data/                           # Статические данные (legacy?)
│   ├── banners.ts
│   ├── lab.ts
│   └── products.ts
│
├── lib/                            # Библиотеки/обёртки
│   ├── apiClient.ts               # HTTP клиент
│   └── telegram.ts
│
├── App.tsx                         # Корневой компонент + роутинг
├── main.tsx                        # Точка входа
└── index.css                       # Глобальные стили

```

---

## 2. Критические места системы

### 2.1 Глобальные стили

**Файлы:**
- `src/index.css` — основной файл глобальных стилей
- `src/admin/AdminLayout.css` — стили админки (изолированные)
- `src/pages/admin/AdminPages.css` — общие стили админ-страниц

**Ключевые CSS переменные:**
```css
:root {
  --app-height: 100dvh;          /* Обновляется через useTgViewport */
  --footer-h: 72px;               /* Обновляется через AppShell ResizeObserver */
  --color-bg: #0a0a0a;
  --color-text: #f5f5f5;
  /* ... design tokens */
}
```

**Глобальные правила:**
- `html, body, #root { height: 100%; }` — основа для flex-верстки
- `body { overscroll-behavior: none; min-height: var(--app-height); }` — без `overflow: hidden` (в обычном режиме)
- `.app-scroll { overflow-y: auto; }` — основной скролл-контейнер
- `.app-scroll.scroll-lock { overflow: hidden !important; }` — блокировка при модалках
- `body.admin-lock-scroll { overflow: hidden; }` — блокировка только в админке

---

### 2.2 Управление скроллом/overflow

#### А) Обычный режим (магазин)
- **Скролл:** `.app-scroll` контейнер (в AppLayout)
- **Блокировка:** Класс `.scroll-lock` на `.app-scroll`, НЕ на `body`
- **Где применяется:**
  - `ProductSheetWrapper` — блокирует при открытом sheet
  - `BottomSheet` — блокирует при открытом drawer
  - `MiniCartDrawer` — блокирует через `body.style.overflow` (⚠️ конфликт)
  - `Header` — блокирует при открытом меню
  - `AddReviewSheet` — блокирует при открытом sheet
  - `ProductAdminSheet` — блокирует при открытом sheet

#### Б) Админ-панель
- **Скролл:** `.admin-main` контейнер (изолированный)
- **Блокировка:** Класс `admin-lock-scroll` на `body` через `AdminLayout.tsx`
- **Фиксированный header:** `position: fixed` с `padding-top` на body
- **Safe-area:** `env(safe-area-inset-top/bottom)` для iOS

#### В) Проблемные места:
1. **MiniCartDrawer** использует `body.style.overflow` напрямую (конфликт с админкой)
2. **LabIntroLoader** также использует `body.style.overflow`
3. Нет единого механизма блокировки — смешение классов и inline стилей

---

### 2.3 Навигация (React Router)

**Структура роутов (`App.tsx`):**
```tsx
<Routes>
  <Route path="/" element={<LoadingScreen />} />
  <Route path="/app" element={<AppLayout />}>
    <Route index element={<MainPage />} />
    <Route path="product/:id" element={<MainPage />} />  // ⚠️ MainPage вместо отдельной страницы
    <Route path="catalog" element={<CatalogPage />} />
    <Route path="cart" element={<CartPage />} />
    <Route path="checkout" element={<CheckoutPage />} />
    <Route path="profile" element={<ProfileRoute />} />  // Модальный или страница
    <Route path="banner/:id" element={<BannerDetailsPage />} />
    <Route path="admin" element={<AdminGuard><AdminLayout /></AdminGuard>}>
      {/* Вложенные роуты админки */}
    </Route>
    {/* ... другие роуты */}
  </Route>
</Routes>
```

**Особенности:**
- **ProductSheet:** Открывается через `/app/product/:id`, но рендерится через `ProductRouteHandler` в `AppLayout`
- **ProfileRoute:** Условно рендерит `BottomSheet` (модальный) или `ProfilePage` (страница) через `useModalRoute`
- **Lazy loading:** Все админ-страницы и тяжелые страницы (Lab, Reviews) загружаются лениво

**Навигация по товарам (v1.16.7):**
- `ProductGridCard` → `navigate('/app/product/:id')`
- `ProductCarousel` → `navigate('/app/product/:id')`
- `ProductShowcaseCarousel` → `onOpen(id)` → `navigate('/app/product/:id')`
- `ProductRouteHandler` → `openProduct(id)` → открывает `ProductSheet`

---

### 2.4 Telegram WebApp интеграция

**Инициализация:**
- `main.tsx` → `AuthProvider` → использует `useTelegramWebApp`
- `App.tsx` → `useTgViewport()` — управление высотой viewport

**Хуки:**
- `useTelegramWebApp()` — детекция Telegram WebApp + retry логика (10 попыток)
- `useTgViewport()` — обновляет `--app-height` CSS переменную через `tg.viewportStableHeight`
- `useTelegramAuth()` — аутентификация через Telegram
- `useTelegramInit()` — инициализация WebApp (`tg.expand()`)

**BackButton:**
- ❌ **НЕ используется** явно в коде (нет `tg.BackButton.show()`)
- Навигация назад через `navigate(-1)` в некоторых местах

**Viewport handling:**
- Используется `viewportStableHeight` (iOS fix, не меняется при открытии клавиатуры)
- Fallback: `viewportHeight` → `window.innerHeight` → `100dvh`
- Слушатель `viewportChanged` event от Telegram

---

### 2.5 State Management

#### А) React Context
- **AuthContext** — статус аутентификации, пользователь
- **CartContext** — корзина (сохраняется в `localStorage`, ключ: `asked_cart_v1`)
- **ProductSheetContext** — открыт/закрыт ProductSheet, `productId`
- **UserContext** — данные пользователя

#### Б) Local Storage
- Корзина: `asked_catalog_cols` (настройки каталога)
- Продукты (legacy?): `asked.products` через `productsStore.ts`

#### В) Store (Zustand/подобное)
- ❌ **Нет** явного Zustand/Redux
- `productsStore.ts` — простой store с localStorage persist
- `reviewsStore.ts` — store для отзывов

#### Г) API данные
- Товары: `getUIProducts()` → API → маппинг в `UIProduct`
- Заказы: через `adminApi.ts`
- Кэширования нет — каждый запрос идёт на сервер

---

### 2.6 Загрузка данных

**Товары:**
- **API:** `frontend/src/api/productsApi.ts`
  - `getPublicProducts()` → `/api/public/products`
  - `getUIProducts()` → маппинг в `UIProduct` формат
- **Где используются:**
  - `CatalogPage` — загружает при монтировании, перезагружает при изменении фильтров
  - `MainPage` — загружает для showcase carousel (первые 6 товаров)
  - `ProductCarousel` — загружает для карусели
  - `ProductSheet` — загружает одиночный товар + похожие товары

**Корзина:**
- `CartContext` — синхронизация с localStorage при каждом изменении
- `CartPage` — отображает из контекста

**Заказы:**
- `OrdersAdminPage` — через `adminApi.getOrders()`

---

### 2.7 Клики на карточках товаров

**Компоненты:**
1. **ProductGridCard** (`modules/products/ProductGridCard.tsx`)
   - Клик на карточку → `navigate('/app/product/:id')`
   - Кнопка "В корзину" → `e.stopPropagation()` → `addItem()`
   - Выбор размера → `e.stopPropagation()` → `addItem()`

2. **ProductCarousel** (`modules/products/ProductCarousel.tsx`)
   - Клик на центральную карточку → `navigate('/app/product/:id')`
   - Левая/правая карточки — не кликабельны

3. **ProductShowcaseCarousel** (`components/ProductShowcaseCarousel.tsx`)
   - Клик на карточку → `onOpen(product.id)` → `navigate('/app/product/:id')` (через MainPage)

**Навигация (v1.16.7):**
- Все используют `navigate('/app/product/:id')` вместо `openProduct(id)`
- `ProductRouteHandler` обрабатывает deep link → открывает `ProductSheet`

---

### 2.8 Порталы и модалки

**Порталы (ReactDOM.createPortal):**
- **LabIntroLoader** — портал для fullscreen overlay (`createPortal(content, document.body)`)

**Модальные компоненты:**
- **ProductSheet** — НЕ портал, рендерится в дереве AppLayout
- **BottomSheet** — НЕ портал, рендерится в дереве
- **MiniCartDrawer** — НЕ портал, рендерится в Header

**Блокировка body scroll:**
- Все модалки используют `.app-scroll.scroll-lock`
- Исключение: `MiniCartDrawer` и `LabIntroLoader` используют `body.style.overflow` напрямую

---

## 3. Структурная карта ключевых модулей

### 3.1 Основные модули и ответственность

1. **AppLayout** (`layouts/AppLayout.tsx`)
   - Обёртка для всех страниц магазина
   - Рендерит Header, Footer, BackgroundLayer
   - Управляет ProductSheet через ProductSheetWrapper
   - Обрабатывает maintenance mode

2. **AdminLayout** (`admin/AdminLayout.tsx`)
   - Изолированный layout для админки
   - Фиксированный header, sidebar/drawer на mobile
   - Блокирует body scroll через класс `admin-lock-scroll`

3. **ProductSheet** (`components/ProductSheet/`)
   - Модальное окно товара (fullscreen на mobile)
   - Синхронизация с URL через ProductRouteHandler
   - Блокирует скролл через `.app-scroll.scroll-lock`

4. **CartContext** (`context/CartContext.tsx`)
   - Глобальное состояние корзины
   - Автосинхронизация с localStorage
   - Методы: `addItem`, `removeItem`, `setQty`, `clear`

5. **useTgViewport** (`hooks/useTgViewport.ts`)
   - Критически важный хук для Telegram WebApp
   - Обновляет `--app-height` CSS переменную
   - Использует `viewportStableHeight` для iOS

6. **ProductRouteHandler** (`components/ProductSheet/ProductRouteHandler.tsx`)
   - Обрабатывает deep links `/app/product/:id`
   - Открывает ProductSheet при переходе на роут
   - Возвращает назад при закрытии sheet

7. **Header** (`modules/header/Header.tsx`)
   - Главная навигация
   - Мини-корзина (MiniCartDrawer)
   - Меню на mobile (drawer)

8. **CatalogPage** (`pages/CatalogPage.tsx`)
   - Каталог товаров с фильтрами
   - Загружает товары через `getUIProducts()`
   - Рендерит `ProductGridCard` в сетке

9. **MainPage** (`pages/main/MainPage.tsx`)
   - Главная страница
   - Баннеры, карусель товаров, tiles
   - Рендерит ProductRouteHandler для обработки `/app/product/:id`

10. **AppShell** (`components/layout/AppShell.tsx`)
    - Унифицированный shell компонент (используется не везде)
    - Измеряет footer высоту через ResizeObserver
    - Обновляет `--footer-h` CSS переменную

11. **AdminLayout.css** (`admin/AdminLayout.css`)
    - Изолированные стили админки
    - Фиксированный header, flex layout
    - Safe-area insets для iOS

12. **index.css** (`index.css`)
    - Глобальные стили
    - Design tokens (CSS переменные)
    - Базовые стили для `.app-scroll`, `.scroll-lock`

13. **productsApi.ts** (`api/productsApi.ts`)
    - API клиент для товаров
    - Маппинг API Product → UIProduct
    - Публичные методы: `getUIProducts()`, `getUIProduct()`

14. **CartContext** (`context/CartContext.tsx`)
    - Состояние корзины
    - localStorage persistence
    - Вычисляемые значения: `totalQty`, `totalPrice`

15. **BackgroundLayer** (`components/BackgroundLayer.tsx`)
    - Fixed фон (не скроллится с контентом)
    - Используется для создания глубины

16. **RouteTransitionWrapper** (`components/RouteTransitionWrapper.tsx`)
    - Обёртка для анимаций переходов между страницами

17. **ErrorBoundary** (`components/ErrorBoundary.tsx`)
    - Обработка ошибок React

18. **SessionExpiredHandler** (`components/SessionExpiredHandler.tsx`)
    - Обработка истекшей сессии Telegram

19. **MiniCartDrawer** (`modules/cart/MiniCartDrawer.tsx`)
    - Дровер корзины в header
    - ⚠️ Использует `body.style.overflow` напрямую (конфликт с админкой)

20. **BottomSheet** (`components/BottomSheet.tsx`)
    - Универсальный bottom drawer
    - Используется для Profile модального режима
    - Блокирует скролл через `.app-scroll.scroll-lock`

---

### 3.2 Главные риски "почему одно ломает другое"

#### 🔴 КРИТИЧЕСКИЕ

1. **Глобальная блокировка скролла — конфликт механизмов**
   - **Проблема:** Админка блокирует через `body.admin-lock-scroll`, магазин через `.app-scroll.scroll-lock`
   - **Риск:** Если открыть админку и потом магазин (или наоборот), блокировка может не сброситься
   - **Где:** `AdminLayout.tsx`, `ProductSheetWrapper.tsx`, `BottomSheet.tsx`, `MiniCartDrawer.tsx`

2. **Inline стили `body.style.overflow` vs классы**
   - **Проблема:** `MiniCartDrawer` и `LabIntroLoader` используют inline стили, остальные — классы
   - **Риск:** Inline стили перебивают классы, блокировка не снимается корректно
   - **Где:** `modules/cart/MiniCartDrawer.tsx`, `modules/lab/LabIntroLoader.tsx`

3. **ProductRouteHandler синхронизация с URL**
   - **Проблема:** Сложная логика синхронизации состояния ProductSheet с URL через `useEffect`
   - **Риск:** Race conditions при быстрой навигации, залипание sheet
   - **Где:** `components/ProductSheet/ProductRouteHandler.tsx`, `ProductSheetWrapper.tsx`

#### 🟡 ВЫСОКИЕ

4. **Разные подходы к высоте viewport**
   - **Проблема:** Админка использует `100dvh`, магазин — `var(--app-height)` (обновляется через useTgViewport)
   - **Риск:** На iOS может быть рассинхронизация высоты
   - **Где:** `admin/AdminLayout.css`, `index.css`, `hooks/useTgViewport.ts`

5. **Нет единого контейнера для скролла в админке**
   - **Проблема:** Админка блокирует body, но скролл в `.admin-main` — может быть конфликт с модалками
   - **Риск:** Модалки в админке могут не блокировать скролл корректно
   - **Где:** `admin/AdminLayout.css`, `pages/admin/AdminPages.css`

6. **Lazy loading без Suspense границ**
   - **Проблема:** Некоторые страницы lazy, но Suspense только в App.tsx
   - **Риск:** При ошибке загрузки может упасть всё приложение
   - **Где:** `App.tsx` (lazy импорты)

7. **CartContext синхронизация с localStorage**
   - **Проблема:** Каждое изменение корзины триггерит `localStorage.setItem` (в `useEffect`)
   - **Риск:** При быстрых изменениях может быть потеря данных или лишние записи
   - **Где:** `context/CartContext.tsx`

#### 🟢 СРЕДНИЕ

8. **ProfileRoute условный рендеринг**
   - **Проблема:** Profile может быть модалкой или страницей в зависимости от `useModalRoute`
   - **Риск:** Разное поведение навигации может путать пользователя
   - **Где:** `App.tsx` (ProfileRoute)

9. **Нет кэширования API запросов**
   - **Проблема:** Каждый переход на страницу заново загружает товары
   - **Риск:** Медленная работа, лишние запросы
   - **Где:** `pages/CatalogPage.tsx`, `pages/main/MainPage.tsx`

10. **AppShell используется не везде**
    - **Проблема:** Некоторые страницы используют свой layout, другие — AppShell
    - **Риск:** Разное поведение footer/header на разных страницах
    - **Где:** `components/layout/AppShell.tsx` (используется не везде)

11. **useTgViewport вызывается дважды**
    - **Проблема:** В `App.tsx` и в `AppShell.tsx` (если используется)
    - **Риск:** Дублирование слушателей событий
    - **Где:** `App.tsx`, `components/layout/AppShell.tsx`

12. **Навигация по товарам — два пути**
    - **Проблема:** Можно открыть через `navigate('/app/product/:id')` или через `openProduct(id)`
    - **Риск:** Разное поведение, сложно отлаживать
    - **Где:** `ProductGridCard.tsx` (navigate), `ProductSheetContext.tsx` (openProduct)

---

## 4. План миграции по патч-версиям (v1.16.x)

### v1.16.8 — Foundation: Layout & Scroll Stability

**Цель:** Унифицировать управление скроллом и layout

**Задачи:**
1. ✅ Создать единый механизм блокировки скролла
   - Создать хук `useScrollLock()` с приоритетами
   - Убрать все inline `body.style.overflow`
   - Мигрировать все компоненты на единый механизм

2. ✅ Унифицировать высоту viewport
   - Использовать `var(--app-height)` везде (включая админку)
   - Убрать `100dvh` из админки
   - Проверить iOS safe-area везде

3. ✅ Исправить конфликты блокировки скролла
   - Мигрировать `MiniCartDrawer` на классы
   - Мигрировать `LabIntroLoader` на классы
   - Добавить cleanup при unmount

4. ✅ Стабилизировать AdminLayout scroll
   - Убедиться, что модалки в админке блокируют скролл корректно
   - Проверить safe-area insets

**Файлы для изменения:**
- `hooks/useScrollLock.ts` (новый)
- `modules/cart/MiniCartDrawer.tsx`
- `modules/lab/LabIntroLoader.tsx`
- `admin/AdminLayout.css`
- `components/BottomSheet.tsx`
- `components/ProductSheet/ProductSheetWrapper.tsx`

---

### v1.16.9 — Navigation Correctness

**Цель:** Исправить навигацию по товарам и обратную навигацию

**Задачи:**
1. ✅ Унифицировать открытие товаров
   - Всегда использовать `navigate('/app/product/:id')`
   - Убрать `openProduct(id)` из публичного API (оставить только для внутреннего использования)
   - Упростить `ProductRouteHandler`

2. ✅ Исправить обратную навигацию
   - Добавить Telegram BackButton support
   - Исправить логику возврата из ProductSheet
   - Добавить guard для предотвращения зацикливания

3. ✅ Упростить ProfileRoute
   - Убрать условный рендеринг, всегда использовать страницу
   - Или всегда использовать модалку (решить единый подход)

4. ✅ Добавить unit guards
   - Проверка `product.id` перед навигацией (уже есть в v1.16.7)
   - Проверка валидности роутов

**Файлы для изменения:**
- `modules/products/ProductGridCard.tsx`
- `modules/products/ProductCarousel.tsx`
- `components/ProductSheet/ProductRouteHandler.tsx`
- `components/ProductSheet/ProductSheetWrapper.tsx`
- `App.tsx` (ProfileRoute)
- `hooks/useTelegramBackButton.ts` (новый, опционально)

---

### v1.16.10 — Performance: Code Split & Memoization

**Цель:** Оптимизировать производительность

**Задачи:**
1. ✅ Добавить Suspense границы
   - Обернуть каждую lazy страницу в Suspense с fallback
   - Добавить ErrorBoundary для каждого Suspense

2. ✅ Мемоизация компонентов
   - `React.memo` для `ProductGridCard`, `ProductCarousel`
   - `useMemo` для вычисляемых значений (фильтры, сортировка)

3. ✅ Оптимизировать CartContext
   - Debounce для `localStorage.setItem`
   - `useMemo` для `totalQty`, `totalPrice`

4. ✅ Добавить виртуализацию списков (опционально)
   - Для каталога с большим количеством товаров
   - Библиотека: `react-window` или `react-virtual`

**Файлы для изменения:**
- `App.tsx` (Suspense границы)
- `modules/products/ProductGridCard.tsx` (memo)
- `context/CartContext.tsx` (debounce)
- `pages/CatalogPage.tsx` (виртуализация, опционально)

---

### v1.16.11 — UI Consistency: Containers & Blocks

**Цель:** Унифицировать контейнеры и блоки

**Задачи:**
1. ✅ Создать единую систему контейнеров
   - `.page-container` — основной контейнер страницы
   - `.content-container` — контент с max-width
   - `.card` — универсальная карточка
   - `.section` — секция контента

2. ✅ Применить единые контейнеры везде
   - Мигрировать все страницы на `.page-container`
   - Унифицировать отступы и padding

3. ✅ Создать систему утилитарных классов
   - `.ellipsis` — обрезка текста
   - `.grid-2`, `.grid-3` — сетки
   - `.flex-center`, `.flex-between` — flex утилиты

4. ✅ Унифицировать формы
   - Единые стили для input, select, textarea
   - Единые стили для кнопок
   - Единая система валидации (опционально)

**Файлы для изменения:**
- `index.css` (новые классы)
- Все страницы (миграция на новые классы)
- `pages/admin/*.tsx` (уже есть `.admin-container`, расширить)

---

### Дальнейшие версии (v1.17.x+)

**v1.17.0 — State Management:**
- Рассмотреть Zustand для глобального состояния
- React Query для API данных (кэширование, invalidation)
- Убрать дублирование между Context и localStorage

**v1.17.1 — Type Safety:**
- Строгая типизация всех API ответов
- Убрать `any` типы
- Добавить runtime валидацию (Zod опционально)

**v1.17.2 — Testing:**
- Unit тесты для критичных компонентов
- E2E тесты для основных flow (добавление в корзину, оформление заказа)

---

## 5. Выводы и рекомендации

### ✅ Сильные стороны:
1. Чёткая структура модулей
2. Разделение админки и магазина
3. Хорошая интеграция с Telegram WebApp
4. Использование CSS переменных для design tokens

### ⚠️ Проблемные места:
1. **Конфликт механизмов блокировки скролла** — критично исправить
2. **Разные подходы к viewport height** — унифицировать
3. **Inline стили vs классы** — убрать inline стили
4. **Нет единой системы контейнеров** — создать и применить

### 🎯 Приоритеты миграции:
1. **v1.16.8** — Foundation (скролл, layout) — **КРИТИЧНО**
2. **v1.16.9** — Navigation — **ВЫСОКИЙ**
3. **v1.16.10** — Performance — **СРЕДНИЙ**
4. **v1.16.11** — UI Consistency — **НИЗКИЙ**

### 📝 Рекомендации:
1. Начать с v1.16.8 (Foundation) — это устранит большинство багов со скроллом
2. После v1.16.9 (Navigation) добавить E2E тесты для основных flow
3. После v1.16.10 (Performance) измерить метрики (LCP, FID, CLS)
4. После v1.16.11 (UI Consistency) начать планирование v1.17.x (большие изменения)

---

**Отчёт составлен:** 2025-12-23  
**Версия кода:** v1.16.7  
**Автор анализа:** AI Assistant (Cursor)

