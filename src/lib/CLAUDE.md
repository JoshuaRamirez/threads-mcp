# lib/ Module

Core types and data access layer.

## types.ts

Domain types mirroring the Threads CLI data model:
- `Thread`: Work item with `status`, `temperature`, `size`, `importance`, `progress[]`, `details[]`
- `Container`: Organizational folder (type discriminator: `type: 'container'`)
- `Group`: Cross-cutting categorization (separate from hierarchy)
- `Entity`: Union type `Thread | Container`

Enum-like types: `ThreadStatus`, `Temperature`, `ThreadSize`, `Importance` (1-5)

Filter/Input types follow pattern: `*Filter` for queries, `Create*Input`/`Update*Input` for mutations.

## threads-client.ts

Stateless client with direct file I/O to `~/.threads/threads.json`.

### Storage Pattern
- Every read calls `loadData()` (no caching)
- Every write calls `saveData()` which creates backup first
- Maintains CLI compatibility by using identical file format

### Type Guards
```typescript
isThread(entity)    // entity.type !== 'container'
isContainer(entity) // entity.type === 'container'
```

### Lookup Pattern
All entity getters have both `get*(id)` and `get*ByName(name)` variants. Tools should try ID first, then fall back to name lookup.

### Hierarchy Methods
- `getChildren(entityId)`: Immediate children only
- `getAncestors(entityId)`: Path to root (excludes self)
- `getSubtree(entityId)`: Full recursive tree as `TreeNode`
- `getFullTree()`: All root entities with subtrees

### Priority Algorithm (`getNextAction`)
Sorts active threads by: temperature (hot→frozen) then importance (5→1). Returns first match.
