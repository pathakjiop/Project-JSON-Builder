import { useState } from 'react';
import { parseGitHubUrl, fetchRepoTree, shouldAutoIgnore } from '../services/github';
import type { GitHubTreeNode } from '../services/github';
import { generateJsonWithGemini } from '../services/gemini';
import type { GeneratorOptions } from '../services/gemini';

export function useGenerator() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [statusText, setStatusText] = useState<string>('');
  
  // Stores the fetched repository tree structure
  const [tree, setTree] = useState<GitHubTreeNode[] | null>(null);
  
  // Selected paths for generation
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());

  const getRepoTree = async (repoUrl: string) => {
    setLoading(true);
    setError(null);
    setTree(null);
    setResult(null);
    setSelectedPaths(new Set());
    
    try {
      if (!repoUrl.trim()) {
        throw new Error('Please provide a valid GitHub repository URL.');
      }

      setStatusText('Parsing URL...');
      const parsed = parseGitHubUrl(repoUrl);
      if (!parsed) {
        throw new Error('Invalid GitHub URL format. Use "https://github.com/owner/repo".');
      }

      setStatusText('Fetching repository files...');
      const rawTree = await fetchRepoTree(parsed.owner, parsed.repo);
      
      if (!rawTree || rawTree.length === 0) {
        throw new Error('No files found or could not fetch repository tree.');
      }

      setTree(rawTree);
      
      // Auto-select files, ignoring common binary/dependency targets
      const initialSelection = new Set<string>();
      rawTree.forEach(node => {
        if (node.type === 'blob' && !shouldAutoIgnore(node.path)) {
          initialSelection.add(node.path);
        }
      });
      setSelectedPaths(initialSelection);
      
      setStatusText('Files loaded successfully!');
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred while fetching.');
      setStatusText('');
    } finally {
      setLoading(false);
    }
  };

  const generate = async (apiKey: string, options: GeneratorOptions) => {
    if (!tree) return;
    
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      if (!apiKey.trim()) {
        throw new Error('Please provide a valid Gemini API Key.');
      }

      if (selectedPaths.size === 0) {
        throw new Error('Please select at least one file to include in the codebase map.');
      }

      setStatusText('Preparing repository context...');
      // Filter tree structure to include only checked elements
      const filteredTree = tree.filter(node => 
        node.type === 'tree' || selectedPaths.has(node.path)
      );

      setStatusText('Synthesizing codebase layout with Gemini AI...');
      const jsonStr = await generateJsonWithGemini(filteredTree, apiKey, options);

      setResult(jsonStr);
      setStatusText('Analysis and TOON synthesis complete!');
      return jsonStr;
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during analysis.');
      setStatusText('');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setTree(null);
    setResult(null);
    setError(null);
    setStatusText('');
    setSelectedPaths(new Set());
  };

  const togglePath = (path: string) => {
    const next = new Set(selectedPaths);
    if (next.has(path)) {
      next.delete(path);
    } else {
      next.add(path);
    }
    setSelectedPaths(next);
  };

  return {
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
  };
}
