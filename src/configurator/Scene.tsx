import { Html, OrbitControls } from '@react-three/drei'
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useRef, useState, type ComponentType, type ReactNode, type RefObject } from 'react'
import * as THREE from 'three'
import { chapters, chapterOfSlot } from '../chapters'
import { formatPrice } from '../lib/format'
import { scrollState } from '../lib/scroll'
import { scrollToId } from '../lib/smoothScroll'
import { finishOf, footprints, placement, slotById, slots, variantOf, type SlotId } from './catalog'
import { Armchair, CoffeeTable, FloorLamp, Plant, Rug, Sofa, Storage, WallArt } from './Furniture'
import { Lights, Room } from './Room'
import { useRoom } from './store'

type ItemComponent = ComponentType<{ variant: string; color: string; finish: string; night?: boolean }>

const components: Record<SlotId, ItemComponent> = {
  rug: Rug,
  sofa: Sofa,
  armchair: Armchair,
  table: CoffeeTable,
  lamp: FloorLamp,
  storage: Storage,
  plant: Plant,
  art: WallArt,
}

/** Номер главы-конструктора: здесь камеру можно крутить самому */
export const CONFIG_CHAPTER = chapters.length - 1

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)

/**
 * Ракурсы камеры по главам: точка, куда смотрим, и смещение камеры от неё.
 * dx — сдвиг картинки вправо (доля ширины) на десктопе, чтобы освободить место под текст.
 */
const KEYS = [
  { target: V(0, 0.4, -0.3), offset: V(8.4, 11.2, 11), dx: 0.2 },
  { target: V(0, 1.0, -0.5), offset: V(7.6, 5.4, 8), dx: 0.18 },
  { target: V(0.2, 0.6, -1.9), offset: V(2.8, 2.0, 4.8), dx: 0.2 },
  { target: V(-0.8, 0.5, -0.5), offset: V(3.9, 2.7, 4.3), dx: 0.2 },
  { target: V(0.9, 1.0, -1.4), offset: V(-3.3, 1.1, 4.7), dx: 0.2 },
  { target: V(0, 0, -0.15), offset: V(0, 11.5, 0.25), dx: 0.18 },
  { target: V(-1.4, 1.0, -1.3), offset: V(5.0, 2.4, 4.8), dx: 0.2 },
  { target: V(0, 0.8, -0.5), offset: V(6.6, 4.4, 6.9).normalize().multiplyScalar(10.5), dx: 0 },
]

const easeOutBack = (t: number) => 1 + 2.4 * Math.pow(t - 1, 3) + 1.4 * Math.pow(t - 1, 2)
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
const smooth = (x: number) => x * x * (3 - 2 * x)

/** Предмет «падает» сверху с лёгким пружинящим отскоком */
function Appear({ children, lifted }: { children: ReactNode; lifted: boolean }) {
  const ref = useRef<THREE.Group>(null)
  const t = useRef(0)
  const lift = useRef(0)

  useLayoutEffect(() => {
    ref.current?.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        o.castShadow = true
        o.receiveShadow = true
      }
    })
  })

  useFrame((state, dt) => {
    const g = ref.current
    if (!g) return
    const liftGoal = lifted ? 0.05 : 0
    // анимация закончилась — кадры и пересчёт теней больше не нужны
    if (t.current >= 1 && Math.abs(liftGoal - lift.current) < 0.0005) return
    t.current = Math.min(1, t.current + dt / 0.8)
    lift.current += (liftGoal - lift.current) * (1 - Math.exp(-dt * 12))
    const s = Math.max(0.001, easeOutBack(t.current))
    g.scale.set(s, s, s)
    g.position.y = (1 - easeOutCubic(t.current)) * 0.9 + lift.current
    state.gl.shadowMap.needsUpdate = true
    state.invalidate()
  })

  return (
    <group ref={ref} scale={0.001}>
      {children}
    </group>
  )
}

type V3 = [number, number, number]

const hitMat = new THREE.MeshBasicMaterial({ visible: false })

type HitBox = { size: V3; center: V3 }

/** Габаритные коробки частей предмета по его плану — для наведения и кликов */
function hitBoxes(id: SlotId, variant: string): HitBox[] {
  const fp = footprints[`${id}:${variant}`]
  if (!fp || fp.wall) return [{ size: [fp?.wall ?? 1, 0.9, 0.12], center: [0, 0, 0.06] }]
  // дуговой торшер: отдельно стойка и плафон, чтобы не перекрывать диван под дугой
  if (id === 'lamp' && variant === 'arc') {
    return [
      { size: [0.34, 2.3, 0.34], center: [0, 1.15, 0] },
      { size: [0.45, 0.4, 0.45], center: [-0.85, 1.95, 0.95] },
    ]
  }
  const h = id === 'rug' ? 0.03 : slotById[id].labelY * 0.85
  return fp.parts.map((p) => ({
    size: [p.r ? p.r * 2 : p.w!, h, p.r ? p.r * 2 : p.d!],
    center: [p.x, h / 2, p.z],
  }))
}

