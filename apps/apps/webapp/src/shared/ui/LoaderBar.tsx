interface LoaderBarProps {
  progress: number // 0-100
}

/**
 * Прогресс-бар загрузки
 */
export function LoaderBar({ progress }: LoaderBarProps) {
  return (
    <div
      style={{
        width: '100%',
        height: '4px',
        background: 'rgba(255, 255, 255, 0.2)',
        borderRadius: '999px',
        overflow: 'hidden',
        marginTop: '24px',
      }}
    >
      <div
        style={{
          width: `${Math.min(100, Math.max(0, progress))}%`,
          height: '100%',
          background: 'var(--tg-button, #2481cc)',
          borderRadius: '999px',
          transition: 'width 300ms ease-out',
        }}
      />
    </div>
  )
}
