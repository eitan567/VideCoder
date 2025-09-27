
import React, { useState, useMemo } from 'react';
import { OpenFile, AgentStatus, AgentLog } from '../types';
import AgentView from './AgentView';
import CodeEditor from './CodeEditor';

interface CenterPanelProps {
  openFiles: OpenFile[];
  activeFilePath: string | null;
  onFileContentChange: (path: string, newContent: string) => void;
  onSaveFile: (path: string) => void;
  onCloseFile: (path: string) => void;
  onSetActiveFile: (path: string | null) => void;
  agentStatus: AgentStatus;
  agentLogs: AgentLog[];
  onAgentRequest: (request: string) => Promise<void>;
}

type ActiveTab = 'agent' | 'editor';

const CenterPanel: React.FC<CenterPanelProps> = (props) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('agent');

  const activeFile = useMemo(() => {
    return props.openFiles.find(f => f.path === props.activeFilePath);
  }, [props.openFiles, props.activeFilePath]);
  
  // Switch to editor tab when a file becomes active
  React.useEffect(() => {
    if (props.activeFilePath) {
      setActiveTab('editor');
    }
  }, [props.activeFilePath]);

  return (
    <div className="flex flex-col h-full bg-gray-900">
      <div className="flex border-b border-gray-800">
        <button
          onClick={() => setActiveTab('agent')}
          className={`px-4 py-2 text-sm ${activeTab === 'agent' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800/50'}`}
        >
          Agent
        </button>
        {props.openFiles.map(file => (
          <div key={file.path}
             className={`flex items-center px-4 py-2 text-sm border-r border-gray-800 ${props.activeFilePath === file.path ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800/50'}`}
          >
            <button className="mr-2" onClick={() => {
              props.onSetActiveFile(file.path);
              setActiveTab('editor');
            }}>
              {file.path.split('/').pop()}
              {file.content !== file.savedContent && <span className="ml-1 text-yellow-400">*</span>}
            </button>
             <button onClick={() => props.onCloseFile(file.path)} className="text-gray-500 hover:text-white text-xs">✕</button>
          </div>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'agent' && (
          <AgentView
            logs={props.agentLogs}
            status={props.agentStatus}
            onAgentRequest={props.onAgentRequest}
          />
        )}
        {activeTab === 'editor' && activeFile && (
          <CodeEditor
            file={activeFile}
            onContentChange={props.onFileContentChange}
            onSave={props.onSaveFile}
            agentStatus={props.agentStatus}
          />
        )}
        {activeTab === 'editor' && !activeFile && (
             <div className="flex items-center justify-center h-full text-gray-500">
                Select a file to start editing.
            </div>
        )}
      </div>
    </div>
  );
};

export default CenterPanel;
