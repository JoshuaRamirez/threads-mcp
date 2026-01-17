/**
 * Smoke tests for search/list operations with potentially undefined fields.
 * Verifies the fix for "Cannot read properties of undefined (reading 'some')" bug.
 *
 * Note: These tests run against the real ~/.threads/threads.json data file.
 * The primary purpose is to ensure no crashes occur with real-world data
 * that may have undefined tags/description fields.
 */

import { describe, it, expect } from '@jest/globals';

describe('Search and List - no crash with undefined fields', () => {
  it('search() does not throw with real data', async () => {
    const { ThreadsClient } = await import('../dist/lib/threads-client.js');
    const client = new ThreadsClient();

    // Should not throw regardless of data state
    expect(() => client.search('test')).not.toThrow();
    expect(() => client.search('nonexistent-query-xyz')).not.toThrow();
    expect(() => client.search('')).not.toThrow();
  });

  it('listThreads() with search filter does not throw', async () => {
    const { ThreadsClient } = await import('../dist/lib/threads-client.js');
    const client = new ThreadsClient();

    expect(() => client.listThreads({ search: 'test' })).not.toThrow();
    expect(() => client.listThreads({ search: '' })).not.toThrow();
  });

  it('listThreads() with tags filter does not throw', async () => {
    const { ThreadsClient } = await import('../dist/lib/threads-client.js');
    const client = new ThreadsClient();

    expect(() => client.listThreads({ tags: ['sometag'] })).not.toThrow();
    expect(() => client.listThreads({ tags: [] })).not.toThrow();
  });

  it('listContainers() with search filter does not throw', async () => {
    const { ThreadsClient } = await import('../dist/lib/threads-client.js');
    const client = new ThreadsClient();

    expect(() => client.listContainers({ search: 'test' })).not.toThrow();
  });

  it('listContainers() with tags filter does not throw', async () => {
    const { ThreadsClient } = await import('../dist/lib/threads-client.js');
    const client = new ThreadsClient();

    expect(() => client.listContainers({ tags: ['sometag'] })).not.toThrow();
  });

  it('search() returns array', async () => {
    const { ThreadsClient } = await import('../dist/lib/threads-client.js');
    const client = new ThreadsClient();

    const results = client.search('mcp');
    expect(Array.isArray(results)).toBe(true);
  });
});
