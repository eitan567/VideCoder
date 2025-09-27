import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { FileNode, OpenFile, AgentStatus, AgentLog } from '../types';
import FileExplorer from './FileExplorer';
import CenterPanel from './CenterPanel';
import PreviewPanel from './PreviewPanel';
import { findFileByPath, updateFileContent, renameNodeByPath } from '../utils/fileTree';

interface EditorPageProps {
  initialPrompt: string;
  initialFileTree: FileNode[];
  onBackToHome: () => void;
}

const EditorPage: React.FC<EditorPageProps> = ({ initialPrompt, initialFileTree, onBackToHome }) => {
  const [fileTree, setFileTree] = useState<FileNode[]>(initialFileTree);
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([]);
  const [activeFilePath, setActiveFilePath] = useState<string | null>(null);
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [renamingPath, setRenamingPath] = useState<string | null>(null);
  
  const [agentStatus, setAgentStatus] = useState<AgentStatus>('idle');
  const [agentLogs, setAgentLogs] = useState<AgentLog[]>([
    { id: 1, type: 'user', text: `Initial prompt: ${initialPrompt}` },
    { id: 2, type: 'action', text: 'Project generated successfully.' }
  ]);
  
  const initialFileOpened = useRef(false);
  
  const handleFileSelect = useCallback((path: string) => {
    setRenamingPath(null); // Cancel any rename when selecting a file
    const isOpen = openFiles.some(f => f.path === path);
    if (!isOpen) {
      const file = findFileByPath(fileTree, path);
      if (file && file.type === 'file' && file.content !== undefined) {
        setOpenFiles(prev => [...prev, {
          path,
          content: file.content!,
          savedContent: file.content!
        }]);
      }
    }
    setActiveFilePath(path);
  }, [fileTree, openFiles]);

  useEffect(() => {
    if (initialFileTree && !initialFileOpened.current) {
        const indexHtmlPath = '/index.html';
        const indexHtmlNode = findFileByPath(initialFileTree, indexHtmlPath);
        if (indexHtmlNode) {
            handleFileSelect(indexHtmlPath);
            initialFileOpened.current = true;
        }
    }
  }, [initialFileTree, handleFileSelect]);

  const buildPreviewHtml = useCallback((tree: FileNode[]): string => {
    const indexHtmlNode = findFileByPath(tree, '/index.html');
    if (!indexHtmlNode || typeof indexHtmlNode.content !== 'string') {
        return '<div style="padding: 1rem; color: #f87171;">Error: index.html not found.</div>';
    }

    let html = indexHtmlNode.content;
    const replacements = [];

    const linkRegex = /<link[^>]+?href="([^"]+)"/gi;
    let linkMatch;
    while ((linkMatch = linkRegex.exec(html)) !== null) {
        const fullTag = linkMatch[0];
        const href = linkMatch[1];
        if (href.startsWith('http') || href.startsWith('//')) continue;
        const cssPath = '/' + href.replace(/^\.?\//, '');
        const cssFile = findFileByPath(tree, cssPath);
        if (cssFile && cssFile.content) {
            replacements.push({ find: fullTag, replace: `<style>${cssFile.content}</style>` });
        } else {
            replacements.push({ find: fullTag, replace: `<!-- Vibe Coder: Could not find local stylesheet: ${href} -->` });
        }
    }

    const scriptRegex = /<script[^>]+?src="([^"]+)"[^>]*?><\/script>/gi;
    let scriptMatch;
    while ((scriptMatch = scriptRegex.exec(html)) !== null) {
        const fullTag = scriptMatch[0];
        const src = scriptMatch[1];
        if (src.startsWith('http') || src.startsWith('//')) continue;
        const preservedAttrs = fullTag.replace(/<script/i, '').replace(/><\/script>/i, '').replace(/src=(["']).*?\1/, '').trim();
        const jsPath = '/' + src.replace(/^\.?\//, '');
        const jsFile = findFileByPath(tree, jsPath);
        if (jsFile && jsFile.content) {
            replacements.push({ find: fullTag, replace: `<script ${preservedAttrs}>${jsFile.content}</script>` });
        } else {
            replacements.push({ find: fullTag, replace: `<!-- Vibe Coder: Could not find local script: ${src} -->` });
        }
    }
    
    for (const item of replacements) {
        html = html.replace(item.find, item.replace);
    }

    return html;
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
        setHtmlContent(buildPreviewHtml(fileTree));
    }, 500);

    return () => {
        clearTimeout(handler);
    };
  }, [fileTree, buildPreviewHtml]);
  
  const handleFileContentChange = useCallback((path: string, newContent: string) => {
    setOpenFiles(prev => prev.map(f => f.path === path ? { ...f, content: newContent } : f));
  }, []);

  const handleSaveFile = useCallback((path:string) => {
    const fileToSave = openFiles.find(f => f.path === path);
    if (!fileToSave) return;
    const newFileTree = updateFileContent(fileTree, path, fileToSave.content);
    setFileTree(newFileTree);
    setOpenFiles(prev => prev.map(f => f.path === path ? { ...f, savedContent: f.content } : f));
  }, [fileTree, openFiles]);

  // Auto-save useEffect
  useEffect(() => {
    if (agentStatus !== 'idle') {
      return;
    }

    const unsavedFiles = openFiles.filter(f => f.content !== f.savedContent);
    if (unsavedFiles.length === 0) {
      return;
    }

    const timer = setTimeout(() => {
      if (agentStatus !== 'idle') {
        return;
      }

      let newTree = fileTree;
      for (const file of unsavedFiles) {
        newTree = updateFileContent(newTree, file.path, file.content);
      }
      setFileTree(newTree);

      setOpenFiles(prevOpenFiles => 
        prevOpenFiles.map(of => {
          const wasUnsaved = unsavedFiles.some(uf => uf.path === of.path);
          return wasUnsaved ? { ...of, savedContent: of.content } : of;
        })
      );
    }, 3000); // 3-second delay

    return () => clearTimeout(timer);
  }, [openFiles, agentStatus, fileTree]);


  const handleCloseFile = useCallback((path: string) => {
    const fileIndex = openFiles.findIndex(f => f.path === path);
    if (fileIndex === -1) return;
    const newOpenFiles = openFiles.filter(f => f.path !== path);
    setOpenFiles(newOpenFiles);
    if (activeFilePath === path) {
      if (newOpenFiles.length > 0) {
        const newActiveIndex = Math.max(0, fileIndex - 1);
        setActiveFilePath(newOpenFiles[newActiveIndex].path);
      } else {
        setActiveFilePath(null);
      }
    }
  }, [openFiles, activeFilePath]);
  
  const handleSetActiveFile = useCallback((path: string | null) => {
      setActiveFilePath(path);
  }, []);

  const handleAgentRequest = async (request: string) => {
    setAgentStatus('working');
    setAgentLogs(prev => [...prev, { id: Date.now(), type: 'user', text: request }]);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setAgentLogs(prev => [...prev, { id: Date.now() + 1, type: 'thought', text: "This is a placeholder for agent logic." }]);
    setAgentLogs(prev => [...prev, { id: Date.now() + 2, type: 'action', text: "Completed placeholder task." }]);
    setAgentStatus('idle');
  };

  const handleInitiateRename = useCallback((path: string) => {
    setRenamingPath(path);
  }, []);

  const handleCancelRename = useCallback(() => {
    setRenamingPath(null);
  }, []);

  const handleCommitRename = useCallback((oldPath: string, newName: string) => {
    if (!newName || newName.includes('/')) {
        alert("Invalid name. Name cannot be empty or contain slashes.");
        setRenamingPath(null);
        return;
    }

    const { tree: newFileTree, error } = renameNodeByPath(fileTree, oldPath, newName);

    if (error) {
        alert(error);
        setRenamingPath(null);
        return;
    }
    
    setFileTree(newFileTree);

    const parentPath = oldPath.substring(0, oldPath.lastIndexOf('/'));
    const newPath = `${parentPath}/${newName}`;

    const updatedOpenFiles = openFiles.map(file => {
        if (file.path === oldPath) {
            return { ...file, path: newPath };
        }
        if (file.path.startsWith(oldPath + '/')) {
            const newFilePath = newPath + file.path.substring(oldPath.length);
            return { ...file, path: newFilePath };
        }
        return file;
    });
    setOpenFiles(updatedOpenFiles);

    if (activeFilePath) {
        if (activeFilePath === oldPath) {
            setActiveFilePath(newPath);
        } else if (activeFilePath.startsWith(oldPath + '/')) {
            const newActivePath = newPath + activeFilePath.substring(oldPath.length);
            setActiveFilePath(newActivePath);
        }
    }

    setRenamingPath(null);
  }, [fileTree, openFiles, activeFilePath]);
  
  const handleManualRefresh = useCallback(() => {
    setHtmlContent(buildPreviewHtml(fileTree));
  }, [fileTree, buildPreviewHtml]);

  return (
    <div className="h-screen w-screen bg-gray-950 text-white flex flex-col">
      <header className="flex items-center justify-between p-2 border-b border-gray-800 bg-gray-900 flex-shrink-0">
        <h1 className="text-xl font-bold">Vibe Coder</h1>
        <button onClick={onBackToHome} className="text-sm hover:bg-gray-700 px-3 py-1 rounded-md">
          &larr; Back to Home
        </button>
      </header>
      <main className="flex-1 flex overflow-hidden">
        <div className="w-[250px] flex-shrink-0 h-full border-r border-gray-800">
          <FileExplorer 
            fileTree={fileTree} 
            onFileSelect={handleFileSelect}
            activeFilePath={activeFilePath}
            renamingPath={renamingPath}
            onInitiateRename={handleInitiateRename}
            onCancelRename={handleCancelRename}
            onCommitRename={handleCommitRename}
          />
        </div>
        <div className="flex-1 flex flex-col min-w-0">
            <div className="flex-1 flex h-full">
                <div className="w-1/2 h-full border-r border-gray-800">
                    <CenterPanel 
                      openFiles={openFiles}
                      activeFilePath={activeFilePath}
                      onFileContentChange={handleFileContentChange}
                      onSaveFile={handleSaveFile}
                      onCloseFile={handleCloseFile}
                      onSetActiveFile={handleSetActiveFile}
                      agentStatus={agentStatus}
                      agentLogs={agentLogs}
                      onAgentRequest={handleAgentRequest}
                    />
                </div>
                <div className="w-1/2 h-full">
                    <PreviewPanel 
                        htmlContent={htmlContent} 
                        onRefresh={handleManualRefresh} 
                        agentStatus={agentStatus}
                    />
                </div>
            </div>
        </div>
      </main>
    </div>
  );
};

export default EditorPage;