import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { ThreadsClient } from '../lib/threads-client.js';

// Tool definitions
export const progressTools: Tool[] = [
  {
    name: 'add_progress',
    description: 'Add a progress note to a thread',
    inputSchema: {
      type: 'object',
      properties: {
        threadId: { type: 'string', description: 'Thread ID to add progress to' },
        note: { type: 'string', description: 'Progress note text' },
        timestamp: {
          type: 'string',
          description: 'Custom timestamp (ISO 8601, default: now)'
        }
      },
      required: ['threadId', 'note']
    }
  },
  {
    name: 'list_progress',
    description: 'Get progress history for a thread',
    inputSchema: {
      type: 'object',
      properties: {
        threadId: { type: 'string', description: 'Thread ID' },
        limit: {
          type: 'integer',
          minimum: 1,
          description: 'Max entries to return (most recent first)'
        }
      },
      required: ['threadId']
    }
  },
  {
    name: 'edit_progress',
    description: 'Edit an existing progress entry',
    inputSchema: {
      type: 'object',
      properties: {
        threadId: { type: 'string', description: 'Thread ID' },
        progressId: { type: 'string', description: 'Progress entry ID' },
        note: { type: 'string', description: 'New note text' }
      },
      required: ['threadId', 'progressId', 'note']
    }
  },
  {
    name: 'delete_progress',
    description: 'Delete a progress entry',
    inputSchema: {
      type: 'object',
      properties: {
        threadId: { type: 'string', description: 'Thread ID' },
        progressId: { type: 'string', description: 'Progress entry ID' }
      },
      required: ['threadId', 'progressId']
    }
  }
];

// Tool handlers
export function handleProgressTool(
  name: string,
  args: Record<string, unknown>,
  client: ThreadsClient
): { success: boolean; data?: unknown; error?: string } {
  try {
    switch (name) {
      case 'add_progress': {
        const entry = client.addProgress(
          args.threadId as string,
          args.note as string,
          args.timestamp as string | undefined
        );
        if (!entry) {
          return { success: false, error: `Thread not found: ${args.threadId}` };
        }
        return { success: true, data: entry };
      }

      case 'list_progress': {
        const progress = client.listProgress(
          args.threadId as string,
          args.limit as number | undefined
        );
        return { success: true, data: progress };
      }

      case 'edit_progress': {
        const entry = client.editProgress(
          args.threadId as string,
          args.progressId as string,
          args.note as string
        );
        if (!entry) {
          return { success: false, error: `Progress entry not found` };
        }
        return { success: true, data: entry };
      }

      case 'delete_progress': {
        const deleted = client.deleteProgress(
          args.threadId as string,
          args.progressId as string
        );
        if (!deleted) {
          return { success: false, error: `Progress entry not found` };
        }
        return { success: true, data: { deleted: true } };
      }

      default:
        return { success: false, error: `Unknown tool: ${name}` };
    }
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
