# src/ Directory

MCP server implementation for Threads CLI data.

## Module Responsibilities

```
server.ts     → Entry point, stdio transport, registration
lib/          → Types + ThreadsClient (data layer)
tools/        → MCP tools (mutations + queries)
resources/    → MCP resources (read-only URI access)
```

## Data Flow

```
MCP Request → server.ts → tools/index.ts or resources/index.ts
                              ↓
                         *-ops.ts or *.ts handlers
                              ↓
                         lib/threads-client.ts
                              ↓
                         ~/.threads/threads.json
```

## Extension Points

| To add... | Modify... |
|-----------|-----------|
| New tool | `tools/*-ops.ts` (add to array + handler) |
| New resource | `resources/*.ts` or `resources/index.ts` |
| New entity type | `lib/types.ts` + client methods + tools + resources |
| New filter field | `lib/types.ts` (*Filter) + client filter logic + tool schema |

## Import Conventions

All imports use `.js` extension for ESM compatibility:
```typescript
import { ThreadsClient } from './lib/threads-client.js';
```
