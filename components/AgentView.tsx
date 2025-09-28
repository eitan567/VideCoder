
import React, { useState, useRef, useEffect } from 'react';
import { AgentLog, AgentStatus } from '../types';

interface AgentViewProps {
  logs: AgentLog[];
  status: AgentStatus;
  onAgentRequest: (request: string) => Promise<void>;
  hasGenerationError?: boolean;
  onRetry?: () => void;
}

const AgentView: React.FC<AgentViewProps> = ({ logs, status, onAgentRequest, hasGenerationError, onRetry }) => {
  const [input, setInput] = useState('');
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && status === 'idle') {
      onAgentRequest(input);
      setInput('');
    }
  };

  const getLogStyle = (type: AgentLog['type']) => {
    switch (type) {
      case 'user':
        return 'bg-blue-600/20 border-l-4 border-blue-500';
      case 'action':
        return 'bg-green-600/20 border-l-4 border-green-500';
      case 'thought':
        return 'text-gray-400 italic';
      case 'error':
        return 'bg-red-600/20 border-l-4 border-red-500 text-red-300';
      default:
        return '';
    }
  };

  return (
    <div className="flex flex-col h-full p-4">
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {logs.map(log => (
          <div key={log.id} className={`p-3 rounded-md text-sm ${getLogStyle(log.type)}`}>
            <pre className="whitespace-pre-wrap font-sans">{log.text}</pre>
            {log.type === 'error' && onRetry && (
              <div className="mt-2">
                <button
                  onClick={onRetry}
                  className="w-full px-3 py-1.5 bg-blue-600 text-white rounded-md font-semibold text-sm hover:bg-blue-700 transition-colors mt-2"
                >
                  Retry Generation
                </button>
              </div>
            )}
          </div>
        ))}
         {status === 'working' && (
            <div className="flex items-center text-gray-400">
                <svg className="animate-spin mr-2 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Agent is thinking...
            </div>
         )}
        <div ref={logsEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="mt-4 border-t border-gray-700 pt-4">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={status === 'idle' ? "Tell the agent what to do next..." : "Agent is working..."}
            disabled={status !== 'idle'}
            className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 pl-4 pr-24 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={status !== 'idle' || !input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1 bg-blue-600 text-white rounded-md font-semibold text-sm hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default AgentView;
