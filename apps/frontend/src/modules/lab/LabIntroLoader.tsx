import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { pushLayer, popLayer } from '../../shared/layerManager'
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
      return
    }

    // Стартуем интро
    console.log('[LabIntroLoader] Starting intro...')
    isFinishingRef.current = false
    setIsVisible(true)
    setProgress(0)
    setCurrentStage('SCANNING')
    setIsFinishing(false)

    // Случайная длительность
    const duration = minMs + Math.random() * (maxMs - minMs)
    durationRef.current = duration
    startTimeRef.current = Date.now()
    minHoldDoneAtRef.current = Date.now() + Math.min(duration, 5000) // Минимум 5с

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
        // Финиш: быстро до 100%, затем fade-out
        if (!isFinishingRef.current) {
          isFinishingRef.current = true
          setIsFinishing(true)
          setProgress(1)
          setCurrentStage('READY')
          
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
    }
  }, [active, minMs, maxMs, onDone, dataReady, prefersReducedMotion])

  // Layer management: управление scroll-lock через LayerManager
  useEffect(() => {
    if (typeof document === 'undefined') return
    
    if (isVisible && active) {
      pushLayer('LabIntroLoader')
    } else {
      popLayer('LabIntroLoader')
    }

    return () => {
      popLayer('LabIntroLoader')
    }
  }, [isVisible, active])

  // Portal для fullscreen overlay
  if (typeof document === 'undefined') {
    return null
  }

  const content = (
    <div className={`lab-intro-loader ${isVisible && active ? 'is-visible' : ''} ${isFinishing ? 'is-finishing' : ''}`}>
      {/* Backdrop с эффектами - стиль как в LoadingScreen */}
      <div className="lab-intro-backdrop" />
      <div className="lab-intro-bg" />
      <div className="lab-intro-glass" />
      
      {/* Контент в стиле LoadingScreen */}
      <div className="lab-intro-content">
        <div className="lab-intro-sticker">ASKED LAB</div>
        
        <div className="lab-intro-text">
          <div className="lab-intro-title">Синтез кастомов</div>
          <div className="lab-intro-sub">
            Лаборатория ASKED создаёт уникальные вещи под заказ
          </div>
        </div>

        {/* Progress bar в стиле LoadingScreen */}
        <div className="lab-intro-progress">
          <div className="lab-intro-progress-track" />
          <div 
            className="lab-intro-progress-thumb" 
            style={{ left: `clamp(0px, calc(${progress * 100}% - 90px), calc(100% - 90px))` }}
          />
        </div>

        {/* Статус */}
        <div className="lab-intro-status">
          <span className="lab-intro-status-label">STATUS:</span>
          <span className={`lab-intro-status-value ${currentStage.toLowerCase()}`}>
            {currentStage === 'SCANNING' && 'SCANNING FABRIC'}
            {currentStage === 'MIXING' && 'MIXING PIGMENTS'}
            {currentStage === 'CALIBRATING' && 'CALIBRATING AIRBRUSH'}
            {currentStage === 'CURING' && 'CURING LAYER'}
            {currentStage === 'READY' && 'READY'}
          </span>
        </div>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}

