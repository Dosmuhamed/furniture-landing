import { RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { artPalettes } from './catalog'
import { artTexture, fabricBump, rng, rugTexture, woodGrain } from './textures'

type V3 = [number, number, number]

/* ---------- Материалы ---------- */

let bumpTex: THREE.Texture | null = null
let grainTex: THREE.Texture | null = null
const getBump = () => (bumpTex ??= fabricBump())
const getGrain = () => (grainTex ??= woodGrain())

const colorDistance = (a: THREE.Color, b: THREE.Color) => Math.abs(a.r - b.r) + Math.abs(a.g - b.g) + Math.abs(a.b - b.b)

/** Материал, цвет которого плавно перетекает к новому значению */
function useLerpMaterial(color: string, params: THREE.MeshStandardMaterialParameters) {
  // параметры задаются один раз при создании, дальше меняется только цвет
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ ...params, color }), [])
  const target = useMemo(() => new THREE.Color(color), [color])
  useEffect(() => () => mat.dispose(), [mat])
  useFrame((state, dt) => {
    if (colorDistance(mat.color, target) < 0.0005) return
    mat.color.lerp(target, 1 - Math.exp(-dt * 9))
    state.invalidate()
  })
  return mat
}

const useFabric = (color: string) => useLerpMaterial(color, { roughness: 0.92, bumpMap: getBump(), bumpScale: 2 })
const useWood = (color: string) => useLerpMaterial(color, { roughness: 0.55, map: getGrain() })
const useMetal = (color: string) => useLerpMaterial(color, { roughness: 0.32, metalness: 0.75 })

const ceramic = new THREE.MeshStandardMaterial({ color: '#efebe4', roughness: 0.35 })
const darkWood = new THREE.MeshStandardMaterial({ color: '#4a3426', roughness: 0.6 })
const marble = new THREE.MeshStandardMaterial({ color: '#f1eee8', roughness: 0.18 })
const soil = new THREE.MeshStandardMaterial({ color: '#3b2a1f', roughness: 1 })
const leafMat = new THREE.MeshStandardMaterial({ color: '#3f6b3a', roughness: 0.55, side: THREE.DoubleSide })
const oliveLeaf = new THREE.MeshStandardMaterial({ color: '#7d8a5a', roughness: 0.8, flatShading: true })
const snakeLeaf = new THREE.MeshStandardMaterial({ color: '#4d6b3c', roughness: 0.6 })
const brass = new THREE.MeshStandardMaterial({ color: '#c9a25a', roughness: 0.28, metalness: 0.9 })

/** Подушки контрастного цвета: на светлой обивке — терракота, на тёмной — молочные */
const pillowColor = (color: string) => {
  const hsl = { h: 0, s: 0, l: 0 }
  new THREE.Color(color).getHSL(hsl)
  return hsl.l > 0.45 ? '#b8653f' : '#efe7da'
}

/* ---------- Примитивы ---------- */

type BoxProps = { s: V3; p: V3; m: THREE.Material; r?: V3; rad?: number }

const Box = ({ s, p, m, r }: BoxProps) => (
  <mesh position={p} rotation={r} material={m}>
    <boxGeometry args={s} />
  </mesh>
)

const Soft = ({ s, p, m, r, rad = 0.05 }: BoxProps) => (
  <RoundedBox args={s} radius={rad} smoothness={4} position={p} rotation={r} material={m} />
)

type CylProps = { r1: number; r2?: number; h: number; p: V3; m: THREE.Material; seg?: number }

const Cyl = ({ r1, r2 = r1, h, p, m, seg = 32 }: CylProps) => (
  <mesh position={p} material={m}>
    <cylinderGeometry args={[r1, r2, h, seg]} />
  </mesh>
)

type ItemProps = { variant: string; color: string; finish: string; night?: boolean }

/* ---------- Диваны ---------- */

