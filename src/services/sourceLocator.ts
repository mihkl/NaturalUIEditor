import type { SourceLocation, InspectedElement } from '@/types';

/**
 * Gets the React fiber node from a DOM element
 */
function getFiberFromElement(element: HTMLElement): unknown | null {
  const key = Object.keys(element).find(
    (k) => k.startsWith('__reactFiber$') || k.startsWith('__reactInternalInstance$')
  );
  return key ? (element as unknown as Record<string, unknown>)[key] : null;
}

/**
 * Parses source location from a stack trace string
 */
function parseStackTrace(stack: string): SourceLocation | null {
  const stackLines = stack.split('\n');

  for (const line of stackLines) {
    // Match: (http://localhost:PORT/src/path/file.tsx?t=123:LINE:COL) or without query
    const match = line.match(/\(http:\/\/[^/]+\/([^?:]+)(?:\?[^:]*)?:(\d+):(\d+)\)/) ||
                  line.match(/at\s+http:\/\/[^/]+\/([^?:]+)(?:\?[^:]*)?:(\d+):(\d+)/) ||
                  line.match(/http:\/\/[^/]+\/([^?:]+)(?:\?[^:]*)?:(\d+):(\d+)/);

    if (match) {
      const [, filePath, lineNum, colNum] = match;
      if (filePath.includes('node_modules') || filePath.includes('react')) continue;
      if (filePath.startsWith('src/')) {
        return {
          fileName: '/' + filePath,
          lineNumber: parseInt(lineNum, 10),
          columnNumber: parseInt(colNum, 10),
        };
      }
    }
  }

  return null;
}

/**
 * Extracts source location from a React fiber node
 */
function getSourceFromFiber(fiber: unknown): SourceLocation | null {
  if (!fiber || typeof fiber !== 'object') return null;

  const f = fiber as Record<string, unknown>;

  // Try _debugSource first (React 17 and earlier)
  if (f._debugSource && typeof f._debugSource === 'object') {
    const source = f._debugSource as Record<string, unknown>;
    if (source.fileName && typeof source.lineNumber === 'number') {
      return {
        fileName: String(source.fileName),
        lineNumber: source.lineNumber,
        columnNumber: typeof source.columnNumber === 'number' ? source.columnNumber : undefined,
      };
    }
  }

  // Try _debugStack (React 18+)
  if (f._debugStack) {
    if (typeof f._debugStack === 'string') {
      const source = parseStackTrace(f._debugStack);
      if (source) return source;
    } else if (f._debugStack instanceof Error) {
      const source = parseStackTrace(f._debugStack.stack || '');
      if (source) return source;
    }
  }

  // Try _debugOwner's stack
  if (f._debugOwner && typeof f._debugOwner === 'object') {
    const owner = f._debugOwner as Record<string, unknown>;
    if (owner._debugStack) {
      if (typeof owner._debugStack === 'string') {
        const source = parseStackTrace(owner._debugStack);
        if (source) return source;
      } else if (owner._debugStack instanceof Error) {
        const source = parseStackTrace((owner._debugStack as Error).stack || '');
        if (source) return source;
      }
    }
  }

  // Walk up the fiber tree
  let current = f.return as Record<string, unknown> | null;
  let depth = 0;
  while (current && depth < 20) {
    depth++;

    if (current._debugSource && typeof current._debugSource === 'object') {
      const source = current._debugSource as Record<string, unknown>;
      if (source.fileName && typeof source.lineNumber === 'number') {
        return {
          fileName: String(source.fileName),
          lineNumber: source.lineNumber,
          columnNumber: typeof source.columnNumber === 'number' ? source.columnNumber : undefined,
        };
      }
    }

    if (current._debugStack) {
      if (typeof current._debugStack === 'string') {
        const source = parseStackTrace(current._debugStack);
        if (source) return source;
      } else if (current._debugStack instanceof Error) {
        const source = parseStackTrace(current._debugStack.stack || '');
        if (source) return source;
      }
    }

    current = current.return as Record<string, unknown> | null;
  }

  return null;
}

/**
 * Gets the component name from a fiber node
 */
function getComponentNameFromFiber(fiber: unknown): string | null {
  if (!fiber || typeof fiber !== 'object') return null;

  const f = fiber as Record<string, unknown>;

  if (f.type) {
    if (typeof f.type === 'function') {
      return (f.type as { displayName?: string; name?: string }).displayName ||
             (f.type as { name?: string }).name ||
             null;
    }
    if (typeof f.type === 'string') {
      return f.type;
    }
  }

  let current = f.return as Record<string, unknown> | null;
  while (current) {
    if (current.type && typeof current.type === 'function') {
      const name = (current.type as { displayName?: string; name?: string }).displayName ||
                   (current.type as { name?: string }).name;
      if (name) return name;
    }
    current = current.return as Record<string, unknown> | null;
  }

  return null;
}

/**
 * Inspects a DOM element and extracts its React source location
 */
export function inspectElement(element: HTMLElement): InspectedElement {
  const fiber = getFiberFromElement(element);
  const source = getSourceFromFiber(fiber);
  const componentName = getComponentNameFromFiber(fiber);
  const rect = element.getBoundingClientRect();

  return {
    element,
    source,
    componentName,
    rect,
  };
}

/**
 * Normalizes a file path from Vite's format to a relative path
 */
export function normalizeFilePath(filePath: string): string {
  let normalized = filePath.replace(/^\//, '');
  normalized = normalized.replace(/^(@fs\/|@vite\/)/, '');
  normalized = normalized.replace(/\\/g, '/');
  // Remove Vite's cache-busting query strings like ?t=123456
  normalized = normalized.replace(/\?.*$/, '');
  return normalized;
}

/**
 * Checks if an element should be ignored
 */
export function shouldIgnoreElement(element: HTMLElement): boolean {
  if (element.closest('[data-inspector-ui]')) return true;
  const fiber = getFiberFromElement(element);
  if (!fiber) return true;
  return false;
}
