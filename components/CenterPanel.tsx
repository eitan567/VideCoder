import React, { useMemo } from 'react';
import { OpenFile, AgentStatus } from '../types';
import CodeEditor from './CodeEditor';

interface CenterPanelProps {
  openFiles: OpenFile[];
  activeFilePath: string | null;
  onFileContentChange: (path: string, newContent: string) => void;
  onSaveFile: (path: string) => void;
  onCloseFile: (path: string) => void;
  onSetActiveFile: (path: string | null) => void;
  agentStatus: AgentStatus;
}

const CenterPanel: React.FC<CenterPanelProps> = (props) => {
  const activeFile = useMemo(() => {
    return props.openFiles.find(f => f.path === props.activeFilePath);
  }, [props.openFiles, props.activeFilePath]);

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {props.openFiles.length > 0 && (
        <div className="flex border-b border-gray-800">
          {props.openFiles.map(file => (
            <div key={file.path}
              className={`flex items-center px-4 py-2 text-sm border-r border-gray-800 ${props.activeFilePath === file.path ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800/50'}`}
            >
              <button className="mr-2" onClick={() => props.onSetActiveFile(file.path)}>
                {file.path.split('/').pop()}
                {file.content !== file.savedContent && <span className="ml-1 text-yellow-400">*</span>}
              </button>
              <button onClick={() => props.onCloseFile(file.path)} className="text-gray-500 hover:text-white text-xs">✕</button>
            </div>
          ))}
        </div>
      )}
      <div className="flex-1 min-h-0">
        {activeFile ? (
          <CodeEditor
            file={activeFile}
            onContentChange={props.onFileContentChange}
            onSave={props.onSaveFile}
            agentStatus={props.agentStatus}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select a file to start editing.
          </div>
        )}
      </div>
    </div>
  );
};

export default CenterPanel;