export function Sofa({ variant, color }: ItemProps) {
  const fabric = useFabric(color)
  const pillow = useFabric(pillowColor(color))
  const legs = useWood('#5a3e2b')

  if (variant === 'cloud') {
    return (
      <group>
        <Box s={[2.1, 0.06, 0.85]} p={[0, 0.03, 0]} m={darkWood} />
        <Soft s={[2.3, 0.28, 1]} p={[0, 0.2, 0]} m={fabric} rad={0.1} />
        {[-1, 1].map((x) => (
          <Soft key={x} s={[0.3, 0.38, 1]} p={[x * 1, 0.5, 0]} m={fabric} rad={0.14} />
        ))}
        <Soft s={[2.3, 0.52, 0.26]} p={[0, 0.58, -0.37]} m={fabric} rad={0.12} />
        {[-1, 1].map((x) => (
          <group key={x}>
            <Soft s={[0.83, 0.17, 0.74]} p={[x * 0.43, 0.42, 0.1]} m={fabric} rad={0.08} />
            <Soft s={[0.85, 0.48, 0.24]} p={[x * 0.43, 0.72, -0.2]} r={[-0.16, 0, 0]} m={fabric} rad={0.12} />
          </group>
        ))}
        <Soft s={[0.42, 0.4, 0.12]} p={[-0.5, 0.72, 0.02]} r={[-0.28, 0, 0.14]} m={pillow} rad={0.06} />
      </group>
    )
  }

  if (variant === 'corner') {
    return (
      <group>
        {(
          [
            [1.15, -0.36],
            [1.15, 0.36],
            [-1.15, -0.36],
            [-1.15, 0.98],
            [-0.4, 0.98],
          ] as const
        ).map(([x, z], i) => (
          <Cyl key={i} r1={0.03} r2={0.02} h={0.14} p={[x, 0.07, z]} m={legs} />
        ))}
        <Soft s={[2.4, 0.2, 0.92]} p={[0, 0.24, 0]} m={fabric} rad={0.04} />
        <Soft s={[0.86, 0.2, 0.72]} p={[-0.77, 0.24, 0.76]} m={fabric} rad={0.04} />
        <Soft s={[0.17, 0.32, 0.92]} p={[1.115, 0.5, 0]} m={fabric} rad={0.06} />
        <Soft s={[2.4, 0.48, 0.16]} p={[0, 0.58, -0.38]} m={fabric} rad={0.06} />
        {[0, 0.69].map((x) => (
          <Soft key={x} s={[0.67, 0.15, 0.7]} p={[x, 0.415, 0.08]} m={fabric} rad={0.06} />
        ))}
        <Soft s={[0.84, 0.15, 1.3]} p={[-0.77, 0.415, 0.47]} m={fabric} rad={0.06} />
        {[-0.77, 0, 0.69].map((x) => (
          <Soft key={x} s={[0.7, 0.4, 0.16]} p={[x, 0.66, -0.24]} r={[-0.18, 0, 0]} m={fabric} rad={0.07} />
        ))}
        <Soft s={[0.4, 0.38, 0.1]} p={[0.75, 0.7, -0.1]} r={[-0.3, 0, -0.12]} m={pillow} />
        <Soft s={[0.4, 0.38, 0.1]} p={[-0.6, 0.7, -0.1]} r={[-0.3, 0, 0.12]} m={pillow} />
      </group>
    )
  }

  // Oslo
  return (
    <group>
      {[-1, 1].flatMap((x) =>
        [-1, 1].map((z) => <Cyl key={`${x}${z}`} r1={0.03} r2={0.02} h={0.14} p={[x * 1, 0.07, z * 0.36]} m={legs} />),
      )}
      <Soft s={[2.2, 0.2, 0.92]} p={[0, 0.24, 0]} m={fabric} rad={0.04} />
      {[-1, 1].map((x) => (
        <Soft key={x} s={[0.17, 0.32, 0.92]} p={[x * 1.015, 0.5, 0]} m={fabric} rad={0.06} />
      ))}
      <Soft s={[2.2, 0.48, 0.16]} p={[0, 0.58, -0.38]} m={fabric} rad={0.06} />
      {[-0.62, 0, 0.62].map((x) => (
        <group key={x}>
          <Soft s={[0.6, 0.15, 0.7]} p={[x, 0.415, 0.08]} m={fabric} rad={0.06} />
          <Soft s={[0.6, 0.4, 0.16]} p={[x, 0.66, -0.24]} r={[-0.18, 0, 0]} m={fabric} rad={0.07} />
        </group>
      ))}
      <Soft s={[0.4, 0.38, 0.1]} p={[0.62, 0.7, -0.1]} r={[-0.3, 0, -0.12]} m={pillow} />
      <Soft s={[0.4, 0.38, 0.1]} p={[-0.62, 0.7, -0.1]} r={[-0.3, 0, 0.12]} m={pillow} />
    </group>
  )
}

