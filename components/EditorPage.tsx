import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { generateProject } from '../services/geminiService';
import { generateProjectWithOpenRouter } from '../services/openRouterService';
import { generateProjectWithKiloCode } from '../services/kilocodeService';
import { FileNode, OpenFile, AgentStatus, AgentLog } from '../types';
import FileExplorer from './FileExplorer';
import CenterPanel from './CenterPanel';
import PreviewPanel from './PreviewPanel';
import AgentView from './AgentView';
import { updateFileContent, renameNodeByPath, resolvePath, createFileMap } from '../utils/fileTree';

interface EditorPageProps {
  initialPrompt: string;
  providerId: string;
  modelId: string;
  onBackToHome: () => void;
}

const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);

const EditorPage: React.FC<EditorPageProps> = ({ initialPrompt, providerId, modelId, onBackToHome }) => {
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [isGenerating, setIsGenerating] = useState(true);
  const [hasGenerationError, setHasGenerationError] = useState(false);
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([]);
  const [activeFilePath, setActiveFilePath] = useState<string | null>(null);
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [renamingPath, setRenamingPath] = useState<string | null>(null);
  const [previewPath, setPreviewPath] = useState<string>('/index.html');
  const [isDownloading, setIsDownloading] = useState(false);
  
  const [agentStatus, setAgentStatus] = useState<AgentStatus>('idle');
  const [agentLogs, setAgentLogs] = useState<AgentLog[]>([
    { id: 1, type: 'user', text: `Generating project for: ${initialPrompt}` },
    { id: 2, type: 'thought', text: 'Initializing AI generation...' }
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

  const hasGenerated = useRef(false);

  useEffect(() => {
    const generateAndSetTree = async () => {
      if (fileTree.length === 0 && !hasGenerated.current) {
        hasGenerated.current = true;
        console.log('Starting project generation in EditorPage...');
        setAgentLogs(prev => [...prev, { id: Date.now(), type: 'action', text: 'Calling AI API...' }]);

        // Simulate progress with placeholders
        const simulationInterval = setInterval(() => {
          setFileTree(prev => {
            if (prev.length < 3) {
              return [...prev, {
                name: `loading-step-${prev.length + 1}`,
                type: 'folder' as const,
                children: [{ name: 'temp.js', type: 'file' as const, content: '// Loading...' }]
              }];
            }
            return prev;
          });
        }, 1000);

        try {
          let result: FileNode[];
          if (providerId === 'google') {
            result = await generateProject(initialPrompt);
          } else if (providerId === 'openrouter') {
            result = await generateProjectWithOpenRouter(initialPrompt, modelId);
          } else if (providerId === 'kilocode') {
            result = await generateProjectWithKiloCode(initialPrompt, modelId);
          } else {
            throw new Error(`Unsupported provider: ${providerId}`);
          }
          clearInterval(simulationInterval);

          if (result.length > 0 && result[0].name === 'error.log') {
            const errorContent = result[0].content || 'Unknown error';
            const isQuotaError = errorContent.includes('429') || errorContent.includes('quota exceeded');
            const userFriendlyMsg = isQuotaError
              ? 'API quota exceeded. You\'ve reached your daily limit of 250 free requests. Please wait for reset or upgrade your plan.'
              : `Generation error: ${errorContent}`;
            setAgentLogs(prev => [...prev, { id: Date.now() + 1, type: 'error', text: userFriendlyMsg }]);
            setFileTree([{ name: 'error.log', type: 'file' as const, content: errorContent }]);
            setHasGenerationError(true);
          } else {
            setAgentLogs(prev => [...prev, { id: Date.now() + 1, type: 'action', text: 'Received response from AI. Now processing and creating files/folders...' }]);
            await processGeneratedFiles(result);
            setAgentLogs(prev => [...prev, { id: Date.now() + 2, type: 'action', text: 'Project files generated successfully!' }]);
            setHasGenerationError(false);
          }
        } catch (e) {
          clearInterval(simulationInterval);
          const errorMsg = e instanceof Error ? e.message : 'Unknown error';
          const isQuotaError = errorMsg.includes('429') || errorMsg.includes('quota exceeded') || errorMsg.includes('RESOURCE_EXHAUSTED');
          const userFriendlyMsg = isQuotaError
            ? 'API quota exceeded. You\'ve reached your daily limit of 250 free requests. Please wait for reset or upgrade your plan.'
            : `Generation failed: ${errorMsg}`;
          setAgentLogs(prev => [...prev, { id: Date.now() + 1, type: 'error', text: userFriendlyMsg }]);
          setFileTree([{ name: 'error.log', type: 'file' as const, content: `Error: ${errorMsg}` }]);
          setHasGenerationError(true);
        } finally {
          // Ensure isGenerating is set to false after all other operations complete
          setIsGenerating(false);
          console.log('Project generation complete in EditorPage.');
        }
      }
    };

    generateAndSetTree();
  }, []); // Empty dependency array since we only want this to run once

  const retryGeneration = useCallback(async () => {
    hasGenerated.current = false; // Reset the generation flag for retry
    setHasGenerationError(false);
    setIsGenerating(true);
    setFileTree([]);
    setAgentLogs(prev => [...prev, { id: Date.now(), type: 'action', text: 'Retrying generation...' }]);
    // Re-run the generation logic with current provider and model
    const simulationInterval = setInterval(() => {
      setFileTree(prev => {
        if (prev.length < 3) {
          return [...prev, {
            name: `loading-step-${prev.length + 1}`,
            type: 'folder' as const,
            children: [{ name: 'temp.js', type: 'file' as const, content: '// Loading...' }]
          }];
        }
        return prev;
      });
    }, 1000);

    try {
      let result: FileNode[];
      if (providerId === 'google') {
        result = await generateProject(initialPrompt);
      } else if (providerId === 'openrouter') {
        result = await generateProjectWithOpenRouter(initialPrompt, modelId);
      } else if (providerId === 'kilocode') {
        result = await generateProjectWithKiloCode(initialPrompt, modelId);
      } else {
        throw new Error(`Unsupported provider: ${providerId}`);
      }
      clearInterval(simulationInterval);

      if (result.length > 0 && result[0].name === 'error.log') {
        const errorContent = result[0].content || 'Unknown error';
        const isQuotaError = errorContent.includes('429') || errorContent.includes('quota exceeded');
        const userFriendlyMsg = isQuotaError
          ? 'API quota exceeded. You\'ve reached your daily limit of 250 free requests. Please wait for reset or upgrade your plan.'
          : `Generation error: ${errorContent}`;
        setAgentLogs(prev => [...prev, { id: Date.now() + 1, type: 'error', text: userFriendlyMsg }]);
        setFileTree([{ name: 'error.log', type: 'file' as const, content: errorContent }]);
        setHasGenerationError(true);
      } else {
        setAgentLogs(prev => [...prev, { id: Date.now() + 1, type: 'action', text: 'Received response from AI. Now processing and creating files/folders...' }]);
        await processGeneratedFiles(result);
        setAgentLogs(prev => [...prev, { id: Date.now() + 2, type: 'action', text: 'Project files generated successfully!' }]);
        setHasGenerationError(false);
      }
    } catch (e) {
      clearInterval(simulationInterval);
      const errorMsg = e instanceof Error ? e.message : 'Unknown error';
      const isQuotaError = errorMsg.includes('429') || errorMsg.includes('quota exceeded') || errorMsg.includes('RESOURCE_EXHAUSTED');
      const userFriendlyMsg = isQuotaError
        ? 'API quota exceeded. You\'ve reached your daily limit of 250 free requests. Please wait for reset or upgrade your plan.'
        : `Generation failed: ${errorMsg}`;
      setAgentLogs(prev => [...prev, { id: Date.now() + 1, type: 'error', text: userFriendlyMsg }]);
      setFileTree([{ name: 'error.log', type: 'file' as const, content: `Error: ${errorMsg}` }]);
      setHasGenerationError(true);
    } finally {
      setIsGenerating(false);
      console.log('Project generation complete in EditorPage.');
    }
  }, [initialPrompt, providerId, modelId]);

  const processGeneratedFiles = async (nodes: FileNode[]) => {
    try {
      setFileTree(nodes); // Set full tree immediately for explorer visibility

      // Traverse recursively and log each node with delay for progress in logs
      function logNodes(currentNodes: FileNode[], currentPath: string) {
        let index = 0;
        const logNext = () => {
          if (index < currentNodes.length) {
            const node = currentNodes[index];
            const fullPath = currentPath ? `${currentPath}/${node.name}` : `/${node.name}`;
            setAgentLogs((prevLogs: AgentLog[]) => [...prevLogs, {
              id: Date.now() + Math.random(),
              type: 'action' as const,
              text: `Creating ${node.type}: ${fullPath}`
            }]);
            index++;
            setTimeout(logNext, 150); // Delay between logs for visibility
          } else if (currentPath) {
            // Backtrack if needed, but since recursive, call children first
            // Actually, to handle children, call logNodes on children before next sibling
            // Revised: Use a queue for sequential traversal
          }
        };
        logNext();
      }

      // For simplicity, flatten and log sequentially with delays
      const allNodes: { node: FileNode; fullPath: string }[] = [];
      function collectNodes(currentNodes: FileNode[], currentPath: string) {
        currentNodes.forEach(node => {
          const fullPath = currentPath ? `${currentPath}/${node.name}` : `/${node.name}`;
          allNodes.push({ node, fullPath });
          if (node.type === 'folder' && node.children) {
            collectNodes(node.children, fullPath);
          }
        });
      }
      collectNodes(nodes, '');

      // Sort folders before files
      allNodes.sort((a, b) => a.node.type === 'folder' && b.node.type === 'file' ? -1 : (a.node.type === 'file' && b.node.type === 'folder' ? 1 : 0));

      let logIndex = 0;
      const logNextNode = () => {
        if (logIndex < allNodes.length) {
          const { node, fullPath } = allNodes[logIndex];
          setAgentLogs((prevLogs: AgentLog[]) => [...prevLogs, {
            id: Date.now() + Math.random(),
            type: 'action' as const,
            text: `Creating ${node.type}: ${fullPath}`
          }]);
          logIndex++;
          setTimeout(logNextNode, 150);
        }
      };
      logNextNode();

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown processing error';
      setAgentLogs((prev: AgentLog[]) => [...prev, {
        id: Date.now() + Math.random(),
        type: 'error' as const,
        text: `Error during file creation process: ${errorMsg}`
      }]);
    }
  };

  useEffect(() => {
    if (!isGenerating && fileTree.length > 0 && !initialFileOpened.current) {
        const indexHtmlPath = '/index.html';
        const indexHtmlNode = fileMap.get(indexHtmlPath);
        if (indexHtmlNode) {
            handleFileSelect(indexHtmlPath);
            initialFileOpened.current = true;
        }
    }
  }, [fileTree, isGenerating, handleFileSelect, fileMap]);
  
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

  if (isGenerating) {
    return (
      <div className="h-screen w-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-white mb-2">Generating Your Project</h2>
          <p className="text-gray-400">This may take a moment while the AI creates your files...</p>
          <div className="mt-4 flex justify-center">
            <div className="animate-pulse space-x-1">
              <div className="h-3 w-3 bg-blue-500 rounded-full"></div>
              <div className="h-3 w-3 bg-blue-500 rounded-full"></div>
              <div className="h-3 w-3 bg-blue-500 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-gray-950 text-white flex flex-col">
      <header className="flex items-center justify-between p-2 border-b border-gray-800 bg-gray-900 flex-shrink-0">
        <h1 className="text-xl font-bold">Vibe Coder</h1>
        <div className="flex items-center space-x-2">
            <button
                onClick={handleDownloadProject}
                disabled={isDownloading || fileTree.length === 0}
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
