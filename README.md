# Threads MCP Server

MCP server exposing Threads CLI data and operations via the Model Context Protocol.

## Installation

```bash
cd threads-mcp
npm install
npm run build
```

## Usage

### With Claude Desktop

Add to your Claude Desktop configuration (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "threads": {
      "command": "node",
      "args": ["C:/Users/joshu/Desktop/threads-mcp/dist/server.js"]
    }
  }
}
```

### Development

```bash
npm run dev        # Run with tsx (no build needed)
npm run build      # Compile TypeScript
npm run start      # Run compiled version
npm run typecheck  # Type check only
```

### Testing with MCP Inspector

```bash
npx @modelcontextprotocol/inspector node dist/server.js
```

## Resources

| URI | Description |
|-----|-------------|
| `threads://threads/list` | All threads |
| `threads://threads/active` | Active threads only |
| `threads://threads/hot` | Hot/warm temperature threads |
| `threads://threads/{id}` | Single thread by ID |
| `threads://containers/list` | All containers |
| `threads://containers/{id}` | Single container by ID |
| `threads://groups/list` | All groups |
| `threads://groups/{id}` | Single group by ID |
| `threads://groups/{id}/members` | Entities in a group |
| `threads://tree` | Full hierarchy tree |
| `threads://next` | Suggested next action |
| `threads://progress/{threadId}` | Progress log for a thread |

## Tools

### Thread Management

| Tool | Description |
|------|-------------|
| `create_thread` | Create a new thread |
| `update_thread` | Update thread properties |
| `archive_thread` | Archive a thread (with optional cascade) |
| `delete_thread` | Permanently delete a thread |
| `get_thread` | Get thread by ID or name |

### Progress Tracking

| Tool | Description |
|------|-------------|
| `add_progress` | Add progress note to a thread |
| `list_progress` | Get progress history |
| `edit_progress` | Edit a progress entry |
| `delete_progress` | Delete a progress entry |

### Organization

| Tool | Description |
|------|-------------|
| `create_container` | Create organizational container |
| `update_container` | Update container properties |
| `delete_container` | Delete a container |
| `create_group` | Create a group |
| `update_group` | Update group properties |
| `delete_group` | Delete a group |
| `set_parent` | Set entity parent |
| `move_to_group` | Move entity to group |
| `get_children` | Get immediate children |
| `get_ancestors` | Get path to root |
| `get_subtree` | Get full subtree |

### Query & Search

| Tool | Description |
|------|-------------|
| `list_threads` | List threads with filters |
| `list_containers` | List containers with filters |
| `list_groups` | List all groups |
| `search_threads` | Full-text search |
| `get_next_action` | Suggest next thread to work on |
| `get_full_tree` | Get complete hierarchy |
| `get_entity` | Get any entity by ID/name |
| `get_container` | Get container by ID/name |
| `get_group` | Get group by ID/name |

## Architecture

```
threads-mcp/
├── src/
│   ├── server.ts           # Entry point, stdio transport
│   ├── lib/
│   │   ├── threads-client.ts  # Wrapper for Threads storage
│   │   └── types.ts           # MCP-specific types
│   ├── resources/
│   │   ├── index.ts        # Resource registration
│   │   ├── threads.ts      # Thread resources
│   │   ├── containers.ts   # Container resources
│   │   └── groups.ts       # Group resources
│   └── tools/
│       ├── index.ts        # Tool registration
│       ├── thread-ops.ts   # Thread operations
│       ├── progress-ops.ts # Progress operations
│       ├── org-ops.ts      # Organization operations
│       └── query-ops.ts    # Query operations
```

## Data Storage

Data is stored in `~/.threads/threads.json` (same as Threads CLI). This server directly reads and writes to that file, maintaining full compatibility with CLI operations.

## Example Workflows

### Create and track a project

```
1. Use create_container to create "My Project"
2. Use create_thread to create threads under that container
3. Use add_progress to log updates as you work
4. Use get_next_action to see what to work on next
```

### Review active work

```
1. Read threads://threads/active resource
2. Or use list_threads with status: "active"
3. Use list_progress to see recent updates
```

### Organize existing threads

```
1. Use create_group to create organizational groups
2. Use move_to_group to assign threads
3. Use set_parent to build hierarchy
```

## License

MIT
