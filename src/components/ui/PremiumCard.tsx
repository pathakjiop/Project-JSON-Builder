import React from 'react';
import { motion } from 'framer-motion';
import type { HTMLMotionProps } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface PremiumCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  glowColor?: 'blue' | 'purple' | 'pink' | 'none';
}

export function PremiumCard({ children, className, glowColor = 'none', ...props }: PremiumCardProps) {
  const glowClasses = {
    blue: 'hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] border-accent-blue/20 hover:border-accent-blue/50',
    purple: 'hover:shadow-[0_0_30px_rgba(139,92,246,0.3)] border-accent-purple/20 hover:border-accent-purple/50',
    pink: 'hover:shadow-[0_0_30px_rgba(236,72,153,0.3)] border-accent-pink/20 hover:border-accent-pink/50',
    none: 'border-border hover:border-white/20 hover:shadow-[0_8px_32px_-8px_rgba(255,255,255,0.1)]'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={cn(
        'glass-panel p-6 sm:p-8 transition-all duration-500',
        glowClasses[glowColor],
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
