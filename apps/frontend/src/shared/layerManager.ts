/**
 * LayerManager: централизованное управление слоями (sheets, drawers, galleries)
 * и связанными эффектами (scroll-lock, pointer-events)
 * 
 * Использование:
 *   useEffect(() => {
 *     pushLayer('MySheet')
 *     return () => popLayer('MySheet')
 *   }, [])
 */

let layers: string[] = []

/**
 * Добавить слой в стек
 * Если стек становится непустым, применяется scroll-lock и layer-active
 */
export function pushLayer(id: string): void {
  if (layers.includes(id)) {
    if (import.meta.env.DEV) {
      console.warn(`[LayerManager] Layer "${id}" already exists, skipping push`)
    }
    return
  }

  layers.push(id)
  updateScrollLock()

  if (import.meta.env.DEV) {
    console.log(`[LayerManager] Pushed layer "${id}", stack:`, [...layers])
  }
}

/**
 * Удалить слой из стека
 * Если стек становится пустым, снимается scroll-lock и layer-active
 */
export function popLayer(id: string): void {
  const index = layers.indexOf(id)
  if (index === -1) {
    if (import.meta.env.DEV) {
      console.warn(`[LayerManager] Layer "${id}" not found in stack, skipping pop`)
    }
    return
  }

  layers.splice(index, 1)
  updateScrollLock()

  if (import.meta.env.DEV) {
    console.log(`[LayerManager] Popped layer "${id}", stack:`, [...layers])
  }
}

/**
 * Очистить весь стек слоёв
 * Используется при смене роута для гарантированного сброса состояния
 */
export function clearLayers(): void {
  if (layers.length === 0) return

  if (import.meta.env.DEV) {
    console.log(`[LayerManager] Clearing all layers:`, [...layers])
  }

  layers = []
  updateScrollLock()
}

/**
 * Получить текущий стек (для отладки)
 */
export function getLayers(): readonly string[] {
  return [...layers]
}

/**
 * Обновить состояние scroll-lock и layer-active на основе стека
 */
function updateScrollLock(): void {
  const hasLayers = layers.length > 0

  // Найти scroll-контейнер (.app-content или .app-scroll)
  const scroller = document.querySelector('.app-content') || document.querySelector('.app-scroll') as HTMLElement | null

  if (scroller) {
    if (hasLayers) {
      scroller.classList.add('scroll-lock')
    } else {
      scroller.classList.remove('scroll-lock')
    }
  }

  // Управление классом layer-active на body - убрано, т.к. не используется
  // if (hasLayers) {
  //   document.body.classList.add('layer-active')
  // } else {
  //   document.body.classList.remove('layer-active')
  // }
}

