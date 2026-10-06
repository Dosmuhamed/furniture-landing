import { AnimatePresence, motion, useInView } from 'framer-motion'
import { useRef, useState, type FormEvent } from 'react'
import { useCart } from '../components/Cart'
import { chapters } from '../chapters'
import { floors, footprints, placement, walls } from '../configurator/catalog'
import { useRoom } from '../configurator/store'
import { formatPrice } from '../lib/format'
import { scrollToId } from '../lib/smoothScroll'
import './Spec.css'

const today = new Date().toLocaleDateString('ru-RU')

/** План комнаты сверху, нарисованный по выбранной мебели */
function Plan() {
  const { chosen } = useRoom()
  const ref = useRef<SVGSVGElement>(null)
  const drawn = useInView(ref, { once: true, amount: 0.3 })
  // ковёр рисуем первым, чтобы он был «под» мебелью
  const items = [...chosen].sort((a, b) => (a.slot.id === 'rug' ? -1 : b.slot.id === 'rug' ? 1 : 0))
  const number = (id: string) => chosen.findIndex((x) => x.slot.id === id) + 1

  return (
    <svg ref={ref} className={`plan ${drawn ? 'is-drawn' : ''}`} viewBox="-3.9 -3.5 7.6 6.9" role="img" aria-label="План комнаты сверху">
      {/* стены */}
      <path className="plan__wall" d="M-3.12 2.5 V-2.62 H3 V-2.5 H-3 V-0.2 M-3 1.6 V2.5" pathLength={1} />
      <rect className="plan__wallfill" x={-3.12} y={-2.62} width={6.12} height={0.12} />
      <rect className="plan__wallfill" x={-3.12} y={-2.5} width={0.12} height={2.3} />
      <rect className="plan__wallfill" x={-3.12} y={1.6} width={0.12} height={0.9} />
      {/* окно */}
      <path className="plan__window" d="M-3.12 -0.2 V1.6 M-3 -0.2 V1.6 M-3.06 -0.2 V1.6" />
      {/* открытые стороны диорамы — пунктиром */}
      <path className="plan__open" d="M-3 2.5 H3 V-2.5" />

      {/* размеры */}
      <g className="plan__dim">
        <path d="M-3 -3.05 H3 M-3 -3.15 V-2.95 M3 -3.15 V-2.95" />
        <text x={0} y={-3.15}>6 000</text>
        <path d="M3.35 -2.5 V2.5 M3.25 -2.5 H3.45 M3.25 2.5 H3.45" />
        <text x={3.55} y={0} transform="rotate(90 3.55 0)">
          5 000
        </text>
      </g>

      {items.map(({ slot, variant }, i) => {
        const fp = footprints[`${slot.id}:${variant.id}`]
        if (!fp) return null
        const [x, , z] = placement[slot.id].pos(variant.id)
        const rot = ((placement[slot.id].rot ?? 0) * -180) / Math.PI
        const n = number(slot.id)
        const delay = { transitionDelay: `${0.3 + i * 0.12}s` }
        if (fp.wall) {
          return (
            <g key={slot.id} className="plan__item plan__item--wall">
              <path d={`M${x - fp.wall / 2} -2.44 H${x + fp.wall / 2}`} pathLength={1} style={delay} />
              <circle cx={x + fp.wall / 2 + 0.2} cy={-2.44} r={0.13} className="plan__badge" />
              <text x={x + fp.wall / 2 + 0.2} y={-2.44} className="plan__n">
                {n}
              </text>
            </g>
          )
        }
        return (
          <g key={slot.id} className={`plan__item plan__item--${slot.id}`} transform={`translate(${x} ${z}) rotate(${rot})`}>
            {fp.parts.map((p, k) =>
              p.r ? (
                <circle key={k} cx={p.x} cy={p.z} r={p.r} pathLength={1} style={delay} />
              ) : (
                <rect key={k} x={p.x - p.w! / 2} y={p.z - p.d! / 2} width={p.w} height={p.d} rx={0.04} pathLength={1} style={delay} />
              ),
            )}
            <g transform={`rotate(${-rot})`}>
              <circle r={0.13} className="plan__badge" cy={slot.id === 'rug' ? 0.75 : 0} />
              <text className="plan__n" y={slot.id === 'rug' ? 0.75 : 0}>
                {n}
              </text>
            </g>
          </g>
        )
      })}
    </svg>
  )
}

