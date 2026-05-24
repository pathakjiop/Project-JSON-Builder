import { useState } from 'react';
import { mcpClient } from '../services/mcp/mcpClient';
import type { McpCallArgs } from '../services/mcp/mcpClient';

export function useMcp() {
  const [isCalling, setIsCalling] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const callTool = async (args: McpCallArgs) => {
    setIsCalling(true);
    setLastError(null);
    try {
      const response = await mcpClient.callTool(args);
      if (!response.success) {
        setLastError(response.error || 'Failed to call tool');
      }
      return response;
    } finally {
      setIsCalling(false);
    }
  };

  return {
    callTool,
    isCalling,
    lastError
  };
}
