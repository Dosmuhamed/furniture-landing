import catChairs from './assets/img/cat-chairs.webp'
import catLight from './assets/img/cat-light.webp'
import catSofas from './assets/img/cat-sofas.webp'
import catStorage from './assets/img/cat-storage.webp'
import roomTeal from './assets/img/room-teal.webp'
import type { SlotId } from './configurator/catalog'

export type Chapter = {
  id: string
  /** Короткое название для навигации по главам */
  nav: string
  title: string
  text: string
  /** Какие предметы появляются в комнате, когда читатель доходит до главы */
  slots: SlotId[]
  /** Что можно настроить прямо в карточке главы */
  controls?: SlotId[] | 'room'
  photo?: { src: string; caption: string }
}

export const chapters: Chapter[] = [
  {
    id: 'intro',
    nav: 'Чертёж',
    title: 'Обставьте эту комнату, *пока листаете*',
    text: 'Пустая гостиная 30 м² ждёт вас. Каждый экран ниже добавляет в неё мебель — меняйте модели и цвета прямо по ходу. В конце получите готовый проект и смету.',
    slots: [],
  },
  {
    id: 'walls',
    nav: 'Стены',
    title: 'Сначала — *стены* и пол',
    text: 'Любой наш проект начинается с фона. Цвет стен меняет восприятие ткани сильнее, чем кажется: один и тот же диван на шалфее и на графите — два разных дивана.',
    slots: [],
    controls: 'room',
    photo: { src: roomTeal, caption: 'Бирюзовый кабинет, Караганда' },
  },
  {
    id: 'sofa',
    nav: 'Диван',
    title: 'Диван — *сердце* гостиной',
    text: 'Каркас из сухого бруса берёзы, пружинный блок и съёмные чехлы. Любую модель можно удлинить на 20 см без доплаты.',
    slots: ['sofa'],
    controls: ['sofa'],
    photo: { src: catSofas, caption: 'Oslo в изумрудном велюре' },
  },
  {
    id: 'corner',
    nav: 'Кресло',
    title: 'Кресло и столик для *долгих* разговоров',
    text: 'Кресло ставим у окна: днём там лучший свет для книги. Столик — на расстоянии вытянутой руки от дивана, 40–45 см.',
    slots: ['armchair', 'table'],
    controls: ['armchair', 'table'],
    photo: { src: catChairs, caption: 'Кресло Lounge, гостиная в Астане' },
  },
  {
    id: 'evening',
    nav: 'Свет',
    title: 'А вечером — *тёплый* свет',
    text: 'Солнце село, и комната живёт по-другому. Торшер с тёплой лампой 2700 K делает её уютнее любого потолочного света.',
    slots: ['lamp'],
    controls: ['lamp'],
    photo: { src: catLight, caption: 'Торшер Arc над столиком' },
  },
  {
    id: 'plan',
    nav: 'План',
    title: 'Всё *помещается*. Мы проверили',
    text: 'Вид сверху — так комнату видит наш дизайнер. Вокруг мебели остаётся проход не меньше 90 см, а ковёр заходит под передние ножки дивана.',
    slots: ['rug'],
    controls: ['rug'],
  },
  {
    id: 'details',
    nav: 'Детали',
    title: 'Детали, которые делают *дом*',
    text: 'Стеллаж с книгами, живое растение и картина над диваном. Без них даже лучшая мебель выглядит как витрина.',
    slots: ['storage', 'plant', 'art'],
    controls: ['storage', 'plant', 'art'],
    photo: { src: catStorage, caption: 'Стеллаж Grid во всю стену' },
  },
  {
    id: 'yours',
    nav: 'Ваша комната',
    title: 'Ваша комната',
    text: 'Покрутите её, поменяйте что угодно или примерьте готовый стиль.',
    slots: [],
  },
]

/** В какой главе «живёт» предмет: по клику на него в 3D листаем туда */
export const chapterOfSlot = Object.fromEntries(
  chapters.flatMap((c, i) => c.slots.map((s) => [s, i])),
) as Record<SlotId, number>
