import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { ThreadsClient } from '../lib/threads-client.js';

// Tool definitions
export const orgTools: Tool[] = [
  {
    name: 'create_container',
    description: 'Create a new container for organizing threads',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Container name' },
        description: { type: 'string', description: 'Container description' },
        parentId: { type: 'string', description: 'Parent container ID' },
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
    name: 'update_container',
    description: 'Update properties of a container',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Container ID' },
        name: { type: 'string', description: 'New name' },
        description: { type: 'string', description: 'New description' },
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
    name: 'delete_container',
    description: 'Delete a container',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Container ID' }
      },
      required: ['id']
    }
  },
  {
    name: 'create_group',
    description: 'Create a new group for cross-cutting organization',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Group name' },
        description: { type: 'string', description: 'Group description' }
      },
      required: ['name']
    }
  },
  {
    name: 'update_group',
    description: 'Update properties of a group',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Group ID' },
        name: { type: 'string', description: 'New name' },
        description: { type: 'string', description: 'New description' }
      },
      required: ['id']
    }
  },
  {
    name: 'delete_group',
    description: 'Delete a group',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Group ID' }
      },
      required: ['id']
    }
  },
  {
    name: 'set_parent',
    description: 'Set the parent of a thread or container',
    inputSchema: {
      type: 'object',
      properties: {
        entityId: { type: 'string', description: 'Thread or container ID' },
        parentId: {
          type: ['string', 'null'],
          description: 'New parent ID (null to make root)'
        }
      },
      required: ['entityId', 'parentId']
    }
  },
  {
    name: 'move_to_group',
    description: 'Move a thread or container to a group',
    inputSchema: {
      type: 'object',
      properties: {
        entityId: { type: 'string', description: 'Thread or container ID' },
        groupId: {
          type: ['string', 'null'],
          description: 'Group ID (null to remove from group)'
        }
      },
      required: ['entityId', 'groupId']
    }
  },
  {
    name: 'get_children',
    description: 'Get immediate children of an entity',
    inputSchema: {
      type: 'object',
      properties: {
        entityId: { type: 'string', description: 'Parent entity ID' }
      },
      required: ['entityId']
    }
  },
  {
    name: 'get_ancestors',
    description: 'Get all ancestors of an entity (path to root)',
    inputSchema: {
      type: 'object',
      properties: {
        entityId: { type: 'string', description: 'Entity ID' }
      },
      required: ['entityId']
    }
  },
  {
    name: 'get_subtree',
    description: 'Get the full subtree rooted at an entity',
    inputSchema: {
      type: 'object',
      properties: {
        entityId: { type: 'string', description: 'Root entity ID' }
      },
      required: ['entityId']
    }
  }
];

// Tool handlers
export function handleOrgTool(
  name: string,
  args: Record<string, unknown>,
  client: ThreadsClient
): { success: boolean; data?: unknown; error?: string } {
  try {
    switch (name) {
      case 'create_container': {
        const container = client.createContainer({
          name: args.name as string,
          description: args.description as string | undefined,
          parentId: args.parentId as string | undefined,
          groupId: args.groupId as string | undefined,
          tags: args.tags as string[] | undefined
        });
        return { success: true, data: container };
      }

      case 'update_container': {
        const container = client.updateContainer(args.id as string, {
          name: args.name as string | undefined,
          description: args.description as string | undefined,
          tags: args.tags as string[] | undefined
        });
        if (!container) {
          return { success: false, error: `Container not found: ${args.id}` };
        }
        return { success: true, data: container };
      }

      case 'delete_container': {
        const deleted = client.deleteContainer(args.id as string);
        if (!deleted) {
          return { success: false, error: `Container not found: ${args.id}` };
        }
        return { success: true, data: { deleted: true, id: args.id } };
      }

      case 'create_group': {
        const group = client.createGroup({
          name: args.name as string,
          description: args.description as string | undefined
        });
        return { success: true, data: group };
      }

      case 'update_group': {
        const group = client.updateGroup(args.id as string, {
          name: args.name as string | undefined,
          description: args.description as string | undefined
        });
        if (!group) {
          return { success: false, error: `Group not found: ${args.id}` };
        }
        return { success: true, data: group };
      }

      case 'delete_group': {
        const deleted = client.deleteGroup(args.id as string);
        if (!deleted) {
          return { success: false, error: `Group not found: ${args.id}` };
        }
        return { success: true, data: { deleted: true, id: args.id } };
      }

      case 'set_parent': {
        const entity = client.setParent(
          args.entityId as string,
          args.parentId as string | null
        );
        if (!entity) {
          return { success: false, error: `Entity or parent not found` };
        }
        return { success: true, data: entity };
      }

      case 'move_to_group': {
        const entity = client.moveToGroup(
          args.entityId as string,
          args.groupId as string | null
        );
        if (!entity) {
          return { success: false, error: `Entity or group not found` };
        }
        return { success: true, data: entity };
      }

      case 'get_children': {
        const children = client.getChildren(args.entityId as string);
        return { success: true, data: children };
      }

      case 'get_ancestors': {
        const ancestors = client.getAncestors(args.entityId as string);
        return { success: true, data: ancestors };
      }

      case 'get_subtree': {
        const subtree = client.getSubtree(args.entityId as string);
        if (!subtree) {
          return { success: false, error: `Entity not found: ${args.entityId}` };
        }
        return { success: true, data: subtree };
      }

      default:
        return { success: false, error: `Unknown tool: ${name}` };
    }
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
