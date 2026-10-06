import { motion } from 'framer-motion'
import './Loader.css'

/** Пока создаётся 3D-сцена — чертёжный экран с прорисовкой контура комнаты */
export function Loader() {
  return (
    <motion.div className="loader" exit={{ opacity: 0 }} transition={{ duration: 0.8 }}>
      <svg viewBox="0 0 120 90" aria-hidden>
        <motion.path
          d="M10 60 L60 85 L110 60 L110 20 L60 45 L10 20 Z M60 45 L60 85"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.6, ease: 'easeInOut' }}
        />
      </svg>
      <p>Чертим комнату…</p>
    </motion.div>
  )
}
