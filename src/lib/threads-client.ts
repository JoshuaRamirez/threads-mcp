import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { randomUUID } from 'crypto';
import {
  Thread,
  Container,
  Group,
  Entity,
  ThreadsData,
  ThreadFilter,
  ContainerFilter,
  CreateThreadInput,
  UpdateThreadInput,
  CreateContainerInput,
  UpdateContainerInput,
  CreateGroupInput,
  UpdateGroupInput,
  TreeNode,
  ProgressEntry,
} from './types.js';

// Direct file access matching Threads CLI behavior
const DATA_DIR = path.join(os.homedir(), '.threads');
const DATA_FILE = path.join(DATA_DIR, 'threads.json');
const BACKUP_FILE = path.join(DATA_DIR, 'threads.backup.json');

function ensureDataFile(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    const initialData: ThreadsData = {
      threads: [],
      containers: [],
      groups: [],
      version: '1.0.0'
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
  }
}

function migrateData(data: ThreadsData): ThreadsData {
  if (!data.containers) {
    data.containers = [];
  }

  // Normalize threads: ensure tags and description are never undefined
  for (const thread of data.threads) {
    if (thread.tags === undefined) thread.tags = [];
    if (thread.description === undefined) thread.description = '';
  }

  // Normalize containers: ensure tags and description are never undefined
  for (const container of data.containers) {
    if (container.tags === undefined) container.tags = [];
    if (container.description === undefined) container.description = '';
  }

  return data;
}

function createBackup(): void {
  if (fs.existsSync(DATA_FILE)) {
    fs.copyFileSync(DATA_FILE, BACKUP_FILE);
  }
}

function loadData(): ThreadsData {
  ensureDataFile();
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  const data = JSON.parse(raw) as ThreadsData;
  return migrateData(data);
}

