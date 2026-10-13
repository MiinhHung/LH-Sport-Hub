"use client";

import { motion, useReducedMotion } from "motion/react";

export function AuthReveal({ children }: { children: React.ReactNode }) {
  const it = !!useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, y: it ? 0 : 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-[400px]"
    >
      {children}
    </motion.div>
  );
}
