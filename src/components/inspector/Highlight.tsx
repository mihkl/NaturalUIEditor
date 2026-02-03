import type { InspectedElement } from '@/types';
import { normalizeFilePath } from '@/services/sourceLocator';

interface HighlightProps {
  element: InspectedElement | null;
}

export function Highlight({ element }: HighlightProps) {
  if (!element) return null;

  const { rect, source, componentName } = element;

  // Build the label text
  let label = componentName || 'Unknown';
  if (source) {
    const fileName = normalizeFilePath(source.fileName).split('/').pop();
    label = `${componentName || 'Element'} · ${fileName}:${source.lineNumber}`;
  }

  // Position the label above the element, or below if near top
  const labelTop = rect.top > 30 ? rect.top - 24 : rect.bottom + 4;

  return (
    <>
      {/* Highlight box */}
      <div
        className="inspector-highlight"
        style={{
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        }}
      />

      {/* Label */}
      <div
        className="inspector-label"
        style={{
          top: labelTop,
          left: rect.left,
        }}
      >
        {label}
      </div>
    </>
  );
}
