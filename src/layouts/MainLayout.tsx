import React from 'react';
import { AnimatedGrid } from '../components/animations/AnimatedGrid';
import { Github, History } from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
  onHistoryClick?: () => void;
  historyCount?: number;
}

export function MainLayout({ children, onHistoryClick, historyCount = 0 }: MainLayoutProps) {
  return (
    <div className="relative min-h-screen flex flex-col font-sans">
      <AnimatedGrid />
      
      {/* Premium Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-panel rounded-none border-t-0 border-x-0 bg-surface/30 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-bold tracking-wider text-lg select-none">
            <Github className="w-6 h-6 text-accent-blue" />
            <span>JSON<span className="text-accent-purple">BUILDER</span></span>
          </div>

          {onHistoryClick && (
            <button
              onClick={onHistoryClick}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-border/80 bg-white/5 hover:bg-white/10 text-xs font-semibold text-secondary hover:text-white transition-all cursor-pointer"
            >
              <History className="w-4 h-4 text-accent-blue" />
              <span>History</span>
              {historyCount > 0 && (
                <span className="bg-accent-blue/20 text-accent-blue border border-accent-blue/30 px-1.5 py-0.5 rounded text-[10px] font-mono leading-none font-bold">
                  {historyCount}
                </span>
              )}
            </button>
          )}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 relative z-10 w-full max-w-6xl mx-auto px-4 pt-32 pb-20">
        {children}
      </main>
    </div>
  );
}
