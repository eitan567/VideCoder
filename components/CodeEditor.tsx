
import React, { useRef, useEffect } from 'react';
import { OpenFile, AgentStatus } from '../types';

// Let TypeScript know about the Monaco editor global from the script tag in index.html
declare global {
  interface Window {
    require: any;
    monaco: any;
  }
}

const getLanguageForFile = (filePath: string): string => {
    const extension = filePath.split('.').pop()?.toLowerCase();
    switch (extension) {
        case 'js':
        case 'jsx':
            return 'javascript';
        case 'ts':
        case 'tsx':
            return 'typescript';
        case 'css':
            return 'css';
        case 'json':
            return 'json';
        case 'html':
            return 'html';
        default:
            return 'plaintext';
    }
};

interface CodeEditorProps {
  file: OpenFile;
  onContentChange: (path: string, newContent: string) => void;
  onSave: (path: string) => void;
  agentStatus: AgentStatus;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ file, onContentChange, onSave, agentStatus }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const monacoInstanceRef = useRef<any>(null);
  const subscriptionRef = useRef<any>(null);
  const fileRef = useRef(file);
  fileRef.current = file;

  const isUnsaved = file.content !== file.savedContent;
  const canSave = isUnsaved && agentStatus === 'idle';

  useEffect(() => {
    // This effect handles the entire lifecycle of the Monaco instance
    let editor: any;

    const initMonaco = () => {
      if (editorRef.current) {
        editor = window.monaco.editor.create(editorRef.current, {
          value: fileRef.current.content,
          language: getLanguageForFile(fileRef.current.path),
          theme: 'vs-dark',
          automaticLayout: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          wordWrap: 'on',
        });

        monacoInstanceRef.current = editor;

        subscriptionRef.current = editor.onDidChangeModelContent(() => {
          const currentContent = editor.getValue();
          if (currentContent !== fileRef.current.content) {
              onContentChange(fileRef.current.path, currentContent);
          }
        });
      }
    };

    if (window.monaco) {
      initMonaco();
    } else if (window.require) {
      window.require(['vs/editor/editor.main'], () => {
        initMonaco();
      });
    }

    return () => {
      // Cleanup on component unmount
      if (monacoInstanceRef.current) {
        subscriptionRef.current?.dispose();
        monacoInstanceRef.current.dispose();
        monacoInstanceRef.current = null;
      }
    };
  }, []); // Empty dependency array ensures this runs only on mount/unmount

  useEffect(() => {
    // This effect handles updates when the active file changes
    if (monacoInstanceRef.current) {
      const editor = monacoInstanceRef.current;
      const model = editor.getModel();
      const language = getLanguageForFile(file.path);
      
      if (model) {
        window.monaco.editor.setModelLanguage(model, language);
      }
      
      // Only update the value if it's an external change (not from user typing)
      if (editor.getValue() !== file.content) {
        editor.setValue(file.content);
      }
    }
  }, [file.path, file.content]); // Re-run when file path or content changes

  return (
    <div className="flex flex-col h-full bg-gray-950">
      <div className="flex-shrink-0 flex items-center justify-between p-2 border-b border-gray-800 bg-gray-900">
        <span className="text-sm font-mono">{file.path}</span>
        <button
          onClick={() => onSave(file.path)}
          disabled={!canSave}
          className="px-4 py-1 text-sm bg-green-600 text-white rounded-md font-semibold hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
        >
          {agentStatus === 'working' ? 'Agent is Busy' : 'Save'}
        </button>
      </div>
      <div className="flex-1 min-h-0">
        <div className="relative w-full h-full">
           <div ref={editorRef} className="absolute inset-0" />
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;
