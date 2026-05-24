import type { GitHubTreeNode } from './github';

export interface GeneratorOptions {
  detailLevel: 'lightweight' | 'standard' | 'deep';
  customInstructions?: string;
  model: string;
}

export async function generateJsonWithGemini(
  tree: GitHubTreeNode[],
  apiKey: string,
  options: GeneratorOptions
): Promise<string> {
  const { detailLevel, customInstructions = '', model } = options;

  // Simplify tree to keep request token size manageable
  const simplifiedTree = tree.map(item => ({
    path: item.path,
    type: item.type
  }));

  // Define instruction set based on detail level
  let schemaInstruction = '';
  let exampleFormat = '';

  if (detailLevel === 'lightweight') {
    schemaInstruction = `
- For each file, provide only a "desc" key with a concise (1-sentence) explanation of its purpose.
- Do not extract functions, classes, imports, or exports.
- Group files by their folder paths.
`;
    exampleFormat = `{
  "src": {
    "index.ts": {
      "desc": "Main entry point that boots up the server."
    },
    "db.ts": {
      "desc": "Database client initialization and pooling config."
    }
  }
}`;
  } else if (detailLevel === 'standard') {
    schemaInstruction = `
- For each file, provide:
  1. "desc": A 1-sentence description of the file's purpose.
  2. "classes": An array of class names defined in the file. (Omit if none).
  3. "fns": An array of function/method names defined in the file. (Omit if none).
- Group files by their folder paths.
`;
    exampleFormat = `{
  "src": {
    "auth": {
      "login.ts": {
        "desc": "Handles secure user authentication and session creation.",
        "fns": ["loginUser", "verifySession", "hashPassword"]
      }
    },
    "App.tsx": {
      "desc": "Root React application component.",
      "classes": ["App"]
    }
  }
}`;
  } else {
    // deep AST-like representation
    schemaInstruction = `
- For each file, provide an extremely detailed map:
  1. "desc": Description of the file's purpose.
  2. "classes": An array of objects: { "name": string, "desc": string } (Omit if empty).
  3. "fns": An array of objects: { "name": string, "line": number, "desc": string } (Estimate line number or omit line if unknown; Omit if empty).
  4. "imports": An array of external module names imported (e.g. ["react", "express"]). (Omit if empty).
  5. "exports": An array of named or default exports from the file. (Omit if empty).
  6. "deps": An array of relative paths to OTHER internal files this file depends on/imports (e.g. ["../db", "./utils"]). (Omit if empty).
- Group files by their folder paths.
`;
    exampleFormat = `{
  "src": {
    "services": {
      "api.ts": {
        "desc": "Core service layer coordinating client-side API requests.",
        "imports": ["axios"],
        "exports": ["fetchData", "ApiClient"],
        "deps": ["./auth", "../config"],
        "classes": [
          { "name": "ApiClient", "desc": "Wrapper class for fetching resource queries" }
        ],
        "fns": [
          { "name": "fetchData", "line": 14, "desc": "Fetches a URL and processes headers" }
        ]
      }
    }
  }
}`;
  }

  const prompt = `
Analyze the following GitHub repository folder/file structure and compile a detailed, structured, and high-fidelity code map in JSON.

Extraction Depth Level: ${detailLevel.toUpperCase()}

Instructions for mapping:
${schemaInstruction}
${customInstructions ? `Custom Extra Instructions: "${customInstructions}"\n` : ''}

Rules:
- Represent the folder structure EXACTLY using nested JSON keys.
- Do not invent folders or files that are not in the Repository Tree.
- Return ONLY valid JSON. Do not write explanations outside the JSON object.
- Make sure keys are strictly formatted and strings are closed.

Repository Tree Structure:
${JSON.stringify(simplifiedTree, null, 2)}

Required JSON Output Format Example:
${exampleFormat}
`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            // Request JSON response formatting if supported
            responseMimeType: "application/json"
          }
        })
      }
    );

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error?.message || 'Gemini API request failed');
    }

    const data = await response.json();
    let textContent = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Clean up potential markdown formatting from the response
    textContent = textContent.trim();
    if (textContent.startsWith('```json')) {
      textContent = textContent.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    } else if (textContent.startsWith('```')) {
      textContent = textContent.replace(/^```\n?/, '').replace(/\n?```$/, '').trim();
    }
    
    // Validate if it is valid JSON
    try {
      JSON.parse(textContent);
    } catch (parseError) {
      console.warn("Gemini output was not perfect JSON, attempting basic recovery.", parseError);
      // Basic JSON recovery: try finding the first '{' and last '}'
      const firstBrace = textContent.indexOf('{');
      const lastBrace = textContent.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        textContent = textContent.substring(firstBrace, lastBrace + 1);
        // Test parsing again
        JSON.parse(textContent);
      } else {
        throw new Error("Gemini returned invalid JSON that could not be parsed: " + textContent.substring(0, 100) + "...");
      }
    }
    
    return textContent;
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw error;
  }
}
