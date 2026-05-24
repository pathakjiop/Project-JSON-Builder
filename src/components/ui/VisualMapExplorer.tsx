import React, { useState, useMemo } from 'react';
import { 
  Folder, 
  FolderOpen, 
  FileCode2, 
  Code2, 
  Boxes, 
  CornerDownRight, 
  Eye, 
  Braces,
  Compass,
  ArrowRight
} from 'lucide-react';

interface VisualMapExplorerProps {
  data: any; // Mapped JSON structure
}

interface MapNode {
  name: string;
  path: string;
  type: 'folder' | 'file';
  details?: {
    desc?: string;
    classes?: any[];
    fns?: any[];
    imports?: string[];
    exports?: string[];
    deps?: string[];
  };
  children?: Record<string, MapNode>;
}

export function VisualMapExplorer({ data }: VisualMapExplorerProps) {
  const [selectedFile, setSelectedFile] = useState<MapNode | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['root']));

  // Parse the nested JSON structure into a structured node hierarchy
  const parsedTree = useMemo(() => {
    const root: MapNode = { name: 'root', path: '', type: 'folder', children: {} };

    const isFileObject = (obj: any): boolean => {
      if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
      return 'desc' in obj || 'fns' in obj || 'classes' in obj || 'imports' in obj || 'exports' in obj;
    };

    const traverse = (currentObj: any, currentNode: MapNode, currentPath = '') => {
      if (!currentObj || typeof currentObj !== 'object') return;

      Object.entries(currentObj).forEach(([key, value]) => {
        const nodePath = currentPath ? `${currentPath}/${key}` : key;
        
        if (!currentNode.children) {
          currentNode.children = {};
        }

        if (isFileObject(value)) {
          currentNode.children[key] = {
            name: key,
            path: nodePath,
            type: 'file',
            details: value as any
          };
        } else {
          const folderNode: MapNode = {
            name: key,
            path: nodePath,
            type: 'folder',
            children: {}
          };
          currentNode.children[key] = folderNode;
          traverse(value, folderNode, nodePath);
        }
      });
    };

    traverse(data, root);
    
    // Auto-select the first file found so the details panel is not empty
    const selectFirstFile = (node: MapNode): boolean => {
      if (node.type === 'file') {
        setSelectedFile(node);
        return true;
      }
      if (node.children) {
        // Sort folders first, then files
        const sorted = Object.values(node.children).sort((a, b) => {
          if (a.type === 'folder' && b.type === 'file') return -1;
          if (a.type === 'file' && b.type === 'folder') return 1;
          return a.name.localeCompare(b.name);
        });
        for (const child of sorted) {
          if (selectFirstFile(child)) return true;
        }
      }
      return false;
    };

    selectFirstFile(root);

    return root;
  }, [data]);

  const toggleFolder = (path: string) => {
    const next = new Set(expandedFolders);
    if (next.has(path)) {
      next.delete(path);
    } else {
      next.add(path);
    }
    setExpandedFolders(next);
  };

  // Render tree explorer recursively
  const renderTree = (node: MapNode, depth = 0) => {
    if (node.path === '') {
      return (
        <div className="space-y-1">
          {node.children && Object.values(node.children)
            .sort((a, b) => {
              if (a.type === 'folder' && b.type === 'file') return -1;
              if (a.type === 'file' && b.type === 'folder') return 1;
              return a.name.localeCompare(b.name);
            })
            .map(child => renderTree(child, depth))}
        </div>
      );
    }

    const isFolder = node.type === 'folder';
    const isExpanded = expandedFolders.has(node.path);
    const isSelected = selectedFile?.path === node.path;

    return (
      <div key={node.path} className="select-none">
        <div
          onClick={() => isFolder ? toggleFolder(node.path) : setSelectedFile(node)}
          className={`flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-white/5 cursor-pointer text-sm border border-transparent transition-all duration-200 ${
            isSelected 
              ? 'bg-accent-blue/10 text-white border-accent-blue/30 font-medium' 
              : 'text-secondary hover:text-primary hover:border-white/5'
          }`}
          style={{ paddingLeft: `${depth * 14 + 10}px` }}
        >
          <div className="w-4 h-4 flex items-center justify-center text-secondary/70">
            {isFolder && (isExpanded ? <ChevronOpen /> : <ChevronClosed />)}
          </div>

          <div className="text-secondary/80">
            {isFolder ? (
              isExpanded ? <FolderOpen className="w-4 h-4 text-accent-purple" /> : <Folder className="w-4 h-4 text-accent-purple" />
            ) : (
              <FileCode2 className="w-4 h-4 text-accent-blue" />
            )}
          </div>

          <span className="font-mono truncate">{node.name}</span>
        </div>

        {isFolder && isExpanded && node.children && (
          <div className="mt-0.5">
            {Object.values(node.children)
              .sort((a, b) => {
                if (a.type === 'folder' && b.type === 'file') return -1;
                if (a.type === 'file' && b.type === 'folder') return 1;
                return a.name.localeCompare(b.name);
              })
              .map(child => renderTree(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 min-h-[480px]">
      
      {/* Left panel: Codebase Tree View */}
      <div className="lg:col-span-2 border border-border/80 rounded-xl bg-surfaceHighlight/10 p-4 flex flex-col max-h-[500px]">
        <div className="text-xs font-semibold text-secondary uppercase tracking-wider mb-3 px-1 border-b border-border/40 pb-2">
          File Structure
        </div>
        <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin">
          {renderTree(parsedTree)}
        </div>
      </div>

      {/* Right panel: Symbol Inspector */}
      <div className="lg:col-span-3 border border-border/80 rounded-xl bg-surfaceHighlight/20 p-6 flex flex-col min-h-[400px] max-h-[500px] overflow-y-auto scrollbar-thin relative">
        {selectedFile ? (
          <div className="space-y-6">
            
            {/* Header / Description */}
            <div className="space-y-2 border-b border-border/80 pb-4">
              <div className="flex items-center gap-2">
                <FileCode2 className="w-5 h-5 text-accent-blue" />
                <h3 className="text-lg font-bold text-white font-mono truncate">
                  {selectedFile.name}
                </h3>
              </div>
              <p className="text-sm text-secondary leading-relaxed font-sans bg-white/5 border border-border/50 p-3 rounded-lg">
                {selectedFile.details?.desc || 'No description provided.'}
              </p>
            </div>

            {/* Imports & Exports */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Imports */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-1.5">
                  <Boxes className="w-3.5 h-3.5 text-accent-purple" />
                  Imports
                </h4>
                {selectedFile.details?.imports && selectedFile.details.imports.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedFile.details.imports.map((imp, idx) => (
                      <span key={idx} className="bg-white/5 border border-border text-[11px] px-2 py-0.5 rounded-md text-primary font-mono">
                        {imp}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-secondary/60 italic">None detected</span>
                )}
              </div>

              {/* Exports */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-1.5">
                  <Braces className="w-3.5 h-3.5 text-accent-pink" />
                  Exports
                </h4>
                {selectedFile.details?.exports && selectedFile.details.exports.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedFile.details.exports.map((exp, idx) => (
                      <span key={idx} className="bg-accent-pink/5 border border-accent-pink/20 text-[11px] px-2 py-0.5 rounded-md text-accent-pink font-mono">
                        {exp}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-secondary/60 italic">None detected</span>
                )}
              </div>
            </div>

            {/* Classes */}
            {selectedFile.details?.classes && selectedFile.details.classes.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-1.5">
                  <Boxes className="w-3.5 h-3.5 text-accent-blue" />
                  Classes Defined
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {selectedFile.details.classes.map((cls, idx) => {
                    const isObj = typeof cls === 'object' && cls !== null;
                    const name = isObj ? cls.name : String(cls);
                    const desc = isObj ? cls.desc : '';
                    
                    return (
                      <div key={idx} className="border border-border/80 rounded-lg p-3 bg-surfaceHighlight/40">
                        <div className="font-mono text-sm font-semibold text-white">{name}</div>
                        {desc && <div className="text-xs text-secondary mt-1">{desc}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Functions / Methods */}
            {selectedFile.details?.fns && selectedFile.details.fns.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5 text-accent-blue" />
                  Functions & Methods
                </h4>
                <div className="border border-border/80 rounded-lg overflow-hidden bg-surfaceHighlight/30 font-sans">
                  {selectedFile.details.fns.map((fn, idx) => {
                    const isObj = typeof fn === 'object' && fn !== null;
                    const name = isObj ? fn.name : String(fn);
                    const line = isObj && fn.line ? fn.line : null;
                    const desc = isObj ? fn.desc : '';

                    return (
                      <div key={idx} className={`p-3 text-sm flex flex-col gap-1 border-b border-border/40 last:border-b-0 ${
                        idx % 2 === 0 ? 'bg-white/[0.01]' : 'bg-transparent'
                      }`}>
                        <div className="flex justify-between items-center gap-2">
                          <span className="font-mono font-bold text-accent-blue flex items-center gap-1.5">
                            <CornerDownRight className="w-3.5 h-3.5 text-secondary opacity-60" />
                            {name}()
                          </span>
                          {line && (
                            <span className="bg-white/5 border border-border px-1.5 py-0.5 rounded text-[10px] text-secondary font-mono">
                              L{line}
                            </span>
                          )}
                        </div>
                        {desc && <span className="text-xs text-secondary mt-0.5 pl-5">{desc}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* File Dependencies */}
            {selectedFile.details?.deps && selectedFile.details.deps.length > 0 && (
              <div className="space-y-3 border-t border-border/85 pt-4">
                <h4 className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-accent-purple" />
                  Inter-file Dependencies
                </h4>
                <div className="flex flex-col gap-1.5">
                  {selectedFile.details.deps.map((dep, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs font-mono text-secondary">
                      <ArrowRight className="w-3 h-3 text-accent-purple" />
                      <span>{dep}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-white/5 border border-border flex items-center justify-center text-secondary">
              <Eye className="w-6 h-6 opacity-40" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Select a file</h3>
              <p className="text-xs text-secondary max-w-xs mt-1 leading-relaxed">
                Click any file in the structure tree to inspect its generated AI-readable symbols.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Minimal Arrow icons for collapsible folder navigation
function ChevronClosed() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
  );
}

function ChevronOpen() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  );
}
