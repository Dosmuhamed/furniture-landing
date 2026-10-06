import { AnimatePresence, motion } from 'framer-motion'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { formatPrice } from '../lib/format'
import { setScrollLocked } from '../lib/smoothScroll'
import './Cart.css'

export type CartItem = {
  id: string
  name: string
  note: string
  price: number
  img?: string
  /** Цвет кружка-превью, если нет фото (позиции из конструктора) */
  color?: string
  qty: number
}

type Flyer = { key: number; from: DOMRect; to: DOMRect; img?: string; color?: string }

type CartApi = {
  items: CartItem[]
  count: number
  total: number
  bump: number
  add: (items: Omit<CartItem, 'qty'>[], from?: HTMLElement | null) => void
  remove: (id: string) => void
  open: () => void
}

const CartContext = createContext<CartApi | null>(null)

// eslint-disable-next-line react/only-export-components
export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart вне CartProvider')
  return ctx
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [flyers, setFlyers] = useState<Flyer[]>([])
  const [bump, setBump] = useState(0)
  const [drawer, setDrawer] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<number>(0)
  const flyKey = useRef(0)

  const add = useCallback<CartApi['add']>((newItems, from) => {
    if (!newItems.length) return
    setItems((prev) => {
      let next = prev
      newItems.forEach((item) => {
        next = next.some((i) => i.id === item.id)
          ? next.map((i) => (i.id === item.id ? { ...i, qty: i.qty + 1 } : i))
          : [...next, { ...item, qty: 1 }]
      })
      return next
    })

    // «Летящая» миниатюра от кнопки до иконки корзины
    const target = document.getElementById('cart-button')
    if (from && target) {
      const fromRect = from.getBoundingClientRect()
      const toRect = target.getBoundingClientRect()
      const key = ++flyKey.current
      setFlyers((f) => [...f, { key, from: fromRect, to: toRect, img: newItems[0].img, color: newItems[0].color }])
    } else {
      setBump((b) => b + 1)
    }

    setToast(newItems.length > 1 ? `Добавлено позиций: ${newItems.length}` : `«${newItems[0].name}» в корзине`)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 2600)
  }, [])

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }, [])

  const landed = (key: number) => {
    setFlyers((f) => f.filter((x) => x.key !== key))
    setBump((b) => b + 1)
  }

  useEffect(() => {
    setScrollLocked(drawer)
  }, [drawer])

  const api = useMemo<CartApi>(() => {
    const count = items.reduce((s, i) => s + i.qty, 0)
    const total = items.reduce((s, i) => s + i.qty * i.price, 0)
    return { items, count, total, bump, add, remove, open: () => setDrawer(true) }
  }, [items, bump, add, remove])

  return (
    <CartContext.Provider value={api}>
      {children}

      {flyers.map((f) => {
        const size = 56
        const sx = f.from.left + f.from.width / 2 - size / 2
        const sy = f.from.top + f.from.height / 2 - size / 2
        const tx = f.to.left + f.to.width / 2 - size / 2
        const ty = f.to.top + f.to.height / 2 - size / 2
        return (
          <motion.div
            key={f.key}
            className="flyer"
            style={{ backgroundImage: f.img ? `url(${f.img})` : undefined, backgroundColor: f.color }}
            initial={{ x: sx, y: sy, scale: 1, opacity: 1 }}
            // дуга: сначала вверх, потом в корзину
            animate={{
              x: [sx, (sx + tx) / 2, tx],
              y: [sy, Math.min(sy, ty) - 120, ty],
              scale: [1, 1.15, 0.3],
              opacity: [1, 1, 0.6],
            }}
            transition={{ duration: 0.85, ease: [0.5, 0, 0.3, 1] }}
            onAnimationComplete={() => landed(f.key)}
          />
        )
      })}

      <AnimatePresence>
        {toast && (
          <motion.div
            className="toast"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="toast__dot" />
            {toast}
            <button onClick={() => setDrawer(true)}>Открыть</button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {drawer && <CartDrawer api={api} onClose={() => setDrawer(false)} />}
      </AnimatePresence>
    </CartContext.Provider>
  )
}

function CartDrawer({ api, onClose }: { api: CartApi; onClose: () => void }) {
  const [ordered, setOrdered] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <>
      <motion.div className="drawer-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.aside
        className="drawer"
        role="dialog"
        aria-label="Корзина"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
        data-lenis-prevent
      >
        <header className="drawer__head">
          <h3>Корзина</h3>
          <button className="drawer__close" onClick={onClose} aria-label="Закрыть">
            <svg viewBox="0 0 24 24">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </header>

        {ordered ? (
          <div className="drawer__empty">
            <p className="drawer__big">Спасибо!</p>
            <p>Это демо-витрина, поэтому заказ никуда не ушёл. Но менеджер бы уже набирал вам 🙂</p>
          </div>
        ) : api.items.length === 0 ? (
          <div className="drawer__empty">
            <p className="drawer__big">Пока пусто</p>
            <p>Добавьте что-нибудь из каталога или соберите комнату в конструкторе.</p>
          </div>
        ) : (
          <>
            <ul className="drawer__list">
              <AnimatePresence initial={false}>
                {api.items.map((item) => (
                  <motion.li
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 40, height: 0, paddingTop: 0, paddingBottom: 0 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <div
                      className="drawer__thumb"
                      style={{ backgroundImage: item.img ? `url(${item.img})` : undefined, backgroundColor: item.color }}
                    />
                    <div className="drawer__info">
                      <b>{item.name}</b>
                      <small>{item.note}</small>
                      <span>
                        {item.qty > 1 && `${item.qty} × `}
                        {formatPrice(item.price)}
                      </span>
                    </div>
                    <button className="drawer__remove" onClick={() => api.remove(item.id)} aria-label={`Удалить ${item.name}`}>
                      <svg viewBox="0 0 24 24">
                        <path d="M6 6l12 12M18 6 6 18" />
                      </svg>
                    </button>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
            <footer className="drawer__foot">
              <div className="drawer__total">
                <span>Итого</span>
                <b>{formatPrice(api.total)}</b>
              </div>
              <button className="btn btn--dark" onClick={() => setOrdered(true)}>
                Оформить заказ
              </button>
            </footer>
          </>
        )}
      </motion.aside>
    </>
  )
}
