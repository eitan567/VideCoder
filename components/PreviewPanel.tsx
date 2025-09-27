import React from 'react';
import { AgentStatus } from '../types';

interface PreviewPanelProps {
  htmlContent: string;
  onRefresh: () => void;
  agentStatus: AgentStatus;
}

const RefreshIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 9a8 8 0 0113.52-5.07M20 15a8 8 0 01-13.52 5.07" />
  </svg>
);


const PreviewPanel: React.FC<PreviewPanelProps> = ({ htmlContent, onRefresh, agentStatus }) => {
  return (
    <div className="flex flex-col h-full">
      <div className="p-2 border-b border-gray-800 bg-gray-900 flex items-center justify-between">
        <h3 className="text-sm font-bold">Preview</h3>
        <button
          onClick={onRefresh}
          className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Refresh preview"
          disabled={agentStatus !== 'idle'}
        >
          <RefreshIcon />
        </button>
      </div>
      <iframe
        srcDoc={htmlContent}
        title="Preview"
        className="w-full h-full border-0 bg-white"
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
};

export default PreviewPanel;