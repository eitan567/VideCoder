import React from 'react';
import { FileNode } from '../types';
import FileTreeNode from './FileTreeNode';

interface FileExplorerProps {
  fileTree: FileNode[];
  onFileSelect: (path: string) => void;
  activeFilePath: string | null;
  renamingPath: string | null;
  onInitiateRename: (path: string) => void;
  onCancelRename: () => void;
  onCommitRename: (oldPath: string, newName: string) => void;
}

const FileExplorer: React.FC<FileExplorerProps> = (props) => {
  const { 
    fileTree, 
    onFileSelect, 
    activeFilePath, 
    renamingPath, 
    onInitiateRename, 
    onCancelRename, 
    onCommitRename 
  } = props;
  
  return (
    <div className="flex flex-col h-full bg-gray-950 text-white">
      <div className="p-2 border-b border-gray-800 bg-gray-900 flex-shrink-0">
        <h3 className="text-sm font-bold tracking-wider uppercase">Explorer</h3>
      </div>
      <div className="flex-1 p-2 overflow-y-auto">
        {fileTree.map(node => (
          <FileTreeNode
            key={node.name}
            node={node}
            path="" 
            onFileSelect={onFileSelect}
            activeFilePath={activeFilePath}
            renamingPath={renamingPath}
            onInitiateRename={onInitiateRename}
            onCancelRename={onCancelRename}
            onCommitRename={onCommitRename}
          />
        ))}
      </div>
    </div>
  );
};

export default FileExplorer;