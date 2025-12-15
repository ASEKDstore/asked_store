import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import './LabIntroLoader.css'

interface LabIntroLoaderProps {
  active: boolean
  minMs?: number
  maxMs?: number
  onDone?: () => void
  dataReady?: boolean
}

type Stage = 'SCANNING' | 'MIXING' | 'CALIBRATING' | 'CURING' | 'READY'

const STAGES: Stage[] = ['SCANNING', 'MIXING', 'CALIBRATING', 'CURING', 'READY']
const STAGE_THRESHOLDS = [0, 20, 40, 60, 85, 100]

export const LabIntroLoader = ({ 
  active, 
  minMs = 5000, 
  maxMs = 8000,
  onDone,
  dataReady = false
}: LabIntroLoaderProps) => {
  const [progress, setProgress] = useState(0)
  const [currentStage, setCurrentStage] = useState<Stage>('SCANNING')
  const [isVisible, setIsVisible] = useState(false)
  const [isFinishing, setIsFinishing] = useState(false)
  const [showReadyStamp, setShowReadyStamp] = useState(false)
  const [showStamps, setShowStamps] = useState({ ok: false, pass: false, verified: false })
  
  const startTimeRef = useRef<number>(0)
  const durationRef = useRef<number>(0)
  const minHoldDoneAtRef = useRef<number>(0)
  const animationFrameRef = useRef<number | null>(null)
  const isFinishingRef = useRef(false)
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false

  useEffect(() => {
    console.log('[LabIntroLoader] active changed:', active)
    
    if (!active) {
      setIsVisible(false)
      setProgress(0)
      setCurrentStage('SCANNING')
      setIsFinishing(false)
      setShowReadyStamp(false)
      setShowStamps({ ok: false, pass: false, verified: false })
      return
    }

    // Стартуем интро
    console.log('[LabIntroLoader] Starting intro...')
    isFinishingRef.current = false
    setIsVisible(true)
    setProgress(0)
    setCurrentStage('SCANNING')
    setIsFinishing(false)
    setShowReadyStamp(false)
    setShowStamps({ ok: false, pass: false, verified: false })

    // Случайная длительность
    const duration = minMs + Math.random() * (maxMs - minMs)
    durationRef.current = duration
    startTimeRef.current = Date.now()
    minHoldDoneAtRef.current = Date.now() + Math.min(duration, 5000) // Минимум 5с

    // Показываем штампы по таймингу
    const okTimer = setTimeout(() => setShowStamps(prev => ({ ...prev, ok: true })), duration * 0.3)
    const passTimer = setTimeout(() => setShowStamps(prev => ({ ...prev, pass: true })), duration * 0.6)
    const verifiedTimer = setTimeout(() => setShowStamps(prev => ({ ...prev, verified: true })), duration * 0.85)

    // Анимация прогресса
    const updateProgress = () => {
      const elapsed = Date.now() - startTimeRef.current
      const targetProgress = Math.min(elapsed / durationRef.current, 0.99) // До 99%, 100% только при финише
      
      setProgress(targetProgress)

      // Определяем текущую стадию по прогрессу
      const percent = targetProgress * 100
      let stageIndex = 0
      for (let i = 0; i < STAGE_THRESHOLDS.length - 1; i++) {
        if (percent >= STAGE_THRESHOLDS[i] && percent < STAGE_THRESHOLDS[i + 1]) {
          stageIndex = i
          break
        }
      }
      if (percent >= 85) stageIndex = 4
      setCurrentStage(STAGES[stageIndex])

      // Проверяем, можно ли завершить
      const now = Date.now()
      const canFinish = now >= minHoldDoneAtRef.current && dataReady && targetProgress >= 0.99
      const maxDuration = 12000 // Максимум 12с
      const shouldForceFinish = now - startTimeRef.current >= maxDuration

      if (canFinish || shouldForceFinish) {
        // Финиш: быстро до 100%, показываем READY stamp, затем fade-out
        if (!isFinishingRef.current) {
          isFinishingRef.current = true
          setIsFinishing(true)
          setProgress(1)
          setCurrentStage('READY')
          setShowReadyStamp(true)
          
          // Fade-out через 400ms
          setTimeout(() => {
            setIsVisible(false)
            setTimeout(() => {
              onDone?.()
            }, 300)
          }, 400)
          return // Прекращаем анимацию
        }
      } else if (!prefersReducedMotion && !isFinishingRef.current) {
        animationFrameRef.current = requestAnimationFrame(updateProgress)
      }
    }

    if (!prefersReducedMotion) {
      animationFrameRef.current = requestAnimationFrame(updateProgress)
    } else {
      // Для reduced motion: просто таймер
      const timer = setTimeout(() => {
        setProgress(1)
        setCurrentStage('READY')
        setShowReadyStamp(true)
        setTimeout(() => {
          setIsVisible(false)
          onDone?.()
        }, 400)
      }, duration)
      return () => clearTimeout(timer)
    }

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      clearTimeout(okTimer)
      clearTimeout(passTimer)
      clearTimeout(verifiedTimer)
    }
  }, [active, minMs, maxMs, onDone, dataReady, prefersReducedMotion])

  // Блокируем скролл body при активном лоадере
  useEffect(() => {
    if (typeof document === 'undefined') return
    
    if (isVisible && active) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isVisible, active])

  // Portal для fullscreen overlay
  if (typeof document === 'undefined') {
    return null
  }

  const content = (
    <div className={`lab-intro-loader ${isVisible && active ? 'is-visible' : ''} ${isFinishing ? 'is-finishing' : ''}`}>
      {/* Backdrop с эффектами */}
      <div className="lab-intro-backdrop" />
      <div className="lab-intro-scanlines" />
      <div className="lab-intro-grain" />

      {/* HUD по центру */}
      <div className="lab-intro-hud">
        <div className="lab-intro-header">
          <div className="lab-intro-title">ASKED LAB</div>
          <div className="lab-intro-subtitle">// SYNTHESIS</div>
        </div>

        <div className="lab-intro-content">
          <div className="lab-intro-stage">
            <span className="lab-intro-stage-label">STATUS:</span>
            <span className={`lab-intro-stage-value ${currentStage.toLowerCase()}`}>
              {currentStage === 'SCANNING' && 'SCANNING FABRIC'}
              {currentStage === 'MIXING' && 'MIXING PIGMENTS'}
              {currentStage === 'CALIBRATING' && 'CALIBRATING AIRBRUSH'}
              {currentStage === 'CURING' && 'CURING LAYER'}
              {currentStage === 'READY' && 'READY'}
            </span>
          </div>

          {/* Progress bar */}
          <div className="lab-intro-progress">
            <div 
              className="lab-intro-progress-bar" 
              style={{ width: `${progress * 100}%` }}
            />
            <div className="lab-intro-progress-shine" />
          </div>
        </div>

        {/* Штампы справа */}
        <div className="lab-intro-stamps">
          {showStamps.ok && (
            <div className="lab-intro-stamp lab-intro-stamp--ok">OK</div>
          )}
          {showStamps.pass && (
            <div className="lab-intro-stamp lab-intro-stamp--pass">PASS</div>
          )}
          {showStamps.verified && (
            <div className="lab-intro-stamp lab-intro-stamp--verified">LAB VERIFIED</div>
          )}
          {showReadyStamp && (
            <div className="lab-intro-stamp lab-intro-stamp--ready">READY</div>
          )}
        </div>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}

