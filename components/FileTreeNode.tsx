import React, { useState, useRef, useEffect } from 'react';
import { FileNode } from '../types';
import { ICONS } from '../constants';

interface FileTreeNodeProps {
  node: FileNode;
  path: string;
  onFileSelect: (path: string) => void;
  activeFilePath: string | null;
  renamingPath: string | null;
  onInitiateRename: (path: string) => void;
  onCancelRename: () => void;
  onCommitRename: (oldPath: string, newName: string) => void;
}

const getFileIcon = (fileName: string): React.ReactNode => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'html':
      return ICONS.html;
    case 'css':
      return ICONS.css;
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
      return ICONS.js;
    case 'json':
      return ICONS.json;
    default:
      return ICONS.file;
  }
};

const FileTreeNode: React.FC<FileTreeNodeProps> = (props) => {
  const { node, path, onFileSelect, activeFilePath, renamingPath, onInitiateRename, onCancelRename, onCommitRename } = props;
  const [isOpen, setIsOpen] = useState(true);
  const [newName, setNewName] = useState(node.name);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentPath = `${path}/${node.name}`;
  const isActive = activeFilePath === currentPath;
  const isRenaming = renamingPath === currentPath;

  useEffect(() => {
    if (isRenaming) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isRenaming]);

  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [contextMenu]);

  const handleCommit = () => {
    if (newName.trim() && newName.trim() !== node.name) {
      onCommitRename(currentPath, newName.trim());
    } else {
      onCancelRename();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCommit();
    } else if (e.key === 'Escape') {
      onCancelRename();
    }
  };

  const handleBlur = () => {
    handleCommit();
  };
  
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };
  
  const handleRenameClick = () => {
    setContextMenu(null);
    setNewName(node.name);
    onInitiateRename(currentPath);
  };
  
  const handleNodeClick = () => {
    if (node.type === 'file') {
      onFileSelect(currentPath);
    } else {
      setIsOpen(!isOpen);
    }
  };
  
  return (
    <div className="text-sm my-1 relative" onContextMenu={handleContextMenu}>
      <div
        onClick={handleNodeClick}
        className={`flex items-center p-1 rounded-md ${isRenaming ? '' : 'cursor-pointer'} ${
          isActive ? 'bg-blue-600/30 text-white' : 'text-gray-400 hover:bg-gray-800'
        }`}
      >
        {node.type === 'folder' 
          ? (isOpen ? ICONS.folderOpen : ICONS.folder) 
          : getFileIcon(node.name)
        }
        {isRenaming ? (
          <input
            ref={inputRef}
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            className="bg-gray-700 text-white border border-blue-500 rounded-sm px-1 text-sm outline-none w-full"
            onClick={(e) => e.stopPropagation()} // Prevent node click handler from firing
          />
        ) : (
          <span className="select-none">{node.name}</span>
        )}
      </div>
      {isOpen && node.type === 'folder' && (
        <div className="pl-4 border-l border-gray-700 ml-2">
          {node.children?.map(child => (
            <FileTreeNode
              key={child.name}
              node={child}
              path={currentPath}
              {...props}
            />
          ))}
        </div>
      )}

      {contextMenu && (
        <div 
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="absolute z-10 bg-gray-800 border border-gray-700 rounded-md shadow-lg py-1"
        >
          <button 
            onClick={handleRenameClick}
            className="block w-full text-left px-4 py-1 text-sm text-gray-300 hover:bg-gray-700"
          >
            Rename
          </button>
        </div>
      )}
    </div>
  );
};

export default FileTreeNode;