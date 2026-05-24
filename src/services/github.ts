export interface GitHubRepoInfo {
  owner: string;
  repo: string;
}

export interface GitHubTreeNode {
  path: string;
  type: 'tree' | 'blob';
  size?: number;
  mode?: string;
  sha?: string;
  url?: string;
}

export function parseGitHubUrl(url: string): GitHubRepoInfo | null {
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.hostname !== 'github.com') return null;
    
    const parts = parsedUrl.pathname.split('/').filter(Boolean);
    if (parts.length < 2) return null;
    
    return {
      owner: parts[0],
      repo: parts[1].replace('.git', '')
    };
  } catch {
    return null;
  }
}

/**
 * Checks if a file path belongs to a common build, dependency, or binary folder
 * that should be automatically deselected by default.
 */
export function shouldAutoIgnore(path: string): boolean {
  const parts = path.toLowerCase().split('/');
  
  // Ignored folders
  const ignoredFolders = [
    'node_modules',
    'dist',
    'build',
    'out',
    'target',
    'bin',
    'obj',
    '.git',
    '.github',
    '.next',
    '.nuxt',
    '.cache',
    '.idea',
    '.vscode',
    'vendor',
    'coverage'
  ];
  
  // Check if any folder segment matches the ignored list
  if (parts.some(part => ignoredFolders.includes(part))) {
    return true;
  }
  
  // Ignored file names/extensions
  const ignoredFiles = [
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
    'bun.lockb',
    'composer.lock',
    'cargo.lock',
    'gemfile.lock',
    '.ds_store',
    'thumbs.db',
    'favicon.ico'
  ];
  
  const fileName = parts[parts.length - 1];
  if (ignoredFiles.includes(fileName)) {
    return true;
  }
  
  // Ignored binary/media file extensions
  const ignoredExtensions = [
    '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.mp4', '.mov', '.avi', '.mp3', '.wav',
    '.zip', '.tar', '.gz', '.rar', '.7z', '.pdf', '.docx', '.xlsx', '.pptx', '.woff', '.woff2', '.ttf', '.eot'
  ];
  
  if (ignoredExtensions.some(ext => fileName.endsWith(ext))) {
    return true;
  }
  
  return false;
}

/**
 * Determines if a file path is a standard human-readable code or configuration file.
 */
export function isCodeFile(path: string): boolean {
  const fileName = path.toLowerCase();
  const codeExtensions = [
    '.ts', '.tsx', '.js', '.jsx', '.json', '.html', '.css', '.md', '.py', '.go', '.rs',
    '.java', '.c', '.cpp', '.h', '.hpp', '.cs', '.php', '.rb', '.sh', '.sql', '.yml', '.yaml',
    '.toml', '.xml', '.kt', '.kts', '.swift', '.gradle', '.properties', '.env', '.dockerfile', 'dockerfile'
  ];
  
  return codeExtensions.some(ext => fileName.endsWith(ext) || fileName === 'dockerfile');
}

export async function fetchRepoTree(owner: string, repo: string): Promise<GitHubTreeNode[]> {
  try {
    const branchResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
    if (!branchResponse.ok) {
      if (branchResponse.status === 404) {
        throw new Error('Repository not found. Ensure the spelling is correct and it is a public repository.');
      } else if (branchResponse.status === 403) {
        throw new Error('GitHub API rate limit exceeded. Please try again later.');
      }
      throw new Error('Failed to fetch repository details');
    }
    
    const branchData = await branchResponse.json();
    const defaultBranch = branchData.default_branch;

    const treeResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`
    );
    
    if (!treeResponse.ok) {
      throw new Error('Failed to fetch repository tree structure from GitHub');
    }

    const treeData = await treeResponse.json();
    return (treeData.tree as GitHubTreeNode[]) || [];
  } catch (error) {
    console.error('GitHub API Error:', error);
    throw error;
  }
}
