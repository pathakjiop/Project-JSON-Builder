import React, { useState, useEffect } from 'react';
import { MainLayout } from './layouts/MainLayout';
import { HeroSection } from './sections/HeroSection';
import { GeneratorSection } from './sections/GeneratorSection';
import { ResultSection } from './sections/ResultSection';
import { HistorySidebar } from './components/ui/HistorySidebar';
import type { HistoryItem } from './components/ui/HistorySidebar';
import { useGenerator } from './hooks/useGenerator';
import { parseGitHubUrl, isCodeFile, shouldAutoIgnore } from './services/github';
import { jsonToToon } from './services/toon';

const LOCAL_STORAGE_KEY = 'JSON_BUILDER_HISTORY_V1';

function App() {
  const { 
    getRepoTree, 
    generate, 
    reset, 
    loading, 
    error, 
    result, 
    statusText, 
    tree, 
    selectedPaths, 
    setSelectedPaths,
    togglePath,
    setResult
  } = useGenerator();

  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [currentRepoUrl, setCurrentRepoUrl] = useState('');

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load scan history', e);
    }
  }, []);

  // Sync history to localStorage when changed
  const saveHistory = (newHistory: HistoryItem[]) => {
    setHistory(newHistory);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newHistory));
    } catch (e) {
      console.error('Failed to save scan history', e);
    }
  };

  const handleFetchTree = async (url: string) => {
    setCurrentRepoUrl(url);
    await getRepoTree(url);
  };

  const handleGenerate = async (apiKey: string, options: any) => {
    const jsonStr = await generate(apiKey, options);
    
    // If successfully generated, append to local storage scan history
    if (jsonStr && currentRepoUrl) {
      try {
        const parsedUrl = parseGitHubUrl(currentRepoUrl);
        const parsedJson = JSON.parse(jsonStr);
        const toonStr = jsonToToon(parsedJson);

        const newItem: HistoryItem = {
          id: Date.now().toString(),
          repoUrl: currentRepoUrl,
          owner: parsedUrl?.owner || 'owner',
          repo: parsedUrl?.repo || 'repo',
          date: new Date().toISOString(),
          model: options.model,
          detailLevel: options.detailLevel,
          fileCount: selectedPaths.size,
          jsonResult: jsonStr,
          toonResult: toonStr
        };

        const updatedHistory = [newItem, ...history];
        saveHistory(updatedHistory);
      } catch (e) {
        console.error('Could not save item to history:', e);
      }
    }
  };

  const handleSelectPreset = (preset: 'all' | 'code' | 'none') => {
    if (!tree) return;
    const next = new Set<string>();
    
    if (preset === 'all') {
      tree.forEach(node => {
        if (node.type === 'blob') next.add(node.path);
      });
    } else if (preset === 'code') {
      tree.forEach(node => {
        if (node.type === 'blob' && isCodeFile(node.path) && !shouldAutoIgnore(node.path)) {
          next.add(node.path);
        }
      });
    }
    
    setSelectedPaths(next);
  };

  const handleLoadHistoryItem = (item: HistoryItem) => {
    // Load result directly into result section
    setResult(item.jsonResult);
    setCurrentRepoUrl(item.repoUrl);
    
    // Put generator back into a ready state or reset it so they can see the details
    reset();
  };

  const handleDeleteHistoryItem = (id: string) => {
    const filtered = history.filter(item => item.id !== id);
    saveHistory(filtered);
  };

  return (
    <MainLayout 
      onHistoryClick={() => setHistoryOpen(true)}
      historyCount={history.length}
    >
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <HeroSection />
        
        <div className="w-full max-w-4xl mx-auto space-y-12">
          <GeneratorSection 
            tree={tree}
            selectedPaths={selectedPaths}
            onTogglePath={togglePath}
            onSelectPreset={handleSelectPreset}
            onFetchTree={handleFetchTree}
            onGenerate={handleGenerate}
            onReset={reset}
            loading={loading}
            error={error}
            statusText={statusText}
          />
          
          <ResultSection result={result} />
        </div>
      </div>

      {/* Slide Drawer History */}
      <HistorySidebar
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        history={history}
        onLoadItem={handleLoadHistoryItem}
        onDeleteItem={handleDeleteHistoryItem}
      />
    </MainLayout>
  );
}

export default App;
