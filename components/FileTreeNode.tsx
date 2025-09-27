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
  const inputRef = useRef<HTMLInputElement>(null);

  const currentPath = `${path}/${node.name}`;
  const isActive = activeFilePath === currentPath;
  const isRenaming = renamingPath === currentPath;

  useEffect(() => {
    if (isRenaming) {
      setNewName(node.name);
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isRenaming, node.name]);

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
  
  const handleNodeClick = () => {
    if (node.type === 'file') {
      onFileSelect(currentPath);
    } else {
      setIsOpen(!isOpen);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onInitiateRename(currentPath);
  };
  
  return (
    <div className="text-sm my-1 relative">
      <div
        onClick={handleNodeClick}
        onDoubleClick={handleDoubleClick}
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
    </div>
  );
};

export default FileTreeNode;