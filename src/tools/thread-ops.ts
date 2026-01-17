import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { ThreadsClient, isThread } from '../lib/threads-client.js';
import { ThreadStatus, Temperature, ThreadSize, Importance } from '../lib/types.js';

// Tool definitions
export const threadTools: Tool[] = [
  {
    name: 'create_thread',
    description: 'Create a new thread for tracking an activity stream',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Thread name' },
        description: { type: 'string', description: 'Brief thread description' },
        status: {
          type: 'string',
          enum: ['active', 'paused', 'stopped', 'completed', 'archived'],
          description: 'Initial status (default: active)'
        },
        temperature: {
          type: 'string',
          enum: ['frozen', 'freezing', 'cold', 'tepid', 'warm', 'hot'],
          description: 'Thread momentum (default: warm)'
        },
        size: {
          type: 'string',
          enum: ['tiny', 'small', 'medium', 'large', 'huge'],
          description: 'Scope of work (default: medium)'
        },
        importance: {
          type: 'integer',
          minimum: 1,
          maximum: 5,
          description: 'Priority level 1-5 (default: 3)'
        },
        parentId: { type: 'string', description: 'Parent thread/container ID' },
        groupId: { type: 'string', description: 'Group ID to assign to' },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags for categorization'
        }
      },
      required: ['name']
    }
  },
  {
    name: 'update_thread',
    description: 'Update properties of an existing thread',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Thread ID to update' },
        name: { type: 'string', description: 'New name' },
        description: { type: 'string', description: 'New description' },
        status: {
          type: 'string',
          enum: ['active', 'paused', 'stopped', 'completed', 'archived'],
          description: 'New status'
        },
        temperature: {
          type: 'string',
          enum: ['frozen', 'freezing', 'cold', 'tepid', 'warm', 'hot'],
          description: 'New temperature'
        },
        size: {
          type: 'string',
          enum: ['tiny', 'small', 'medium', 'large', 'huge'],
          description: 'New size'
        },
        importance: {
          type: 'integer',
          minimum: 1,
          maximum: 5,
          description: 'New importance'
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Replace tags array'
        }
      },
      required: ['id']
    }
  },
  {
    name: 'archive_thread',
    description: 'Archive a thread (optionally with children)',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Thread ID to archive' },
        cascade: {
          type: 'boolean',
          description: 'Also archive child threads (default: false)'
        }
      },
      required: ['id']
    }
  },
  {
    name: 'delete_thread',
    description: 'Permanently delete a thread',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Thread ID to delete' }
      },
      required: ['id']
    }
  },
  {
    name: 'get_thread',
    description: 'Get a single thread by ID or name',
    inputSchema: {
      type: 'object',
      properties: {
        identifier: { type: 'string', description: 'Thread ID or name' }
      },
      required: ['identifier']
    }
  }
];

// Tool handlers
export function handleThreadTool(
  name: string,
  args: Record<string, unknown>,
  client: ThreadsClient
): { success: boolean; data?: unknown; error?: string } {
  try {
    switch (name) {
      case 'create_thread': {
        const thread = client.createThread({
          name: args.name as string,
          description: args.description as string | undefined,
          status: args.status as ThreadStatus | undefined,
          temperature: args.temperature as Temperature | undefined,
          size: args.size as ThreadSize | undefined,
          importance: args.importance as Importance | undefined,
          parentId: args.parentId as string | undefined,
          groupId: args.groupId as string | undefined,
          tags: args.tags as string[] | undefined
        });
        return { success: true, data: thread };
      }

      case 'update_thread': {
        const thread = client.updateThread(args.id as string, {
          name: args.name as string | undefined,
          description: args.description as string | undefined,
          status: args.status as ThreadStatus | undefined,
          temperature: args.temperature as Temperature | undefined,
          size: args.size as ThreadSize | undefined,
          importance: args.importance as Importance | undefined,
          tags: args.tags as string[] | undefined
        });
        if (!thread) {
          return { success: false, error: `Thread not found: ${args.id}` };
        }
        return { success: true, data: thread };
      }

      case 'archive_thread': {
        const thread = client.archiveThread(
          args.id as string,
          args.cascade as boolean | undefined
        );
        if (!thread) {
          return { success: false, error: `Thread not found: ${args.id}` };
        }
        return { success: true, data: thread };
      }

      case 'delete_thread': {
        const deleted = client.deleteThread(args.id as string);
        if (!deleted) {
          return { success: false, error: `Thread not found: ${args.id}` };
        }
        return { success: true, data: { deleted: true, id: args.id } };
      }

      case 'get_thread': {
        const identifier = args.identifier as string;
        let thread = client.getThread(identifier);
        if (!thread) {
          thread = client.getThreadByName(identifier);
        }
        if (!thread) {
          return { success: false, error: `Thread not found: ${identifier}` };
        }
        return { success: true, data: thread };
      }

      default:
        return { success: false, error: `Unknown tool: ${name}` };
    }
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
