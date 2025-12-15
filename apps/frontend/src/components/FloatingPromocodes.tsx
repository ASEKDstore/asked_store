import './FloatingPromocodes.css'

export function FloatingPromocodes() {
  const promos = ['-10%', 'FREE', 'ASKED', '-15%', '-20%', 'NEW']

  return (
    <div className="promo-layer">
      {promos.map((promo, index) => (
        <span key={index} className={`promo promo-${index + 1}`}>
          {promo}
        </span>
      ))}
    </div>
  )
}




