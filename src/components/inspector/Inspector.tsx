import { Toolbar } from './Toolbar';
import { Highlight } from './Highlight';
import { EditorPanel } from '../editor/EditorPanel';
import { useInspector } from '@/hooks/useInspector';

export function Inspector() {
  const {
    state,
    hoveredElement,
    componentCode,
    startInspecting,
    stopInspecting,
    requestModification,
    createPR,
    closeEditor,
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
          onRequestModification={requestModification}
          onCreatePR={createPR}
          onClose={closeEditor}
        />
      )}
    </>
  );
}
