import { Suspense, lazy } from 'react'
import { motion } from 'framer-motion'

const Spline = lazy(() => import('@splinetool/react-spline'))

export default function SplineHero() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 1 }}
      whileHover={{ scale: 1.015 }}
      className="relative w-full h-[540px] hidden lg:block"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-violet-500/10 to-transparent rounded-[30px] blur-3xl" />
      <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-96 h-32 bg-indigo-600/15 blur-[80px] rounded-full pointer-events-none" />

      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        className="relative h-full rounded-[28px] backdrop-blur-2xl bg-white/[0.03] border border-white/[0.08] shadow-2xl shadow-violet-900/20 overflow-hidden"
      >
        <Suspense
          fallback={
            <div className="w-full h-full flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-indigo-400/40 border-t-indigo-400 animate-spin" />
                <span className="text-white/30 text-xs">Loading 3D scene…</span>
              </div>
            </div>
          }
        >
          <Spline
            scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
            className="w-full h-full"
          />
        </Suspense>
      </motion.div>

      <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-80 h-24 bg-violet-500/20 blur-[90px] rounded-full pointer-events-none" />
    </motion.div>
  )
}
