import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  emptySelection,
  finishOf,
  presets,
  slots,
  variantOf,
  type RoomState,
  type Selection,
  type SlotId,
} from './catalog'

export type Tab = SlotId | 'room'

type RoomApi = {
  selection: Selection
  room: RoomState
  night: boolean
  tab: Tab
  preset: string | null
  /** Выбранные предметы с моделью и отделкой — для сметы, корзины и плана */
  chosen: { slot: (typeof slots)[number]; variant: NonNullable<ReturnType<typeof variantOf>>; finish: ReturnType<typeof finishOf> }[]
  total: number
  setItem: (id: SlotId, patch: Partial<Selection[SlotId]>) => void
  setRoom: (patch: Partial<RoomState>) => void
  setNight: (night: boolean) => void
  setTab: (tab: Tab) => void
  applyPreset: (id: string) => void
  clear: () => void
  /** Ставит модель по умолчанию, если предмет ещё ни разу не выбирали */
  autofill: (ids: SlotId[]) => void
}

const RoomContext = createContext<RoomApi | null>(null)

// eslint-disable-next-line react/only-export-components
export function useRoom() {
  const ctx = useContext(RoomContext)
  if (!ctx) throw new Error('useRoom вне RoomProvider')
  return ctx
}

export function RoomProvider({ children }: { children: ReactNode }) {
  const [selection, setSelection] = useState<Selection>(emptySelection)
  const [room, setRoomState] = useState<RoomState>({ wall: 'milk', floor: 'oak' })
  const [night, setNight] = useState(false)
  const [tab, setTab] = useState<Tab>('sofa')
  const [preset, setPreset] = useState<string | null>(null)
  const touched = useRef(new Set<SlotId>())
  const timers = useRef<number[]>([])

  const setItem = useCallback((id: SlotId, patch: Partial<Selection[SlotId]>) => {
    touched.current.add(id)
    setPreset(null)
    setSelection((s) => ({ ...s, [id]: { ...s[id], ...patch } }))
  }, [])

  const setRoom = useCallback((patch: Partial<RoomState>) => {
    setPreset(null)
    setRoomState((r) => ({ ...r, ...patch }))
  }, [])

  const autofill = useCallback((ids: SlotId[]) => {
    const fresh = ids.filter((id) => !touched.current.has(id))
    if (!fresh.length) return
    fresh.forEach((id) => touched.current.add(id))
    setSelection((s) => {
      const next = { ...s }
      fresh.forEach((id) => {
        if (!next[id].variant) next[id] = { ...next[id], variant: slots.find((x) => x.id === id)!.variants[0].id }
      })
      return next
    })
  }, [])

  // Готовый стиль: предметы появляются по очереди, «каскадом»
  const applyPreset = useCallback((id: string) => {
    const p = presets.find((x) => x.id === id)
    if (!p) return
    timers.current.forEach(clearTimeout)
    timers.current = []
    slots.forEach((s) => touched.current.add(s.id))
    setPreset(id)
    setRoomState(p.room)
    setSelection(emptySelection())
    const order: SlotId[] = ['rug', 'sofa', 'table', 'armchair', 'storage', 'lamp', 'plant', 'art']
    order.forEach((slot, i) => {
      const item = p.items[slot]
      if (!item) return
      timers.current.push(
        window.setTimeout(() => setSelection((s) => ({ ...s, [slot]: { variant: item[0], finish: item[1] } })), 150 + i * 160),
      )
    })
  }, [])

  const clear = useCallback(() => {
    timers.current.forEach(clearTimeout)
    slots.forEach((s) => touched.current.add(s.id))
    setPreset(null)
    setSelection(emptySelection())
  }, [])

  const api = useMemo<RoomApi>(() => {
    const chosen = slots.flatMap((slot) => {
      const variant = variantOf(slot.id, selection[slot.id].variant)
      return variant ? [{ slot, variant, finish: finishOf(slot.id, selection[slot.id].finish) }] : []
    })
    const total = chosen.reduce((sum, x) => sum + x.variant.price, 0)
    return {
      selection,
      room,
      night,
      tab,
      preset,
      chosen,
      total,
      setItem,
      setRoom,
      setNight,
      setTab,
      applyPreset,
      clear,
      autofill,
    }
  }, [selection, room, night, tab, preset, setItem, setRoom, applyPreset, clear, autofill])

  return <RoomContext.Provider value={api}>{children}</RoomContext.Provider>
}
