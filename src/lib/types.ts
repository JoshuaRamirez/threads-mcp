// Re-export types from Threads
// These are the same types used by the Threads CLI

export type ThreadStatus = 'active' | 'paused' | 'stopped' | 'completed' | 'archived';
export type Temperature = 'frozen' | 'freezing' | 'cold' | 'tepid' | 'warm' | 'hot';
export type ThreadSize = 'tiny' | 'small' | 'medium' | 'large' | 'huge';
export type Importance = 1 | 2 | 3 | 4 | 5;

export interface ProgressEntry {
  id: string;
  timestamp: string;
  note: string;
}

export interface DetailsEntry {
  id: string;
  timestamp: string;
  content: string;
}

export interface Dependency {
  threadId: string;
  why: string;
  what: string;
  how: string;
  when: string;
}

export type EntityType = 'thread' | 'container';

export interface Thread {
  type?: 'thread';
  id: string;
  name: string;
  description: string;
  status: ThreadStatus;
  importance: Importance;
  temperature: Temperature;
  size: ThreadSize;
  parentId: string | null;
  groupId: string | null;
  tags: string[];
  dependencies: Dependency[];
  progress: ProgressEntry[];
  details: DetailsEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface Container {
  type: 'container';
  id: string;
  name: string;
  description: string;
  parentId: string | null;
  groupId: string | null;
  tags: string[];
  details: DetailsEntry[];
  createdAt: string;
  updatedAt: string;
}

export type Entity = Thread | Container;

export interface Group {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface ThreadsData {
  threads: Thread[];
  containers: Container[];
  groups: Group[];
  version: string;
}

// MCP-specific filter types
export interface ThreadFilter {
  status?: ThreadStatus;
  temperature?: Temperature;
  size?: ThreadSize;
  importance?: Importance;
  groupId?: string;
  parentId?: string | null;
  tags?: string[];
  search?: string;
}

export interface ContainerFilter {
  groupId?: string;
  parentId?: string | null;
  tags?: string[];
  search?: string;
}

// Input types for creating/updating
export interface CreateThreadInput {
  name: string;
  description?: string;
  status?: ThreadStatus;
  temperature?: Temperature;
  size?: ThreadSize;
  importance?: Importance;
  parentId?: string | null;
  groupId?: string | null;
  tags?: string[];
}

export interface UpdateThreadInput {
  name?: string;
  description?: string;
  status?: ThreadStatus;
  temperature?: Temperature;
  size?: ThreadSize;
  importance?: Importance;
  parentId?: string | null;
  groupId?: string | null;
  tags?: string[];
}

export interface CreateContainerInput {
  name: string;
  description?: string;
  parentId?: string | null;
  groupId?: string | null;
  tags?: string[];
}

export interface UpdateContainerInput {
  name?: string;
  description?: string;
  parentId?: string | null;
  groupId?: string | null;
  tags?: string[];
}

export interface CreateGroupInput {
  name: string;
  description?: string;
}

export interface UpdateGroupInput {
  name?: string;
  description?: string;
}

// Tree node for hierarchy representation
export interface TreeNode {
  entity: Entity;
  children: TreeNode[];
}
