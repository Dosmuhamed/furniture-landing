import { animate, AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { useCart } from '../components/Cart'
import { formatPrice } from '../lib/format'
import { ease } from '../lib/motion'
import { scrollToId } from '../lib/smoothScroll'
import { finishOf, floors, presets, slotById, slots, walls } from './catalog'
import { useRoom } from './store'
import './Panel.css'

/** Последняя глава: полный конструктор поверх 3D-комнаты */
export function Panel({ visible, snap }: { visible: boolean; snap: () => void }) {
  const r = useRoom()
  const cart = useCart()
  const active = r.tab === 'room' ? null : slotById[r.tab]

  const addAll = (el: HTMLElement) =>
    cart.add(
      r.chosen.map(({ slot, variant, finish }) => ({
        id: `${slot.id}-${variant.id}-${finish.id}`,
        name: `${slot.label} ${variant.name}`,
        note: `${slot.finishLabel}: ${finish.name}`,
        price: variant.price,
        color: finish.color,
      })),
      el,
    )

  return (
    <div className={`studio ${visible ? 'is-visible' : ''} ${r.night ? 'is-night' : ''}`}>
      <div className="studio__top">
        <h2>
          Ваша <em>комната</em>
        </h2>
        <p>Вращайте её мышью или пальцем, нажмите на предмет, чтобы изменить его, или примерьте готовый стиль.</p>
        <div className="studio__presets">
          {presets.map((p) => (
            <button key={p.id} className={r.preset === p.id ? 'is-active' : ''} onClick={() => r.applyPreset(p.id)}>
              {r.preset === p.id && <motion.span layoutId="preset-pill" className="studio__pill" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
              <span>{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="studio__tools">
        <button className={`studio__dn ${r.night ? 'is-night' : ''}`} onClick={() => r.setNight(!r.night)}>
          <span className="studio__knob">
            {r.night ? (
              <svg viewBox="0 0 24 24">
                <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="4.5" />
                <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
              </svg>
            )}
          </span>
          {r.night ? 'Вечер' : 'День'}
        </button>
        <button className="studio__icon" onClick={snap} aria-label="Сохранить снимок комнаты" title="Сохранить снимок">
          <svg viewBox="0 0 24 24">
            <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
            <circle cx="12" cy="13" r="3.5" />
          </svg>
        </button>
      </div>

      <aside className="panel" data-lenis-prevent>
        <div className="panel__tabs" role="tablist">
          {slots.map((s) => {
            const filled = !!r.selection[s.id].variant
            return (
              <button
                key={s.id}
                role="tab"
                aria-selected={r.tab === s.id}
                className={`panel__tab ${r.tab === s.id ? 'is-active' : ''}`}
                onClick={() => r.setTab(s.id)}
              >
                <svg viewBox="0 0 24 24">
                  <path d={s.icon} />
                </svg>
                <span>{s.label}</span>
                {filled && <i className="panel__dot" style={{ background: finishOf(s.id, r.selection[s.id].finish).color }} />}
              </button>
            )
          })}
          <button role="tab" aria-selected={r.tab === 'room'} className={`panel__tab ${r.tab === 'room' ? 'is-active' : ''}`} onClick={() => r.setTab('room')}>
            <svg viewBox="0 0 24 24">
              <path d="M3 21V9l9-6 9 6v12M3 21h18M9 21v-6h6v6" />
            </svg>
            <span>Комната</span>
          </button>
        </div>

        <div className="panel__body">
          <AnimatePresence mode="wait">
            <motion.div key={r.tab} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.3, ease }}>
              {active ? (
                <>
                  <p className="panel__label">Модель</p>
                  <div className="panel__variants">
                    {[...active.variants, null].map((v) => {
                      const on = r.selection[active.id].variant === (v?.id ?? null)
                      return (
                        <button key={v?.id ?? 'none'} className={`variant ${on ? 'is-on' : ''}`} onClick={() => r.setItem(active.id, { variant: v?.id ?? null })}>
                          <span className="variant__check" aria-hidden>
                            <svg viewBox="0 0 24 24">
                              <path d={v ? 'm5 12 5 5 9-10' : 'M6 6l12 12M18 6 6 18'} />
                            </svg>
                          </span>
                          <span className="variant__name">
                            <b>{v ? v.name : 'Без предмета'}</b>
                            {v && <small>{v.desc}</small>}
                          </span>
                          {v && <span className="variant__price">{formatPrice(v.price)}</span>}
                        </button>
                      )
                    })}
                  </div>
                  <p className="panel__label">
                    {active.finishLabel}: <b>{finishOf(active.id, r.selection[active.id].finish).name}</b>
                  </p>
                  <div className="panel__swatches">
                    {active.finishes.map((f) => (
                      <button
                        key={f.id}
                        className={`sw ${r.selection[active.id].finish === f.id ? 'is-on' : ''}`}
                        style={{ background: f.color }}
                        onClick={() =>
                          r.setItem(active.id, r.selection[active.id].variant ? { finish: f.id } : { finish: f.id, variant: active.variants[0].id })
                        }
                        aria-label={f.name}
                        title={f.name}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <p className="panel__label">
                    Стены: <b>{walls.find((w) => w.id === r.room.wall)?.name}</b>
                  </p>
                  <div className="panel__swatches">
                    {walls.map((w) => (
                      <button
                        key={w.id}
                        className={`sw ${r.room.wall === w.id ? 'is-on' : ''}`}
                        style={{ background: w.color }}
                        onClick={() => r.setRoom({ wall: w.id })}
                        aria-label={w.name}
                        title={w.name}
                      />
                    ))}
                  </div>
                  <p className="panel__label">Пол</p>
                  <div className="panel__floors">
                    {floors.map((f) => (
                      <button key={f.id} className={`chip ${r.room.floor === f.id ? 'is-on' : ''}`} onClick={() => r.setRoom({ floor: f.id })}>
                        <i className={`floor-ico floor-ico--${f.id}`} />
                        {f.name}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <footer className="panel__foot">
          <div className="panel__sum">
            <span>{r.chosen.length ? `Предметов: ${r.chosen.length}` : 'Ничего не выбрано'}</span>
            <AnimatedPrice value={r.total} />
          </div>
          <div className="panel__actions">
            <button className="btn btn--dark" disabled={!r.chosen.length} onClick={(e) => addAll(e.currentTarget)}>
              Всё в корзину
            </button>
            <button className="btn btn--ghost" onClick={() => scrollToId('spec')}>
              Смета
            </button>
          </div>
        </footer>
      </aside>
    </div>
  )
}

function AnimatedPrice({ value }: { value: number }) {
  const ref = useRef<HTMLElement>(null)
  const shown = useRef(value)
  useEffect(() => {
    const controls = animate(shown.current, value, {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        shown.current = v
        if (ref.current) ref.current.textContent = formatPrice(v)
      },
    })
    return () => controls.stop()
  }, [value])
  return <b ref={ref}>{formatPrice(value)}</b>
}
