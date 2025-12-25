import React, { useEffect, useRef } from 'react'
import './MainProcess.css'

/**
 * Блок 9: Процесс (Process)
 * Изолированный компонент для отображения процесса создания
 */
export const MainProcess: React.FC = () => {
  const processGridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const grid = processGridRef.current
    if (!grid) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.2) {
            grid.classList.add('is-visible')
            observer.disconnect()
          }
        })
      },
      {
        threshold: 0.2,
        rootMargin: '0px 0px -50px 0px',
      }
    )

    observer.observe(grid)

    return () => {
      observer.disconnect()
    }
  }, [])

  return (
    <div className="main-block main-block-process">
      <section className="home-process">
        <div className="process-head">
          <div className="process-kicker">PROCESS</div>
          <h2 className="process-title">Как создаётся вещь в ASKED</h2>
          <p className="process-sub">
            Мы собираем продукт по шагам — от идеи до результата.
          </p>
        </div>

        <div className="process-grid" ref={processGridRef}>
          <div className="process-step">
            <div className="step-num">01</div>
            <div className="step-name">Идея / эскиз</div>
            <div className="step-desc">Концепт, референсы и стиль.</div>
          </div>

          <div className="process-step">
            <div className="step-num">02</div>
            <div className="step-name">Подбор базы</div>
            <div className="step-desc">Фасон, ткань, цвет, размер.</div>
          </div>

          <div className="process-step">
            <div className="step-num">03</div>
            <div className="step-name">Кастом / роспись</div>
            <div className="step-desc">Аэрограф, кисти, детали.</div>
          </div>

          <div className="process-step">
            <div className="step-num">04</div>
            <div className="step-name">Готовая вещь</div>
            <div className="step-desc">Финальная проверка и упаковка.</div>
          </div>
        </div>
      </section>
    </div>
  )
}