/* ---------- Кресла ---------- */

export function Armchair({ variant, color }: ItemProps) {
  const fabric = useFabric(color)
  const wood = useWood('#b48658')

  if (variant === 'pebble') {
    return (
      <group>
        <Cyl r1={0.4} r2={0.36} h={0.32} p={[0, 0.2, 0]} m={fabric} seg={48} />
        <mesh position={[0, 0.36, 0]} rotation={[-Math.PI / 2, 0, 0]} material={fabric}>
          <torusGeometry args={[0.38, 0.045, 16, 64]} />
        </mesh>
        <Cyl r1={0.36} h={0.1} p={[0, 0.41, 0]} m={fabric} seg={48} />
        {/* спинка-ракушка: дуга тора, раскрытая вперёд */}
        <group position={[0, 0.56, 0]} rotation={[0, -Math.PI * 0.125, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} material={fabric}>
            <torusGeometry args={[0.33, 0.12, 20, 64, Math.PI * 1.25]} />
          </mesh>
        </group>
        <Cyl r1={0.3} h={0.04} p={[0, 0.02, 0]} m={darkWood} />
      </group>
    )
  }

  // Lounge
  return (
    <group>
      {[-1, 1].map((x) => (
        <group key={x}>
          <Box s={[0.05, 0.05, 0.76]} p={[x * 0.36, 0.58, 0.02]} m={wood} />
          <Box s={[0.05, 0.58, 0.05]} p={[x * 0.36, 0.29, 0.36]} m={wood} />
          <Box s={[0.05, 0.6, 0.05]} p={[x * 0.36, 0.3, -0.32]} r={[-0.12, 0, 0]} m={wood} />
          <Box s={[0.05, 0.05, 0.7]} p={[x * 0.36, 0.2, 0.02]} m={wood} />
        </group>
      ))}
      <Box s={[0.68, 0.04, 0.66]} p={[0, 0.22, 0.03]} m={wood} />
      <Soft s={[0.66, 0.14, 0.64]} p={[0, 0.31, 0.05]} m={fabric} />
      <Soft s={[0.64, 0.56, 0.14]} p={[0, 0.62, -0.28]} r={[-0.28, 0, 0]} m={fabric} rad={0.06} />
    </group>
  )
}

/* ---------- Журнальные столики ---------- */

function TableDecor({ y }: { y: number }) {
  const book1 = useFabric('#3e5170')
  const book2 = useFabric('#d9c7ab')
  return (
    <group position={[0, y, 0]}>
      <Cyl r1={0.05} r2={0.065} h={0.22} p={[0.18, 0.11, -0.05]} m={ceramic} />
      <Box s={[0.26, 0.035, 0.18]} p={[-0.14, 0.018, 0.06]} m={book1} />
      <Box s={[0.22, 0.03, 0.16]} p={[-0.13, 0.05, 0.06]} r={[0, 0.2, 0]} m={book2} />
    </group>
  )
}

export function CoffeeTable({ variant, color }: ItemProps) {
  const wood = useWood(color)
  const metal = useMetal(color)

  if (variant === 'plank') {
    return (
      <group>
        <Soft s={[1.15, 0.05, 0.62]} p={[0, 0.39, 0]} m={wood} rad={0.012} />
        {[-1, 1].flatMap((x) => [-1, 1].map((z) => <Box key={`${x}${z}`} s={[0.05, 0.37, 0.05]} p={[x * 0.5, 0.185, z * 0.24]} m={wood} />))}
        <Box s={[1.0, 0.025, 0.5]} p={[0, 0.12, 0]} m={wood} />
        <TableDecor y={0.415} />
      </group>
    )
  }

  if (variant === 'duo') {
    const legs = (r: number, h: number) =>
      [0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2 + 0.4
        return <Cyl key={i} r1={0.012} h={h} p={[Math.cos(a) * r, h / 2, Math.sin(a) * r]} m={metal} seg={8} />
      })
    return (
      <group>
        <group position={[-0.15, 0, -0.08]}>
          <Cyl r1={0.42} h={0.03} p={[0, 0.425, 0]} m={marble} seg={64} />
          {legs(0.3, 0.41)}
          <TableDecor y={0.44} />
        </group>
        <group position={[0.42, 0, 0.3]}>
          <Cyl r1={0.28} h={0.03} p={[0, 0.315, 0]} m={marble} seg={48} />
          {legs(0.19, 0.3)}
        </group>
      </group>
    )
  }

  // Stump
  return (
    <group>
      <Cyl r1={0.48} h={0.06} p={[0, 0.37, 0]} m={wood} seg={64} />
      <Cyl r1={0.2} r2={0.25} h={0.34} p={[0, 0.17, 0]} m={wood} seg={48} />
      <TableDecor y={0.4} />
    </group>
  )
}

