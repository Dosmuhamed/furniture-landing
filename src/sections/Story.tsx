import { AnimatePresence, motion } from 'framer-motion'
import { useCart } from '../components/Cart'
import { chapters, type Chapter } from '../chapters'
import { finishOf, floors, slotById, walls, type SlotId } from '../configurator/catalog'
import { Panel } from '../configurator/Panel'
import { useRoom } from '../configurator/store'
import { formatPrice } from '../lib/format'
import { ease } from '../lib/motion'
import { scrollToId } from '../lib/smoothScroll'
import './Story.css'

/** «*слово*» → курсив с акцентом */
function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*[^*]+\*)/).map((part, i) =>
        part.startsWith('*') ? <em key={i}>{part.slice(1, -1)}</em> : <span key={i}>{part}</span>,
      )}
    </>
  )
}

export function Story({ chapter, snap }: { chapter: number; snap: () => void }) {
  return (
    <div className="story">
      <Intro />
      {chapters.slice(1, -1).map((c, i) => (
        <ChapterBlock key={c.id} chapter={c} index={i + 1} active={chapter === i + 1} />
      ))}
      <section className="chapter chapter--config" id={chapters[chapters.length - 1].id}>
        <Panel visible={chapter === chapters.length - 1} snap={snap} />
      </section>
    </div>
  )
}

function Intro() {
  const c = chapters[0]
  return (
    <section className="chapter chapter--intro" id={c.id}>
      <div className="intro">
        <motion.p className="intro__kicker" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 1 }}>
          LUNDA · мебельная мастерская, Алматы
        </motion.p>
        <h1>
          {c.title.split(/(\*[^*]+\*)/).map((part, i) => (
            <motion.span
              key={i}
              className={part.startsWith('*') ? 'is-em' : ''}
              initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ delay: 0.5 + i * 0.25, duration: 1.2, ease }}
            >
              {part.replace(/\*/g, '')}
            </motion.span>
          ))}
        </h1>
        <motion.p className="intro__text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3, duration: 1 }}>
          {c.text}
        </motion.p>
        <motion.button
          className="intro__cue"
          onClick={() => scrollToId(chapters[1].id)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.7 }}
        >
          <span className="intro__mouse">
            <i />
          </span>
          Листайте — стены начнут расти
        </motion.button>
      </div>

      {/* Штамп, как в углу архитектурного чертежа */}
      <motion.dl className="stamp" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.5, duration: 1 }}>
        <div>
          <dt>Объект</dt>
          <dd>Гостиная</dd>
        </div>
        <div>
          <dt>Площадь</dt>
          <dd>30 м²</dd>
        </div>
        <div>
          <dt>Масштаб</dt>
          <dd>1 : 50</dd>
        </div>
        <div>
          <dt>Лист</dt>
          <dd>1 / {chapters.length}</dd>
        </div>
      </motion.dl>
    </section>
  )
}

function ChapterBlock({ chapter: c, index, active }: { chapter: Chapter; index: number; active: boolean }) {
  return (
    <section className="chapter" id={c.id}>
      <motion.article
        className="card"
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ amount: 0.35 }}
        transition={{ duration: 0.9, ease }}
      >
        <header className="card__head">
          <span className="card__num">
            {String(index + 1).padStart(2, '0')} / {String(chapters.length).padStart(2, '0')}
          </span>
          <span className="card__nav">{c.nav}</span>
        </header>
        <h2>
          <Rich text={c.title} />
        </h2>
        <p className="card__text">{c.text}</p>

        {c.controls === 'room' && <RoomControls />}
        {Array.isArray(c.controls) && (
          <div className="card__controls">
            {c.controls.map((id) => (
              <SlotControls key={id} id={id} compact={c.controls!.length > 2} />
            ))}
          </div>
        )}
        {c.id === 'evening' && <DayNight />}
        {Array.isArray(c.controls) && <CardFooter ids={c.controls} />}

        {c.photo && (
          <AnimatePresence>
            {active && (
              <motion.figure
                className="polaroid"
                initial={{ opacity: 0, rotate: 14, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, rotate: index % 2 ? 5 : -4, y: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: 10, y: 20 }}
                transition={{ duration: 0.8, ease }}
              >
                <img src={c.photo.src} alt={c.photo.caption} loading="lazy" />
                <figcaption>{c.photo.caption}</figcaption>
              </motion.figure>
            )}
          </AnimatePresence>
        )}
      </motion.article>
    </section>
  )
}