const PLAN_CHAPTER = chapters.findIndex((c) => c.id === 'plan')

type ItemsProps = {
  chapter: number
  configMode: boolean
  hovered: SlotId | null
  setHovered: (id: SlotId | null) => void
}

function Items({ chapter, configMode, hovered, setHovered }: ItemsProps) {
  const { selection, night, setTab } = useRoom()
  const planView = chapter === PLAN_CHAPTER
  // подписи габаритов держим в DOM только рядом с главой «План»
  const planLabels = Math.abs(chapter - PLAN_CHAPTER) <= 1

  return (
    <>
      {slots.map(({ id }) => {
        const { variant, finish } = selection[id]
        if (!variant) return null
        const C = components[id]
        const { pos, rot = 0 } = placement[id]
        const f = finishOf(id, finish)
        const v = variantOf(id, variant)
        const hits = hitBoxes(id, variant)
        return (
          <group key={id} position={pos(variant)} rotation={[0, rot, 0]}>
            {/* Невидимые коробки: луч мыши проверяет их, а не сотни деталей мебели */}
            {hits.map((hit, n) => (
              <mesh
                key={n}
                position={hit.center}
                material={hitMat}
                onPointerOver={(e: ThreeEvent<PointerEvent>) => {
                  e.stopPropagation()
                  setHovered(id)
                }}
                onPointerOut={() => setHovered(null)}
                onClick={(e: ThreeEvent<MouseEvent>) => {
                  e.stopPropagation()
                  if (e.delta > 5) return
                  // в конструкторе открываем настройки предмета, в истории — его главу
                  if (configMode) setTab(id)
                  else scrollToId(chapters[chapterOfSlot[id]].id)
                }}
              >
                <boxGeometry args={hit.size} />
              </mesh>
            ))}
            <Appear key={variant} lifted={hovered === id}>
              <C variant={variant} color={f.color} finish={f.id} night={night} />
            </Appear>
            {hovered === id && v && !planView && (
              <Html position={[0, slotById[id].labelY, 0]} center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
                <div className="tip3d">
                  <b>
                    {slotById[id].label} {v.name}
                  </b>
                  <span>{formatPrice(v.price)}</span>
                </div>
              </Html>
            )}
            {/* Вид сверху: подписи с габаритами */}
            {planLabels && id !== 'art' && (
              <Html position={[0, 0.05, 0]} center zIndexRange={[15, 0]} style={{ pointerEvents: 'none' }}>
                <div className={`plan-label plan-label--${id} ${planView ? 'is-on' : ''}`}>
                  <b>{v?.name}</b>
                  <span>{footprints[`${id}:${variant}`]?.label}</span>
                </div>
              </Html>
            )}
          </group>
        )
      })}
    </>
  )
}

