/**
 * Компонент информации о версии
 */
export function VersionInfo() {
  // Получаем версию из package.json или env
  const version = import.meta.env.VITE_APP_VERSION || '1.16.5'
  const commit = import.meta.env.VITE_GIT_COMMIT || 'dev'
  const buildTime = import.meta.env.VITE_BUILD_TIME || new Date().toISOString().split('T')[0]

  return (
    <div
      style={{
        fontSize: '12px',
        color: 'rgba(255, 255, 255, 0.6)',
        textAlign: 'center',
        marginTop: '16px',
      }}
    >
      <div>v{version} · разработано командой ASKED · 2025</div>
      <div style={{ marginTop: '4px', fontSize: '11px', opacity: 0.7 }}>
        build: v{version} · {commit.substring(0, 7)} · {buildTime}
      </div>
    </div>
  )
}
