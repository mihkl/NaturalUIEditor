import { useState, useCallback, useEffect, useRef } from 'react';
import type { InspectedElement, EditorState } from '@/types';
import { inspectElement, shouldIgnoreElement, normalizeFilePath } from '@/services/sourceLocator';
import { fetchSourceCode, findContainingComponent, applyModificationByLines, createPullRequest } from '@/services/fileService';
import { generateModification } from '@/services/aiService';

const initialState: EditorState = {
  isInspecting: false,
  selectedElement: null,
  isEditorOpen: false,
  isLoading: false,
  modification: null,
  error: null,
};

export function useInspector() {
  const [state, setState] = useState<EditorState>(initialState);
  const [hoveredElement, setHoveredElement] = useState<InspectedElement | null>(null);
  const [sourceCode, setSourceCode] = useState<string>('');
  const [componentCode, setComponentCode] = useState<{ code: string; startLine: number; endLine: number; name: string | null } | null>(null);

  const isInspectingRef = useRef(false);

  const startInspecting = useCallback(() => {
    isInspectingRef.current = true;
    setState(prev => ({ ...prev, isInspecting: true }));
    document.body.classList.add('inspecting');
  }, []);

  const stopInspecting = useCallback(() => {
    isInspectingRef.current = false;
    setState(prev => ({ ...prev, isInspecting: false }));
    setHoveredElement(null);
    document.body.classList.remove('inspecting');
  }, []);

  useEffect(() => {
    if (!state.isInspecting) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isInspectingRef.current) return;

      const element = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
      if (!element || shouldIgnoreElement(element)) {
        setHoveredElement(null);
        return;
      }

      const inspected = inspectElement(element);
      setHoveredElement(inspected);
    };

    const handleClick = async (e: MouseEvent) => {
      if (!isInspectingRef.current) return;

      e.preventDefault();
      e.stopPropagation();

      const element = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
      if (!element || shouldIgnoreElement(element)) return;

      const inspected = inspectElement(element);

      if (!inspected.source) {
        setState(prev => ({
          ...prev,
          isInspecting: false,
          error: 'Could not find source location for this element. Try clicking a different element.',
        }));
        isInspectingRef.current = false;
        document.body.classList.remove('inspecting');
        return;
      }

      isInspectingRef.current = false;
      setState(prev => ({
        ...prev,
        isInspecting: false,
        selectedElement: inspected,
        isEditorOpen: true,
        error: null,
      }));
      setHoveredElement(null);
      document.body.classList.remove('inspecting');

      try {
        const source = await fetchSourceCode(inspected.source.fileName);
        setSourceCode(source);

        const component = findContainingComponent(source, inspected.source.lineNumber);
        setComponentCode(component);
      } catch (err) {
        setState(prev => ({
          ...prev,
          error: `Could not fetch source: ${err instanceof Error ? err.message : 'Unknown error'}`,
        }));
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('click', handleClick, true);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('click', handleClick, true);
    };
  }, [state.isInspecting]);

  const requestModification = useCallback(async (instruction: string) => {
    if (!state.selectedElement?.source || !componentCode) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await generateModification({
        source: state.selectedElement.source,
        instruction,
        currentCode: componentCode.code,
        context: `Component: ${componentCode.name || 'Unknown'}`,
      });

      setState(prev => ({
        ...prev,
        isLoading: false,
        modification: response,
        error: response.success ? null : response.error || 'Modification failed',
      }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      }));
    }
  }, [state.selectedElement, componentCode]);

  const createPR = useCallback(async (): Promise<string | null> => {
    if (!state.selectedElement?.source || !state.modification?.success || !componentCode) return null;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const filePath = normalizeFilePath(state.selectedElement.source.fileName);

      // Compute the full modified file content
      const modifiedSource = applyModificationByLines(
        sourceCode,
        componentCode.startLine,
        componentCode.endLine,
        state.modification.modifiedCode
      );

      const result = await createPullRequest(filePath, modifiedSource, state.modification.explanation);

      if (result.success && result.prUrl) {
        setState(prev => ({ ...prev, isLoading: false }));
        return result.prUrl;
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: result.error || 'Failed to create pull request',
        }));
        return null;
      }
    } catch (err) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to create pull request',
      }));
      return null;
    }
  }, [state.selectedElement, state.modification, sourceCode, componentCode]);

  const closeEditor = useCallback(() => {
    setState(initialState);
    setSourceCode('');
    setComponentCode(null);
  }, []);

  return {
    state,
    hoveredElement,
    componentCode,
    startInspecting,
    stopInspecting,
    requestModification,
    createPR,
    closeEditor,
  };
}
