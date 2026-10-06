import * as THREE from 'three'

/** Детерминированный генератор случайных чисел: текстуры одинаковы при каждой загрузке */
export function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function canvas(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return [c, c.getContext('2d')!] as const
}

function toTexture(c: HTMLCanvasElement, srgb = true) {
  const tex = new THREE.CanvasTexture(c)
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  tex.needsUpdate = true
  return tex
}

const shade = (hex: string, amount: number) => {
  const c = new THREE.Color(hex)
  const hsl = { h: 0, s: 0, l: 0 }
  c.getHSL(hsl)
  c.setHSL(hsl.h, hsl.s, Math.min(1, Math.max(0, hsl.l + amount)))
  return `#${c.getHexString()}`
}

/** Тонкие волокна дерева поверх прямоугольника */
function grain(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, base: string, r: () => number) {
  ctx.fillStyle = shade(base, (r() - 0.5) * 0.08)
  ctx.fillRect(x, y, w, h)
  const lines = Math.max(4, Math.round(h / 3))
  for (let i = 0; i < lines; i++) {
    ctx.strokeStyle = shade(base, -0.04 - r() * 0.08)
    ctx.globalAlpha = 0.15 + r() * 0.25
    ctx.lineWidth = 0.6 + r() * 1.2
    ctx.beginPath()
    const yy = y + r() * h
    ctx.moveTo(x, yy)
    const amp = r() * 3
    for (let xx = x; xx <= x + w; xx += 24) ctx.lineTo(xx, yy + Math.sin(xx * 0.02 + i) * amp)
    ctx.stroke()
  }
  ctx.globalAlpha = 1
}

/** Паркетная доска на весь пол 6×5 м */
export function plankFloor(base: string) {
  const [c, ctx] = canvas(2048, 1708)
  const r = rng(7)
  const plankH = 62 // ~18 см
  for (let y = 0; y < c.height; y += plankH) {
    let x = -r() * 600
    while (x < c.width) {
      const len = 500 + r() * 500
      grain(ctx, x, y, len, plankH, base, r)
      ctx.fillStyle = 'rgba(40,25,10,0.35)'
      ctx.fillRect(x, y, 2, plankH)
      x += len
    }
    ctx.fillStyle = 'rgba(40,25,10,0.3)'
    ctx.fillRect(0, y, c.width, 2)
  }
  return toTexture(c)
}

/** Паркет «ёлочкой» */
export function herringboneFloor(base: string) {
  const [c, ctx] = canvas(2048, 1708)
  const r = rng(11)
  const L = 200
  const W = 50
  ctx.fillStyle = base
  ctx.fillRect(0, 0, c.width, c.height)
  for (let col = -2; col < c.width / (W * 2) + 2; col++) {
    for (let row = -6; row < c.height / W + 6; row++) {
      const cx = col * L * Math.SQRT1_2 * 2
      const cy = row * W * Math.SQRT2
      for (const dir of [1, -1]) {
        ctx.save()
        ctx.translate(cx + (dir === 1 ? 0 : L * Math.SQRT1_2), cy)
        ctx.rotate((dir * Math.PI) / 4)
        grain(ctx, 0, 0, L, W, base, r)
        ctx.strokeStyle = 'rgba(40,25,10,0.35)'
        ctx.lineWidth = 2
        ctx.strokeRect(0, 0, L, W)
        ctx.restore()
      }
    }
  }
  return toTexture(c)
}

/** Микроцемент: мягкие пятна и мелкий шум */
export function cementFloor() {
  const [c, ctx] = canvas(1024, 854)
  const r = rng(3)
  ctx.fillStyle = '#cfc9bf'
  ctx.fillRect(0, 0, c.width, c.height)
  for (let i = 0; i < 200; i++) {
    const x = r() * c.width
    const y = r() * c.height
    const rad = 20 + r() * 120
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad)
    const light = r() > 0.5
    g.addColorStop(0, light ? 'rgba(255,255,255,0.07)' : 'rgba(80,70,60,0.05)')
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2)
  }
  noise(ctx, c.width, c.height, 18, r)
  return toTexture(c)
}

function noise(ctx: CanvasRenderingContext2D, w: number, h: number, strength: number, r: () => number) {
  const img = ctx.getImageData(0, 0, w, h)
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (r() - 0.5) * strength
    img.data[i] += n
    img.data[i + 1] += n
    img.data[i + 2] += n
  }
  ctx.putImageData(img, 0, 0)
}

/** Серый шум для рельефа ткани */
export function fabricBump() {
  const [c, ctx] = canvas(256, 256)
  const r = rng(5)
  ctx.fillStyle = '#808080'
  ctx.fillRect(0, 0, 256, 256)
  for (let i = 0; i < 2600; i++) {
    ctx.fillStyle = r() > 0.5 ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)'
    ctx.beginPath()
    ctx.arc(r() * 256, r() * 256, 0.6 + r() * 1.6, 0, Math.PI * 2)
    ctx.fill()
  }
  const tex = toTexture(c, false)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(6, 6)
  return tex
}

