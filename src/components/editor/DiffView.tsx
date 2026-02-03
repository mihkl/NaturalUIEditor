import { useMemo } from 'react';

interface DiffViewProps {
  original: string;
  modified: string;
}

interface DiffLine {
  type: 'unchanged' | 'added' | 'removed';
  content: string;
  lineNumber: number | null;
}

export function DiffView({ original, modified }: DiffViewProps) {
  const diff = useMemo(() => computeDiff(original, modified), [original, modified]);

  return (
    <div className="font-mono text-xs overflow-auto max-h-[400px]">
      {diff.map((line, i) => (
        <div
          key={i}
          className={`flex ${
            line.type === 'added'
              ? 'bg-green-50'
              : line.type === 'removed'
              ? 'bg-red-50'
              : ''
          }`}
        >
          <div className="w-8 flex-shrink-0 text-right pr-2 text-gray-400 border-r border-gray-200 select-none">
            {line.lineNumber ?? ''}
          </div>
          <div className="w-6 flex-shrink-0 text-center select-none">
            {line.type === 'added' && <span className="text-green-600">+</span>}
            {line.type === 'removed' && <span className="text-red-600">-</span>}
          </div>
          <pre
            className={`flex-1 px-2 whitespace-pre-wrap break-all ${
              line.type === 'added'
                ? 'text-green-800'
                : line.type === 'removed'
                ? 'text-red-800'
                : 'text-gray-800'
            }`}
          >
            {line.content || ' '}
          </pre>
        </div>
      ))}
    </div>
  );
}

/**
 * Simple line-by-line diff algorithm
 */
function computeDiff(original: string, modified: string): DiffLine[] {
  const originalLines = original.split('\n');
  const modifiedLines = modified.split('\n');

  // Use LCS-based diff
  const lcs = longestCommonSubsequence(originalLines, modifiedLines);
  const result: DiffLine[] = [];

  let origIdx = 0;
  let modIdx = 0;
  let lineNum = 1;

  for (const [origLcsIdx, modLcsIdx] of lcs) {
    // Add removed lines (in original but not in LCS match)
    while (origIdx < origLcsIdx) {
      result.push({
        type: 'removed',
        content: originalLines[origIdx],
        lineNumber: null,
      });
      origIdx++;
    }

    // Add added lines (in modified but not in LCS match)
    while (modIdx < modLcsIdx) {
      result.push({
        type: 'added',
        content: modifiedLines[modIdx],
        lineNumber: lineNum++,
      });
      modIdx++;
    }

    // Add unchanged line
    result.push({
      type: 'unchanged',
      content: originalLines[origIdx],
      lineNumber: lineNum++,
    });
    origIdx++;
    modIdx++;
  }

  // Add remaining removed lines
  while (origIdx < originalLines.length) {
    result.push({
      type: 'removed',
      content: originalLines[origIdx],
      lineNumber: null,
    });
    origIdx++;
  }

  // Add remaining added lines
  while (modIdx < modifiedLines.length) {
    result.push({
      type: 'added',
      content: modifiedLines[modIdx],
      lineNumber: lineNum++,
    });
    modIdx++;
  }

  return result;
}

/**
 * Compute LCS indices for diff
 */
function longestCommonSubsequence(a: string[], b: string[]): [number, number][] {
  const m = a.length;
  const n = b.length;

  // DP table
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to find LCS
  const result: [number, number][] = [];
  let i = m;
  let j = n;

  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      result.unshift([i - 1, j - 1]);
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  return result;
}
