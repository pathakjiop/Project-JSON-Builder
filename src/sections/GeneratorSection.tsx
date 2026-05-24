import React, { useState } from 'react';
import { PremiumCard } from '../components/ui/PremiumCard';
import { Input } from '../components/ui/Input';
import { GlowingButton } from '../components/ui/GlowingButton';
import { Reveal } from '../components/animations/Reveal';
import { FileTreeSelector } from '../components/ui/FileTreeSelector';
import { 
  Link, 
  Key, 
  Code2, 
  AlertCircle, 
  GitFork, 
  ArrowLeft, 
  Settings2, 
  Sparkles, 
  FileCode2,
  FolderTree
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GitHubTreeNode } from '../services/github';
import { isCodeFile, shouldAutoIgnore } from '../services/github';

interface GeneratorSectionProps {
  tree: GitHubTreeNode[] | null;
  selectedPaths: Set<string>;
  onTogglePath: (path: string) => void;
  onSelectPreset: (preset: 'all' | 'code' | 'none') => void;
  onFetchTree: (url: string) => Promise<void>;
  onGenerate: (apiKey: string, options: any) => Promise<void>;
  onReset: () => void;
  loading: boolean;
  error: string | null;
  statusText: string;
}

export function GeneratorSection({
  tree,
  selectedPaths,
  onTogglePath,
  onSelectPreset,
  onFetchTree,
  onGenerate,
  onReset,
  loading,
  error,
  statusText
}: GeneratorSectionProps) {
  const [repoUrl, setRepoUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  
  // Custom Generation Options
  const [model, setModel] = useState('gemini-2.5-flash');
  const [detailLevel, setDetailLevel] = useState<'lightweight' | 'standard' | 'deep'>('standard');
  const [customInstructions, setCustomInstructions] = useState('');

  const handleFetchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFetchTree(repoUrl);
  };

  const handleGenerateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(apiKey, {
      model,
      detailLevel,
      customInstructions
    });
  };

  return (
    <Reveal delay={0.3}>
      <PremiumCard glowColor="purple" className="max-w-3xl mx-auto mb-16 relative overflow-hidden p-6 sm:p-8">
        
        {/* Decorative subtle background colors inside the card */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-accent-purple/5 blur-[80px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent-blue/5 blur-[80px] rounded-full pointer-events-none" />

        <AnimatePresence mode="wait">
          {!tree ? (
            // ================== STEP 1: LOAD REPOSITORY ==================
            <motion.div
              key="step-fetch"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="space-y-1">
                <span className="text-xs font-bold text-accent-purple uppercase tracking-wider">Step 1</span>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <GitFork className="w-5 h-5 text-accent-purple" />
                  Connect Public GitHub Repository
                </h2>
                <p className="text-xs text-secondary">
                  Specify any public repository. We will fetch its folder layout to let you pick and choose what to map.
                </p>
              </div>

              <form onSubmit={handleFetchSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-secondary ml-1">Repository URL</label>
                  <Input
                    type="text"
                    placeholder="e.g. https://github.com/facebook/react"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    icon={<Link className="w-5 h-5" />}
                    disabled={loading}
                    required
                  />
                </div>

                {error && (
                  <div className="flex items-start gap-2.5 text-red-400 bg-red-400/5 p-3 rounded-xl text-xs border border-red-400/20">
                    <AlertCircle className="w-4.5 h-4.5 flex-shrink-0 mt-0.5" />
                    <p className="leading-relaxed">{error}</p>
                  </div>
                )}

                <div className="pt-2 flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <GlowingButton 
                    type="submit" 
                    isLoading={loading}
                    className="w-full sm:w-auto min-w-[220px]"
                  >
                    <FolderTree className="w-5 h-5" />
                    Load Structure
                  </GlowingButton>

                  {statusText && (
                    <div className="text-xs text-accent-blue font-semibold animate-pulse tracking-wide font-mono">
                      {statusText}
                    </div>
                  )}
                </div>
              </form>
            </motion.div>
          ) : (
            // ================== STEP 2: SELECT FILES & CONFIGURE ==================
            <motion.div
              key="step-generate"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Back / Navigation bar */}
              <div className="flex items-center justify-between border-b border-border/40 pb-4">
                <button
                  onClick={onReset}
                  disabled={loading}
                  className="flex items-center gap-1.5 text-xs text-secondary hover:text-white transition-colors bg-white/5 border border-border/80 px-2.5 py-1.5 rounded-lg disabled:opacity-40"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Load Different Repo
                </button>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-accent-blue uppercase tracking-wider block">Step 2</span>
                  <span className="text-xs font-mono text-white truncate max-w-[200px] block">
                    {repoUrl.replace('https://github.com/', '')}
                  </span>
                </div>
              </div>

              <form onSubmit={handleGenerateSubmit} className="space-y-6">
                
                {/* File tree selector component */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-xs font-bold text-secondary uppercase tracking-wider">Select Files for Mapping</label>
                    <span className="text-[11px] text-accent-purple font-medium">Auto-ignored binaries & build folders</span>
                  </div>
                  <FileTreeSelector
                    tree={tree}
                    selectedPaths={selectedPaths}
                    onTogglePath={onTogglePath}
                    onSelectAll={() => onSelectPreset('all')}
                    onDeselectAll={() => onSelectPreset('none')}
                    onSelectPreset={onSelectPreset}
                  />
                </div>

                {/* Configuration Accordion Toggle */}
                <div className="border border-border/60 rounded-xl overflow-hidden bg-surfaceHighlight/5">
                  <button
                    type="button"
                    onClick={() => setShowSettings(!showSettings)}
                    className="w-full flex items-center justify-between p-4 text-xs font-bold text-secondary uppercase tracking-wider hover:bg-white/5 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Settings2 className="w-4 h-4 text-accent-purple" />
                      Configure AI Mapping Settings
                    </span>
                    <span className="text-accent-purple font-semibold">
                      {showSettings ? 'Hide Settings' : 'Configure (Model, Depth)'}
                    </span>
                  </button>

                  <AnimatePresence>
                    {showSettings && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-border/40 p-4 space-y-4 bg-surfaceHighlight/15"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Model selection */}
                          <div className="space-y-2">
                            <label className="text-xs font-semibold text-secondary">AI Model</label>
                            <select
                              value={model}
                              onChange={(e) => setModel(e.target.value)}
                              className="w-full bg-surface border border-border px-3 py-2 rounded-lg text-xs text-primary focus:outline-none focus:border-accent-blue transition-colors"
                            >
                              <option value="gemini-2.5-flash">Gemini 2.5 Flash (Fast & Efficient)</option>
                              <option value="gemini-2.5-pro">Gemini 2.5 Pro (Deep & Strict)</option>
                            </select>
                          </div>

                          {/* Detail level */}
                          <div className="space-y-2">
                            <label className="text-xs font-semibold text-secondary">Symbol Extraction Detail</label>
                            <select
                              value={detailLevel}
                              onChange={(e) => setDetailLevel(e.target.value as any)}
                              className="w-full bg-surface border border-border px-3 py-2 rounded-lg text-xs text-primary focus:outline-none focus:border-accent-blue transition-colors"
                            >
                              <option value="lightweight">Lightweight (File summaries only)</option>
                              <option value="standard">Standard (Functions & Classes outline)</option>
                              <option value="deep">Deep AST (Imports, exports, exact lines, deps)</option>
                            </select>
                          </div>
                        </div>

                        {/* Custom prompt instructions */}
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-secondary flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-accent-blue" />
                            Focused AI Guidelines (Optional)
                          </label>
                          <textarea
                            placeholder="e.g. 'Focus heavily on React Hooks and context provider APIs. Ignore CSS files completely.'"
                            value={customInstructions}
                            onChange={(e) => setCustomInstructions(e.target.value)}
                            rows={3}
                            className="w-full bg-surface border border-border px-3 py-2 rounded-lg text-xs text-primary placeholder-secondary focus:outline-none focus:border-accent-blue transition-colors font-sans resize-none"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Gemini Authorization & Generation */}
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-secondary uppercase tracking-wider ml-1">Authorize Gemini API Key</label>
                    <Input
                      type="password"
                      placeholder="Enter Gemini API key here..."
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      icon={<Key className="w-5 h-5" />}
                      disabled={loading}
                      required
                    />
                    <div className="flex justify-between px-1">
                      <span className="text-[10px] text-secondary">Keys are processed client-side and never stored.</span>
                      <a 
                        href="https://ai.google.dev/" 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-[10px] text-accent-blue hover:underline font-semibold"
                      >
                        Get a Free Key
                      </a>
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-start gap-2.5 text-red-400 bg-red-400/5 p-3 rounded-xl text-xs border border-red-400/20">
                      <AlertCircle className="w-4.5 h-4.5 flex-shrink-0 mt-0.5" />
                      <p className="leading-relaxed">{error}</p>
                    </div>
                  )}

                  <div className="pt-2 flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <GlowingButton 
                      type="submit" 
                      isLoading={loading}
                      className="w-full sm:w-auto min-w-[220px]"
                    >
                      <FileCode2 className="w-5 h-5" />
                      Compile TOON Map
                    </GlowingButton>

                    {statusText && (
                      <div className="text-xs text-accent-purple font-semibold animate-pulse tracking-wide font-mono">
                        {statusText}
                      </div>
                    )}
                  </div>
                </div>

              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </PremiumCard>
    </Reveal>
  );
}