function saveData(data: ThreadsData): void {
  ensureDataFile();
  createBackup();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Type guards
export function isThread(entity: Entity): entity is Thread {
  return entity.type !== 'container';
}

export function isContainer(entity: Entity): entity is Container {
  return entity.type === 'container';
}

/**
 * ThreadsClient wraps the Threads storage layer with a cleaner API
 * for MCP server operations.
 */
export class ThreadsClient {
  // ===== THREADS =====

  listThreads(filter?: ThreadFilter): Thread[] {
    const data = loadData();
    let threads = data.threads;

    if (filter) {
      if (filter.status) {
        threads = threads.filter(t => t.status === filter.status);
      }
      if (filter.temperature) {
        threads = threads.filter(t => t.temperature === filter.temperature);
      }
      if (filter.size) {
        threads = threads.filter(t => t.size === filter.size);
      }
      if (filter.importance) {
        threads = threads.filter(t => t.importance === filter.importance);
      }
      if (filter.groupId !== undefined) {
        threads = threads.filter(t => t.groupId === filter.groupId);
      }
      if (filter.parentId !== undefined) {
        threads = threads.filter(t => t.parentId === filter.parentId);
      }
      if (filter.tags && filter.tags.length > 0) {
        threads = threads.filter(t =>
          filter.tags!.some(tag => (t.tags || []).includes(tag))
        );
      }
      if (filter.search) {
        const search = filter.search.toLowerCase();
        threads = threads.filter(t =>
          t.name.toLowerCase().includes(search) ||
          (t.description || '').toLowerCase().includes(search)
        );
      }
    }

    return threads;
  }

  getThread(id: string): Thread | null {
    const data = loadData();
    return data.threads.find(t => t.id === id) || null;
  }

  getThreadByName(name: string): Thread | null {
    const data = loadData();
    const lower = name.toLowerCase();
    return data.threads.find(t => t.name.toLowerCase() === lower) || null;
  }

  createThread(input: CreateThreadInput): Thread {
    const data = loadData();
    const now = new Date().toISOString();

    const thread: Thread = {
      type: 'thread',
      id: randomUUID(),
      name: input.name,
      description: input.description || '',
      status: input.status || 'active',
      temperature: input.temperature || 'warm',
      size: input.size || 'medium',
      importance: input.importance || 3,
      parentId: input.parentId ?? null,
      groupId: input.groupId ?? null,
      tags: input.tags || [],
      dependencies: [],
      progress: [],
      details: [],
      createdAt: now,
      updatedAt: now
    };

    data.threads.push(thread);
    saveData(data);
    return thread;
  }

  updateThread(id: string, updates: UpdateThreadInput): Thread | null {
    const data = loadData();
    const index = data.threads.findIndex(t => t.id === id);
    if (index === -1) return null;

    data.threads[index] = {
      ...data.threads[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    saveData(data);
    return data.threads[index];
  }

  archiveThread(id: string, cascade: boolean = false): Thread | null {
    const data = loadData();
    const index = data.threads.findIndex(t => t.id === id);
    if (index === -1) return null;

    data.threads[index].status = 'archived';
    data.threads[index].updatedAt = new Date().toISOString();

    if (cascade) {
      // Archive child threads
      const children = data.threads.filter(t => t.parentId === id);
      for (const child of children) {
        const childIndex = data.threads.findIndex(t => t.id === child.id);
        if (childIndex !== -1) {
          data.threads[childIndex].status = 'archived';
          data.threads[childIndex].updatedAt = new Date().toISOString();
        }
      }
    }

    saveData(data);
    return data.threads[index];
  }

  deleteThread(id: string): boolean {
    const data = loadData();
    const index = data.threads.findIndex(t => t.id === id);
    if (index === -1) return false;

    data.threads.splice(index, 1);
    saveData(data);
    return true;
  }

  // ===== PROGRESS =====

  addProgress(threadId: string, note: string, timestamp?: string): ProgressEntry | null {
    const data = loadData();
    const index = data.threads.findIndex(t => t.id === threadId);
    if (index === -1) return null;

    const entry: ProgressEntry = {
      id: randomUUID(),
      timestamp: timestamp || new Date().toISOString(),
      note
    };

    data.threads[index].progress.push(entry);
    data.threads[index].updatedAt = new Date().toISOString();
    saveData(data);
    return entry;
  }

  listProgress(threadId: string, limit?: number): ProgressEntry[] {
    const thread = this.getThread(threadId);
    if (!thread) return [];

    let progress = [...thread.progress].reverse(); // Most recent first
    if (limit && limit > 0) {
      progress = progress.slice(0, limit);
    }
    return progress;
  }

  editProgress(threadId: string, progressId: string, note: string): ProgressEntry | null {
    const data = loadData();
    const threadIndex = data.threads.findIndex(t => t.id === threadId);
    if (threadIndex === -1) return null;

    const progressIndex = data.threads[threadIndex].progress.findIndex(p => p.id === progressId);
    if (progressIndex === -1) return null;

    data.threads[threadIndex].progress[progressIndex].note = note;
    data.threads[threadIndex].updatedAt = new Date().toISOString();
    saveData(data);
    return data.threads[threadIndex].progress[progressIndex];
  }

  deleteProgress(threadId: string, progressId: string): boolean {
    const data = loadData();
    const threadIndex = data.threads.findIndex(t => t.id === threadId);
    if (threadIndex === -1) return false;

    const progressIndex = data.threads[threadIndex].progress.findIndex(p => p.id === progressId);
    if (progressIndex === -1) return false;

    data.threads[threadIndex].progress.splice(progressIndex, 1);
    data.threads[threadIndex].updatedAt = new Date().toISOString();
    saveData(data);
    return true;
  }

  // ===== CONTAINERS =====

  listContainers(filter?: ContainerFilter): Container[] {
    const data = loadData();
    let containers = data.containers;

    if (filter) {
      if (filter.groupId !== undefined) {
        containers = containers.filter(c => c.groupId === filter.groupId);
      }
      if (filter.parentId !== undefined) {
        containers = containers.filter(c => c.parentId === filter.parentId);
      }
      if (filter.tags && filter.tags.length > 0) {
        containers = containers.filter(c =>
          filter.tags!.some(tag => (c.tags || []).includes(tag))
        );
      }
      if (filter.search) {
        const search = filter.search.toLowerCase();
        containers = containers.filter(c =>
          c.name.toLowerCase().includes(search) ||
          (c.description || '').toLowerCase().includes(search)
        );
      }
    }

    return containers;
  }

  getContainer(id: string): Container | null {
    const data = loadData();
    return data.containers.find(c => c.id === id) || null;
  }

  getContainerByName(name: string): Container | null {
    const data = loadData();
    const lower = name.toLowerCase();
    return data.containers.find(c => c.name.toLowerCase() === lower) || null;
  }

  createContainer(input: CreateContainerInput): Container {
    const data = loadData();
    const now = new Date().toISOString();

    const container: Container = {
      type: 'container',
      id: randomUUID(),
      name: input.name,
      description: input.description || '',
      parentId: input.parentId ?? null,
      groupId: input.groupId ?? null,
      tags: input.tags || [],
      details: [],
      createdAt: now,
      updatedAt: now
    };

    data.containers.push(container);
    saveData(data);
    return container;
  }

  updateContainer(id: string, updates: UpdateContainerInput): Container | null {
    const data = loadData();
    const index = data.containers.findIndex(c => c.id === id);
    if (index === -1) return null;

    data.containers[index] = {
      ...data.containers[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    saveData(data);
    return data.containers[index];
  }

  deleteContainer(id: string): boolean {
    const data = loadData();
    const index = data.containers.findIndex(c => c.id === id);
    if (index === -1) return false;

    data.containers.splice(index, 1);
    saveData(data);
    return true;
  }

  // ===== GROUPS =====

  listGroups(): Group[] {
    const data = loadData();
    return data.groups;
  }

  getGroup(id: string): Group | null {
    const data = loadData();
    return data.groups.find(g => g.id === id) || null;
  }

  getGroupByName(name: string): Group | null {
    const data = loadData();
    const lower = name.toLowerCase();
    return data.groups.find(g => g.name.toLowerCase() === lower) || null;
  }

  createGroup(input: CreateGroupInput): Group {
    const data = loadData();
    const now = new Date().toISOString();

    const group: Group = {
      id: randomUUID(),
      name: input.name,
      description: input.description || '',
      createdAt: now,
      updatedAt: now
    };

    data.groups.push(group);
    saveData(data);
    return group;
  }

  updateGroup(id: string, updates: UpdateGroupInput): Group | null {
    const data = loadData();
    const index = data.groups.findIndex(g => g.id === id);
    if (index === -1) return null;

    data.groups[index] = {
      ...data.groups[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    saveData(data);
    return data.groups[index];
  }

  deleteGroup(id: string): boolean {
    const data = loadData();
    const index = data.groups.findIndex(g => g.id === id);
    if (index === -1) return false;

    data.groups.splice(index, 1);
    saveData(data);
    return true;
  }

  // ===== ENTITY OPERATIONS =====

  getEntity(id: string): Entity | null {
    return this.getThread(id) || this.getContainer(id);
  }

  getEntityByName(name: string): Entity | null {
    return this.getThreadByName(name) || this.getContainerByName(name);
  }

  getAllEntities(): Entity[] {
    const data = loadData();
    return [...data.threads, ...data.containers];
  }

  setParent(entityId: string, parentId: string | null): Entity | null {
    // Validate parent exists if not null
    if (parentId !== null) {
      const parent = this.getEntity(parentId);
      if (!parent) return null;
    }

    // Try as thread first
    const thread = this.getThread(entityId);
    if (thread) {
      return this.updateThread(entityId, { parentId });
    }

    // Try as container
    const container = this.getContainer(entityId);
    if (container) {
      return this.updateContainer(entityId, { parentId });
    }

    return null;
  }

  moveToGroup(entityId: string, groupId: string | null): Entity | null {
    // Validate group exists if not null
    if (groupId !== null) {
      const group = this.getGroup(groupId);
      if (!group) return null;
    }

    // Try as thread first
    const thread = this.getThread(entityId);
    if (thread) {
      return this.updateThread(entityId, { groupId });
    }

    // Try as container
    const container = this.getContainer(entityId);
    if (container) {
      return this.updateContainer(entityId, { groupId });
    }

    return null;
  }

  // ===== HIERARCHY =====

  getChildren(entityId: string): Entity[] {
    const data = loadData();
    const threads = data.threads.filter(t => t.parentId === entityId);
    const containers = data.containers.filter(c => c.parentId === entityId);
    return [...containers, ...threads];
  }

  getAncestors(entityId: string): Entity[] {
    const ancestors: Entity[] = [];
    let current = this.getEntity(entityId);

    while (current && current.parentId) {
      const parent = this.getEntity(current.parentId);
      if (parent) {
        ancestors.push(parent);
        current = parent;
      } else {
        break;
      }
    }

    return ancestors;
  }

  getSubtree(entityId: string): TreeNode | null {
    const entity = this.getEntity(entityId);
    if (!entity) return null;

    const buildNode = (e: Entity): TreeNode => {
      const children = this.getChildren(e.id);
      return {
        entity: e,
        children: children.map(buildNode)
      };
    };

    return buildNode(entity);
  }

  getFullTree(): TreeNode[] {
    // Get root entities (no parent)
    const data = loadData();
    const rootThreads = data.threads.filter(t => t.parentId === null);
    const rootContainers = data.containers.filter(c => c.parentId === null);
    const roots = [...rootContainers, ...rootThreads];

    const buildNode = (e: Entity): TreeNode => {
      const children = this.getChildren(e.id);
      return {
        entity: e,
        children: children.map(buildNode)
      };
    };

    return roots.map(buildNode);
  }

  // ===== SEARCH & QUERY =====

  search(query: string): Entity[] {
    const data = loadData();
    const lower = query.toLowerCase();

    const matchingThreads = data.threads.filter(t =>
      t.name.toLowerCase().includes(lower) ||
      (t.description || '').toLowerCase().includes(lower) ||
      (t.tags || []).some(tag => tag.toLowerCase().includes(lower))
    );

    const matchingContainers = data.containers.filter(c =>
      c.name.toLowerCase().includes(lower) ||
      (c.description || '').toLowerCase().includes(lower) ||
      (c.tags || []).some(tag => tag.toLowerCase().includes(lower))
    );

    return [...matchingContainers, ...matchingThreads];
  }

  /**
   * Suggest the next thread to work on based on priority criteria:
   * - Active status
   * - Higher temperature
   * - Higher importance
   */
  getNextAction(): Thread | null {
    const activeThreads = this.listThreads({ status: 'active' });
    if (activeThreads.length === 0) return null;

    const tempOrder: Record<string, number> = {
      hot: 6, warm: 5, tepid: 4, cold: 3, freezing: 2, frozen: 1
    };

    // Sort by temperature (desc) then importance (desc)
    activeThreads.sort((a, b) => {
      const tempDiff = tempOrder[b.temperature] - tempOrder[a.temperature];
      if (tempDiff !== 0) return tempDiff;
      return b.importance - a.importance;
    });

    return activeThreads[0];
  }
}
