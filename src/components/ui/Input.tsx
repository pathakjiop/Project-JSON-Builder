import React, { forwardRef } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, ...props }, ref) => {
    return (
      <div className="relative group w-full">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary group-focus-within:text-accent-blue transition-colors">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            'glass-input w-full transition-all duration-300',
            icon ? 'pl-12' : 'pl-4',
            className
          )}
          {...props}
        />
        {/* Animated focus border bottom */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-gradient-to-r from-accent-blue to-accent-purple group-focus-within:w-full transition-all duration-500 rounded-full opacity-50" />
      </div>
    );
  }
);

Input.displayName = 'Input';
