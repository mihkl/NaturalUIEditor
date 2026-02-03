import { useMemo } from 'react';
import {
  SandpackProvider,
  SandpackPreview,
  useSandpack,
} from '@codesandbox/sandpack-react';

interface LivePreviewProps {
  code: string;
  componentName: string;
}

// Extract imports and component from the code
function parseComponent(code: string, componentName: string) {
  // Find all import statements
  const importRegex = /^import\s+.+\s+from\s+['"][^'"]+['"];?\s*$/gm;
  const imports: string[] = [];
  let match;

  while ((match = importRegex.exec(code)) !== null) {
    // Skip local imports that won't exist in sandbox
    if (!match[0].includes("'@/") && !match[0].includes("'./") && !match[0].includes("'../")) {
      imports.push(match[0]);
    }
  }

  // Remove imports from code to get just the component
  const codeWithoutImports = code.replace(importRegex, '').trim();

  return { imports, codeWithoutImports };
}

function PreviewErrorBoundary({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function SandpackErrorDisplay() {
  const { sandpack } = useSandpack();

  if (sandpack.error) {
    return (
      <div className="p-4 text-sm text-red-600 bg-red-50">
        <p className="font-medium">Preview Error:</p>
        <pre className="mt-1 text-xs whitespace-pre-wrap">{sandpack.error.message}</pre>
      </div>
    );
  }

  return null;
}

export function LivePreview({ code, componentName }: LivePreviewProps) {
  const files = useMemo(() => {
    const { imports, codeWithoutImports } = parseComponent(code, componentName);

    // Create a wrapper that renders the component
    const appCode = `
${imports.join('\n')}

${codeWithoutImports}

export default function App() {
  return <${componentName || 'PreviewComponent'} />;
}
`;

    return {
      '/App.tsx': appCode,
      '/styles.css': `
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: system-ui, -apple-system, sans-serif; }
      `,
    };
  }, [code, componentName]);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Live Preview</span>
        <span className="text-xs text-gray-500">Powered by Sandpack</span>
      </div>
      <div className="h-[300px] overflow-hidden">
        <SandpackProvider
          template="react-ts"
          files={files}
          theme="light"
          options={{
            externalResources: [
              'https://cdn.tailwindcss.com',
            ],
            classes: {
              'sp-wrapper': 'h-full',
              'sp-preview': 'h-full',
              'sp-preview-container': 'h-full',
            },
          }}
          customSetup={{
            dependencies: {
              'lucide-react': 'latest',
            },
          }}
        >
          <PreviewErrorBoundary>
            <SandpackErrorDisplay />
            <SandpackPreview
              showNavigator={false}
              showRefreshButton={true}
              showOpenInCodeSandbox={false}
              style={{ height: '100%' }}
            />
          </PreviewErrorBoundary>
        </SandpackProvider>
      </div>
    </div>
  );
}
