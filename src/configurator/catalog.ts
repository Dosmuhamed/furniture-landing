export type SlotId = 'sofa' | 'armchair' | 'table' | 'rug' | 'lamp' | 'storage' | 'plant' | 'art'

export type Variant = { id: string; name: string; desc: string; price: number }
export type Finish = { id: string; name: string; color: string }

export type Slot = {
  id: SlotId
  label: string
  /** Название характеристики, которую меняют свотчи */
  finishLabel: string
  variants: Variant[]
  finishes: Finish[]
  /** Высота подписи над предметом в 3D */
  labelY: number
  icon: string
}

const fabrics: Finish[] = [
  { id: 'linen', name: 'Лён, песок', color: '#cdbb9f' },
  { id: 'boucle', name: 'Букле, молочный', color: '#ebe5da' },
  { id: 'olive', name: 'Велюр, олива', color: '#6e7650' },
  { id: 'terracotta', name: 'Велюр, терракота', color: '#b25b34' },
  { id: 'graphite', name: 'Рогожка, графит', color: '#4b4b50' },
  { id: 'indigo', name: 'Лён, индиго', color: '#3e5170' },
]

const woods: Finish[] = [
  { id: 'oak', name: 'Дуб', color: '#c49a6c' },
  { id: 'ash', name: 'Ясень', color: '#e2cba8' },
  { id: 'walnut', name: 'Орех', color: '#6e4a32' },
  { id: 'black', name: 'Чёрный дуб', color: '#2c2724' },
]

export const slots: Slot[] = [
  {
    id: 'sofa',
    label: 'Диван',
    finishLabel: 'Обивка',
    labelY: 1.15,
    icon: 'M3 11V9a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v2M3 11a2 2 0 0 1 2 2v2h14v-2a2 2 0 0 1 4 0v4H1v-4a2 2 0 0 1 2-2Zm2 6v2m14-2v2',
    variants: [
      { id: 'oslo', name: 'Oslo', desc: 'Классика на дубовых ножках, 3 места', price: 489000 },
      { id: 'cloud', name: 'Cloud', desc: 'Глубокий и мягкий, как облако', price: 629000 },
      { id: 'corner', name: 'Lagom', desc: 'Угловой с оттоманкой', price: 759000 },
    ],
    finishes: fabrics,
  },
  {
    id: 'armchair',
    label: 'Кресло',
    finishLabel: 'Обивка',
    labelY: 1.05,
    icon: 'M6 10V7a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v3M4 10a2 2 0 0 1 2 2v2h12v-2a2 2 0 1 1 4 0v4H2v-4a2 2 0 0 1 2-2Zm3 6v3m10-3v3',
    variants: [
      { id: 'lounge', name: 'Lounge', desc: 'Деревянный каркас, наклонная спинка', price: 189000 },
      { id: 'pebble', name: 'Pebble', desc: 'Круглое кресло-ракушка', price: 164000 },
    ],
    finishes: fabrics,
  },
  {
    id: 'table',
    label: 'Столик',
    finishLabel: 'Дерево',
    labelY: 0.85,
    icon: 'M3 9h18M5 9l-1 9m16-9 1 9M8 9v5h8V9',
    variants: [
      { id: 'stump', name: 'Stump', desc: 'Круглый на массивной опоре', price: 119000 },
      { id: 'plank', name: 'Plank', desc: 'Прямоугольный с полкой', price: 98000 },
      { id: 'duo', name: 'Duo', desc: 'Пара столиков, мраморные столешницы', price: 142000 },
    ],
    finishes: woods,
  },
  {
    id: 'rug',
    label: 'Ковёр',
    finishLabel: 'Цвет',
    labelY: 0.35,
    icon: 'M4 6h16v12H4zM7 9h10v6H7zM4 4v2m4-2v2m4-2v2m4-2v2m4-2v2M4 18v2m4-2v2m4-2v2m4-2v2m4-2v2',
    variants: [
      { id: 'berber', name: 'Berber', desc: 'Шерсть, ромбовидный узор, 300×200', price: 89000 },
      { id: 'halo', name: 'Halo', desc: 'Круглый, ⌀ 250 см', price: 69000 },
      { id: 'lines', name: 'Lines', desc: 'Хлопок, полосы, 280×190', price: 79000 },
    ],
    finishes: [
      { id: 'sand', name: 'Песок', color: '#d9c7a9' },
      { id: 'clay', name: 'Терракота', color: '#b9673f' },
      { id: 'stone', name: 'Камень', color: '#8f8b86' },
      { id: 'moss', name: 'Мох', color: '#7b8460' },
    ],
  },
  {
    id: 'lamp',
    label: 'Торшер',
    finishLabel: 'Металл',
    labelY: 2.5,
    icon: 'M8 3h8l2 6H6l2-6Zm4 6v12m-4 0h8',
    variants: [
      { id: 'arc', name: 'Arc', desc: 'Дуговой, свет над столиком', price: 129000 },
      { id: 'tripod', name: 'Tripod', desc: 'Тренога с тканевым абажуром', price: 74000 },
    ],
    finishes: [
      { id: 'brass', name: 'Латунь', color: '#c9a25a' },
      { id: 'black', name: 'Чёрный', color: '#26241f' },
      { id: 'white', name: 'Белый', color: '#eeeae3' },
    ],
  },
  {
    id: 'storage',
    label: 'Хранение',
    finishLabel: 'Дерево',
    labelY: 2.15,
    icon: 'M5 3h14v18H5zM5 9h14M5 15h14',
    variants: [
      { id: 'grid', name: 'Grid', desc: 'Открытый стеллаж с книгами', price: 214000 },
      { id: 'low', name: 'Low', desc: 'Низкий комод на ножках', price: 268000 },
    ],
    finishes: woods,
  },
  {
    id: 'plant',
    label: 'Растение',
    finishLabel: 'Кашпо',
    labelY: 1.9,
    icon: 'M12 21v-8m0 0c0-4 3-7 7-7 0 4-3 7-7 7Zm0 0C12 9 9 6 5 6c0 4 3 7 7 7Zm-4 4h8l-1 4H9l-1-4Z',
    variants: [
      { id: 'monstera', name: 'Монстера', desc: 'Крупные резные листья, 120 см', price: 24000 },
      { id: 'olive', name: 'Олива', desc: 'Деревце в напольном кашпо, 160 см', price: 39000 },
      { id: 'snake', name: 'Сансевиерия', desc: 'Неприхотливая, 90 см', price: 18000 },
    ],
    finishes: [
      { id: 'clay', name: 'Терракота', color: '#b66a45' },
      { id: 'white', name: 'Белый', color: '#ece8e1' },
      { id: 'black', name: 'Графит', color: '#33312e' },
    ],
  },
  {
    id: 'art',
    label: 'Декор',
    finishLabel: 'Палитра',
    labelY: 2.6,
    icon: 'M4 4h16v16H4zm0 12 5-5 4 4 2-2 5 5',
    variants: [
      { id: 'triptych', name: 'Триптих', desc: 'Три абстракции в рамах', price: 36000 },
      { id: 'canvas', name: 'Холст', desc: 'Большая картина 130×85', price: 48000 },
      { id: 'mirror', name: 'Зеркало', desc: 'Круглое в латунной раме', price: 57000 },
    ],
    finishes: [
      { id: 'warm', name: 'Тёплая', color: '#c0612f' },
      { id: 'sage', name: 'Шалфей', color: '#5b6749' },
      { id: 'mono', name: 'Монохром', color: '#1d1915' },
    ],
  },
]

