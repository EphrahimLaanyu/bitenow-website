"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ReactNode } from "react";

interface AnimatedListProps {
  children: ReactNode;
  className?: string;
}

export function AnimatedList({ children, className }: AnimatedListProps) {
  return (
    <div className={className}>
      <AnimatePresence mode="popLayout">
        {children}
      </AnimatePresence>
    </div>
  );
}

export function AnimatedListItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      layout
    >
      {children}
    </motion.div>
  );
}
