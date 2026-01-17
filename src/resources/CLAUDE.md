# resources/ Module

MCP resource definitions for read-only data access via URIs.

## URI Scheme

All resources use `threads://` prefix:
```
threads://threads/list          # All threads
threads://threads/active        # Filtered by status
threads://threads/hot           # Filtered by temperature
threads://threads/{id}          # Single thread
threads://containers/list       # All containers
threads://containers/{id}       # Single container
threads://groups/list           # All groups
threads://groups/{id}           # Single group
threads://groups/{id}/members   # Entities in group
threads://tree                  # Full hierarchy
threads://next                  # Priority suggestion
threads://progress/{threadId}   # Progress log
```

## File Structure Pattern

Each domain file (`threads.ts`, `containers.ts`, `groups.ts`) exports:
1. `get*Resources(client): Resource[]` - Returns available resources (static + dynamic per-entity)
2. `read*Resource(uri, client): TextResourceContents | null` - Reads specific resource

System resources (tree, next, progress) are handled directly in `index.ts`.

## Adding a New Resource

1. For domain resources: Add to `get*Resources()` and handle in `read*Resource()`
2. For system resources: Add to `getSystemResources()` and `readSystemResource()` in `index.ts`
3. Add case to `parseUri()` switch if new URI type prefix

## Dynamic Resources

Resources are generated at list-time by iterating entities:
- Each thread/container/group gets its own `threads://{type}/{id}` resource
- Progress resources only appear for threads with `progress.length > 0`
- Group member resources enumerate entities with matching `groupId`

## Response Format

All resources return `TextResourceContents` with:
- `uri`: Original request URI
- `mimeType`: `'application/json'`
- `text`: JSON.stringify(data, null, 2)
