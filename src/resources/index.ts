import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  Resource,
  TextResourceContents,
} from '@modelcontextprotocol/sdk/types.js';
import { ThreadsClient } from '../lib/threads-client.js';
import { getThreadResources, readThreadResource } from './threads.js';
import { getContainerResources, readContainerResource } from './containers.js';
import { getGroupResources, readGroupResource } from './groups.js';

/**
 * Get additional system resources (tree, progress, etc.)
 */
function getSystemResources(client: ThreadsClient): Resource[] {
  const resources: Resource[] = [
    {
      uri: 'threads://tree',
      name: 'Full Hierarchy Tree',
      description: 'Complete hierarchy of all threads and containers',
      mimeType: 'application/json'
    },
    {
      uri: 'threads://next',
      name: 'Next Action',
      description: 'Suggested next thread to work on',
      mimeType: 'application/json'
    }
  ];

  // Add progress resources for each thread
  const threads = client.listThreads();
  for (const thread of threads) {
    if (thread.progress.length > 0) {
      resources.push({
        uri: `threads://progress/${thread.id}`,
        name: `Progress: ${thread.name}`,
        description: `Progress log for thread: ${thread.name}`,
        mimeType: 'application/json'
      });
    }
  }

  return resources;
}

/**
 * Read system resources
 */
function readSystemResource(uri: string, client: ThreadsClient): TextResourceContents | null {
  if (uri === 'threads://tree') {
    const tree = client.getFullTree();
    return {
      uri,
      mimeType: 'application/json',
      text: JSON.stringify(tree, null, 2)
    };
  }

  if (uri === 'threads://next') {
    const next = client.getNextAction();
    return {
      uri,
      mimeType: 'application/json',
      text: JSON.stringify(next, null, 2)
    };
  }

  if (uri.startsWith('threads://progress/')) {
    const threadId = uri.replace('threads://progress/', '');
    const progress = client.listProgress(threadId);
    if (progress.length === 0) return null;
    return {
      uri,
      mimeType: 'application/json',
      text: JSON.stringify(progress, null, 2)
    };
  }

  return null;
}

/**
 * Parse URI to determine resource type
 */
function parseUri(uri: string): { type: string; rest: string } | null {
  if (!uri.startsWith('threads://')) return null;

  const path = uri.slice('threads://'.length);
  const slashIndex = path.indexOf('/');

  if (slashIndex === -1) {
    return { type: path, rest: '' };
  }

  return {
    type: path.slice(0, slashIndex),
    rest: path.slice(slashIndex + 1)
  };
}

/**
 * Register all resource handlers with the MCP server
 */
export function registerResources(server: Server, client: ThreadsClient): void {
  // Handler for listing all resources
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    const allResources: Resource[] = [
      ...getThreadResources(client),
      ...getContainerResources(client),
      ...getGroupResources(client),
      ...getSystemResources(client)
    ];

    return { resources: allResources };
  });

  // Handler for reading a specific resource
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;

    const parsed = parseUri(uri);
    if (!parsed) {
      throw new Error(`Invalid URI: ${uri}`);
    }

    let contents: TextResourceContents | null = null;

    switch (parsed.type) {
      case 'threads':
        contents = readThreadResource(uri, client);
        break;
      case 'containers':
        contents = readContainerResource(uri, client);
        break;
      case 'groups':
        contents = readGroupResource(uri, client);
        break;
      case 'tree':
      case 'next':
      case 'progress':
        contents = readSystemResource(uri, client);
        break;
      default:
        throw new Error(`Unknown resource type: ${parsed.type}`);
    }

    if (contents === null) {
      throw new Error(`Resource not found: ${uri}`);
    }

    return { contents: [contents] };
  });
}