/* ---------- Ковры ---------- */

export function Rug({ variant, color }: ItemProps) {
  const tex = useMemo(() => rugTexture(variant, color), [variant, color])
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, roughness: 1 }), [tex])
  useEffect(
    () => () => {
      tex.dispose()
      mat.dispose()
    },
    [tex, mat],
  )

  if (variant === 'halo') {
    return (
      <mesh position={[0, 0.006, 0]} material={mat}>
        <cylinderGeometry args={[1.25, 1.25, 0.012, 96]} />
      </mesh>
    )
  }
  const size: V3 = variant === 'lines' ? [2.8, 0.012, 1.9] : [3, 0.012, 2.1]
  return (
    <mesh position={[0, 0.006, 0]} material={mat}>
      <boxGeometry args={size} />
    </mesh>
  )
}

/* ---------- Торшеры ---------- */

/** Свет лампы плавно разгорается ночью */
function useGlow(night: boolean) {
  const shade = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#f3ebdd', roughness: 0.9, side: THREE.DoubleSide, emissive: '#ffb066', emissiveIntensity: 0 }),
    [],
  )
  const bulb = useMemo(() => new THREE.MeshStandardMaterial({ color: '#fff4e0', emissive: '#ffcf8a', emissiveIntensity: 0.2 }), [])
  useEffect(
    () => () => {
      shade.dispose()
      bulb.dispose()
    },
    [shade, bulb],
  )
  useFrame((state, dt) => {
    const k = 1 - Math.exp(-dt * 4)
    const goal = night ? 0.7 : 0
    if (Math.abs(goal - shade.emissiveIntensity) < 0.002) return
    shade.emissiveIntensity += (goal - shade.emissiveIntensity) * k
    bulb.emissiveIntensity += ((night ? 4 : 0.2) - bulb.emissiveIntensity) * k
    state.invalidate()
  })
  return { shade, bulb }
}

const arcCurve = new THREE.CubicBezierCurve3(
  new THREE.Vector3(0, 0.04, 0),
  new THREE.Vector3(0, 2.3, 0),
  new THREE.Vector3(-0.45, 2.5, 0.5),
  new THREE.Vector3(-0.85, 2.08, 0.95),
)