/** Камера летит по ракурсам глав; в последней главе управление переходит к пользователю */
function CameraRig({ configMode }: { configMode: boolean }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const size = useThree((s) => s.size)
  const pos = useRef(V(14, 16, 18))
  const target = useRef(V(0, 0.4, -0.3))
  const shift = useRef({ x: 0, y: 0 })
  const tmp = useRef({ p: V(0, 0, 0), t: V(0, 0, 0), a: V(0, 0, 0), b: V(0, 0, 0) })
  // true, когда пользователь сам начал крутить комнату в конструкторе
  const userControl = useRef(false)

  useEffect(() => {
    if (!configMode) userControl.current = false
  }, [configMode])

  useEffect(() => {
    camera.fov = 32
    camera.updateProjectionMatrix()
  }, [camera])

  // кадры рисуются по требованию: прокрутка — повод перерисовать сцену
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => {
    window.addEventListener('scroll', invalidate as () => void, { passive: true })
    return () => window.removeEventListener('scroll', invalidate as () => void)
  }, [invalidate])

  useFrame((state, dt) => {
    const { width: W, height: H } = size
    const desktop = W >= 900
    // на узких экранах отодвигаем камеру, чтобы комната помещалась
    const k = Math.max(1, Math.pow(1.45 / (W / H), 0.75))

    const t = Math.min(Math.max(scrollState.t, 0), KEYS.length - 1)
    const i = Math.min(Math.floor(t), KEYS.length - 2)
    // камера «замирает» у каждой главы и перелетает между ними
    const f = smooth(Math.min(1, Math.max(0, (t - i - 0.2) / 0.6)))
    const A = KEYS[i]
    const B = KEYS[i + 1]
    const { p, t: tg, a, b } = tmp.current
    tg.lerpVectors(A.target, B.target, f)
    a.copy(A.offset).multiplyScalar(k)
    b.copy(B.offset).multiplyScalar(k)
    p.copy(tg).add(a.lerp(b, f))

    // сдвиг картинки: на десктопе — вбок под текст, на телефоне — вверх над карточкой
    const dxOf = (n: number) => (desktop ? (n === CONFIG_CHAPTER ? -210 / W : KEYS[n].dx) : 0)
    const dyOf = (n: number) => (desktop ? 0 : n === 0 ? 0.26 : n === CONFIG_CHAPTER ? -0.22 : -0.2)
    const goalX = THREE.MathUtils.lerp(dxOf(i), dxOf(i + 1), f)
    const goalY = THREE.MathUtils.lerp(dyOf(i), dyOf(i + 1), f)

    const damp = 1 - Math.exp(-dt * 3.2)
    shift.current.x += (goalX - shift.current.x) * damp
    shift.current.y += (goalY - shift.current.y) * damp
    camera.setViewOffset(W, H, -shift.current.x * W, -shift.current.y * H, W, H)

    const shifting = Math.abs(goalX - shift.current.x) + Math.abs(goalY - shift.current.y) > 0.0002

    if (configMode && userControl.current) {
      // крутит пользователь; запоминаем позицию, чтобы потом плавно продолжить полёт отсюда
      pos.current.copy(camera.position)
      target.current.copy(KEYS[CONFIG_CHAPTER].target)
      if (shifting) state.invalidate()
      return
    }
    pos.current.lerp(p, damp)
    target.current.lerp(tg, damp)
    camera.position.copy(pos.current)
    camera.lookAt(target.current)
    // камера ещё летит — нужен следующий кадр; долетела — сцена замирает и не тратит ресурсы
    if (shifting || pos.current.distanceToSquared(p) > 1e-6 || target.current.distanceToSquared(tg) > 1e-6) state.invalidate()
  })

  return configMode ? (
    <OrbitControls
      makeDefault
      onStart={() => {
        userControl.current = true
      }}
      target={KEYS[CONFIG_CHAPTER].target}
      enablePan={false}
      enableZoom={false}
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.6}
      minAzimuthAngle={0.08}
      maxAzimuthAngle={1.45}
      minPolarAngle={0.65}
      maxPolarAngle={1.32}
    />
  ) : null
}

/** Любое изменение комнаты — повод нарисовать новый кадр и пересчитать тени */
function Kick({ deps }: { deps: unknown[] }) {
  const { invalidate, gl } = useThree()
  useEffect(() => {
    gl.shadowMap.needsUpdate = true
    invalidate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return null
}

function Snapper({ snapRef }: { snapRef: RefObject<(() => string) | null> }) {
  const { gl, scene, camera } = useThree()
  useEffect(() => {
    snapRef.current = () => {
      gl.render(scene, camera)
      return gl.domElement.toDataURL('image/png')
    }
  }, [gl, scene, camera, snapRef])
  return null
}

type ExperienceProps = {
  chapter: number
  active: boolean
  snapRef: RefObject<(() => string) | null>
  onReady: () => void
}

/** Полноэкранная 3D-комната за всем содержимым страницы */
export function Experience({ chapter, active, snapRef, onReady }: ExperienceProps) {
  const { room, night, selection } = useRoom()
  // наведение хранится здесь, а не в общем состоянии: иначе каждое движение мыши перерисовывало бы всю страницу
  const [hovered, setHovered] = useState<SlotId | null>(null)
  const configMode = chapter >= CONFIG_CHAPTER
  const [dprMax] = useState(() => (window.matchMedia('(max-width: 899px)').matches ? 1.5 : 1.75))

  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : ''
  }, [hovered])

  return (
    <div className={`experience ${configMode ? 'is-config' : ''}`}>
      <Canvas
        shadows
        dpr={[1, dprMax]}
        frameloop={active ? 'demand' : 'never'}
        camera={{ position: [14, 16, 18], fov: 32, near: 0.1, far: 80 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.NeutralToneMapping
          gl.toneMappingExposure = 1.05
          // тени пересчитываем вручную, только когда мебель двигается (см. Appear, Room)
          gl.shadowMap.autoUpdate = false
          gl.shadowMap.needsUpdate = true
          onReady()
        }}
        onPointerMissed={() => setHovered(null)}
      >
        <Lights night={night} lamp={selection.lamp.variant} />
        <Room wall={room.wall} floor={room.floor} night={night} blueprint={chapter <= 1} />
        <Items chapter={chapter} configMode={configMode} hovered={hovered} setHovered={setHovered} />
        <Kick deps={[selection, room, night, hovered, chapter, active]} />
        <CameraRig configMode={configMode} />
        <Snapper snapRef={snapRef} />
      </Canvas>
    </div>
  )
}
