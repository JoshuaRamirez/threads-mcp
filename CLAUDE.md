# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run build      # Compile TypeScript to dist/
npm run dev        # Run with tsx (no build needed)
npm run start      # Run compiled version
npm run typecheck  # Type check only
npm run test       # Run Jest tests (requires --experimental-vm-modules)
```

### Testing with MCP Inspector

```bash
npx @modelcontextprotocol/inspector node dist/server.js
```

## Architecture

This is an MCP (Model Context Protocol) server that exposes a Threads CLI data store via stdio transport.

### Core Layers

1. **Transport Layer** (`src/server.ts`): Entry point using `StdioServerTransport` from MCP SDK
2. **Client Layer** (`src/lib/threads-client.ts`): Stateless wrapper around file-based storage at `~/.threads/threads.json`
3. **Resource Layer** (`src/resources/`): MCP resources for read-only data access via URIs
4. **Tool Layer** (`src/tools/`): MCP tools for mutations and queries

### Data Model

Three entity types with hierarchical relationships:
- **Thread**: Work item with status/temperature/size/importance tracking + progress log
- **Container**: Organizational grouping (folders)
- **Group**: Cross-cutting categorization (tags-like but structured)

Entities use `parentId` for hierarchy and `groupId` for group membership. Type guards `isThread()` and `isContainer()` distinguish entity types.

### Tool Categories

Tools are split by domain in `src/tools/`:
- `thread-ops.ts`: CRUD for threads
- `progress-ops.ts`: Progress entry management
- `org-ops.ts`: Container, group, hierarchy operations
- `query-ops.ts`: List/search/filter operations

Each file exports a `*Tools` array and `handle*Tool()` dispatcher. Registration happens via `registerTools()` in `index.ts`.

### Resource Pattern

Resources use `threads://` URI scheme. The `src/resources/index.ts` routes by parsed URI type to domain-specific handlers that return `TextResourceContents`.

### Storage

Direct file I/O to `~/.threads/threads.json` with backup creation on every write. No caching—each operation reloads from disk for CLI compatibility.
