"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";

export function ShinyText({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.span
      className={`relative inline-block overflow-hidden ${className ?? ""}`}
    >
      {children}
      <motion.span
        initial={{ x: "-100%" }}
        animate={{ x: "200%" }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut", repeatDelay: 1 }}
        className="absolute inset-0 z-10 block h-full w-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12"
      />
    </motion.span>
  );
}
