import { AnimatePresence } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'
import { chapters } from './chapters'
import { CartProvider } from './components/Cart'
import { Loader } from './components/Loader'
import { TopBar } from './components/TopBar'
import { Experience } from './configurator/Scene'
import { RoomProvider, useRoom } from './configurator/store'
import { initScrollState, scrollState } from './lib/scroll'
import { initSmoothScroll } from './lib/smoothScroll'
import { Spec } from './sections/Spec'
import { Story } from './sections/Story'

export default function App() {
  return (
    <CartProvider>
      <RoomProvider>
        <Page />
      </RoomProvider>
    </CartProvider>
  )
}

const LAST = chapters.length - 1

function Page() {
  const { autofill, setNight, night } = useRoom()
  const [chapter, setChapter] = useState(0)
  // только «флажки», которые меняются редко: состояние Page не должно обновляться на каждый пиксель скролла
  const [onBlueprint, setOnBlueprint] = useState(true)
  const [covered, setCovered] = useState(false)
  const [ready, setReady] = useState(false)
  const snapRef = useRef<(() => string) | null>(null)
  const last = useRef(-1)

  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)
    initSmoothScroll()
    const stop = initScrollState()

    const onScroll = () => {
      const t = scrollState.t
      setOnBlueprint(t < 0.6)
      // смета полностью закрыла 3D-сцену — её можно не рисовать
      setCovered(t > chapters.length + 0.05)
      const ch = Math.max(0, Math.round(t))
      if (ch === last.current) return
      last.current = ch
      setChapter(ch)
      // по мере чтения в комнате появляется мебель глав, которые уже пройдены
      autofill(chapters.slice(0, Math.min(ch, LAST) + 1).flatMap((c) => c.slots))
      // глава «Свет» — вечер; в остальных главах истории — день
      if (ch < LAST) setNight(chapters[ch].id === 'evening')
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      stop()
      window.removeEventListener('scroll', onScroll)
    }
  }, [autofill, setNight])

  const snap = useCallback(() => {
    const url = snapRef.current?.()
    if (!url) return
    const a = document.createElement('a')
    a.href = url
    a.download = 'lunda-room.png'
    a.click()
  }, [])

  const onReady = useCallback(() => setReady(true), [])
  // шапка светлым по тёмному: на чертеже и вечером
  const dark = onBlueprint || (night && chapter <= LAST) || chapter > LAST

  return (
    <>
      <div className={`backdrop ${night && chapter <= LAST ? 'is-night' : ''}`} aria-hidden />
      <Experience chapter={Math.min(chapter, LAST)} active={!covered} snapRef={snapRef} onReady={onReady} />
      <TopBar chapter={chapter} dark={dark} />
      <main>
        <Story chapter={chapter} snap={snap} />
        <Spec />
      </main>
      <AnimatePresence>{!ready && <Loader />}</AnimatePresence>
    </>
  )
}
