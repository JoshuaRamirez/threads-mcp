import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { ThreadsClient } from '../lib/threads-client.js';

import { threadTools, handleThreadTool } from './thread-ops.js';
import { progressTools, handleProgressTool } from './progress-ops.js';
import { orgTools, handleOrgTool } from './org-ops.js';
import { queryTools, handleQueryTool } from './query-ops.js';

// Combine all tools
const allTools: Tool[] = [
  ...threadTools,
  ...progressTools,
  ...orgTools,
  ...queryTools
];

// Build a set of tool names for fast lookup
const threadToolNames = new Set(threadTools.map(t => t.name));
const progressToolNames = new Set(progressTools.map(t => t.name));
const orgToolNames = new Set(orgTools.map(t => t.name));
const queryToolNames = new Set(queryTools.map(t => t.name));

/**
 * Register all tool handlers with the MCP server
 */
export function registerTools(server: Server, client: ThreadsClient): void {
  // Handler for listing all tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: allTools };
  });

  // Handler for calling a tool
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    // Route to appropriate handler based on tool category
    let result: { success: boolean; data?: unknown; error?: string };

    if (threadToolNames.has(name)) {
      result = handleThreadTool(name, args || {}, client);
    } else if (progressToolNames.has(name)) {
      result = handleProgressTool(name, args || {}, client);
    } else if (orgToolNames.has(name)) {
      result = handleOrgTool(name, args || {}, client);
    } else if (queryToolNames.has(name)) {
      result = handleQueryTool(name, args || {}, client);
    } else {
      result = { success: false, error: `Unknown tool: ${name}` };
    }

    // Format response
    if (result.success) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result.data, null, 2)
          }
        ]
      };
    } else {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ error: result.error }, null, 2)
          }
        ],
        isError: true
      };
    }
  });
}
