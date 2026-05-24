/**
 * Local TOON (Token-Oriented Object Notation) Serializer Engine.
 * Formats standard JavaScript objects/JSON into a highly compact,
 * YAML/tabular hybrid optimized for LLM context windows.
 */

export function jsonToToon(obj: any, indentLevel = 0): string {
  const indent = ' '.repeat(indentLevel);
  
  if (obj === null || obj === undefined) {
    return 'null';
  }
  
  if (typeof obj !== 'object') {
    // Escape string values if they have newlines or special characters
    if (typeof obj === 'string') {
      if (obj.includes('\n') || obj.includes(':')) {
        return `"${obj.replace(/"/g, '\\"')}"`;
      }
      return obj;
    }
    return String(obj);
  }
  
  // If it's an array
  if (Array.isArray(obj)) {
    if (obj.length === 0) {
      return '[]';
    }
    
    // Check if the array contains uniform objects (tabular representation)
    const isUniformObjects = obj.every(item => item && typeof item === 'object' && !Array.isArray(item));
    
    if (isUniformObjects) {
      // Gather all unique keys across all objects
      const allKeys = Array.from(
        new Set(obj.flatMap(item => Object.keys(item)))
      );
      
      if (allKeys.length > 0) {
        const header = `{${allKeys.join(',')}}`;
        let result = `[${obj.length}]${header}:\n`;
        
        const rows = obj.map(item => {
          const vals = allKeys.map(key => {
            const val = item[key];
            if (val === undefined || val === null) return '';
            
            // Format primitive values in a CSV-like row
            const strVal = String(val);
            if (strVal.includes(',') || strVal.includes('"') || strVal.includes('\n')) {
              return `"${strVal.replace(/"/g, '\\"').replace(/\n/g, ' ')}"`;
            }
            return strVal;
          });
          return `${' '.repeat(indentLevel + 2)}${vals.join(',')}`;
        });
        
        return result + rows.join('\n');
      }
    }
    
    // Fallback: regular primitive or non-uniform array representation
    let result = `[${obj.length}]:\n`;
    const items = obj.map(item => {
      if (typeof item === 'object') {
        return jsonToToon(item, indentLevel + 2);
      }
      return `${' '.repeat(indentLevel + 2)}${String(item)}`;
    });
    return result + items.join('\n');
  }
  
  // If it's a standard object
  const keys = Object.keys(obj);
  if (keys.length === 0) {
    return '{}';
  }
  
  const lines = keys.map(key => {
    const value = obj[key];
    
    // Clean key formatting if needed
    const formattedKey = key.includes(' ') || key.includes(':') ? `"${key}"` : key;
    
    if (value === null || value === undefined) {
      return `${indent}${formattedKey}: null`;
    }
    
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return `${indent}${formattedKey}: []`;
      }
      
      const isUniform = value.every(item => item && typeof item === 'object' && !Array.isArray(item));
      if (isUniform) {
        const subKeys = Array.from(new Set(value.flatMap(item => Object.keys(item))));
        const header = `{${subKeys.join(',')}}`;
        let headerLine = `${indent}${formattedKey}[${value.length}]${header}:`;
        
        const rows = value.map(item => {
          const vals = subKeys.map(k => {
            const val = item[k];
            if (val === undefined || val === null) return '';
            const strVal = String(val);
            if (strVal.includes(',') || strVal.includes('"') || strVal.includes('\n')) {
              return `"${strVal.replace(/"/g, '\\"').replace(/\n/g, ' ')}"`;
            }
            return strVal;
          });
          return `${indent}  ${vals.join(',')}`;
        });
        
        return `${headerLine}\n${rows.join('\n')}`;
      } else {
        const items = value.map(item => {
          if (typeof item === 'object') {
            return jsonToToon(item, indentLevel + 2);
          }
          return `${indent}  ${String(item)}`;
        });
        return `${indent}${formattedKey}[${value.length}]:\n${items.join('\n')}`;
      }
    }
    
    if (typeof value === 'object') {
      const nestedToon = jsonToToon(value, indentLevel + 2);
      return `${indent}${formattedKey}:\n${nestedToon}`;
    }
    
    // Primitive values
    const strVal = String(value);
    const formattedVal = typeof value === 'string' && (strVal.includes('\n') || strVal.includes(':') || strVal.startsWith(' ') || strVal.endsWith(' '))
      ? `"${strVal.replace(/"/g, '\\"')}"`
      : strVal;
      
    return `${indent}${formattedKey}: ${formattedVal}`;
  });
  
  return lines.join('\n');
}

/**
 * Estimates the token count of a given string content.
 * Follows standard OpenAI/Google tokenization ratios (~3.8 characters per token).
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 3.8);
}

/**
 * Calculates comparison statistics between JSON and TOON formats.
 */
export interface FormatStats {
  jsonChars: number;
  jsonTokens: number;
  toonChars: number;
  toonTokens: number;
  savingsPercent: number;
}

export function compareFormats(jsonText: string, toonText: string): FormatStats {
  const jsonChars = jsonText.length;
  const toonChars = toonText.length;
  const jsonTokens = estimateTokens(jsonText);
  const toonTokens = estimateTokens(toonText);
  
  const savingsPercent = jsonTokens > 0 
    ? Math.max(0, Math.round(((jsonTokens - toonTokens) / jsonTokens) * 100))
    : 0;
    
  return {
    jsonChars,
    jsonTokens,
    toonChars,
    toonTokens,
    savingsPercent
  };
}
