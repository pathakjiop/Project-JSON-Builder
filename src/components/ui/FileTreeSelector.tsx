import React, { useState, useMemo } from 'react';
import { 
  Folder, 
  FolderOpen, 
  File, 
  FileCode2, 
  ChevronRight, 
  ChevronDown, 
  Search, 
  CheckSquare, 
  Square,
  MinusSquare,
  Sparkles
} from 'lucide-react';
import type { GitHubTreeNode } from '../../services/github';
import { isCodeFile } from '../../services/github';

interface FileTreeSelectorProps {
  tree: GitHubTreeNode[];
  selectedPaths: Set<string>;
  onTogglePath: (path: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onSelectPreset: (preset: 'all' | 'code' | 'none') => void;
}

interface TreeNode {
  name: string;
  path: string;
  type: 'tree' | 'blob';
  children?: Record<string, TreeNode>;
}

export function FileTreeSelector({
  tree,
  selectedPaths,
  onTogglePath,
  onSelectAll,
  onDeselectAll,
  onSelectPreset
}: FileTreeSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['root']));

  // Parse flat tree nodes into a nested hierarchical tree structure
  const nestedTree = useMemo(() => {
    const root: TreeNode = { name: 'root', path: '', type: 'tree', children: {} };
    
    // Sort tree so folders appear before files alphabetically
    const sortedTree = [...tree].sort((a, b) => {
      const aIsFolder = a.type === 'tree';
      const bIsFolder = b.type === 'tree';
      if (aIsFolder && !bIsFolder) return -1;
      if (!aIsFolder && bIsFolder) return 1;
      return a.path.localeCompare(b.path);
    });

    for (const node of sortedTree) {
      const parts = node.path.split('/');
      let current = root;
      
      let currentPath = '';
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        
        if (!current.children) {
          current.children = {};
        }
        
        if (!current.children[part]) {
          current.children[part] = {
            name: part,
            path: currentPath,
            type: i === parts.length - 1 ? node.type : 'tree',
            children: {}
          };
        }
        
        current = current.children[part];
      }
    }
    
    return root;
  }, [tree]);

  const toggleFolder = (path: string) => {
    const next = new Set(expandedFolders);
    if (next.has(path)) {
      next.delete(path);
    } else {
      next.add(path);
    }
    setExpandedFolders(next);
  };

  // Helper to check if a folder's children are selected/partially selected
  const getFolderSelectionState = (node: TreeNode): 'all' | 'none' | 'partial' => {
    const getChildrenBlobs = (n: TreeNode): string[] => {
      const blobs: string[] = [];
      const traverse = (curr: TreeNode) => {
        if (curr.type === 'blob') {
          blobs.push(curr.path);
        } else if (curr.children) {
          Object.values(curr.children).forEach(traverse);
        }
      };
      traverse(n);
      return blobs;
    };

    const blobs = getChildrenBlobs(node);
    if (blobs.length === 0) return 'none';
    
    const selectedCount = blobs.filter(b => selectedPaths.has(b)).length;
    if (selectedCount === 0) return 'none';
    if (selectedCount === blobs.length) return 'all';
    return 'partial';
  };

  const handleFolderCheckboxClick = (node: TreeNode, e: React.MouseEvent) => {
    e.stopPropagation();
    const state = getFolderSelectionState(node);
    
    const getChildrenBlobs = (n: TreeNode): string[] => {
      const blobs: string[] = [];
      const traverse = (curr: TreeNode) => {
        if (curr.type === 'blob') {
          blobs.push(curr.path);
        } else if (curr.children) {
          Object.values(curr.children).forEach(traverse);
        }
      };
      traverse(n);
      return blobs;
    };

    const blobs = getChildrenBlobs(node);
    const shouldSelect = state !== 'all';
    
    blobs.forEach(blob => {
      const isSelected = selectedPaths.has(blob);
      if (shouldSelect && !isSelected) {
        onTogglePath(blob);
      } else if (!shouldSelect && isSelected) {
        onTogglePath(blob);
      }
    });
  };

  // Render tree node recursively
  const renderNode = (node: TreeNode, depth = 0) => {
    const isFolder = node.type === 'tree';
    const isExpanded = expandedFolders.has(node.path);
    const hasSearchActive = searchTerm.trim() !== '';
    
    // Check search filter for this node or any of its children
    const matchesSearch = (n: TreeNode): boolean => {
      if (n.name.toLowerCase().includes(searchTerm.toLowerCase())) return true;
      if (n.children) {
        return Object.values(n.children).some(matchesSearch);
      }
      return false;
    };

    if (hasSearchActive && !matchesSearch(node)) {
      return null;
    }

    if (node.path === '') {
      // Don't render root itself, just its children
      return (
        <div className="space-y-1">
          {node.children && Object.values(node.children).map(child => renderNode(child, depth))}
        </div>
      );
    }

    const selectionState = isFolder ? getFolderSelectionState(node) : selectedPaths.has(node.path) ? 'all' : 'none';

    return (
      <div key={node.path} className="select-none">
        <div 
          onClick={() => isFolder ? toggleFolder(node.path) : onTogglePath(node.path)}
          className={`flex items-center gap-2 py-1.5 px-3 rounded-lg hover:bg-white/5 cursor-pointer text-sm transition-colors border border-transparent hover:border-white/5 ${
            !isFolder && selectedPaths.has(node.path) ? 'bg-accent-blue/5 text-primary' : 'text-secondary'
          }`}
          style={{ paddingLeft: `${depth * 16 + 12}px` }}
        >
          {/* Collapse/Expand Toggle */}
          <div className="w-5 h-5 flex items-center justify-center">
            {isFolder && (
              isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
            )}
          </div>

          {/* Checkbox Icon */}
          <div 
            onClick={(e) => {
              if (isFolder) {
                handleFolderCheckboxClick(node, e);
              } else {
                e.stopPropagation();
                onTogglePath(node.path);
              }
            }}
            className="text-secondary hover:text-white transition-colors cursor-pointer"
          >
            {selectionState === 'all' && <CheckSquare className="w-4 h-4 text-accent-blue" />}
            {selectionState === 'partial' && <MinusSquare className="w-4 h-4 text-accent-blue/70" />}
            {selectionState === 'none' && <Square className="w-4 h-4 opacity-50" />}
          </div>

          {/* File/Folder Icon */}
          <div className="text-secondary">
            {isFolder ? (
              isExpanded ? <FolderOpen className="w-4 h-4 text-accent-purple" /> : <Folder className="w-4 h-4 text-accent-purple" />
            ) : (
              isCodeFile(node.path) ? <FileCode2 className="w-4 h-4 text-accent-blue" /> : <File className="w-4 h-4 opacity-60" />
            )}
          </div>

          {/* Name */}
          <span className={`font-mono truncate ${!isFolder && selectedPaths.has(node.path) ? 'text-white font-medium' : ''}`}>
            {node.name}
          </span>
        </div>

        {/* Render nested children */}
        {isFolder && (isExpanded || hasSearchActive) && node.children && (
          <div className="mt-1">
            {Object.values(node.children).map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="border border-border/80 rounded-xl bg-surface/40 p-4 space-y-4 max-h-[450px] flex flex-col">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search repository files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-surfaceHighlight/50 border border-border px-3 py-1.5 pl-9 rounded-lg text-sm text-primary placeholder-secondary focus:outline-none focus:border-accent-blue transition-colors font-sans"
          />
          <Search className="w-4 h-4 text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        {/* Preset selectors */}
        <div className="flex gap-2 flex-wrap items-center">
          <button
            type="button"
            onClick={() => onSelectPreset('all')}
            className="text-xs px-2.5 py-1.5 rounded-md border border-border bg-surfaceHighlight/60 hover:bg-white/10 hover:text-white transition-colors"
          >
            Select All
          </button>
          <button
            type="button"
            onClick={() => onSelectPreset('code')}
            className="text-xs px-2.5 py-1.5 rounded-md border border-accent-blue/30 bg-accent-blue/5 text-accent-blue hover:bg-accent-blue/15 transition-all flex items-center gap-1"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Code Preset
          </button>
          <button
            type="button"
            onClick={() => onSelectPreset('none')}
            className="text-xs px-2.5 py-1.5 rounded-md border border-border bg-surfaceHighlight/60 hover:bg-white/10 hover:text-white transition-colors"
          >
            Deselect All
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex justify-between items-center text-xs text-secondary border-b border-border/40 pb-2">
        <span>Selected: <strong className="text-white">{selectedPaths.size}</strong> files</span>
        <span>Total: <strong className="text-white">{tree.filter(n => n.type === 'blob').length}</strong> files</span>
      </div>

      {/* Tree scrollable area */}
      <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin">
        {tree.length === 0 ? (
          <div className="text-center py-8 text-secondary text-sm">No files in repository</div>
        ) : (
          renderNode(nestedTree)
        )}
      </div>
    </div>
  );
}
