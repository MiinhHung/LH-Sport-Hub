"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";
import * as React from "react";

const REVEAL_EASE = [0.22, 1, 0.36, 1] as const;

export interface RevealProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  y?: number;
  className?: string;
  once?: boolean;
}

/**
 * Component Reveal hiển thị nội dung mượt mà khi cuộn vào viewport.
 * - y: 24 -> 0
 * - opacity: 0 -> 1
 * - easing: [0.22, 1, 0.36, 1]
 * - duration: 0.7s
 * - Tự động hiển thị tĩnh không hoạt họa khi prefers-reduced-motion được bật.
 */
export function Reveal({
  children,
  delay = 0,
  duration = 0.7,
  y = 24,
  className,
  once = true,
  ...props
}: RevealProps) {
  const shouldReduce = useReducedMotion();

  if (shouldReduce) {
    return (
      <div className={className}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: "-40px" }}
      transition={{
        duration,
        delay,
        ease: REVEAL_EASE,
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

