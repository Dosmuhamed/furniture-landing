import { Environment, Html, Lightformer } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { scrollState } from '../lib/scroll'
import { walls } from './catalog'
import { cementFloor, herringboneFloor, plankFloor, skyTexture } from './textures'

// Комната 6 × 5 м, высота 2.8 м. Задняя стена — по z = -2.5, левая — по x = -3
export const ROOM = { w: 6, d: 5, h: 2.8, t: 0.12 }
const WINDOW = { z1: -0.2, z2: 1.6, y1: 0.85, y2: 2.3 }

const floorCache = new Map<string, THREE.Texture>()
function floorTexture(id: string) {
  let tex = floorCache.get(id)
  if (!tex) {
    tex =
      id === 'walnut'
        ? plankFloor('#7e573b')
        : id === 'herringbone'
          ? herringboneFloor('#c49c70')
          : id === 'cement'
            ? cementFloor()
            : plankFloor('#d6b48a')
    floorCache.set(id, tex)
  }
  return tex
}

const leftWallGeometry = (() => {
  // Контур рисуем в плоскости (u = -z, v = y), потом поворачиваем на 90°
  const { d, h, t } = ROOM
  const shape = new THREE.Shape()
  shape.moveTo(-d / 2, 0)
  shape.lineTo(d / 2 + t, 0)
  shape.lineTo(d / 2 + t, h)
  shape.lineTo(-d / 2, h)
  shape.closePath()
  const hole = new THREE.Path()
  hole.moveTo(-WINDOW.z2, WINDOW.y1)
  hole.lineTo(-WINDOW.z1, WINDOW.y1)
  hole.lineTo(-WINDOW.z1, WINDOW.y2)
  hole.lineTo(-WINDOW.z2, WINDOW.y2)
  hole.closePath()
  shape.holes.push(hole)
  return new THREE.ExtrudeGeometry(shape, { depth: t, bevelEnabled: false })
})()

const frameMat = new THREE.MeshStandardMaterial({ color: '#f6f2ec', roughness: 0.5 })
const plinthMat = new THREE.MeshStandardMaterial({ color: '#d9cfc1', roughness: 0.9, transparent: true })
// Невидимый потолок: только отбрасывает тень, чтобы солнце светило в окно, а не поверх стен
const ceilingMat = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false, side: THREE.DoubleSide })

/* ---------- Чертёж: белые линии контуров, сетка пола и размеры ---------- */

const lineMat = new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.9 })
const gridMat = new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.18 })

const blueprintGeo = (() => {
  const { w, d, h, t } = ROOM
  const back = new THREE.EdgesGeometry(new THREE.BoxGeometry(w + t, h, t))
  const left = new THREE.EdgesGeometry(leftWallGeometry)
  const slab = new THREE.EdgesGeometry(new THREE.BoxGeometry(w + t, 0.2, d + t))
  const pts: number[] = []
  for (let x = -w / 2; x <= w / 2 + 1e-6; x += 0.5) pts.push(x, 0.003, -d / 2, x, 0.003, d / 2)
  for (let z = -d / 2; z <= d / 2 + 1e-6; z += 0.5) pts.push(-w / 2, 0.003, z, w / 2, 0.003, z)
  const grid = new THREE.BufferGeometry()
  grid.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
  return { back, left, slab, grid }
})()

const easeOut = (x: number) => 1 - Math.pow(1 - x, 3)

