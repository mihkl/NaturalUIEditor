import { MousePointer2, X } from 'lucide-react';

interface ToolbarProps {
  isInspecting: boolean;
  onStartInspecting: () => void;
  onStopInspecting: () => void;
}

export function Toolbar({ isInspecting, onStartInspecting, onStopInspecting }: ToolbarProps) {
  return (
    <div
      data-inspector-ui
      className="fixed bottom-4 right-4 z-[10002] flex items-center gap-2 bg-white rounded-lg shadow-lg border border-gray-200 p-2"
    >
      {isInspecting ? (
        <>
          <span className="text-sm text-gray-600 px-2">Click an element to edit</span>
          <button
            onClick={onStopInspecting}
            className="flex items-center gap-2 px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
          >
            <X size={16} />
            Cancel
          </button>
        </>
      ) : (
        <button
          onClick={onStartInspecting}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          <MousePointer2 size={16} />
          Edit UI
        </button>
      )}
    </div>
  );
}
