
export interface FileNode {
  name: string;
  type: 'file' | 'folder';
  content?: string;
  children?: FileNode[];
}

export interface OpenFile {
  path: string;
  content: string;
  savedContent: string;
}

export interface Provider {
  id: string;
  name: string;
  models: Model[];
}

export interface Model {
  id: string;
  name: string;
}

export type AgentStatus = 'idle' | 'working' | 'error';

export interface AgentLog {
  id: number;
  text: string;
  type: 'thought' | 'action' | 'error' | 'user';
}