function RoomControls() {
  const { room, setRoom } = useRoom()
  return (
    <div className="card__controls">
      <div className="ctl">
        <span className="ctl__label">
          Стены · <b>{walls.find((w) => w.id === room.wall)?.name}</b>
        </span>
        <div className="ctl__swatches">
          {walls.map((w) => (
            <button
              key={w.id}
              className={`sw ${room.wall === w.id ? 'is-on' : ''}`}
              style={{ background: w.color }}
              onClick={() => setRoom({ wall: w.id })}
              aria-label={w.name}
              title={w.name}
            />
          ))}
        </div>
      </div>
      <div className="ctl">
        <span className="ctl__label">Пол</span>
        <div className="ctl__chips">
          {floors.map((f) => (
            <button key={f.id} className={`chip ${room.floor === f.id ? 'is-on' : ''}`} onClick={() => setRoom({ floor: f.id })}>
              <i className={`floor-ico floor-ico--${f.id}`} />
              {f.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function SlotControls({ id, compact }: { id: SlotId; compact?: boolean }) {
  const { selection, setItem } = useRoom()
  const slot = slotById[id]
  const sel = selection[id]
  return (
    <div className="ctl">
      <span className="ctl__label">
        {slot.label}
        {!compact && (
          <>
            {' '}
            · <b>{finishOf(id, sel.finish).name}</b>
          </>
        )}
      </span>
      <div className="ctl__chips">
        {slot.variants.map((v) => (
          <button key={v.id} className={`chip ${sel.variant === v.id ? 'is-on' : ''}`} onClick={() => setItem(id, { variant: v.id })}>
            {v.name}
            {!compact && <small>{formatPrice(v.price)}</small>}
          </button>
        ))}
        <button className={`chip chip--ghost ${!sel.variant ? 'is-on' : ''}`} onClick={() => setItem(id, { variant: null })} aria-label={`Убрать: ${slot.label}`}>
          ✕
        </button>
      </div>
      {!compact && (
        <div className="ctl__swatches">
          {slot.finishes.map((f) => (
            <button
              key={f.id}
              className={`sw ${sel.finish === f.id ? 'is-on' : ''}`}
              style={{ background: f.color }}
              onClick={() => setItem(id, sel.variant ? { finish: f.id } : { finish: f.id, variant: slot.variants[0].id })}
              aria-label={f.name}
              title={f.name}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function DayNight() {
  const { night, setNight } = useRoom()
  return (
    <button className={`daynight ${night ? 'is-night' : ''}`} onClick={() => setNight(!night)}>
      <span className="daynight__track">
        <span className="daynight__knob" />
      </span>
      {night ? 'Вечер — включить день' : 'День — включить вечер'}
    </button>
  )
}

function CardFooter({ ids }: { ids: SlotId[] }) {
  const { chosen } = useRoom()
  const cart = useCart()
  const items = chosen.filter((x) => ids.includes(x.slot.id))
  const sum = items.reduce((s, x) => s + x.variant.price, 0)
  return (
    <footer className="card__foot">
      <div>
        <small>{items.length ? items.map((x) => `${x.slot.label} ${x.variant.name}`).join(' + ') : 'Ничего не выбрано'}</small>
        <b>{formatPrice(sum)}</b>
      </div>
      <button
        className="btn btn--dark"
        disabled={!items.length}
        onClick={(e) =>
          cart.add(
            items.map(({ slot, variant, finish }) => ({
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
        В корзину
      </button>
    </footer>
  )
}
