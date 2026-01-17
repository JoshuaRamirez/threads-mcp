import { Resource, TextResourceContents } from '@modelcontextprotocol/sdk/types.js';
import { ThreadsClient } from '../lib/threads-client.js';
import { Group, Entity } from '../lib/types.js';

/**
 * Get static group resources
 */
export function getGroupResources(client: ThreadsClient): Resource[] {
  const resources: Resource[] = [
    {
      uri: 'threads://groups/list',
      name: 'All Groups',
      description: 'List of all groups in the system',
      mimeType: 'application/json'
    }
  ];

  // Add individual group resources
  const groups = client.listGroups();
  for (const group of groups) {
    resources.push({
      uri: `threads://groups/${group.id}`,
      name: group.name,
      description: group.description || `Group: ${group.name}`,
      mimeType: 'application/json'
    });

    // Add group members resource
    resources.push({
      uri: `threads://groups/${group.id}/members`,
      name: `${group.name} - Members`,
      description: `Threads and containers in group: ${group.name}`,
      mimeType: 'application/json'
    });
  }

  return resources;
}

/**
 * Read group resource by URI
 */
export function readGroupResource(uri: string, client: ThreadsClient): TextResourceContents | null {
  const uriParts = uri.replace('threads://groups/', '').split('/');
  const segment = uriParts[0];
  const subSegment = uriParts[1];

  let data: Group | Group[] | Entity[] | null = null;

  switch (segment) {
    case 'list':
      data = client.listGroups();
      break;
    default:
      // Assume it's a group ID
      if (subSegment === 'members') {
        // Get members of this group
        const threads = client.listThreads({ groupId: segment });
        const containers = client.listContainers({ groupId: segment });
        data = [...containers, ...threads];
      } else {
        data = client.getGroup(segment);
        if (!data) {
          // Try by name
          data = client.getGroupByName(segment);
        }
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