export const slotById = Object.fromEntries(slots.map((s) => [s.id, s])) as Record<SlotId, Slot>

export const artPalettes: Record<string, string[]> = {
  warm: ['#c0612f', '#e8c9a0', '#7a4a2b', '#f3e9dc', '#d99a6c'],
  sage: ['#5b6749', '#b9c2ad', '#e9e1d1', '#2f3326', '#a3876a'],
  mono: ['#1d1915', '#8c857c', '#d9d2c8', '#f6f2ec', '#4b4640'],
}

export const walls = [
  { id: 'milk', name: 'Молочный', color: '#efe8dd' },
  { id: 'sage', name: 'Шалфей', color: '#b8c0a9' },
  { id: 'clay', name: 'Глина', color: '#d8b59b' },
  { id: 'powder', name: 'Пудра', color: '#e4cdc4' },
  { id: 'graphite', name: 'Графит', color: '#77736f' },
]

export const floors = [
  { id: 'oak', name: 'Светлый дуб' },
  { id: 'walnut', name: 'Орех' },
  { id: 'herringbone', name: 'Ёлочка' },
  { id: 'cement', name: 'Микроцемент' },
]

export type Selection = Record<SlotId, { variant: string | null; finish: string }>

export type RoomState = { wall: string; floor: string }

export const emptySelection = (): Selection =>
  Object.fromEntries(slots.map((s) => [s.id, { variant: null, finish: s.finishes[0].id }])) as Selection

type Preset = {
  id: string
  name: string
  room: RoomState
  items: Partial<Record<SlotId, [string, string]>>
}

export const presets: Preset[] = [
  {
    id: 'scandi',
    name: 'Скандинавия',
    room: { wall: 'milk', floor: 'oak' },
    items: {
      sofa: ['oslo', 'linen'],
      armchair: ['lounge', 'boucle'],
      table: ['plank', 'ash'],
      rug: ['berber', 'sand'],
      lamp: ['tripod', 'white'],
      storage: ['grid', 'ash'],
      plant: ['olive', 'white'],
      art: ['triptych', 'warm'],
    },
  },
  {
    id: 'japandi',
    name: 'Japandi',
    room: { wall: 'sage', floor: 'oak' },
    items: {
      sofa: ['cloud', 'boucle'],
      armchair: ['pebble', 'olive'],
      table: ['stump', 'walnut'],
      rug: ['halo', 'sand'],
      lamp: ['arc', 'black'],
      storage: ['low', 'walnut'],
      plant: ['snake', 'black'],
      art: ['mirror', 'mono'],
    },
  },
  {
    id: 'boho',
    name: 'Бохо',
    room: { wall: 'clay', floor: 'herringbone' },
    items: {
      sofa: ['corner', 'terracotta'],
      armchair: ['lounge', 'linen'],
      table: ['duo', 'oak'],
      rug: ['lines', 'clay'],
      lamp: ['arc', 'brass'],
      storage: ['grid', 'walnut'],
      plant: ['monstera', 'clay'],
      art: ['canvas', 'warm'],
    },
  },
  {
    id: 'loft',
    name: 'Лофт',
    room: { wall: 'graphite', floor: 'cement' },
    items: {
      sofa: ['oslo', 'graphite'],
      armchair: ['pebble', 'terracotta'],
      table: ['plank', 'black'],
      rug: ['berber', 'stone'],
      lamp: ['tripod', 'black'],
      storage: ['low', 'black'],
      plant: ['monstera', 'black'],
      art: ['canvas', 'mono'],
    },
  },
]

