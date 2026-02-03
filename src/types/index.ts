// Source location info from React fiber
export interface SourceLocation {
  fileName: string;
  lineNumber: number;
  columnNumber?: number;
}

// Element info for the inspector
export interface InspectedElement {
  element: HTMLElement;
  source: SourceLocation | null;
  componentName: string | null;
  rect: DOMRect;
}

// AI modification request
export interface ModificationRequest {
  source: SourceLocation;
  instruction: string;
  currentCode: string;
  context?: string;
}

// AI modification response
export interface ModificationResponse {
  success: boolean;
  originalCode: string;
  modifiedCode: string;
  explanation: string;
  error?: string;
}

// GitHub commit info
export interface CommitInfo {
  owner: string;
  repo: string;
  branch: string;
  filePath: string;
  message: string;
  content: string;
  sha?: string; // Required for updates
}

// Editor state
export interface EditorState {
  isInspecting: boolean;
  selectedElement: InspectedElement | null;
  isEditorOpen: boolean;
  isLoading: boolean;
  modification: ModificationResponse | null;
  error: string | null;
}

// Config for GitHub (Gemini key comes from env)
export interface GitHubConfig {
  githubToken: string;
  repoOwner: string;
  repoName: string;
  branch: string;
}
