import './custom-preview-3d.css'

type Props = {
  canvas: 'hoodie' | 'tshirt' | 'sneakers' | 'cap' | 'bag'
  color: 'black' | 'white' | 'grey' | 'custom'
  customColor?: string
  side?: string | null // грудь/спина/полный/одна сторона/нет
}

export const CustomPreview3D: React.FC<Props> = ({ canvas, color, customColor, side }) => {
  const sideKey = side
    ? side === 'Грудь'
      ? 'chest'
      : side === 'Спина полностью'
      ? 'back'
      : side === 'Полный'
      ? 'full'
      : side === 'Одна сторона'
      ? 'one'
      : 'none'
    : 'none'

  const canvasLabels: Record<typeof canvas, string> = {
    hoodie: 'Худи',
    tshirt: 'Футболка',
    sneakers: 'Кроссовки',
    cap: 'Кепка',
    bag: 'Сумка',
  }

  const colorLabels: Record<typeof color, string> = {
    black: 'Черный',
    white: 'Белый',
    grey: 'Серый',
    custom: customColor || 'Свой',
  }

  const labelText = `${canvasLabels[canvas]} • ${colorLabels[color]}${side ? ` • ${side}` : ''}`

  return (
    <div className="cp3d">
      <div className={`cp3d-stage cp3d-${canvas}`}>
        <div
          className={`cp3d-color cp3d-color-${color}`}
          style={color === 'custom' ? { background: customColor } : undefined}
        />
        <img className="cp3d-base" src={`/assets/mocks/${canvas}-base.png`} alt="" />
        <img className="cp3d-shade" src={`/assets/mocks/${canvas}-shade.png`} alt="" />
        <div className={`cp3d-print cp3d-print-${sideKey}`} />
      </div>
      <div className="cp3d-label">{labelText}</div>
    </div>
  )
}




