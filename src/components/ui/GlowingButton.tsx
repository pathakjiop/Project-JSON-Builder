import React from 'react';
import { motion } from 'framer-motion';
import type { HTMLMotionProps } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Loader2 } from 'lucide-react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface GlowingButtonProps extends HTMLMotionProps<'button'> {
  isLoading?: boolean;
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary';
}

export function GlowingButton({ 
  isLoading, 
  children, 
  className, 
  variant = 'primary',
  ...props 
}: GlowingButtonProps) {
  
  const baseClasses = 'relative group overflow-hidden rounded-xl px-6 py-3 font-semibold transition-all duration-300 flex items-center justify-center gap-2';
  
  const variants = {
    primary: 'bg-accent-blue/10 text-accent-blue hover:text-white border border-accent-blue/50 hover:bg-accent-blue/20',
    secondary: 'bg-surfaceHighlight text-primary border border-border hover:border-white/20 hover:bg-surfaceHighlight/80'
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(baseClasses, variants[variant], className)}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {/* Glow Effect Background */}
      {variant === 'primary' && (
        <div className="absolute inset-0 -z-10 bg-accent-blue/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      )}
      
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : children}
    </motion.button>
  );
}
