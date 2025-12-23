# Аудит состояния фронтенда: Scroll Management (v1.16.10)

**Дата:** 2025-12-23  
**Версия:** 1.16.10

---

## 1. Манипуляции с `document.body.style.*`

### 1.1 Изменения `document.body.style.overflow`

**Найдено:** 3 места

1. **`frontend/src/admin/AdminLayout.tsx:50,52,55`**
   ```typescript
   // Блокируем скролл body при открытом меню (дополнительно)
   React.useEffect(() => {
     if (sidebarOpen) {
       document.body.style.overflow = 'hidden'  // ⚠️ КОНФЛИКТ
     } else {
       document.body.style.overflow = ''
     }
     return () => {
       document.body.style.overflow = ''
     }
   }, [sidebarOpen])
   ```
   **Проблема:** Дублирует логику `admin-lock-scroll` класса, может конфликтовать.

---

## 2. Манипуляции с классами на `body`

### 2.1 `document.body.classList.add/remove`

**Найдено:** 2 места

1. **`frontend/src/admin/AdminLayout.tsx:41,43`**
   ```typescript
   // Блокируем скролл body только в админке
   React.useEffect(() => {
     document.body.classList.add('admin-lock-scroll')
     return () => {
       document.body.classList.remove('admin-lock-scroll')
     }
   }, [])
   ```

2. **`frontend/src/layouts/AppLayout.tsx:44,46`**
   ```typescript
   useEffect(() => {
     const isLab = location.pathname.startsWith('/app/lab')
     document.body.classList.toggle('lab-mode', isLab)
     return () => {
       document.body.classList.remove('lab-mode')
     }
   }, [location.pathname])
   ```

---

## 3. CSS `overflow: hidden` для `body`

### 3.1 Прямые правила для `body`

**Найдено:** 2 правила

1. **`frontend/src/admin/AdminLayout.css:15-17`**
   ```css
   body.admin-lock-scroll {
     overflow: hidden;
     overscroll-behavior: none;
   }
   ```
   **Статус:** ✅ Используется для админки

2. **`frontend/src/admin/AdminLayout.css:452-454`**
   ```css
   body.admin-modal-open {
     overflow: hidden;
   }
   ```
   **Статус:** ⚠️ Класс не найден в коде (неиспользуемый)

### 3.2 Классы блокировки скролла для контента

**Найдено:** 2 класса (локальная блокировка)

1. **`frontend/src/index.css:227-230`**
   ```css
   .app-content.scroll-lock {
     overflow: hidden !important;
     touch-action: none;
   }
   ```

2. **`frontend/src/index.css:243-246`**
   ```css
   .app-scroll.scroll-lock {
     overflow: hidden !important;
     touch-action: none;
   }
   ```
   **Статус:** ✅ Используется компонентами для локальной блокировки

---

## 4. Схема viewport (высота)

### 4.1 CSS переменные

**Найдено:**

- **`frontend/src/index.css:12`**
  ```css
  --app-height: 100dvh; /* Fallback, updated by useTgViewport hook */
  ```

### 4.2 Использование `100vh` / `100dvh`

**Статистика:**
- `100vh`: ~25 использований (старые страницы)
- `100dvh`: 5 использований (новая схема)
- `--app-height`: 2 использования (LoadingScreen, NoTgContextScreen)

**Ключевые файлы:**

1. **Новая схема (100dvh):**
   - `index.css:102` — `body { min-height: 100dvh; }`
   - `index.css:111` — `#root { min-height: 100dvh; }`
   - `index.css:191` — `.app-root { min-height: 100dvh; }`
   - `AppLayout.css:12` — `.app-layout { min-height: 100dvh; }`
   - `AppShell.css:14` — `.app-shell { min-height: 100dvh; }`
   - `AdminLayout.css:30` — `.admin-root { height: 100dvh; }`

2. **Старая схема (100vh):**
   - Множество страниц: `cart.css`, `lab.css`, `reviews.css`, `product-details.css`, `profile.css`, и т.д.

3. **Динамическое обновление:**
   - `frontend/src/hooks/useTgViewport.ts:24` — обновляет `--app-height` через Telegram WebApp

---

## 5. Навигация по карточке товара

