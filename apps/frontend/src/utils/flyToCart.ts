export function flyToCart(opts: {
  imageUrl: string
  fromEl: HTMLElement
}) {
  const badge =
    (document.querySelector('[data-cart-badge="true"]') as HTMLElement | null) ||
    (document.querySelector('.header-cart-btn') as HTMLElement | null)

  if (!badge) return

  const fromRect = opts.fromEl.getBoundingClientRect()
  const toRect = badge.getBoundingClientRect()

  const img = document.createElement('div')
  img.style.position = 'fixed'
  img.style.left = `${fromRect.left + fromRect.width / 2 - 18}px`
  img.style.top = `${fromRect.top + fromRect.height / 2 - 18}px`
  img.style.width = '36px'
  img.style.height = '36px'
  img.style.borderRadius = '12px'
  img.style.backgroundImage = `url(${opts.imageUrl})`
  img.style.backgroundSize = 'cover'
  img.style.backgroundPosition = 'center'
  img.style.zIndex = '9999'
  img.style.boxShadow = '0 14px 40px rgba(0,0,0,0.55)'
  img.style.border = '1px solid rgba(255,255,255,0.18)'

  // плавность
  img.style.transition = 'transform 520ms cubic-bezier(.2,.9,.2,1), opacity 520ms ease'
  img.style.willChange = 'transform, opacity'

  document.body.appendChild(img)

  const dx = toRect.left + toRect.width / 2 - (fromRect.left + fromRect.width / 2)
  const dy = toRect.top + toRect.height / 2 - (fromRect.top + fromRect.height / 2)

  // небольшая дуга: сделаем "подскок" через scale + slight rotate
  requestAnimationFrame(() => {
    img.style.transform = `translate(${dx}px, ${dy}px) scale(0.2) rotate(12deg)`
    img.style.opacity = '0.2'
  })

  const cleanup = () => {
    img.removeEventListener('transitionend', cleanup)
    img.remove()
    // можно чуть "пульснуть" бейдж
    badge.classList.remove('cart-pulse')
    void badge.offsetWidth
    badge.classList.add('cart-pulse')
  }

  img.addEventListener('transitionend', cleanup)
}




