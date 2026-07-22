"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

export function MagicRings({ children }: { children: ReactNode }) {
  return (
    <div className="relative inline-flex items-center justify-center p-8">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
        className="absolute h-full w-full rounded-full border border-amber-400/20 border-t-amber-400/60"
      />
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
        className="absolute h-[120%] w-[120%] rounded-full border border-amber-400/10 border-b-amber-400/50"
      />
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
        className="absolute h-full w-full rounded-full bg-amber-400/10 blur-xl"
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
