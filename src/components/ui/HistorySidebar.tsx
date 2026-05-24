import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Trash2, 
  History, 
  Calendar, 
  Settings, 
  FileJson, 
  Sparkles,
  GitBranch
} from 'lucide-react';

export interface HistoryItem {
  id: string;
  repoUrl: string;
  owner: string;
  repo: string;
  date: string;
  model: string;
  detailLevel: string;
  fileCount: number;
  jsonResult: string;
  toonResult: string;
}

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onLoadItem: (item: HistoryItem) => void;
  onDeleteItem: (id: string) => void;
}

export function HistorySidebar({
  isOpen,
  onClose,
  history,
  onLoadItem,
  onDeleteItem
}: HistorySidebarProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop blur overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />

          {/* Sliding drawer panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md z-50 bg-surface border-l border-border shadow-2xl flex flex-col pt-6 font-sans"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pb-4 border-b border-border/80">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-accent-blue" />
                <h2 className="text-lg font-bold text-white tracking-wide">Scan History</h2>
                <span className="bg-white/5 border border-border px-2 py-0.5 rounded text-xs text-secondary font-mono">
                  {history.length}
                </span>
              </div>
              <button 
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-white/5 text-secondary hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List scroll area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {history.length === 0 ? (
                <div className="h-[60%] flex flex-col items-center justify-center text-center p-6 space-y-4">
                  <div className="w-12 h-12 rounded-full bg-white/5 border border-border flex items-center justify-center text-secondary">
                    <History className="w-6 h-6 opacity-40" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">No history yet</h3>
                    <p className="text-xs text-secondary max-w-xs mt-1 leading-relaxed">
                      Generated codebase indexes will be securely saved locally in your browser for quick access.
                    </p>
                  </div>
                </div>
              ) : (
                history.map((item) => (
                  <motion.div
                    key={item.id}
                    layoutId={`history-${item.id}`}
                    className="group border border-border hover:border-accent-blue/30 rounded-xl bg-surfaceHighlight/30 hover:bg-surfaceHighlight/50 p-4 transition-all duration-300 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-accent-blue/5 blur-[30px] rounded-full pointer-events-none" />

                    <div className="flex justify-between items-start gap-4">
                      {/* Left Info content */}
                      <div 
                        onClick={() => {
                          onLoadItem(item);
                          onClose();
                        }}
                        className="flex-1 cursor-pointer space-y-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs text-accent-blue font-semibold">
                            <GitBranch className="w-3.5 h-3.5" />
                            <span>{item.owner}</span>
                          </div>
                          <h4 className="text-base font-bold text-white truncate max-w-[220px]">
                            {item.repo}
                          </h4>
                        </div>

                        {/* Badges metadata */}
                        <div className="flex gap-2 flex-wrap text-[10px]">
                          <span className="flex items-center gap-1 bg-white/5 border border-border/80 px-2 py-0.5 rounded text-secondary font-mono">
                            <Calendar className="w-3 h-3" />
                            {new Date(item.date).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                          <span className="flex items-center gap-1 bg-white/5 border border-border/80 px-2 py-0.5 rounded text-secondary font-mono">
                            <Settings className="w-3 h-3" />
                            {item.detailLevel}
                          </span>
                          <span className="flex items-center gap-1 bg-white/5 border border-border/80 px-2 py-0.5 rounded text-secondary font-mono">
                            <FileJson className="w-3 h-3" />
                            {item.fileCount} files
                          </span>
                        </div>
                      </div>

                      {/* Right action delete */}
                      <button
                        onClick={() => onDeleteItem(item.id)}
                        className="p-2 rounded-lg bg-red-500/5 hover:bg-red-500/10 text-red-400 opacity-60 hover:opacity-100 transition-all border border-red-500/10 hover:border-red-500/20"
                        title="Delete index"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border/80 bg-surfaceHighlight/20 text-center">
              <div className="inline-flex items-center gap-1.5 text-[11px] text-secondary font-medium">
                <Sparkles className="w-3.5 h-3.5 text-accent-purple" />
                <span>Saved locally to index your workflows.</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
