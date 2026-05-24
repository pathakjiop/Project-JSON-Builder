import React, { useState, useMemo } from 'react';
import Editor from '@monaco-editor/react';
import { Reveal } from '../components/animations/Reveal';
import { PremiumCard } from '../components/ui/PremiumCard';
import { AnalyticsDashboard } from '../components/ui/AnalyticsDashboard';
import { VisualMapExplorer } from '../components/ui/VisualMapExplorer';
import { jsonToToon, compareFormats } from '../services/toon';
import { 
  Check, 
  Copy, 
  Download, 
  Compass, 
  FileCode2, 
  FileJson
} from 'lucide-react';

interface ResultSectionProps {
  result: string | null;
}

type TabType = 'visual' | 'toon' | 'json';

export function ResultSection({ result }: ResultSectionProps) {
  const [activeTab, setActiveTab] = useState<TabType>('visual');
  const [copied, setCopied] = useState(false);

  // Compute TOON representation and statistics
  const data = useMemo(() => {
    if (!result) return null;
    try {
      const parsed = JSON.parse(result);
      const toon = jsonToToon(parsed);
      const stats = compareFormats(result, toon);
      return { parsed, toon, stats };
    } catch (e) {
      console.error('Failed to parse result JSON', e);
      return null;
    }
  }, [result]);

  if (!result || !data) return null;

  const { parsed, toon, stats } = data;

  const handleCopy = async () => {
    try {
      const textToCopy = activeTab === 'toon' ? toon : result;
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleDownload = () => {
    const isToon = activeTab === 'toon';
    const blob = new Blob([isToon ? toon : result], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = isToon ? 'codebase-map.toon' : 'codebase-map.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 w-full max-w-4xl mx-auto pb-16">
      
      {/* 1. Analytics Dashboard */}
      <Reveal delay={0.1}>
        <AnalyticsDashboard stats={stats} />
      </Reveal>

      {/* 2. Workspace View Panel */}
      <Reveal delay={0.2}>
        <PremiumCard glowColor="blue" className="w-full relative p-0 overflow-hidden rounded-2xl flex flex-col border border-border/80 bg-surface/35 backdrop-blur-lg">
          
          {/* Custom Header with Tabs and Actions */}
          <div className="h-14 bg-surfaceHighlight/80 backdrop-blur border-b border-border flex items-center justify-between px-4 z-10">
            {/* Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('visual')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                  activeTab === 'visual'
                    ? 'bg-accent-blue/10 text-accent-blue border border-accent-blue/20'
                    : 'text-secondary hover:text-white border border-transparent'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                Visual Map
              </button>
              <button
                onClick={() => setActiveTab('toon')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                  activeTab === 'toon'
                    ? 'bg-accent-purple/10 text-accent-purple border border-accent-purple/20'
                    : 'text-secondary hover:text-white border border-transparent'
                }`}
              >
                <FileCode2 className="w-3.5 h-3.5" />
                TOON Source
              </button>
              <button
                onClick={() => setActiveTab('json')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                  activeTab === 'json'
                    ? 'bg-accent-pink/10 text-accent-pink border border-accent-pink/20'
                    : 'text-secondary hover:text-white border border-transparent'
                }`}
              >
                <FileJson className="w-3.5 h-3.5" />
                JSON Source
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleCopy}
                disabled={activeTab === 'visual'}
                className={`p-2 rounded-lg bg-white/5 border border-border/60 hover:bg-white/10 text-secondary hover:text-white transition-all ${
                  activeTab === 'visual' ? 'opacity-30 cursor-not-allowed' : ''
                }`}
                title="Copy code to clipboard"
              >
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </button>
              <button
                onClick={handleDownload}
                disabled={activeTab === 'visual'}
                className={`p-2 rounded-lg bg-white/5 border border-border/60 hover:bg-white/10 text-secondary hover:text-white transition-all ${
                  activeTab === 'visual' ? 'opacity-30 cursor-not-allowed' : ''
                }`}
                title="Download file"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tab Contents */}
          <div className="p-6 bg-surfaceHighlight/5">
            {activeTab === 'visual' && (
              <VisualMapExplorer data={parsed} />
            )}

            {activeTab === 'toon' && (
              <div className="h-[450px] w-full border border-border/80 rounded-xl overflow-hidden bg-[#1e1e1e]">
                <Editor
                  height="100%"
                  defaultLanguage="yaml" // Using YAML for decent highlighting on custom indentation structure
                  theme="vs-dark"
                  value={toon}
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    fontSize: 14,
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    padding: { top: 16, bottom: 16 },
                    scrollBeyondLastLine: false,
                    smoothScrolling: true,
                    cursorBlinking: "smooth",
                    lineNumbers: "on",
                    wordWrap: "on"
                  }}
                />
              </div>
            )}

            {activeTab === 'json' && (
              <div className="h-[450px] w-full border border-border/80 rounded-xl overflow-hidden bg-[#1e1e1e]">
                <Editor
                  height="100%"
                  defaultLanguage="json"
                  theme="vs-dark"
                  value={result}
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    fontSize: 14,
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    padding: { top: 16, bottom: 16 },
                    scrollBeyondLastLine: false,
                    smoothScrolling: true,
                    cursorBlinking: "smooth",
                    lineNumbers: "on",
                    wordWrap: "on"
                  }}
                />
              </div>
            )}
          </div>
        </PremiumCard>
      </Reveal>
    </div>
  );
}
