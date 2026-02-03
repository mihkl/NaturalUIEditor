/**
 * File service for reading and writing source files in development mode.
 */

import { normalizeFilePath } from './sourceLocator';

/**
 * Fetches the source code of a file using Vite's dev server
 */
export async function fetchSourceCode(filePath: string): Promise<string> {
  const normalized = normalizeFilePath(filePath);

  try {
    const response = await fetch(`/${normalized}?raw`);
    if (response.ok) {
      return await response.text();
    }
  } catch {
    // Fall through
  }

  try {
    const response = await fetch(`/${normalized}`);
    if (response.ok) {
      const text = await response.text();
      if (!text.includes('import.meta') && !text.includes('__vite')) {
        return text;
      }
    }
  } catch {
    // Fall through
  }

  throw new Error(`Could not fetch source for: ${filePath}`);
}

/**
 * Writes content to a file via the dev server API.
 * This triggers HMR for live preview.
 */
export async function writeSourceFile(filePath: string, content: string): Promise<void> {
  const normalized = normalizeFilePath(filePath);
  
  // Normalize line endings to Unix style before writing
  const normalizedContent = content.replace(/\r\n/g, '\n');
  
  console.log('Writing file:', normalized, 'Content length:', normalizedContent.length);

  const response = await fetch('/__write-file', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filePath: normalized, content: normalizedContent }),
  });

  console.log('Write response status:', response.status);

  if (!response.ok) {
    const error = await response.json();
    console.error('Write error:', error);
    throw new Error(error.error || 'Failed to write file');
  }

  const result = await response.json();
  console.log('Write result:', result);
}

/**
 * Reverts a file to its backup (before modification)
 */
export async function revertSourceFile(filePath: string): Promise<boolean> {
  const normalized = normalizeFilePath(filePath);

  const response = await fetch('/__revert-file', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filePath: normalized }),
  });

  if (response.ok) {
    return true;
  }

  return false;
}

/**
 * Finds the component/function that contains a given line number
 */
export function findContainingComponent(source: string, lineNumber: number): {
  code: string;
  startLine: number;
  endLine: number;
  name: string | null;
} {
  const lines = source.split('\n');

  const patterns = [
    /^(?:export\s+)?(?:default\s+)?function\s+(\w+)/,
    /^(?:export\s+)?const\s+(\w+)\s*[=:]\s*(?:\([^)]*\)|[^=])*=>\s*[{(]?/,
    /^(?:export\s+)?const\s+(\w+)\s*[=:]\s*function/,
    /^(?:export\s+)?class\s+(\w+)/,
  ];

  let componentStart = -1;
  let componentName: string | null = null;
  let braceCount = 0;
  let inComponent = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (!inComponent) {
      for (const pattern of patterns) {
        const match = line.match(pattern);
        if (match) {
          componentStart = i;
          componentName = match[1] || null;
          inComponent = true;
          break;
        }
      }
    }

    if (inComponent) {
      for (const char of line) {
        if (char === '{' || char === '(') braceCount++;
        if (char === '}' || char === ')') braceCount--;
      }

      if (braceCount === 0 && i > componentStart) {
        if (lineNumber >= componentStart + 1 && lineNumber <= i + 1) {
          return {
            code: lines.slice(componentStart, i + 1).join('\n'),
            startLine: componentStart + 1,
            endLine: i + 1,
            name: componentName,
          };
        }
        inComponent = false;
        componentStart = -1;
        componentName = null;
      }
    }
  }

  // Fallback: return context around the line
  const startLine = Math.max(0, lineNumber - 30);
  const endLine = Math.min(lines.length, lineNumber + 30);
  return {
    code: lines.slice(startLine, endLine).join('\n'),
    startLine: startLine + 1,
    endLine,
    name: null,
  };
}

/**
 * Applies a code modification by replacing lines in the source file.
 * Uses line-based replacement for reliability.
 */
export function applyModificationByLines(
  originalSource: string,
  startLine: number,
  endLine: number,
  modifiedCode: string
): string {
  // Normalize line endings to Unix style
  const normalizedSource = originalSource.replace(/\r\n/g, '\n');
  const normalizedModified = modifiedCode.replace(/\r\n/g, '\n');

  const lines = normalizedSource.split('\n');

  // startLine and endLine are 1-indexed
  const before = lines.slice(0, startLine - 1);
  const after = lines.slice(endLine);

  return [...before, normalizedModified, ...after].join('\n');
}

/**
 * Applies a code modification to a source file (text-based fallback)
 */
export function applyModification(
  originalSource: string,
  originalCode: string,
  modifiedCode: string
): string {
  if (originalSource.includes(originalCode)) {
    return originalSource.replace(originalCode, modifiedCode);
  }

  // Normalize and try again
  const normalizedOriginal = originalCode.replace(/\r\n/g, '\n').trim();
  const normalizedSource = originalSource.replace(/\r\n/g, '\n');

  if (normalizedSource.includes(normalizedOriginal)) {
    return normalizedSource.replace(normalizedOriginal, modifiedCode);
  }

  console.warn('Could not find exact code match, returning modified source with replacement');

  // Last resort: try to find by first and last lines
  const origLines = normalizedOriginal.split('\n');
  const firstLine = origLines[0].trim();
  const lastLine = origLines[origLines.length - 1].trim();

  const sourceLines = normalizedSource.split('\n');
  let startIdx = -1;
  let endIdx = -1;

  for (let i = 0; i < sourceLines.length; i++) {
    if (sourceLines[i].trim() === firstLine && startIdx === -1) {
      startIdx = i;
    }
    if (startIdx !== -1 && sourceLines[i].trim() === lastLine) {
      endIdx = i;
      break;
    }
  }

  if (startIdx !== -1 && endIdx !== -1) {
    const before = sourceLines.slice(0, startIdx);
    const after = sourceLines.slice(endIdx + 1);
    return [...before, modifiedCode, ...after].join('\n');
  }

  throw new Error('Could not find code to replace. The original code may have been modified.');
}
