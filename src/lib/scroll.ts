/**
 * Положение прокрутки в «главах»: 0 — первый экран, 1 — второй и т. д.
 * Обновляется обработчиком скролла и читается в каждом кадре 3D-сцены без лишних ререндеров React.
 */
export const scrollState = { t: 0 }

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

export function initScrollState() {
  let build = ''
  const update = () => {
    scrollState.t = window.scrollY / window.innerHeight
    // 0 → чертёж, 1 → готовая комната: от этого зависят фон и подписи чертежа.
    // Переменную трогаем, только когда значение изменилось: после второго экрана — ни разу
    const next = clamp01(scrollState.t * 1.1).toFixed(3)
    if (next === build) return
    build = next
    document.documentElement.style.setProperty('--build', next)
  }
  update()
  window.addEventListener('scroll', update, { passive: true })
  window.addEventListener('resize', update)
  return () => {
    window.removeEventListener('scroll', update)
    window.removeEventListener('resize', update)
  }
}
