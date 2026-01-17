# tools/ Module

MCP tool definitions and handlers.

## File Structure Pattern

Each `*-ops.ts` file exports:
1. `*Tools: Tool[]` - Array of MCP tool definitions with JSON Schema
2. `handle*Tool(name, args, client)` - Dispatcher returning `{ success, data?, error? }`

Registration happens in `index.ts` which builds lookup sets for routing.

## Tool Categories

| File | Domain | Tools |
|------|--------|-------|
| `thread-ops.ts` | Thread CRUD | create, update, archive, delete, get |
| `progress-ops.ts` | Progress log | add, list, edit, delete |
| `org-ops.ts` | Hierarchy | container/group CRUD, set_parent, move_to_group, get_children/ancestors/subtree |
| `query-ops.ts` | Search/list | list_threads/containers/groups, search, get_next_action, get_full_tree, get_entity |

## Adding a New Tool

1. Add `Tool` definition to appropriate `*Tools` array with `inputSchema`
2. Add case to the file's `handle*Tool()` switch
3. Tool is auto-registered via `index.ts` aggregation

## Response Contract

All handlers return:
```typescript
{ success: true, data: <result> }           // on success
{ success: false, error: "message" }        // on failure
```

The `index.ts` wrapper formats these as MCP `content` blocks.

## Schema Conventions

- Required params in `required[]` array
- Optional enums: `status`, `temperature`, `size`
- `parentId`/`groupId` accept `['string', 'null']` for explicit null
- `identifier` params try ID first, then name lookup