/** Светлая текстура волокон: окрашивается цветом материала */
export function woodGrain() {
  const [c, ctx] = canvas(512, 512)
  const r = rng(9)
  ctx.fillStyle = '#f2f2f2'
  ctx.fillRect(0, 0, 512, 512)
  for (let i = 0; i < 90; i++) {
    ctx.strokeStyle = `rgba(90,70,50,${0.05 + r() * 0.12})`
    ctx.lineWidth = 0.5 + r() * 2.5
    ctx.beginPath()
    const y = r() * 512
    ctx.moveTo(0, y)
    for (let x = 0; x <= 512; x += 16) ctx.lineTo(x, y + Math.sin(x * 0.012 + i) * 6 + Math.sin(x * 0.05) * 1.5)
    ctx.stroke()
  }
  const tex = toTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  return tex
}

/** Узоры ковров */
export function rugTexture(kind: string, base: string) {
  const [c, ctx] = canvas(1024, 1024)
  const r = rng(kind.length * 13)
  const light = shade(base, 0.16)
  const dark = shade(base, -0.2)
  ctx.fillStyle = base
  ctx.fillRect(0, 0, 1024, 1024)

  if (kind === 'berber') {
    ctx.strokeStyle = dark
    ctx.lineWidth = 7
    const step = 128
    for (let x = -step; x < 1024 + step; x += step) {
      for (let y = 0; y < 1024 + step; y += step) {
        ctx.beginPath()
        ctx.moveTo(x, y - step / 2)
        ctx.lineTo(x + step / 2, y)
        ctx.lineTo(x, y + step / 2)
        ctx.lineTo(x - step / 2, y)
        ctx.closePath()
        ctx.stroke()
      }
    }
    ctx.strokeStyle = light
    ctx.lineWidth = 26
    ctx.strokeRect(30, 30, 964, 964)
  } else if (kind === 'halo') {
    for (let i = 0; i < 9; i++) {
      ctx.strokeStyle = i % 2 ? light : dark
      ctx.lineWidth = i % 3 === 0 ? 18 : 6
      ctx.beginPath()
      ctx.arc(512, 512, 120 + i * 46, 0, Math.PI * 2)
      ctx.stroke()
    }
  } else {
    for (let y = 0; y < 1024; y += 64) {
      ctx.fillStyle = (y / 64) % 3 === 0 ? dark : (y / 64) % 3 === 1 ? light : base
      ctx.fillRect(0, y, 1024, y % 128 === 0 ? 36 : 14)
    }
  }
  // ворс
  for (let i = 0; i < 9000; i++) {
    ctx.fillStyle = r() > 0.5 ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'
    ctx.fillRect(r() * 1024, r() * 1024, 2, 2)
  }
  return toTexture(c)
}

/** Абстрактные картины для рам */
export function artTexture(seed: number, palette: string[], w = 512, h = 680) {
  const [c, ctx] = canvas(w, h)
  const r = rng(seed)
  ctx.fillStyle = palette[3]
  ctx.fillRect(0, 0, w, h)
  const pick = () => palette[Math.floor(r() * palette.length)]
  const shapes = 3 + Math.floor(r() * 3)
  for (let i = 0; i < shapes; i++) {
    ctx.fillStyle = pick()
    const kind = Math.floor(r() * 3)
    const x = r() * w
    const y = r() * h
    const s = (0.25 + r() * 0.45) * Math.min(w, h)
    ctx.beginPath()
    if (kind === 0) {
      ctx.arc(x, y, s / 2, 0, Math.PI * 2)
    } else if (kind === 1) {
      // арка
      ctx.moveTo(x - s / 2, h)
      ctx.lineTo(x - s / 2, y)
      ctx.arc(x, y, s / 2, Math.PI, 0)
      ctx.lineTo(x + s / 2, h)
    } else {
      ctx.ellipse(x, y, s / 2, s / 4, r() * Math.PI, 0, Math.PI * 2)
    }
    ctx.fill()
  }
  ctx.strokeStyle = palette[0]
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.moveTo(r() * w, 0)
  ctx.bezierCurveTo(r() * w, h * 0.3, r() * w, h * 0.7, r() * w, h)
  ctx.stroke()
  noise(ctx, w, h, 14, r)
  return toTexture(c)
}

/** Небо за окном: день — светлый градиент, ночь — тёмный со звёздами */
export function skyTexture(night: boolean) {
  const [c, ctx] = canvas(256, 256)
  const g = ctx.createLinearGradient(0, 0, 0, 256)
  if (night) {
    g.addColorStop(0, '#0d1428')
    g.addColorStop(1, '#2a3354')
  } else {
    g.addColorStop(0, '#bcd6ee')
    g.addColorStop(1, '#fbf1df')
  }
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 256, 256)
  if (night) {
    const r = rng(21)
    for (let i = 0; i < 60; i++) {
      ctx.fillStyle = `rgba(255,255,255,${0.4 + r() * 0.6})`
      ctx.fillRect(r() * 256, r() * 180, 1.2, 1.2)
    }
  } else {
    // силуэты деревьев внизу
    ctx.fillStyle = 'rgba(110,130,95,0.55)'
    for (let x = -20; x < 276; x += 34) {
      ctx.beginPath()
      ctx.arc(x, 240, 30 + ((x * 7) % 17), 0, Math.PI * 2)
      ctx.fill()
    }
  }
  return toTexture(c)
}
