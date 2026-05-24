import { useEffect, useState } from 'react';
import { Sparkles, Cpu, Coins, TrendingUp } from 'lucide-react';
import type { FormatStats } from '../../services/toon';

interface AnalyticsDashboardProps {
  stats: FormatStats;
}

export function AnalyticsDashboard({ stats }: AnalyticsDashboardProps) {
  const [animatedSavings, setAnimatedSavings] = useState(0);

  useEffect(() => {
    // Animate the savings percentage up on load
    const duration = 1000; // 1s
    const startTime = performance.now();
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing out quadratic
      const easeProgress = progress * (2 - progress);
      const currentVal = Math.round(easeProgress * stats.savingsPercent);
      
      setAnimatedSavings(currentVal);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [stats.savingsPercent]);

  // SVG parameters for circular meter
  const radius = 60;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedSavings / 100) * circumference;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center p-6 border border-border/80 rounded-2xl bg-surface/30 backdrop-blur-md relative overflow-hidden">
      
      {/* Background soft glow shapes */}
      <div className="absolute top-[-50px] right-[-50px] w-48 h-48 bg-accent-pink/5 blur-[50px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-50px] left-[-50px] w-48 h-48 bg-accent-blue/5 blur-[50px] rounded-full pointer-events-none" />

      {/* Column 1: Animated Circular Gauge */}
      <div className="flex flex-col items-center justify-center p-4 border border-border/40 rounded-xl bg-surfaceHighlight/20 relative">
        <div className="relative w-36 h-36 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            {/* Background track circle */}
            <circle
              cx="72"
              cy="72"
              r={radius}
              stroke="rgba(255,255,255,0.03)"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Foreground animated gradient circle */}
            <circle
              cx="72"
              cy="72"
              r={radius}
              stroke="url(#purpleBlueGradient)"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-[stroke-dashoffset] duration-300 ease-out"
            />
            {/* Gradient definition */}
            <defs>
              <linearGradient id="purpleBlueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="50%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>
          </svg>

          {/* Core circular display */}
          <div className="absolute text-center select-none flex flex-col items-center">
            <span className="text-3xl font-extrabold text-white tracking-tight leading-none">
              {animatedSavings}%
            </span>
            <span className="text-[10px] text-accent-purple font-semibold uppercase tracking-wider mt-1">
              Savings
            </span>
          </div>
        </div>

        <span className="text-xs font-semibold text-secondary flex items-center gap-1.5 mt-2">
          <TrendingUp className="w-3.5 h-3.5 text-accent-pink" />
          More Context Space
        </span>
      </div>

      {/* Column 2: Comparative Stats List */}
      <div className="md:col-span-2 space-y-4">
        <div>
          <h3 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent-blue" />
            Token Compression Analytics
          </h3>
          <p className="text-xs text-secondary mt-1 max-w-lg leading-relaxed">
            By stripping out formatting noise (syntactic braces, quotes, repeating keys) and grouping arrays tabularly, TOON optimizes codebase layouts for LLMs losslessly.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* JSON size */}
          <div className="p-3 border border-border/40 rounded-xl bg-surfaceHighlight/10 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-xs text-secondary font-medium">
              <span className="w-2 h-2 rounded-full bg-red-400" />
              Standard JSON Size
            </div>
            <div className="mt-2">
              <span className="text-lg font-bold text-white font-mono">
                {stats.jsonTokens.toLocaleString()}
              </span>
              <span className="text-xs text-secondary ml-1">tokens</span>
            </div>
            <span className="text-[10px] text-secondary/60 mt-1 font-mono">
              Characters: {stats.jsonChars.toLocaleString()}
            </span>
          </div>

          {/* TOON size */}
          <div className="p-3 border border-accent-blue/20 rounded-xl bg-accent-blue/5 flex flex-col justify-between shadow-[0_0_15px_rgba(59,130,246,0.05)]">
            <div className="flex items-center gap-1.5 text-xs text-accent-blue font-semibold">
              <span className="w-2 h-2 rounded-full bg-accent-blue animate-pulse" />
              Optimized TOON Size
            </div>
            <div className="mt-2">
              <span className="text-lg font-bold text-white font-mono">
                {stats.toonTokens.toLocaleString()}
              </span>
              <span className="text-xs text-accent-blue/80 ml-1 font-semibold">tokens</span>
            </div>
            <span className="text-[10px] text-accent-blue/60 mt-1 font-mono">
              Characters: {stats.toonChars.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Dynamic value cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="flex items-center gap-2 text-xs text-secondary">
            <Cpu className="w-4 h-4 text-accent-purple" />
            <span>Fits <strong>{(stats.jsonTokens / Math.max(1, stats.toonTokens)).toFixed(1)}x</strong> more files in LLM context</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-secondary">
            <Coins className="w-4 h-4 text-accent-pink" />
            <span>Reduces API prompt cost by <strong>{stats.savingsPercent}%</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}
