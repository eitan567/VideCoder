
import React, { useState, useMemo } from 'react';
import { generateProject } from '../services/geminiService';
import { FileNode, Provider } from '../types';
import { AI_PROVIDERS } from '../constants';

interface LandingPageProps {
  onProjectGenerated: (prompt: string, fileTree: FileNode[]) => void;
  initialPrompt: string;
  promptHistory: string[];
}

const LandingPage: React.FC<LandingPageProps> = ({ onProjectGenerated, initialPrompt, promptHistory }) => {
  const [prompt, setPrompt] = useState(initialPrompt || '');
  const [selectedProviderId, setSelectedProviderId] = useState<string>(AI_PROVIDERS[0].id);
  const [selectedModelId, setSelectedModelId] = useState<string>(AI_PROVIDERS[0].models[0].id);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedProvider = useMemo(() => AI_PROVIDERS.find(p => p.id === selectedProviderId) as Provider, [selectedProviderId]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt.");
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const fileTree = await generateProject(prompt);
      if (fileTree.length > 0 && fileTree[0].name === 'error.log') {
         setError(fileTree[0].content || 'Failed to generate project.');
      } else {
         onProjectGenerated(prompt, fileTree);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleHistoryClick = (historicPrompt: string) => {
    setPrompt(historicPrompt);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 p-4">
      <div className="w-full max-w-2xl text-center">
        <h1 className="text-5xl font-bold text-white mb-2">
          Vibe Coder
        </h1>
        <p className="text-lg text-gray-400 mb-8">
          Describe your application, and let the AI bring it to life.
        </p>

        <div className="bg-gray-900 border border-gray-700 rounded-lg p-2 shadow-lg flex flex-col">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., A Pomodoro timer with a clean, minimalist interface and a progress circle."
            className="w-full bg-transparent text-white placeholder-gray-500 focus:outline-none p-4 resize-none h-32"
            disabled={isLoading}
          />
          <div className="flex items-center justify-between p-2 border-t border-gray-700 mt-2">
            <div className="flex items-center space-x-2">
              <select
                value={selectedProviderId}
                onChange={e => {
                  setSelectedProviderId(e.target.value);
                  const provider = AI_PROVIDERS.find(p => p.id === e.target.value);
                  if (provider) setSelectedModelId(provider.models[0].id);
                }}
                className="bg-gray-800 border border-gray-700 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              >
                {AI_PROVIDERS.map(provider => (
                  <option key={provider.id} value={provider.id}>{provider.name}</option>
                ))}
              </select>
              <select
                value={selectedModelId}
                onChange={e => setSelectedModelId(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading || !selectedProvider}
              >
                {selectedProvider?.models.map(model => (
                  <option key={model.id} value={model.id}>{model.name}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleGenerate}
              disabled={isLoading || !prompt.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </>
              ) : "Generate"}
            </button>
          </div>
        </div>
         {promptHistory.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm text-gray-400 mb-2">Recent Prompts</h3>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {promptHistory.map((p, index) => (
                <button
                  key={index}
                  onClick={() => handleHistoryClick(p)}
                  className="bg-gray-800 text-white text-sm px-3 py-1 border border-gray-600 rounded-full hover:bg-gray-700 hover:border-gray-500 transition-colors"
                  title={p}
                >
                  <span className="truncate max-w-xs">{p.length > 50 ? `${p.substring(0, 50)}...` : p}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        {error && <p className="text-red-400 mt-4">{error}</p>}
      </div>
    </div>
  );
};

export default LandingPage;
