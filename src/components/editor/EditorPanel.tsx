import { useState } from 'react';
import { X, Wand2, RotateCcw, Loader2, Play, Undo2, Check } from 'lucide-react';
import { DiffView } from './DiffView';
import type { InspectedElement, ModificationResponse } from '@/types';
import { normalizeFilePath } from '@/services/sourceLocator';

interface EditorPanelProps {
  element: InspectedElement;
  componentCode: { code: string; startLine: number; endLine: number; name: string | null } | null;
  modification: ModificationResponse | null;
  isLoading: boolean;
  error: string | null;
  isApplied: boolean;
  onRequestModification: (instruction: string) => void;
  onApply: () => void;
  onRevert: () => void;
  onClose: () => void;
  onClearModification: () => void;
}

export function EditorPanel({
  element,
  componentCode,
  modification,
  isLoading,
  error,
  isApplied,
  onRequestModification,
  onApply,
  onRevert,
  onClose,
  onClearModification,
}: EditorPanelProps) {
  const [instruction, setInstruction] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (instruction.trim() && !isLoading) {
      onRequestModification(instruction.trim());
    }
  };

  const fileName = element.source
    ? normalizeFilePath(element.source.fileName).split('/').pop()
    : 'Unknown';

  return (
    <div
      data-inspector-ui
      className="fixed inset-y-0 right-0 w-[600px] bg-white shadow-2xl z-[10003] flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Edit UI Element</h2>
          <p className="text-sm text-gray-500">
            {componentCode?.name || 'Element'} · {fileName}
            {element.source && `:${element.source.lineNumber}`}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-md transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Instruction input */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            What would you like to change?
          </label>
          <textarea
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder="e.g., Make this button larger with more padding, change the color to green..."
            className="w-full h-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            disabled={isLoading || !!modification}
          />
          {!modification && (
            <button
              type="submit"
              disabled={!instruction.trim() || isLoading}
              className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 size={18} />
                  Generate Modification
                </>
              )}
            </button>
          )}
        </form>

        {/* Error display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Applied success message */}
        {isApplied && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <Check size={18} className="text-green-600" />
            <span className="text-sm text-green-700 font-medium">
              Changes applied! Check the live preview.
            </span>
          </div>
        )}

        {/* Modification preview */}
        {modification && modification.success && (
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 font-medium">Explanation:</p>
              <p className="text-sm text-blue-700">{modification.explanation}</p>
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
                <span className="text-sm font-medium text-gray-700">Code Changes</span>
              </div>
              <DiffView
                original={modification.originalCode}
                modified={modification.modifiedCode}
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer actions */}
      {modification && modification.success && (
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 space-y-2">
          {!isApplied ? (
            <button
              onClick={onApply}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 transition-colors"
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Play size={18} />
              )}
              Apply Changes (Live Preview)
            </button>
          ) : (
            <button
              onClick={onRevert}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-300 transition-colors"
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Undo2 size={18} />
              )}
              Revert Changes
            </button>
          )}
          <button
            onClick={onClearModification}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 transition-colors"
          >
            <RotateCcw size={18} />
            Try Different Instruction
          </button>
        </div>
      )}
    </div>
  );
}
