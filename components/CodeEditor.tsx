
import React from 'react';
import { OpenFile, AgentStatus } from '../types';

interface CodeEditorProps {
  file: OpenFile;
  onContentChange: (path: string, newContent: string) => void;
  onSave: (path: string) => void;
  agentStatus: AgentStatus;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ file, onContentChange, onSave, agentStatus }) => {
  const isUnsaved = file.content !== file.savedContent;
  const canSave = isUnsaved && agentStatus === 'idle';

  return (
    <div className="flex flex-col h-full bg-gray-950">
      <div className="flex items-center justify-between p-2 border-b border-gray-800 bg-gray-900">
        <span className="text-sm font-mono">{file.path}</span>
        <button
          onClick={() => onSave(file.path)}
          disabled={!canSave}
          className="px-4 py-1 text-sm bg-green-600 text-white rounded-md font-semibold hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
        >
          {agentStatus === 'working' ? 'Agent is Busy' : 'Save'}
        </button>
      </div>
      <textarea
        value={file.content}
        onChange={(e) => onContentChange(file.path, e.target.value)}
        className="flex-1 w-full h-full bg-transparent text-gray-300 p-4 font-mono text-sm focus:outline-none resize-none"
        spellCheck="false"
      />
    </div>
  );
};

export default CodeEditor;
