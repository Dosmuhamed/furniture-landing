/** 489000 → «489 000 ₸» */
export const formatPrice = (value: number) => `${Math.round(value).toLocaleString('ru-RU')} ₸`