export function Spec() {
  const r = useRoom()
  const cart = useCart()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (name.trim().length < 2) return setError('Как к вам обращаться?')
    if (phone.replace(/\D/g, '').length < 10) return setError('Проверьте номер телефона')
    setError('')
    setSent(true)
  }

  const wall = walls.find((w) => w.id === r.room.wall)
  const floor = floors.find((f) => f.id === r.room.floor)

  return (
    <section className="spec" id="spec">
      <div className="spec__sheet">
        <header className="spec__head">
          <div>
            <span className="spec__kicker">Лист {chapters.length + 1} · Спецификация</span>
            <h2>
              Проект вашей <em>гостиной</em>
            </h2>
          </div>
          <p>Всё, что вы выбрали, пока листали: план, позиции и смета. Отправьте проект дизайнеру — он проверит размеры и привезёт образцы тканей.</p>
        </header>

        {r.chosen.length === 0 ? (
          <div className="spec__empty">
            <p>Комната пока пустая — на чертеже нечего показать.</p>
            <button className="btn btn--light" onClick={() => scrollToId('walls')}>
              Вернуться к началу
            </button>
          </div>
        ) : (
          <div className="spec__grid">
            <div className="spec__planbox">
              <Plan />
              <p className="spec__finish">
                Стены — {wall?.name.toLowerCase()} · Пол — {floor?.name.toLowerCase()}
              </p>
            </div>

            <div className="spec__right">
              <table className="spec__table">
                <thead>
                  <tr>
                    <th>№</th>
                    <th>Позиция</th>
                    <th>Отделка</th>
                    <th>Габарит, см</th>
                    <th>Цена</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence initial={false}>
                    {r.chosen.map(({ slot, variant, finish }, i) => (
                      <motion.tr key={slot.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <td>{i + 1}</td>
                        <td>
                          {slot.label} <b>{variant.name}</b>
                        </td>
                        <td>
                          <i className="spec__sw" style={{ background: finish.color }} />
                          {finish.name}
                        </td>
                        <td>{footprints[`${slot.id}:${variant.id}`]?.label}</td>
                        <td>{formatPrice(variant.price)}</td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3}>Доставка, подъём и сборка</td>
                    <td />
                    <td>0 ₸</td>
                  </tr>
                  <tr className="spec__total">
                    <td colSpan={3}>Итого</td>
                    <td />
                    <td>{formatPrice(r.total)}</td>
                  </tr>
                </tfoot>
              </table>

              <AnimatePresence mode="wait">
                {sent ? (
                  <motion.div key="sent" className="spec__sent" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <b>Проект «{name.trim()}» принят</b>
                    <span>Это демо: заявка никуда не ушла. В настоящем магазине дизайнер позвонил бы в течение часа.</span>
                  </motion.div>
                ) : (
                  <motion.form key="form" className={`spec__form ${error ? 'is-error' : ''}`} onSubmit={submit} noValidate exit={{ opacity: 0 }}>
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Имя" autoComplete="name" aria-label="Имя" />
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7 ___ ___ __ __" inputMode="tel" autoComplete="tel" aria-label="Телефон" />
                    <button type="submit" className="btn btn--light">
                      Отправить дизайнеру
                    </button>
                    <button
                      type="button"
                      className="btn btn--line"
                      onClick={(e) =>
                        cart.add(
                          r.chosen.map(({ slot, variant, finish }) => ({
                            id: `${slot.id}-${variant.id}-${finish.id}`,
                            name: `${slot.label} ${variant.name}`,
                            note: `${slot.finishLabel}: ${finish.name}`,
                            price: variant.price,
                            color: finish.color,
                          })),
                          e.currentTarget,
                        )
                      }
                    >
                      Всё в корзину
                    </button>
                    {error && <span className="spec__error">{error}</span>}
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Штамп чертежа */}
        <dl className="spec__stamp">
          <div>
            <dt>Мастерская</dt>
            <dd>LUNDA, Алматы</dd>
          </div>
          <div>
            <dt>Объект</dt>
            <dd>Гостиная 6 × 5 м</dd>
          </div>
          <div>
            <dt>Дата</dt>
            <dd>{today}</dd>
          </div>
          <div>
            <dt>Лист</dt>
            <dd>
              {chapters.length + 1} / {chapters.length + 1}
            </dd>
          </div>
        </dl>
      </div>

      <footer className="spec__foot">
        <span>© 2026 LUNDA — концепт для портфолио, бренд вымышленный</span>
        <span>+7 (727) 000-00-00 · Алматы, ул. Мастеров, 12</span>
        <span>
          Фото —{' '}
          <a href="https://unsplash.com" target="_blank" rel="noreferrer">
            Unsplash
          </a>
        </span>
      </footer>
    </section>
  )
}