export const finishOf = (slot: SlotId, finishId: string) =>
  slotById[slot].finishes.find((f) => f.id === finishId) ?? slotById[slot].finishes[0]

export const variantOf = (slot: SlotId, variantId: string | null) =>
  slotById[slot].variants.find((v) => v.id === variantId) ?? null

/* ---------- Габариты для плана сверху ---------- */

type Part = { x: number; z: number; w?: number; d?: number; r?: number }
export type Footprint = { label: string; parts: Part[]; wall?: number }

/** Размеры в метрах относительно точки установки предмета (до поворота) */
export const footprints: Record<string, Footprint> = {
  'sofa:oslo': { label: '220 × 92', parts: [{ x: 0, z: 0, w: 2.2, d: 0.92 }] },
  'sofa:cloud': { label: '230 × 100', parts: [{ x: 0, z: 0, w: 2.3, d: 1 }] },
  'sofa:corner': {
    label: '240 × 164',
    parts: [
      { x: 0, z: 0, w: 2.4, d: 0.92 },
      { x: -0.77, z: 0.76, w: 0.86, d: 0.72 },
    ],
  },
  'armchair:lounge': { label: '78 × 80', parts: [{ x: 0, z: 0, w: 0.78, d: 0.8 }] },
  'armchair:pebble': { label: '⌀ 84', parts: [{ x: 0, z: 0, r: 0.42 }] },
  'table:stump': { label: '⌀ 96', parts: [{ x: 0, z: 0, r: 0.48 }] },
  'table:plank': { label: '115 × 62', parts: [{ x: 0, z: 0, w: 1.15, d: 0.62 }] },
  'table:duo': {
    label: '⌀ 84 + ⌀ 56',
    parts: [
      { x: -0.15, z: -0.08, r: 0.42 },
      { x: 0.42, z: 0.3, r: 0.28 },
    ],
  },
  'rug:berber': { label: '300 × 210', parts: [{ x: 0, z: 0, w: 3, d: 2.1 }] },
  'rug:halo': { label: '⌀ 250', parts: [{ x: 0, z: 0, r: 1.25 }] },
  'rug:lines': { label: '280 × 190', parts: [{ x: 0, z: 0, w: 2.8, d: 1.9 }] },
  'lamp:arc': {
    label: 'вылет 130',
    parts: [
      { x: 0, z: 0, r: 0.17 },
      { x: -0.85, z: 0.95, r: 0.2 },
    ],
  },
  'lamp:tripod': { label: '⌀ 60', parts: [{ x: 0, z: 0, r: 0.3 }] },
  'storage:grid': { label: '110 × 36', parts: [{ x: 0, z: 0, w: 1.1, d: 0.36 }] },
  'storage:low': { label: '150 × 45', parts: [{ x: 0, z: 0, w: 1.5, d: 0.45 }] },
  'plant:monstera': { label: '⌀ 90', parts: [{ x: 0, z: 0, r: 0.45 }] },
  'plant:olive': { label: '⌀ 80', parts: [{ x: 0, z: 0, r: 0.4 }] },
  'plant:snake': { label: '⌀ 40', parts: [{ x: 0, z: 0, r: 0.22 }] },
  'art:triptych': { label: 'ширина 162', parts: [], wall: 1.62 },
  'art:canvas': { label: '130 × 85', parts: [], wall: 1.34 },
  'art:mirror': { label: '⌀ 96', parts: [], wall: 0.98 },
}

/** Где стоит каждый предмет: позиция на полу и поворот вокруг вертикали */
export const placement: Record<SlotId, { pos: (v: string) => [number, number, number]; rot?: number }> = {
  rug: { pos: () => [0.1, 0, -0.5] },
  sofa: { pos: () => [0.2, 0, -1.98] },
  armchair: { pos: () => [-1.75, 0, -0.15], rot: 1.25 },
  table: { pos: () => [0.2, 0, -0.42] },
  lamp: { pos: () => [1.65, 0, -1.95] },
  storage: { pos: (v) => [v === 'low' ? -2.765 : -2.81, 0, -1.5], rot: Math.PI / 2 },
  plant: { pos: () => [2.45, 0, -2.0] },
  art: { pos: (v) => [0.2, v === 'mirror' ? 1.78 : 1.72, -2.5] },
}
