"use client";

import { useEffect, useState } from "react";
import { useSpring, useMotionValueEvent } from "framer-motion";

export function CountUp({ value, currency = "KES" }: { value: number; currency?: string }) {
  const spring = useSpring(value, { bounce: 0, duration: 800 });
  const [display, setDisplay] = useState(() => formatValue(value, currency));

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  useMotionValueEvent(spring, "change", (latest) => {
    setDisplay(formatValue(latest, currency));
  });

  return <span>{display}</span>;
}

function formatValue(val: number, currency: string) {
  return new Intl.NumberFormat("en-KE", {
    currency,
    style: "currency"
  }).format(val);
}