### 5.1 Компоненты с обработкой клика

1. **`ProductGridCard.tsx:17-25`**
   ```typescript
   const handleCardClick = useCallback(() => {
     if (!product?.id) {
       if (process.env.NODE_ENV === 'development') {
         console.warn('[ProductGridCard] Cannot navigate: product.id is missing', product)
       }
       return
     }
     navigate(`/app/product/${product.id}`)
   }, [product?.id, navigate])
   ```
   **Путь:** `frontend/src/modules/products/ProductGridCard.tsx:24`

2. **`ProductCarousel.tsx:136-144`**
   ```typescript
   onClick={
     pos === 'center' && product?.id
       ? () => {
           if (!product.id) {
             if (process.env.NODE_ENV === 'development') {
               console.warn('[ProductCarousel] Cannot navigate: product.id is missing', product)
             }
             return
           }
           navigate(`/app/product/${product.id}`)
         }
       : undefined
   }
   ```
   **Путь:** `frontend/src/modules/products/ProductCarousel.tsx:143`

3. **`ProductShowcaseCarousel.tsx:87-94`**
   ```typescript
   onClick={isClickable && product?.id ? () => {
     if (!product.id) {
       if (process.env.NODE_ENV === 'development') {
         console.warn('[ProductShowcaseCarousel] Cannot navigate: product.id is missing', product)
       }
       return
     }
     onOpen(product.id)
   } : undefined}
   ```
   **Путь:** `frontend/src/components/ProductShowcaseCarousel.tsx:94`
   **Обработчик:** `MainPage.tsx:22` → `navigate(\`/app/product/${id}\`)`

4. **`ProductSheet.tsx:318`** (связанные товары)
   ```typescript
   openProduct(p.id)
   ```
   **Путь:** `frontend/src/components/ProductSheet/ProductSheet.tsx:318`

### 5.2 Обработка роутов

- **`ProductRouteHandler.tsx:39`** — открывает sheet при заходе на `/app/product/:id`
- **`ProductRouteSheetBridge.tsx:25`** — альтернативный обработчик

---

## 6. КРАТКИЙ ВЫВОД: Активные механизмы scroll-lock и конфликты

### ✅ Работающие механизмы:

1. **Админка:**
   - `body.admin-lock-scroll` (CSS) — блокирует скролл body
   - `document.body.classList.add('admin-lock-scroll')` (AdminLayout.tsx:41)
   - ⚠️ **КОНФЛИКТ:** `document.body.style.overflow = 'hidden'` при открытом sidebar (AdminLayout.tsx:50) — дублирует логику

2. **Модалки/Sheets (локальная блокировка):**
   - `.app-content.scroll-lock` / `.app-scroll.scroll-lock` (CSS)
   - Используется в: ProductSheet, ProductSheetWrapper, MiniCartDrawer, AddReviewSheet, BottomSheet, FullscreenGallery, ProductAdminSheet, ReplySheet, Header, LabIntroLoader
   - ✅ **Без конфликтов** — работает локально на контейнере

3. **Lab-режим:**
   - `body.lab-mode` (AppLayout.tsx:44) — только класс, CSS не найден (безопасно)

### ⚠️ ПРОБЛЕМЫ:

1. **AdminLayout.tsx:50-56** — дублирует логику `admin-lock-scroll` через `document.body.style.overflow`. Может конфликтовать при быстром открытии/закрытии sidebar.

2. **Смешанная схема viewport:**
   - Новая схема: `100dvh` (index.css, AppLayout, AppShell, AdminLayout)
   - Старая схема: `100vh` (большинство страниц)
   - Динамическая: `--app-height` (2 компонента)

### 📊 Рекомендации:

1. **Удалить** `document.body.style.overflow` в AdminLayout.tsx:50 (полагаться только на `admin-lock-scroll` класс)
2. **Удалить** неиспользуемый CSS `body.admin-modal-open` (AdminLayout.css:452)
3. **Мигрировать** страницы с `100vh` на `100dvh` или `--app-height` для единообразия

---

**Итого:** 2 активных механизма scroll-lock (admin-lock-scroll + локальный scroll-lock), 1 конфликт (дублирование в AdminLayout), схема viewport смешанная.

