import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { ThreadsClient } from '../lib/threads-client.js';
import { ThreadStatus, Temperature, ThreadSize, Importance } from '../lib/types.js';

// Tool definitions
export const queryTools: Tool[] = [
  {
    name: 'list_threads',
    description: 'List threads with optional filtering',
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['active', 'paused', 'stopped', 'completed', 'archived'],
          description: 'Filter by status'
        },
        temperature: {
          type: 'string',
          enum: ['frozen', 'freezing', 'cold', 'tepid', 'warm', 'hot'],
          description: 'Filter by temperature'
        },
        size: {
          type: 'string',
          enum: ['tiny', 'small', 'medium', 'large', 'huge'],
          description: 'Filter by size'
        },
        importance: {
          type: 'integer',
          minimum: 1,
          maximum: 5,
          description: 'Filter by importance'
        },
        groupId: { type: 'string', description: 'Filter by group' },
        parentId: {
          type: ['string', 'null'],
          description: 'Filter by parent (null for root threads)'
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by any of these tags'
        },
        search: {
          type: 'string',
          description: 'Search in name and description'
        }
      }
    }
  },
  {
    name: 'list_containers',
    description: 'List containers with optional filtering',
    inputSchema: {
      type: 'object',
      properties: {
        groupId: { type: 'string', description: 'Filter by group' },
        parentId: {
          type: ['string', 'null'],
          description: 'Filter by parent (null for root containers)'
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by any of these tags'
        },
        search: {
          type: 'string',
          description: 'Search in name and description'
        }
      }
    }
  },
  {
    name: 'list_groups',
    description: 'List all groups',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'search_threads',
    description: 'Search threads and containers by text query',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' }
      },
      required: ['query']
    }
  },
  {
    name: 'get_next_action',
    description: 'Suggest the next thread to work on based on priority',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'get_full_tree',
    description: 'Get the complete hierarchy tree',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'get_entity',
    description: 'Get any entity (thread or container) by ID or name',
    inputSchema: {
      type: 'object',
      properties: {
        identifier: { type: 'string', description: 'Entity ID or name' }
      },
      required: ['identifier']
    }
  },
  {
    name: 'get_container',
    description: 'Get a container by ID or name',
    inputSchema: {
      type: 'object',
      properties: {
        identifier: { type: 'string', description: 'Container ID or name' }
      },
      required: ['identifier']
    }
  },
  {
    name: 'get_group',
    description: 'Get a group by ID or name',
    inputSchema: {
      type: 'object',
      properties: {
        identifier: { type: 'string', description: 'Group ID or name' }
      },
      required: ['identifier']
    }
  }
];

// Tool handlers
export function handleQueryTool(
  name: string,
  args: Record<string, unknown>,
  client: ThreadsClient
): { success: boolean; data?: unknown; error?: string } {
  try {
    switch (name) {
      case 'list_threads': {
        const threads = client.listThreads({
          status: args.status as ThreadStatus | undefined,
          temperature: args.temperature as Temperature | undefined,
          size: args.size as ThreadSize | undefined,
          importance: args.importance as Importance | undefined,
          groupId: args.groupId as string | undefined,
          parentId: args.parentId as string | null | undefined,
          tags: args.tags as string[] | undefined,
          search: args.search as string | undefined
        });
        return { success: true, data: threads };
      }

      case 'list_containers': {
        const containers = client.listContainers({
          groupId: args.groupId as string | undefined,
          parentId: args.parentId as string | null | undefined,
          tags: args.tags as string[] | undefined,
          search: args.search as string | undefined
        });
        return { success: true, data: containers };
      }

      case 'list_groups': {
        const groups = client.listGroups();
        return { success: true, data: groups };
      }

      case 'search_threads': {
        const results = client.search(args.query as string);
        return { success: true, data: results };
      }

      case 'get_next_action': {
        const next = client.getNextAction();
        if (!next) {
          return { success: true, data: null, error: 'No active threads' };
        }
        return { success: true, data: next };
      }

      case 'get_full_tree': {
        const tree = client.getFullTree();
        return { success: true, data: tree };
      }

      case 'get_entity': {
        const identifier = args.identifier as string;
        let entity = client.getEntity(identifier);
        if (!entity) {
          entity = client.getEntityByName(identifier);
        }
        if (!entity) {
          return { success: false, error: `Entity not found: ${identifier}` };
        }
        return { success: true, data: entity };
      }

      case 'get_container': {
        const identifier = args.identifier as string;
        let container = client.getContainer(identifier);
        if (!container) {
          container = client.getContainerByName(identifier);
        }
        if (!container) {
          return { success: false, error: `Container not found: ${identifier}` };
        }
        return { success: true, data: container };
      }

      case 'get_group': {
        const identifier = args.identifier as string;
        let group = client.getGroup(identifier);
        if (!group) {
          group = client.getGroupByName(identifier);
        }
        if (!group) {
          return { success: false, error: `Group not found: ${identifier}` };
        }
        return { success: true, data: group };
      }

      default:
        return { success: false, error: `Unknown tool: ${name}` };
    }
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