export function FloorLamp({ variant, color, night = false }: ItemProps) {
  const metal = useMetal(color)
  // сам источник света живёт в Lights: так число ламп в сцене не меняется и шейдеры не перекомпилируются
  const { shade, bulb } = useGlow(night)

  if (variant === 'tripod') {
    const apex = new THREE.Vector3(0, 1.3, 0)
    return (
      <group>
        {[0, 1, 2].map((i) => {
          const a = (i / 3) * Math.PI * 2 + 0.5
          const foot = new THREE.Vector3(Math.cos(a) * 0.3, 0, Math.sin(a) * 0.3)
          const dir = apex.clone().sub(foot)
          const len = dir.length()
          const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize())
          const mid = foot.clone().add(apex).multiplyScalar(0.5)
          return (
            <mesh key={i} position={mid} quaternion={q} material={metal}>
              <cylinderGeometry args={[0.014, 0.018, len, 10]} />
            </mesh>
          )
        })}
        <Cyl r1={0.012} h={0.2} p={[0, 1.38, 0]} m={metal} seg={8} />
        <mesh position={[0, 1.5, 0]} material={shade}>
          <cylinderGeometry args={[0.2, 0.26, 0.34, 48, 1, true]} />
        </mesh>
        <mesh position={[0, 1.45, 0]} material={bulb}>
          <sphereGeometry args={[0.05, 16, 16]} />
        </mesh>
      </group>
    )
  }

  // Arc
  const end = arcCurve.getPoint(1)
  return (
    <group>
      <Cyl r1={0.17} h={0.04} p={[0, 0.02, 0]} m={marble} seg={48} />
      <mesh material={metal}>
        <tubeGeometry args={[arcCurve, 64, 0.014, 8, false]} />
      </mesh>
      <group position={[end.x, end.y - 0.02, end.z]}>
        <mesh material={metal}>
          <sphereGeometry args={[0.2, 40, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
        <mesh material={shade} scale={0.97}>
          <sphereGeometry args={[0.2, 40, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
        <mesh position={[0, 0.04, 0]} material={bulb}>
          <sphereGeometry args={[0.05, 16, 16]} />
        </mesh>
      </group>
    </group>
  )
}

/* ---------- Хранение ---------- */

const bookColors = ['#7a4a2b', '#c0612f', '#5b6749', '#d9c7ab', '#3e5170', '#efe8dd', '#2c2724', '#a3876a', '#b9c2ad']
const bookMats = bookColors.map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.8 }))
const bookMat = new THREE.MeshStandardMaterial({ roughness: 0.8 })
const unitBox = new THREE.BoxGeometry(1, 1, 1)

type Book = { s: V3; p: V3; rz: number; color: string }

/** Ряды книг на полках: случайно, но одинаково при каждой загрузке */
function useBooks(shelves: number[], width: number) {
  return useMemo(() => {
    const r = rng(42)
    const books: Book[] = []
    shelves.forEach((y) => {
      let x = -width / 2 + 0.03
      const end = width / 2 - 0.25 - r() * 0.2
      while (x < end) {
        const w = 0.025 + r() * 0.035
        const h = 0.2 + r() * 0.12
        const lean = r() > 0.92 ? 0.25 : 0
        books.push({ s: [w, h, 0.2 + r() * 0.05], p: [x + w / 2, y + h / 2, 0.02], rz: -lean, color: bookColors[Math.floor(r() * bookColors.length)] })
        x += w + 0.004 + (lean ? 0.08 : 0)
      }
    })
    return books
  }, [shelves, width])
}

/** Все книги — один InstancedMesh: десятки корешков рисуются за один вызов */
function Books({ books }: { books: Book[] }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const e = new THREE.Euler()
    const c = new THREE.Color()
    books.forEach((b, i) => {
      m.compose(new THREE.Vector3(...b.p), q.setFromEuler(e.set(0, 0, b.rz)), new THREE.Vector3(...b.s))
      mesh.setMatrixAt(i, m)
      mesh.setColorAt(i, c.set(b.color))
    })
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [books])
  return <instancedMesh ref={ref} args={[unitBox, bookMat, books.length]} />
}

const gridShelves = [0.03, 0.5, 0.97, 1.44, 1.885]
const bookShelves = [0.045, 0.985]
const sideboardTop = [0.62]

