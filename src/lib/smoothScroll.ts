import Lenis from 'lenis'

let lenis: Lenis | null = null
let rafId = 0

/**
 * Цикл кадров Lenis работает только пока идёт плавная прокрутка.
 * Постоянный requestAnimationFrame заставлял браузер 60 раз в секунду
 * прогонять конвейер отрисовки даже на неподвижной странице.
 */
function loop(time: number) {
  lenis?.raf(time)
  rafId = lenis?.isScrolling === 'smooth' ? requestAnimationFrame(loop) : 0
}

function wake() {
  if (!lenis || rafId) return
  // сбрасываем внутренние часы Lenis, чтобы после паузы первый шаг анимации не был «прыжком»
  lenis.raf(performance.now())
  rafId = requestAnimationFrame(loop)
}

export function initSmoothScroll() {
  if (lenis || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1 })
  // capture: срабатывает раньше обработчиков самого Lenis
  const opts = { capture: true, passive: true }
  ;['wheel', 'touchstart', 'touchmove', 'keydown', 'pointerdown'].forEach((type) => window.addEventListener(type, wake, opts))
  lenis.on('scroll', wake)
  wake()
}

export function setScrollLocked(locked: boolean) {
  document.documentElement.style.overflow = locked ? 'hidden' : ''
  if (locked) lenis?.stop()
  else lenis?.start()
}

export function scrollToId(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  if (lenis) {
    wake()
    lenis.scrollTo(el, { offset: id === 'top' ? 0 : -40, duration: 1.4 })
    wake()
  } else el.scrollIntoView({ behavior: 'smooth' })
}