export function Room({ wall, floor, night, blueprint }: { wall: string; floor: string; night: boolean; blueprint: boolean }) {
  const wallColor = walls.find((w) => w.id === wall)?.color ?? walls[0].color
  // материал создаётся один раз, дальше цвет плавно подтягивается в useFrame
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const wallMat = useMemo(() => new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.95 }), [])
  const target = useMemo(() => new THREE.Color(wallColor), [wallColor])
  const floorMap = floorTexture(floor)
  const floorMat = useRef<THREE.MeshStandardMaterial>(null)
  const wallsRef = useRef<THREE.Group>(null)
  const linesRef = useRef<THREE.Group>(null)
  const build = useRef(0)
  const daySky = useMemo(() => skyTexture(false), [])
  const nightSky = useMemo(() => skyTexture(true), [])

  useFrame((state, dt) => {
    const c = wallMat.color
    if (Math.abs(c.r - target.r) + Math.abs(c.g - target.g) + Math.abs(c.b - target.b) > 0.0005) {
      c.lerp(target, 1 - Math.exp(-dt * 6))
      state.invalidate()
    }
    // «Стройка»: на первом экране — только чертёж, к концу второго стены уже стоят
    const goal = Math.min(1, Math.max(0, scrollState.t * 1.15))
    if (Math.abs(goal - build.current) < 0.0005) return
    build.current += (goal - build.current) * (1 - Math.exp(-dt * 6))
    if (Math.abs(goal - build.current) < 0.0005) build.current = goal
    // стены растут — тени надо пересчитать; пока не дошли до цели, просим следующий кадр
    state.gl.shadowMap.needsUpdate = true
    state.invalidate()
    const b = build.current
    if (wallsRef.current) {
      wallsRef.current.scale.y = Math.max(0.001, easeOut(b))
      wallsRef.current.visible = b > 0.01
    }
    if (floorMat.current) {
      floorMat.current.opacity = b
      floorMat.current.transparent = b < 0.999
    }
    plinthMat.opacity = b
    lineMat.opacity = 0.9 * (1 - b)
    gridMat.opacity = 0.18 * (1 - b)
    if (linesRef.current) linesRef.current.visible = b < 0.99
  })

  const { w, d, h, t } = ROOM
  const wz = (WINDOW.z1 + WINDOW.z2) / 2
  const wy = (WINDOW.y1 + WINDOW.y2) / 2
  const wl = WINDOW.z2 - WINDOW.z1
  const wh = WINDOW.y2 - WINDOW.y1

  return (
    <group>
      {/* Основание-«срез» диорамы */}
      <mesh position={[-t / 2, -0.1, -t / 2]} material={plinthMat} receiveShadow>
        <boxGeometry args={[w + t, 0.2, d + t]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial ref={floorMat} map={floorMap} roughness={floor === 'cement' ? 0.85 : 0.6} transparent opacity={0} />
      </mesh>

      <group ref={linesRef}>
        <lineSegments geometry={blueprintGeo.back} position={[-t / 2, h / 2, -d / 2 - t / 2]} material={lineMat} />
        <lineSegments geometry={blueprintGeo.left} position={[-w / 2 - t, 0, 0]} rotation={[0, Math.PI / 2, 0]} material={lineMat} />
        <lineSegments geometry={blueprintGeo.slab} position={[-t / 2, -0.1, -t / 2]} material={lineMat} />
        <lineSegments geometry={blueprintGeo.grid} material={gridMat} />
        {blueprint && (
          <>
            <Html position={[0, 0, d / 2 + 0.45]} center className="bp-label">
              6 000
            </Html>
            <Html position={[w / 2 + 0.5, 0, 0]} center className="bp-label">
              5 000
            </Html>
            <Html position={[-w / 2 - 0.2, h + 0.3, -d / 2]} center className="bp-label">
              h 2 800
            </Html>
            <Html position={[-w / 2 - 0.4, (WINDOW.y1 + WINDOW.y2) / 2, wz]} center className="bp-label">
              окно 1 800
            </Html>
          </>
        )}
      </group>

      {/* Стены «вырастают» из пола */}
      <group ref={wallsRef}>
        <mesh position={[-t / 2, h / 2, -d / 2 - t / 2]} material={wallMat} castShadow receiveShadow>
          <boxGeometry args={[w + t, h, t]} />
        </mesh>
        <mesh geometry={leftWallGeometry} position={[-w / 2 - t, 0, 0]} rotation={[0, Math.PI / 2, 0]} material={wallMat} castShadow receiveShadow />

        <mesh position={[0, 0.04, -d / 2 + 0.008]} material={frameMat}>
          <boxGeometry args={[w, 0.08, 0.016]} />
        </mesh>
        <mesh position={[-w / 2 + 0.008, 0.04, 0]} material={frameMat}>
          <boxGeometry args={[0.016, 0.08, d]} />
        </mesh>

        <group position={[-w / 2 - t / 2, 0, 0]}>
          <mesh position={[0, WINDOW.y2 - 0.025, wz]} material={frameMat}>
            <boxGeometry args={[t + 0.03, 0.05, wl]} />
          </mesh>
          <mesh position={[0, WINDOW.y1 + 0.025, wz]} material={frameMat}>
            <boxGeometry args={[t + 0.03, 0.05, wl]} />
          </mesh>
          {[WINDOW.z1 + 0.025, WINDOW.z2 - 0.025, wz].map((z) => (
            <mesh key={z} position={[0, wy, z]} material={frameMat}>
              <boxGeometry args={[z === wz ? 0.05 : t + 0.03, wh, z === wz ? 0.04 : 0.05]} />
            </mesh>
          ))}
          <mesh position={[0, WINDOW.y1 + wh * 0.62, wz]} material={frameMat}>
            <boxGeometry args={[0.05, 0.04, wl]} />
          </mesh>
          <mesh position={[0.17, WINDOW.y1 - 0.02, wz]} material={frameMat} castShadow>
            <boxGeometry args={[0.26, 0.04, wl + 0.16]} />
          </mesh>
          <mesh position={[-0.1, wy, wz]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[wl + 0.5, wh + 0.5]} />
            <meshBasicMaterial map={night ? nightSky : daySky} toneMapped={false} />
          </mesh>
        </group>
      </group>

      {/* Невидимые «потолок» и продолжение левой стены: свет попадает в комнату только через окно */}
      <mesh position={[0, h + 0.01, 1]} rotation={[-Math.PI / 2, 0, 0]} material={ceilingMat} castShadow>
        <planeGeometry args={[w + 4, d + 6]} />
      </mesh>
      <mesh position={[-w / 2 - t / 2, h / 2, d / 2 + 3]} rotation={[0, Math.PI / 2, 0]} material={ceilingMat} castShadow>
        <planeGeometry args={[6, h + 0.2]} />
      </mesh>
    </group>
  )
}

