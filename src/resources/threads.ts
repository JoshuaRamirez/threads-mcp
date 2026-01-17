import { Resource, TextResourceContents } from '@modelcontextprotocol/sdk/types.js';
import { ThreadsClient } from '../lib/threads-client.js';
import { Thread } from '../lib/types.js';

/**
 * Get static thread resources that are always available
 */
export function getThreadResources(client: ThreadsClient): Resource[] {
  const resources: Resource[] = [
    {
      uri: 'threads://threads/list',
      name: 'All Threads',
      description: 'List of all threads in the system',
      mimeType: 'application/json'
    },
    {
      uri: 'threads://threads/active',
      name: 'Active Threads',
      description: 'Threads with active status',
      mimeType: 'application/json'
    },
    {
      uri: 'threads://threads/hot',
      name: 'Hot Threads',
      description: 'Threads with hot or warm temperature',
      mimeType: 'application/json'
    }
  ];

  // Add individual thread resources
  const threads = client.listThreads();
  for (const thread of threads) {
    resources.push({
      uri: `threads://threads/${thread.id}`,
      name: thread.name,
      description: thread.description || `Thread: ${thread.name}`,
      mimeType: 'application/json'
    });
  }

  return resources;
}

/**
 * Read thread resource by URI
 */
export function readThreadResource(uri: string, client: ThreadsClient): TextResourceContents | null {
  const uriParts = uri.replace('threads://threads/', '').split('/');
  const segment = uriParts[0];

  let data: Thread | Thread[] | null = null;

  switch (segment) {
    case 'list':
      data = client.listThreads();
      break;
    case 'active':
      data = client.listThreads({ status: 'active' });
      break;
    case 'hot':
      data = client.listThreads().filter(t =>
        t.temperature === 'hot' || t.temperature === 'warm'
      );
      break;
    default:
      // Assume it's a thread ID
      data = client.getThread(segment);
      if (!data) {
        // Try by name
        data = client.getThreadByName(segment);
      }
      break;
  }

  if (data === null) return null;

  return {
    uri,
    mimeType: 'application/json',
    text: JSON.stringify(data, null, 2)
  };
}
