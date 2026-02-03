import { Toolbar } from './Toolbar';
import { Highlight } from './Highlight';
import { EditorPanel } from '../editor/EditorPanel';
import { useInspector } from '@/hooks/useInspector';

export function Inspector() {
  const {
    state,
    hoveredElement,
    componentCode,
    isApplied,
    startInspecting,
    stopInspecting,
    requestModification,
    applyChanges,
    revertChanges,
    closeEditor,
    clearModification,
  } = useInspector();

  return (
    <>
      <Toolbar
        isInspecting={state.isInspecting}
        onStartInspecting={startInspecting}
        onStopInspecting={stopInspecting}
      />

      {state.isInspecting && <Highlight element={hoveredElement} />}

      {state.isEditorOpen && state.selectedElement && (
        <EditorPanel
          element={state.selectedElement}
          componentCode={componentCode}
          modification={state.modification}
          isLoading={state.isLoading}
          error={state.error}
          isApplied={isApplied}
          onRequestModification={requestModification}
          onApply={applyChanges}
          onRevert={revertChanges}
          onClose={closeEditor}
          onClearModification={clearModification}
        />
      )}
    </>
  );
}
