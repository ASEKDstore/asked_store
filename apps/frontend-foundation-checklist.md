# Frontend Foundation v1.16.8 — Чеклист проверок

## ✅ Выполненные изменения

### 1. Foundation CSS Tokens
- ✅ Добавлены `--app-header-h: 56px` и `--app-gutter: 16px`
- ✅ Добавлены универсальные классы: `.page`, `.container`, `.card`, `.table-wrap`
- ✅ Добавлены правила `min-height: 0` и `min-width: 0` для flex-узлов с overflow

### 2. AppShell Layout
- ✅ Единый AppShell для WebApp (НЕ админки)
- ✅ Фиксированный header через `.app-header`
- ✅ Скролл-контейнер `.app-content` (основной)
- ✅ Поддержка `.app-scroll` для обратной совместимости
- ✅ Safe-area insets через `env(safe-area-inset-*)`

### 3. Telegram Fullscreen
- ✅ Создан хук `useTelegramFullscreen` для инициализации WebApp
- ✅ Вызовы `Telegram.WebApp.ready()` и `expand()`
- ✅ Использование `100dvh` вместо `100vh`
- ✅ Safe-area поддержка в CSS

### 4. Управление скроллом
- ✅ Убраны все `body.style.overflow` из магазина
- ✅ Все модалки используют `.app-content.scroll-lock` или `.app-scroll.scroll-lock`
- ✅ Нет глобального `body { overflow: hidden }` для магазина
- ✅ Исправлены: `MiniCartDrawer`, `LabIntroLoader`
- ✅ Обновлены все компоненты для поддержки `.app-content` и `.app-scroll`

### 5. AppLayout
- ✅ Обновлен для использования `AppShell` для обычных страниц
- ✅ Админка остается отдельной (не использует AppShell)

---

## 📋 Чеклист проверок

### Проверка скролла
- [ ] На обычных страницах скролл работает (главная, каталог, корзина)
- [ ] Скролл плавный на iOS/Android (через `-webkit-overflow-scrolling: touch`)
- [ ] Нет "подпрыгиваний" контента при скролле

### Проверка модалок/дроверов
- [ ] ProductSheet блокирует скролл при открытии
- [ ] После закрытия ProductSheet скролл снова работает
- [ ] BottomSheet блокирует скролл при открытии
- [ ] MiniCartDrawer блокирует скролл при открытии
- [ ] После закрытия всех модалок скролл не остается заблокированным

### Проверка Telegram Fullscreen
- [ ] При открытии в Telegram WebApp нет белых полос снизу
- [ ] Контент не обрезается на iOS (safe-area работает)
- [ ] Viewport корректно занимает всю высоту экрана
- [ ] WebApp расширяется на fullscreen (проверить в консоли: `tg.expand()`)

### Проверка адаптивности
- [ ] На desktop все работает корректно
- [ ] На mobile (iOS) safe-area учитывается
- [ ] На mobile (Android) все работает

### Проверка админки
- [ ] Админка работает независимо (не использует AppShell)
- [ ] Скролл в админке работает корректно
- [ ] Нет конфликтов между админкой и магазином

---

## 🔍 Технические детали

### Измененные файлы (19 файлов):

1. **index.css** — Foundation tokens, layout classes, safe-area
2. **AppShell.tsx/css** — Унифицированный layout компонент
3. **AppLayout.tsx/css** — Использует AppShell для обычных страниц
4. **useTelegramFullscreen.ts** — Новый хук для Telegram WebApp
5. **App.tsx** — Добавлен вызов useTelegramFullscreen
6. **MiniCartDrawer.tsx** — Исправлен на использование .app-content
7. **LabIntroLoader.tsx** — Исправлен на использование .app-content
8. **Header.tsx** — Обновлен для поддержки .app-content
9. **ProductSheetWrapper.tsx** — Обновлен для поддержки .app-content
10. **ProductSheet.tsx** — Обновлен для поддержки .app-content
11. **BottomSheet.tsx** — Обновлен для поддержки .app-content
12. **AddReviewSheet.tsx** — Обновлен для поддержки .app-content
13. **ProductAdminSheet.tsx** — Обновлен для поддержки .app-content
14. **FullscreenGallery.tsx** — Обновлен для поддержки .app-content
15. **ReplySheet.tsx** — Обновлен для поддержки .app-content
16. **package.json** (frontend/backend) — Версия 1.16.8

### Ключевые классы CSS:

```css
.app-shell          /* Корневой контейнер layout */
.app-header         /* Фиксированный header */
.app-content        /* Скролл-контейнер контента */
.app-content.scroll-lock  /* Блокировка скролла */
.page               /* Контейнер страницы */
.container          /* Контейнер контента */
.card               /* Универсальная карточка */
.table-wrap         /* Обертка для таблиц с горизонтальным скроллом */
```

### CSS Variables:

```css
--app-header-h: 56px     /* Высота header */
--app-gutter: 16px       /* Базовый отступ */
--app-height: 100dvh     /* Высота viewport (обновляется через useTgViewport) */
--footer-h: 72px         /* Высота footer (обновляется через AppShell) */
```

---

## ⚠️ Важные замечания

1. **Обратная совместимость**: Все компоненты поддерживают как `.app-content`, так и `.app-scroll` для плавного перехода
2. **Админка**: Админка НЕ использует AppShell и остается независимой
3. **Safe-area**: Используется `env(safe-area-inset-*)` для iOS поддержки
4. **Viewport height**: Используется `100dvh` для корректной высоты на mobile
5. **Блокировка скролла**: Всегда через классы, НЕ через `body.style.overflow`

---

**Версия:** v1.16.8  
**Дата:** 2025-12-23  
**Коммит:** `82cf002`

