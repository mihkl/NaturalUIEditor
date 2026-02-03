import { useState } from 'react';
import { X, Wand2, Loader2, Undo2, GitPullRequest, ExternalLink, Code, Eye } from 'lucide-react';
import { DiffView } from './DiffView';
import { LivePreview } from './LivePreview';
import type { InspectedElement, ModificationResponse } from '@/types';
import { normalizeFilePath } from '@/services/sourceLocator';

interface EditorPanelProps {
  element: InspectedElement;
  componentCode: { code: string; startLine: number; endLine: number; name: string | null } | null;
  modification: ModificationResponse | null;
  isLoading: boolean;
  error: string | null;
  onRequestModification: (instruction: string) => void;
  onCreatePR: () => Promise<string | null>;
  onClose: () => void;
}

export function EditorPanel({
  element,
  componentCode,
  modification,
  isLoading,
  error,
  onRequestModification,
  onCreatePR,
  onClose,
}: EditorPanelProps) {
  const [instruction, setInstruction] = useState('');
  const [prUrl, setPrUrl] = useState<string | null>(null);
  const [isCreatingPR, setIsCreatingPR] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'diff'>('preview');

  const handleCreatePR = async () => {
    setIsCreatingPR(true);
    const url = await onCreatePR();
    if (url) {
      setPrUrl(url);
    }
    setIsCreatingPR(false);
  };

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

        {/* Modification preview */}
        {modification && modification.success && (
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 font-medium">Explanation:</p>
              <p className="text-sm text-blue-700">{modification.explanation}</p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'preview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Eye size={16} />
                Live Preview
              </button>
              <button
                onClick={() => setActiveTab('diff')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'diff'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Code size={16} />
                Code Changes
              </button>
            </div>

            {/* Tab content */}
            {activeTab === 'preview' ? (
              <LivePreview
                code={modification.modifiedCode}
                componentName={componentCode?.name || 'App'}
              />
            ) : (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <DiffView
                  original={modification.originalCode}
                  modified={modification.modifiedCode}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer actions */}
      {modification && modification.success && (
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 space-y-2">
          {prUrl ? (
            <a
              href={prUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
              <ExternalLink size={18} />
              View Pull Request
            </a>
          ) : (
            <>
              <button
                onClick={handleCreatePR}
                disabled={isLoading || isCreatingPR}
                className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:bg-gray-300 transition-colors"
              >
                {isCreatingPR ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Creating PR...
                  </>
                ) : (
                  <>
                    <GitPullRequest size={18} />
                    Create Pull Request
                  </>
                )}
              </button>
              <button
                onClick={onClose}
                disabled={isLoading || isCreatingPR}
                className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 transition-colors"
              >
                <Undo2 size={18} />
                Discard Changes
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
