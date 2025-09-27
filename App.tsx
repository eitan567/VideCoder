
import React, { useState, useCallback } from 'react';
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

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>({ view: 'landing' });

  const handleProjectGenerated = useCallback((prompt: string, fileTree: FileNode[]) => {
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
      {appState.view === 'landing' && <LandingPage onProjectGenerated={handleProjectGenerated} />}
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
