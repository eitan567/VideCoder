import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { FileNode, OpenFile, AgentStatus, AgentLog } from '../types';
import FileExplorer from './FileExplorer';
import CenterPanel from './CenterPanel';
import PreviewPanel from './PreviewPanel';
import AgentView from './AgentView';
import { updateFileContent, renameNodeByPath, resolvePath, createFileMap } from '../utils/fileTree';

interface EditorPageProps {
  initialPrompt: string;
  initialFileTree: FileNode[];
  onBackToHome: () => void;
}

const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);

const EditorPage: React.FC<EditorPageProps> = ({ initialPrompt, initialFileTree, onBackToHome }) => {
  const [fileTree, setFileTree] = useState<FileNode[]>(initialFileTree);
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([]);
  const [activeFilePath, setActiveFilePath] = useState<string | null>(null);
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [renamingPath, setRenamingPath] = useState<string | null>(null);
  const [previewPath, setPreviewPath] = useState<string>('/index.html');
  const [isDownloading, setIsDownloading] = useState(false);
  
  const [agentStatus, setAgentStatus] = useState<AgentStatus>('idle');
  const [agentLogs, setAgentLogs] = useState<AgentLog[]>([
    { id: 1, type: 'user', text: `Initial prompt: ${initialPrompt}` },
    { id: 2, type: 'action', text: 'Project generated successfully.' }
  ]);
  
  const initialFileOpened = useRef(false);

  const fileMap = useMemo(() => createFileMap(fileTree), [fileTree]);
  
  const handleFileSelect = useCallback((path: string) => {
    setRenamingPath(null); // Cancel any rename when selecting a file
    const isOpen = openFiles.some(f => f.path === path);
    if (!isOpen) {
      const file = fileMap.get(path);
      if (file && file.type === 'file' && file.content !== undefined) {
        setOpenFiles(prev => [...prev, {
          path,
          content: file.content!,
          savedContent: file.content!
        }]);
      }
    }
    setActiveFilePath(path);
  }, [fileMap, openFiles]);

  useEffect(() => {
    if (initialFileTree && !initialFileOpened.current) {
        const indexHtmlPath = '/index.html';
        const indexHtmlNode = fileMap.get(indexHtmlPath);
        if (indexHtmlNode) {
            handleFileSelect(indexHtmlPath);
            initialFileOpened.current = true;
        }
    }
  }, [initialFileTree, handleFileSelect, fileMap]);
  
  const buildPreviewHtml = useCallback((htmlFilePath: string, allFilesMap: Map<string, FileNode>): string => {
    const htmlNode = allFilesMap.get(htmlFilePath);
    if (!htmlNode || htmlNode.type !== 'file' || typeof htmlNode.content !== 'string') {
        return `<div style="color: #f87171; font-family: sans-serif; padding: 1rem;">Preview Error: File not found at <code>${htmlFilePath}</code>.</div>`;
    }

    let html = htmlNode.content;
    const basePath = htmlFilePath.substring(0, htmlFilePath.lastIndexOf('/'));

    const headInjection = `
      <base href="${htmlFilePath}">
      <script>
        document.addEventListener('click', e => {
          if (e.defaultPrevented) return;
          const anchor = e.target.closest('a');
          if (anchor && anchor.href) {
            const targetUrl = new URL(anchor.href);
            const isExternal = targetUrl.origin !== location.origin;
            const isDownload = anchor.hasAttribute('download');
            if (!isExternal && !isDownload) {
              e.preventDefault();
              window.parent.postMessage({ type: 'navigate', path: targetUrl.pathname }, '*');
            }
          }
        });
      <\/script>
    `;
    
    if (html.includes('</head>')) {
        html = html.replace('</head>', `${headInjection}</head>`);
    } else {
        html = headInjection + html;
    }

    // Find and replace local CSS <link> tags with <style> tags
    const linkRegex = /<link[^>]+?href="([^"]+)"/gi;
    html = html.replace(linkRegex, (fullTag, href) => {
        if (href.startsWith('http') || href.startsWith('//') || href.startsWith('data:')) return fullTag;
        
        const cssPath = resolvePath(basePath, href);
        const cssFile = allFilesMap.get(cssPath);

        if (cssFile && cssFile.type === 'file' && cssFile.content) {
            return `<style>${cssFile.content}</style>`;
        }
        return `<!-- Vibe Coder: Could not find local stylesheet: ${href} (resolved to ${cssPath}) -->`;
    });

    // Find and replace local JS <script> tags with inline scripts
    const scriptRegex = /<script[^>]+?src="([^"]+)"[^>]*?><\/script>/gi;
    html = html.replace(scriptRegex, (fullTag, src) => {
        if (src.startsWith('http') || src.startsWith('//') || src.startsWith('data:')) return fullTag;
        
        const preservedAttrs = fullTag.replace(/<script/i, '').replace(/><\/script>/i, '').replace(/src=(["']).*?\1/, '').trim();
        const jsPath = resolvePath(basePath, src);
        const jsFile = allFilesMap.get(jsPath);

        if (jsFile && jsFile.type === 'file' && jsFile.content) {
            return `<script ${preservedAttrs}>${jsFile.content}</script>`;
        }
        return `<!-- Vibe Coder: Could not find local script: ${src} (resolved to ${jsPath}) -->`;
    });

    return html;
  }, []);

  // Listen for navigation messages from the iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'navigate') {
        setPreviewPath(event.data.path);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // Rebuild preview content when file tree or preview path changes
  useEffect(() => {
    const handler = setTimeout(() => {
        setHtmlContent(buildPreviewHtml(previewPath, fileMap));
    }, 500);

    return () => {
        clearTimeout(handler);
    };
  }, [fileMap, buildPreviewHtml, previewPath]);
  
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
    // Reset preview to the main index.html file
    setPreviewPath('/index.html');
  }, []);

  const handleDownloadProject = async () => {
    const JSZip = (window as any).JSZip;
    if (!JSZip) {
      console.error("JSZip library not found.");
      alert("Error: Could not download project because the JSZip library is missing.");
      return;
    }

    setIsDownloading(true);
    
    try {
      const zip = new JSZip();

      const addFilesToZip = (zipFolder: any, nodes: FileNode[]) => {
        nodes.forEach(node => {
          if (node.type === 'file' && node.content !== undefined) {
            zipFolder.file(node.name, node.content);
          } else if (node.type === 'folder' && node.children) {
            const folder = zipFolder.folder(node.name);
            if (folder) {
              addFilesToZip(folder, node.children);
            }
          }
        });
      };

      addFilesToZip(zip, fileTree);

      const content = await zip.generateAsync({ type: 'blob' });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = 'vibe-coder-project.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

    } catch (error) {
      console.error("Failed to create zip file:", error);
      alert("An error occurred while creating the zip file.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-gray-950 text-white flex flex-col">
      <header className="flex items-center justify-between p-2 border-b border-gray-800 bg-gray-900 flex-shrink-0">
        <h1 className="text-xl font-bold">Vibe Coder</h1>
        <div className="flex items-center space-x-2">
            <button 
                onClick={handleDownloadProject} 
                disabled={isDownloading}
                className="text-sm flex items-center bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded-md disabled:opacity-50 disabled:cursor-wait"
            >
                {isDownloading ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Zipping...
                    </>
                ) : (
                    <>
                        <DownloadIcon />
                        Download Project
                    </>
                )}
            </button>
            <button onClick={onBackToHome} className="text-sm hover:bg-gray-700 px-3 py-1 rounded-md">
                &larr; Back to Home
            </button>
        </div>
      </header>
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top section: Explorer, Editor, Preview */}
        <div className="flex-1 flex overflow-hidden">
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
          <div className="flex-1 flex min-w-0">
              <div className="w-1/2 h-full border-r border-gray-800">
                  <CenterPanel 
                    openFiles={openFiles}
                    activeFilePath={activeFilePath}
                    onFileContentChange={handleFileContentChange}
                    onSaveFile={handleSaveFile}
                    onCloseFile={handleCloseFile}
                    onSetActiveFile={handleSetActiveFile}
                    agentStatus={agentStatus}
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
        {/* Bottom section: Agent */}
        <div className="h-[350px] flex-shrink-0 border-t border-gray-800">
          <AgentView
              logs={agentLogs}
              status={agentStatus}
              onAgentRequest={handleAgentRequest}
          />
        </div>
      </main>
    </div>
  );
};

export default EditorPage;