export function Storage({ variant, color }: ItemProps) {
  const wood = useWood(color)
  const books = useBooks(bookShelves, 1.07)
  const lowBooks = useBooks(sideboardTop, 0.5)

  if (variant === 'low') {
    return (
      <group>
        {[-1, 1].flatMap((x) => [-1, 1].map((z) => <Cyl key={`${x}${z}`} r1={0.022} r2={0.016} h={0.12} p={[x * 0.68, 0.06, z * 0.17]} m={wood} />))}
        <Soft s={[1.5, 0.5, 0.45]} p={[0, 0.37, 0]} m={wood} rad={0.015} />
        {[-0.495, 0, 0.495].map((x) => (
          <group key={x}>
            <Box s={[0.48, 0.44, 0.012]} p={[x, 0.37, 0.229]} m={wood} />
            <Box s={[0.012, 0.12, 0.02]} p={[x + (x > 0 ? -0.2 : 0.2), 0.37, 0.24]} m={brass} />
          </group>
        ))}
        <Cyl r1={0.06} r2={0.08} h={0.34} p={[-0.48, 0.79, 0]} m={ceramic} />
        <mesh position={[-0.2, 0.68, 0.02]} material={brass}>
          <sphereGeometry args={[0.06, 24, 24]} />
        </mesh>
        <group position={[0.15, 0, 0]}>
          <Books books={lowBooks.slice(0, 7)} />
        </group>
      </group>
    )
  }

  // Grid
  return (
    <group>
      {[-1, 1].map((x) => (
        <Box key={x} s={[0.03, 1.9, 0.36]} p={[x * 0.535, 0.95, 0]} m={wood} />
      ))}
      {gridShelves.map((y) => (
        <Box key={y} s={[1.07, 0.03, 0.36]} p={[0, y, 0]} m={wood} />
      ))}
      <Books books={books} />
      <Cyl r1={0.07} r2={0.05} h={0.24} p={[-0.25, 0.575, 0]} m={ceramic} />
      <mesh position={[0.2, 0.56, 0]} material={brass}>
        <sphereGeometry args={[0.055, 24, 24]} />
      </mesh>
      <Box s={[0.3, 0.03, 0.22]} p={[0.2, 1.47, 0]} m={bookMats[4]} />
      <Box s={[0.28, 0.03, 0.2]} p={[0.2, 1.5, 0]} m={bookMats[3]} />
      <Cyl r1={0.06} r2={0.05} h={0.12} p={[-0.3, 1.515, 0]} m={ceramic} />
      <group position={[-0.3, 1.58, 0]} scale={0.35}>
        <Leaves seed={3} count={6} />
      </group>
    </group>
  )
}

/* ---------- Растения ---------- */

const leafShape = (() => {
  const s = new THREE.Shape()
  s.moveTo(0, 0)
  s.bezierCurveTo(0.26, 0.04, 0.3, 0.36, 0, 0.52)
  s.bezierCurveTo(-0.3, 0.36, -0.26, 0.04, 0, 0)
  return new THREE.ShapeGeometry(s, 12)
})()

function Leaves({ seed, count }: { seed: number; count: number }) {
  const leaves = useMemo(() => {
    const r = rng(seed)
    return Array.from({ length: count }, (_, i) => ({
      a: i * 2.4 + r() * 0.4,
      tilt: 0.25 + r() * 0.5,
      len: 0.45 + r() * 0.45,
      scale: 0.75 + r() * 0.45,
    }))
  }, [seed, count])
  return (
    <>
      {leaves.map((l, i) => (
        <group key={i} rotation={[0, l.a, 0]}>
          <group rotation={[l.tilt, 0, 0]}>
            <mesh position={[0, l.len / 2, 0]} material={leafMat}>
              <cylinderGeometry args={[0.007, 0.01, l.len, 6]} />
            </mesh>
            <mesh geometry={leafShape} position={[0, l.len, 0]} rotation={[0.5 - l.tilt, 0, 0]} scale={l.scale} material={leafMat} />
          </group>
        </group>
      ))}
    </>
  )
}

const icosa = new THREE.IcosahedronGeometry(1, 0)

/** Крона оливы одним InstancedMesh */
function Canopy({ items }: { items: { p: V3; s: number }[] }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const m = new THREE.Matrix4()
    items.forEach((c, i) => {
      mesh.setMatrixAt(i, m.makeScale(c.s, c.s, c.s).setPosition(...c.p))
    })
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [items])
  return <instancedMesh ref={ref} args={[icosa, oliveLeaf, items.length]} />
}

