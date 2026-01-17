import { Resource, TextResourceContents } from '@modelcontextprotocol/sdk/types.js';
import { ThreadsClient } from '../lib/threads-client.js';
import { Container } from '../lib/types.js';

/**
 * Get static container resources
 */
export function getContainerResources(client: ThreadsClient): Resource[] {
  const resources: Resource[] = [
    {
      uri: 'threads://containers/list',
      name: 'All Containers',
      description: 'List of all containers in the system',
      mimeType: 'application/json'
    }
  ];

  // Add individual container resources
  const containers = client.listContainers();
  for (const container of containers) {
    resources.push({
      uri: `threads://containers/${container.id}`,
      name: container.name,
      description: container.description || `Container: ${container.name}`,
      mimeType: 'application/json'
    });
  }

  return resources;
}

/**
 * Read container resource by URI
 */
export function readContainerResource(uri: string, client: ThreadsClient): TextResourceContents | null {
  const uriParts = uri.replace('threads://containers/', '').split('/');
  const segment = uriParts[0];

  let data: Container | Container[] | null = null;

  switch (segment) {
    case 'list':
      data = client.listContainers();
      break;
    default:
      // Assume it's a container ID
      data = client.getContainer(segment);
      if (!data) {
        // Try by name
        data = client.getContainerByName(segment);
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
