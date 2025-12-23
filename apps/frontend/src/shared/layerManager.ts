/**
 * LayerManager: централизованное управление слоями (sheets, drawers, galleries)
 * и связанными эффектами (scroll-lock, pointer-events)
 * 
 * Использование:
 *   useEffect(() => {
 *     pushLayer('MySheet')
 *     return () => popLayer('MySheet')
 *   }, [])
 * 
 * Использует refcount для устойчивости к повторным вызовам и гонкам.
 */

// Map<layerId, refCount>
let layers = new Map<string, number>()

/**
 * Получить общее количество активных слоёв (сумма всех refcount)
 */
function getTotalLayersCount(): number {
  let total = 0
  layers.forEach(count => {
    total += count
  })
  return total
}

/**
 * Добавить слой в стек (с refcount)
 * Если стек становится непустым, применяется scroll-lock
 */
export function pushLayer(id: string): void {
  if (!id || id.trim() === '') {
    if (import.meta.env.DEV) {
      console.warn(`[LayerManager] pushLayer called with empty id, ignoring`)
    }
    return
  }

  const currentCount = layers.get(id) || 0
  layers.set(id, currentCount + 1)
  updateScrollLock()

  if (import.meta.env.DEV) {
    console.log(`[LayerManager] Pushed layer "${id}" (refcount: ${currentCount + 1}), total layers: ${getTotalLayersCount()}`)
  }
}

/**
 * Удалить слой из стека (decrement refcount)
 * Если refcount <= 0, слой удаляется из Map
 * НИКОГДА не уходит в минус
 * Если стек становится пустым, снимается scroll-lock
 */
export function popLayer(id: string): void {
  if (!id || id.trim() === '') {
    if (import.meta.env.DEV) {
      console.warn(`[LayerManager] popLayer called with empty id, ignoring`)
    }
    return
  }

  if (!layers.has(id)) {
    if (import.meta.env.DEV) {
      console.warn(`[LayerManager] Layer "${id}" not found in stack, skipping pop`)
    }
    return
  }

  const currentCount = layers.get(id)!
  const newCount = currentCount - 1

  if (newCount <= 0) {
    layers.delete(id)
  } else {
    layers.set(id, newCount)
  }

  updateScrollLock()

  if (import.meta.env.DEV) {
    console.log(`[LayerManager] Popped layer "${id}" (refcount: ${newCount > 0 ? newCount : 0}), total layers: ${getTotalLayersCount()}`)
  }
}

/**
 * Очистить весь стек слоёв
 * Используется при смене роута для гарантированного сброса состояния
 */
export function clearLayers(): void {
  const hadLayers = layers.size > 0

  if (import.meta.env.DEV && hadLayers) {
    const layerList = Array.from(layers.entries()).map(([id, count]) => `${id}(${count})`).join(', ')
    console.log(`[LayerManager] Clearing all layers: ${layerList}`)
  }

  layers.clear()
  updateScrollLock()
}

/**
 * Получить текущий стек (для отладки)
 * Возвращает массив объектов { id, count }
 */
export function getLayers(): Array<{ id: string; count: number }> {
  return Array.from(layers.entries()).map(([id, count]) => ({ id, count }))
}

/**
 * Обновить состояние scroll-lock на основе общего количества слоёв
 */
function updateScrollLock(): void {
  const totalLayersCount = getTotalLayersCount()
  const hasLayers = totalLayersCount > 0

  // Найти scroll-контейнер (.app-content или .app-scroll)
  const scroller = document.querySelector('.app-content') || document.querySelector('.app-scroll') as HTMLElement | null

  if (!scroller) {
    if (import.meta.env.DEV) {
      console.warn(`[LayerManager] Scroll container (.app-content or .app-scroll) not found`)
    }
    return
  }

  if (hasLayers) {
    scroller.classList.add('scroll-lock')
  } else {
    scroller.classList.remove('scroll-lock')
  }
}

// DEV-only: экспорт для отладки в консоли
if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as any).__ASKED_LAYERS__ = () => getLayers()
}

