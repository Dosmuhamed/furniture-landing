import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { chapters } from '../chapters'
import { useRoom } from '../configurator/store'
import { formatPrice } from '../lib/format'
import { scrollToId } from '../lib/smoothScroll'
import { useCart } from './Cart'
import './TopBar.css'

/** Шапка: логотип, главы-сегменты, смета комнаты и корзина */
export function TopBar({ chapter, dark }: { chapter: number; dark: boolean }) {
  const cart = useCart()
  const { total, chosen } = useRoom()
  // прогресс по главам живёт только в шапке: скролл перерисовывает её, а не всю страницу
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    // считаем сами, а не из scrollState: этот обработчик может сработать раньше, чем тот обновится
    const update = () => setProgress(Math.round((window.scrollY / window.innerHeight) * 20) / 20)
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  return (
    <header className={`top ${dark ? 'is-dark' : ''}`}>
      <a
        href="#intro"
        className="top__logo"
        onClick={(e) => {
          e.preventDefault()
          scrollToId('intro')
        }}
      >
        <svg viewBox="0 0 64 64" aria-hidden>
          <path d="M18 54V30a14 14 0 0 1 28 0v24" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
          <circle cx="32" cy="42" r="4.5" fill="var(--accent)" />
        </svg>
        LUNDA
      </a>

      <nav className="top__chapters" aria-label="Главы">
        <span className="top__current">
          <b>{String(Math.min(chapter, chapters.length) + 1).padStart(2, '0')}</b>
          {chapter < chapters.length ? chapters[chapter].nav : 'Смета'}
        </span>
        <div className="top__segments">
          {chapters.map((c, i) => (
            <button key={c.id} onClick={() => scrollToId(c.id)} aria-label={c.nav} data-label={c.nav}>
              <i style={{ transform: `scaleX(${Math.min(1, Math.max(0, progress - i + 0.5))})` }} />
            </button>
          ))}
        </div>
      </nav>

      <button className="top__sum" onClick={() => scrollToId('spec')} title="Открыть смету">
        <small>Смета · {chosen.length}</small>
        <b>{formatPrice(total)}</b>
      </button>

      <button id="cart-button" className="top__cart" onClick={cart.open} aria-label={`Корзина, товаров: ${cart.count}`}>
        <svg viewBox="0 0 24 24" aria-hidden>
          <path d="M5 8h14l-1.2 11.1a2 2 0 0 1-2 1.9H8.2a2 2 0 0 1-2-1.9L5 8Z" />
          <path d="M9 10V6a3 3 0 0 1 6 0v4" />
        </svg>
        <motion.span
          key={cart.bump}
          initial={{ scale: cart.bump ? 1.8 : 1 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 15 }}
        >
          {cart.count}
        </motion.span>
      </button>
    </header>
  )
}
