# Smoke Test Guide - LayerManager v1.16.13

## Как проверить состояние LayerManager в консоли

После загрузки приложения откройте DevTools (F12) и используйте:

```javascript
// Проверить текущие активные слои
__ASKED_LAYERS__()

// Результат будет массивом объектов:
// [{ id: "MiniCartDrawer", count: 1 }, { id: "ProductSheet", count: 1 }]
```

## Checklist для ручного тестирования

### 1. MiniCartDrawer (20 раз быстро)

**Шаги:**
1. Откройте главную страницу `/app`
2. В консоли запустите: `__ASKED_LAYERS__()` — должно быть `[]`
3. Быстро кликайте на иконку корзины (открыть/закрыть) 20 раз
4. После каждого закрытия проверьте:
   - Скролл страницы работает (можно прокрутить колесом/тачем)
   - В консоли: `__ASKED_LAYERS__()` должно вернуть `[]`
   - На `.app-content` нет класса `.scroll-lock`

**Ожидаемый результат:** ✅ После каждого закрытия скролл возвращается, scroll-lock снимается

---

### 2. ProductSheet (открыть → назад)

**Шаги:**
1. Откройте главную страницу `/app`
2. Кликните на любую карточку товара
3. Должен открыться ProductSheet
4. В консоли: `__ASKED_LAYERS__()` должно показать `[{ id: "ProductSheet", count: 1 }]`
5. Проверьте скролл — должен быть заблокирован (не скроллится)
6. Нажмите "Назад" или свайпните назад
7. В консоли: `__ASKED_LAYERS__()` должно вернуть `[]`
8. Проверьте скролл — должен работать
9. Попробуйте кликнуть на другую карточку товара — должен открыться ProductSheet

**Ожидаемый результат:** ✅ После закрытия скролл возвращается, клики работают

---

### 3. FullscreenGallery (открыть → закрыть)

**Шаги:**
1. Откройте любой товар (ProductSheet)
2. Кликните на изображение, чтобы открыть галерею
3. В консоли: `__ASKED_LAYERS__()` должно показать минимум `ProductSheet` и `FullscreenGallery`
4. Проверьте скролл — должен быть заблокирован
5. Закройте галерею (клик на overlay или ESC)
6. В консоли: `__ASKED_LAYERS__()` должно показать только `[{ id: "ProductSheet", count: 1 }]`
7. Кликните на другую карточку товара в каталоге — должен открыться новый ProductSheet

**Ожидаемый результат:** ✅ После закрытия галереи клики по карточкам работают

---

### 4. Резкая смена маршрутов

**Шаги:**
1. Откройте главную `/app`
2. В консоли: `__ASKED_LAYERS__()` должно быть `[]`
3. Быстро перейдите: `/app` → `/app/product/123` → `/app` → `/app/catalog` → `/app/cart`
4. После каждого перехода проверьте:
   - В консоли: `__ASKED_LAYERS__()` должно вернуть `[]` (все слои сброшены)
   - Скролл работает на всех страницах
   - На `.app-content` нет класса `.scroll-lock`

**Ожидаемый результат:** ✅ Нигде не залипает scroll-lock, скролл всегда работает

---

### 5. Комбинированный тест (открыть несколько слоёв)

**Шаги:**
1. Откройте главную `/app`
2. Откройте корзину (MiniCartDrawer)
3. В консоли: `__ASKED_LAYERS__()` должно показать `[{ id: "MiniCartDrawer", count: 1 }]`
4. Не закрывая корзину, перейдите на другую страницу (например, `/app/catalog`)
5. В консоли: `__ASKED_LAYERS__()` должно вернуть `[]` (clearLayers сработал)
6. Скролл должен работать

**Ожидаемый результат:** ✅ При смене route все слои сбрасываются, scroll-lock снимается

---

## Диагностика проблем

### Если scroll-lock залип:

1. Откройте консоль и выполните:
```javascript
__ASKED_LAYERS__()
```

2. Если возвращает не пустой массив, значит какой-то слой не снялся:
```javascript
// Принудительно очистить все слои
// (в production это не должно быть доступно, только в DEV)
```

3. Проверьте в Elements (DevTools), есть ли класс `.scroll-lock` на `.app-content`:
```javascript
document.querySelector('.app-content').classList.contains('scroll-lock')
// Должно быть false
```

4. Если класс есть, но слоёв нет — это баг в updateScrollLock(). Принудительно снимите:
```javascript
document.querySelector('.app-content').classList.remove('scroll-lock')
```

### Логи в консоли

В DEV режиме LayerManager логирует все операции:
- `[LayerManager] Pushed layer "X" (refcount: N), total layers: M`
- `[LayerManager] Popped layer "X" (refcount: N), total layers: M`
- `[LayerManager] Clearing all layers: X(N), Y(M)`

Если видите странные логи (например, pop без push, или refcount уходит в минус) — это баг.

---

## Автоматизированная проверка (опционально)

Можно добавить в код автоматическую проверку при каждой смене route:

```typescript
// В AppLayout.tsx после clearLayers()
if (import.meta.env.DEV) {
  const scroller = document.querySelector('.app-content')
  if (scroller?.classList.contains('scroll-lock')) {
    console.error('[LayerManager] WARNING: scroll-lock still active after clearLayers()')
  }
}
```

Но это уже опционально, основная защита — refcount и clearLayers() на route change.

