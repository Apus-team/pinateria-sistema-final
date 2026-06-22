import { motion } from 'framer-motion'

export default function LoadingScreen() {
  return (
    <div className="flex h-screen items-center justify-center bg-white dark:bg-gray-950">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="mx-auto mb-4 h-12 w-12 rounded-full border-4 border-fucsia-200 border-t-fucsia-500"
        />
        <p className="text-gray-500 dark:text-gray-400">Cargando...</p>
      </motion.div>
    </div>
  )
}
