# Исправление критических багов v1.16.12+

## Исправленные проблемы:

### 1. ✅ Скролл в LAB не работает
**Причина**: `.lab-root` имел `padding-top: 72px` и `min-height: 100vh`, что конфликтовало с `.app-content`, который уже имеет padding-top.

**Решение**: Убрали `padding-top` и `min-height` из `.lab-root`, т.к. они уже есть в `.app-content`.

### 2. ✅ Корзина "улетает" на главной
**Причина**: `clearLayers()` вызывался при каждом переходе на главную (`/app`), что сбрасывало все открытые слои, включая корзину.

**Решение**: Полностью убрали `clearLayers()` из AppLayout. Каждый компонент сам управляет своим слоем через cleanup в useEffect.

### 3. ✅ Банеры открываются стабильно
**Причина**: После удаления `clearLayers()` навигация работает корректно.

## Оставшиеся проблемы (требуют дополнительной диагностики):

### 1. ❌ Карточки товаров не открываются
**Возможные причины**:
- Overlay корзины/меню блокирует клики (проверить z-index и pointer-events)
- События клика не доходят до карточки (проверить event propagation)
- Navigate не срабатывает (добавить логирование)

**Диагностика**:
```javascript
// В ProductGridCard.tsx добавить логирование:
const handleCardClick = useCallback(() => {
  console.log('[ProductCard] Click detected', product?.id)
  if (!product?.id) {
    console.warn('[ProductCard] No product.id')
    return
  }
  console.log('[ProductCard] Navigating to:', `/app/product/${product.id}`)
  navigate(`/app/product/${product.id}`)
}, [product?.id, navigate])
```

### 2. ❌ Бургер меню пропало
**Возможные причины**:
- Меню рендерится, но не видно (проверить z-index, transform, opacity)
- Overlay блокирует клики (проверить pointer-events)
- Состояние `open` не обновляется (добавить логирование)

**Диагностика**:
```javascript
// В Header.tsx добавить логирование:
useEffect(() => {
  console.log('[Header] Menu state:', open)
}, [open])
```

## Рекомендации для предотвращения багов:

### 1. LayerManager - правила использования:
- ✅ Каждый компонент управляет своим слоем через `pushLayer/popLayer` в useEffect
- ✅ Cleanup в useEffect всегда вызывает `popLayer`
- ❌ НЕ вызывать `clearLayers()` при смене route - это сбрасывает открытые слои
- ❌ НЕ использовать `body.layer-active` - может блокировать клики

### 2. Scroll-lock:
- ✅ Используется только через LayerManager
- ✅ Применяется к `.app-content.scroll-lock`
- ❌ НЕ использовать `body.style.overflow` или `body.classList`

### 3. Overlay/Drawer паттерн:
- ✅ Overlay должен иметь `pointer-events: none` когда закрыт
- ✅ Overlay должен иметь `pointer-events: auto` только когда открыт (`.is-open`)
- ✅ Z-index должен быть ниже, чем у основного контента, чтобы не блокировать клики

### 4. CSS структура:
- ✅ Все страницы находятся внутри `.app-content` (через AppShell)
- ✅ Страницы НЕ должны иметь собственный `padding-top` или `min-height: 100vh`
- ✅ Использовать переменные `--app-header-h` и `--app-gutter` для отступов

### 5. Testing checklist:
- [ ] Открыть/закрыть корзину 10 раз - скролл всегда возвращается
- [ ] Открыть/закрыть меню 10 раз - клики по карточкам работают
- [ ] Клик по карточке товара - открывается ProductSheet
- [ ] Скролл на всех страницах (главная, каталог, LAB) - работает
- [ ] Навигация между страницами - слои не залипают

## Следующие шаги:

1. Добавить логирование в ProductGridCard для диагностики кликов
2. Проверить z-index всех overlay элементов
3. Убедиться, что overlay корзины/меню не блокируют клики когда закрыты
4. Протестировать на реальном устройстве (Telegram WebApp)

