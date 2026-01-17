#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ThreadsClient } from './lib/threads-client.js';
import { registerResources } from './resources/index.js';
import { registerTools } from './tools/index.js';

// Create the MCP server
const server = new Server(
  {
    name: 'threads-mcp',
    version: '1.0.0'
  },
  {
    capabilities: {
      resources: {},
      tools: {}
    }
  }
);

// Create the Threads client
const client = new ThreadsClient();

// Register resources and tools
registerResources(server, client);
registerTools(server, client);

// Error handling
server.onerror = (error) => {
  console.error('[threads-mcp] Server error:', error);
};

process.on('SIGINT', async () => {
  await server.close();
  process.exit(0);
});

// Start the server with stdio transport
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[threads-mcp] Server started');
}

main().catch((error) => {
  console.error('[threads-mcp] Fatal error:', error);
  process.exit(1);
});
