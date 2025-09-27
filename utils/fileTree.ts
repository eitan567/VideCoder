import { FileNode } from '../types';

/**
 * Finds a node in a file tree by its full path.
 * Unlike findFileByPath, this can return a folder as well.
 * @param nodes The root of the file tree.
 * @param path The full path of the node (e.g., "/src/components").
 * @returns The FileNode if found, otherwise null.
 */
const findNodeByPath = (nodes: FileNode[], path: string): FileNode | null => {
  const pathParts = path.split('/').filter(p => p);
  let currentLevel: FileNode[] = nodes;
  let foundNode: FileNode | null = null;

  for (let i = 0; i < pathParts.length; i++) {
    const part = pathParts[i];
    const node = currentLevel.find(n => n.name === part);

    if (!node) return null;

    if (i === pathParts.length - 1) {
      foundNode = node;
      break;
    }

    if (node.type === 'folder' && node.children) {
      currentLevel = node.children;
    } else {
      return null;
    }
  }

  return foundNode;
};

export const findFileByPath = (nodes: FileNode[], path: string): FileNode | null => {
  const node = findNodeByPath(nodes, path);
  return node && node.type === 'file' ? node : null;
};

export const updateFileContent = (nodes: FileNode[], path: string, newContent: string): FileNode[] => {
  const newNodes = JSON.parse(JSON.stringify(nodes));
  const pathParts = path.split('/').filter(p => p);

  let currentLevel: FileNode[] = newNodes;

  for (let i = 0; i < pathParts.length; i++) {
    const part = pathParts[i];
    const node = currentLevel.find((n: FileNode) => n.name === part);

    if (!node) {
      console.error(`Path not found during update: ${part} in ${path}`);
      return nodes;
    }

    if (i === pathParts.length - 1) {
      if (node.type === 'file') {
        node.content = newContent;
      }
      break;
    }

    if (node.type === 'folder' && node.children) {
      currentLevel = node.children;
    } else {
      console.error(`Invalid path during update: tried to traverse through a file at ${part}`);
      return nodes;
    }
  }

  return newNodes;
};

/**
 * Renames a node in the tree and returns a new tree.
 * @param nodes The root of the file tree.
 * @param oldPath The full path of the node to rename.
 * @param newName The new name for the node.
 * @returns An object with the new tree and an optional error message.
 */
export const renameNodeByPath = (
  nodes: FileNode[],
  oldPath: string,
  newName: string
): { tree: FileNode[], error?: string } => {
  const newNodes = JSON.parse(JSON.stringify(nodes));
  const pathParts = oldPath.split('/').filter(p => p);
  const oldName = pathParts.pop();

  if (!oldName) {
    return { tree: nodes, error: "Cannot rename root." };
  }

  let currentLevel: FileNode[] = newNodes;
  let parentLevel: FileNode[] | null = null;
  
  for (const part of pathParts) {
    const node = currentLevel.find((n: FileNode) => n.name === part);
    if (node && node.type === 'folder' && node.children) {
      parentLevel = currentLevel;
      currentLevel = node.children;
    } else {
      return { tree: nodes, error: "Path to rename not found." };
    }
  }

  const directory = parentLevel ? currentLevel : newNodes;
  const nodeToRename = directory.find(n => n.name === oldName);
  
  if (!nodeToRename) {
    return { tree: nodes, error: "Node to rename not found." };
  }
  
  const nameExists = directory.some(n => n.name === newName && n !== nodeToRename);
  if (nameExists) {
    return { tree: nodes, error: `A file or folder named "${newName}" already exists in this location.` };
  }
  
  nodeToRename.name = newName;

  return { tree: newNodes };
};

/**
 * Resolves a relative path from a base path, similar to how browsers handle URLs.
 * @param basePath The directory path from which to resolve, e.g., "/src/pages".
 * @param relativePath The path to resolve, e.g., "../styles/main.css".
 * @returns The resolved absolute path, e.g., "/src/styles/main.css".
 */
export const resolvePath = (basePath: string, relativePath: string): string => {
  if (relativePath.startsWith('/')) {
    return relativePath; // It's already an absolute path from the root.
  }

  const baseParts = basePath.split('/').filter(p => p);
  const relativeParts = relativePath.split('/').filter(p => p);
  
  const stack = [...baseParts];

  for (const part of relativeParts) {
    if (part === '..') {
      stack.pop();
    } else if (part !== '.') {
      stack.push(part);
    }
  }

  return '/' + stack.join('/');
};

/**
 * Traverses a FileNode tree and creates a flat map of full file paths to their nodes.
 * @param nodes The root of the file tree.
 * @returns A Map where keys are full paths (e.g., "/src/index.js") and values are the corresponding FileNode objects.
 */
export const createFileMap = (nodes: FileNode[]): Map<string, FileNode> => {
  const map = new Map<string, FileNode>();

  function traverse(currentNodes: FileNode[], currentPath: string) {
    for (const node of currentNodes) {
      const nodePath = `${currentPath}/${node.name}`;
      map.set(nodePath, node);
      if (node.type === 'folder' && node.children) {
        traverse(node.children, nodePath);
      }
    }
  }

  traverse(nodes, '');
  return map;
};