export function Plant({ variant, color }: ItemProps) {
  const pot = useLerpMaterial(color, { roughness: 0.8 })

  const blades = useMemo(() => {
    const r = rng(17)
    return Array.from({ length: 11 }, (_, i) => ({
      a: i * 2.2,
      off: 0.03 + r() * 0.08,
      h: 0.5 + r() * 0.45,
      tilt: (r() - 0.5) * 0.35,
    }))
  }, [])

  const canopy = useMemo(() => {
    const r = rng(23)
    return Array.from({ length: 16 }, () => ({
      p: [(r() - 0.5) * 0.7, 1.35 + (r() - 0.5) * 0.5, (r() - 0.5) * 0.7] as V3,
      s: 0.12 + r() * 0.1,
    }))
  }, [])

  if (variant === 'olive') {
    return (
      <group>
        <Cyl r1={0.23} r2={0.18} h={0.46} p={[0, 0.23, 0]} m={pot} />
        <Cyl r1={0.21} h={0.01} p={[0, 0.44, 0]} m={soil} />
        <mesh position={[0, 0.85, 0]} rotation={[0, 0, 0.06]} material={darkWood}>
          <cylinderGeometry args={[0.02, 0.035, 0.85, 8]} />
        </mesh>
        <Canopy items={canopy} />
      </group>
    )
  }

  if (variant === 'snake') {
    return (
      <group>
        <Cyl r1={0.17} r2={0.13} h={0.32} p={[0, 0.16, 0]} m={pot} />
        <Cyl r1={0.155} h={0.01} p={[0, 0.3, 0]} m={soil} />
        {blades.map((b, i) => (
          <mesh
            key={i}
            position={[Math.cos(b.a) * b.off, 0.3 + b.h / 2, Math.sin(b.a) * b.off]}
            rotation={[b.tilt, b.a, b.tilt * 0.5]}
            scale={[1, 1, 0.22]}
            material={snakeLeaf}
          >
            <coneGeometry args={[0.045, b.h, 4]} />
          </mesh>
        ))}
      </group>
    )
  }

  // Монстера
  return (
    <group>
      <Cyl r1={0.21} r2={0.16} h={0.38} p={[0, 0.19, 0]} m={pot} />
      <Cyl r1={0.19} h={0.01} p={[0, 0.36, 0]} m={soil} />
      <group position={[0, 0.36, 0]}>
        <Leaves seed={8} count={10} />
      </group>
    </group>
  )
}

/* ---------- Декор на стене ---------- */

export function WallArt({ variant, finish }: ItemProps) {
  const palette = artPalettes[finish] ?? artPalettes.warm
  const frameMat = useWood(finish === 'mono' ? '#2c2724' : '#b48658')

  const textures = useMemo(() => {
    if (variant === 'triptych') return [11, 22, 33].map((s) => artTexture(s, palette))
    if (variant === 'canvas') return [artTexture(44, palette, 800, 520)]
    return []
  }, [variant, palette])
  useEffect(() => () => textures.forEach((t) => t.dispose()), [textures])

  if (variant === 'mirror') {
    return (
      <group>
        <mesh position={[0, 0, 0.03]} material={brass}>
          <torusGeometry args={[0.46, 0.028, 16, 96]} />
        </mesh>
        <mesh position={[0, 0, 0.02]}>
          <circleGeometry args={[0.45, 64]} />
          <meshStandardMaterial color="#dfe6e8" metalness={0.35} roughness={0.08} />
        </mesh>
      </group>
    )
  }

  if (variant === 'canvas') {
    return (
      <group>
        <Box s={[1.34, 0.89, 0.035]} p={[0, 0, 0.018]} m={frameMat} />
        <mesh position={[0, 0, 0.037]}>
          <planeGeometry args={[1.28, 0.83]} />
          <meshStandardMaterial map={textures[0]} roughness={0.9} />
        </mesh>
      </group>
    )
  }

  return (
    <group>
      {[-0.54, 0, 0.54].map((x, i) => (
        <group key={x} position={[x, 0, 0]}>
          <Box s={[0.46, 0.6, 0.03]} p={[0, 0, 0.015]} m={frameMat} />
          <mesh position={[0, 0, 0.031]}>
            <planeGeometry args={[0.4, 0.54]} />
            <meshStandardMaterial map={textures[i]} roughness={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  )
}