/** Свет: днём — солнце через окно, ночью — лунный свет и тёплые лампы */
/** Где светит лампа торшера (в координатах комнаты) для каждой модели */
const lampLightPos: Record<string, [number, number, number]> = {
  arc: [0.8, 1.98, -1.0],
  tripod: [1.65, 1.4, -1.95],
}

export function Lights({ night, lamp }: { night: boolean; lamp: string | null }) {
  const sun = useRef<THREE.DirectionalLight>(null)
  // Свет торшера есть в сцене всегда, просто выключен: если добавлять и убирать источник,
  // three.js перекомпилирует шейдеры всех материалов — это заметный рывок
  const lampLight = useRef<THREE.PointLight>(null)
  const hemi = useRef<THREE.HemisphereLight>(null)
  const fill = useRef<THREE.DirectionalLight>(null)
  const scene = useThree((s) => s.scene)
  const sunColor = useMemo(() => ({ day: new THREE.Color('#ffe9c9'), night: new THREE.Color('#7f9cff') }), [])

  useEffect(() => {
    if (sun.current) {
      sun.current.target.position.set(0, 0, 0.6)
      sun.current.target.updateMatrixWorld()
    }
  }, [])

  useFrame((state, dt) => {
    const l = lampLight.current
    const lampGoal = night && lamp ? 2.4 : 0
    if (l && Math.abs(lampGoal - l.intensity) > 0.002) {
      l.intensity += (lampGoal - l.intensity) * (1 - Math.exp(-dt * 4))
      state.invalidate()
    }
    const goalEnv = night ? 0.08 : 0.45
    if (Math.abs(goalEnv - scene.environmentIntensity) < 0.001) return
    state.invalidate()
    const k = 1 - Math.exp(-dt * 3)
    const lerp = (obj: { intensity: number } | null, to: number) => {
      if (obj) obj.intensity += (to - obj.intensity) * k
    }
    lerp(sun.current, night ? 0.9 : 3.2)
    lerp(hemi.current, night ? 0.22 : 1.05)
    lerp(fill.current, night ? 0.06 : 0.9)
    sun.current?.color.lerp(night ? sunColor.night : sunColor.day, k)
    scene.environmentIntensity += ((night ? 0.08 : 0.45) - scene.environmentIntensity) * k
  })

  return (
    <>
      <pointLight ref={lampLight} position={lampLightPos[lamp ?? 'arc'] ?? lampLightPos.arc} intensity={0} distance={7} decay={1.6} color="#ffb76e" />
      <hemisphereLight ref={hemi} args={['#fff6ea', '#9c8a74', 1.05]} />
      <directionalLight
        ref={sun}
        position={[-7, 5.2, 2.2]}
        intensity={3.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
        shadow-camera-near={1}
        shadow-camera-far={25}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
      />
      <directionalLight ref={fill} position={[6, 4, 7]} intensity={0.9} color="#fff4e8" />
      <Environment resolution={128}>
        <Lightformer intensity={1.6} position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[12, 12, 1]} />
        <Lightformer intensity={3} position={[-6, 2, 1]} rotation-y={Math.PI / 2} scale={[4, 3, 1]} color="#fff1dc" />
        <Lightformer intensity={1} position={[6, 2, 4]} rotation-y={-Math.PI / 2} scale={[6, 4, 1]} />
      </Environment>
    </>
  )
}
