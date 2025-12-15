export function flyOrderToArtist(opts: { fromEl: HTMLElement }) {
  const target = document.querySelector('[data-lab-target]') as HTMLElement | null

  if (!target) return

  const fromRect = opts.fromEl.getBoundingClientRect()
  const toRect = target.getBoundingClientRect()

  const card = document.createElement('div')
  card.style.position = 'fixed'
  card.style.left = `${fromRect.left + fromRect.width / 2 - 60}px`
  card.style.top = `${fromRect.top + fromRect.height / 2 - 30}px`
  card.style.width = '120px'
  card.style.height = '60px'
  card.style.borderRadius = '12px'
  card.style.background = 'rgba(15, 15, 15, 0.95)'
  card.style.backdropFilter = 'blur(18px)'
  card.style.border = '1px solid rgba(255, 255, 255, 0.2)'
  card.style.boxShadow = '0 14px 40px rgba(0, 0, 0, 0.55)'
  card.style.zIndex = '9999'
  card.style.display = 'flex'
  card.style.alignItems = 'center'
  card.style.justifyContent = 'center'
  card.style.padding = '8px 12px'
  card.style.color = '#f5f5f5'
  card.style.fontSize = '10px'
  card.style.fontWeight = '600'
  card.style.letterSpacing = '0.08em'
  card.style.textTransform = 'uppercase'
  card.style.textAlign = 'center'
  card.style.lineHeight = '1.2'
  card.textContent = 'КАСТОМ\nЗАПРОС'

  // Плавность - медленнее и с дугой
  card.style.transition = 'transform 1350ms cubic-bezier(.15,.9,.2,1), opacity 1350ms ease'
  card.style.willChange = 'transform, opacity'

  document.body.appendChild(card)

  const dx = toRect.left + toRect.width / 2 - (fromRect.left + fromRect.width / 2)
  const dy = toRect.top + toRect.height / 2 - (fromRect.top + fromRect.height / 2)

  // Дуга: сначала вверх/влево, потом к цели
  requestAnimationFrame(() => {
    // Добавляем подъем в начале дуги
    const arcOffset = -50
    card.style.transform = `translate(${dx}px, ${dy + arcOffset}px) scale(0.18) rotate(10deg)`
    card.style.opacity = '0.05'
  })

  const cleanup = () => {
    card.removeEventListener('transitionend', cleanup)
    // Небольшая задержка перед удалением для ощущения "прилетело"
    setTimeout(() => {
      card.remove()
    }, 120)
  }

  card.addEventListener('transitionend', cleanup)
}

