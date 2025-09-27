
import React, { useState, useCallback, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import EditorPage from './components/EditorPage';
import { FileNode } from './types';

type AppState = {
  view: 'landing';
} | {
  view: 'editor';
  initialPrompt: string;
  initialFileTree: FileNode[];
};

const PROMPT_HISTORY_KEY = 'vibeCoder_promptHistory';
const MAX_HISTORY_SIZE = 5;

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>({ view: 'landing' });
  const [promptHistory, setPromptHistory] = useState<string[]>([]);
  const [lastPrompt, setLastPrompt] = useState<string>('');

  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem(PROMPT_HISTORY_KEY);
      if (storedHistory) {
        const parsedHistory = JSON.parse(storedHistory);
        if (Array.isArray(parsedHistory)) {
          setPromptHistory(parsedHistory);
          if (parsedHistory.length > 0) {
            setLastPrompt(parsedHistory[0]); // The most recent is the last one used
          }
        }
      }
    } catch (error) {
      console.error("Failed to load prompt history from localStorage:", error);
    }
  }, []);

  const handleProjectGenerated = useCallback((prompt: string, fileTree: FileNode[]) => {
    setLastPrompt(prompt);

    setPromptHistory(prevHistory => {
      const newHistory = [prompt, ...prevHistory.filter(p => p !== prompt)].slice(0, MAX_HISTORY_SIZE);
      try {
        localStorage.setItem(PROMPT_HISTORY_KEY, JSON.stringify(newHistory));
      } catch (error) {
        console.error("Failed to save prompt history to localStorage:", error);
      }
      return newHistory;
    });

    setAppState({
      view: 'editor',
      initialPrompt: prompt,
      initialFileTree: fileTree,
    });
  }, []);
  
  const handleBackToHome = useCallback(() => {
    setAppState({ view: 'landing' });
  }, []);

  return (
    <div className="min-h-screen font-sans">
      {appState.view === 'landing' && (
        <LandingPage
          onProjectGenerated={handleProjectGenerated}
          initialPrompt={lastPrompt}
          promptHistory={promptHistory}
        />
      )}
      {appState.view === 'editor' && (
        <EditorPage
          initialPrompt={appState.initialPrompt}
          initialFileTree={appState.initialFileTree}
          onBackToHome={handleBackToHome}
        />
      )}
    </div>
  );
};

export default App;
