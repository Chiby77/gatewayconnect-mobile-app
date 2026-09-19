import { getDatabase } from '../db/database';
import { MutationOperation, MutationStatus, OfflineMutation } from '../types/domain';
import { recordTombstone } from './conflictResolver';
import { setSyncState } from './syncStatus';

function mutationId(): string {
  return `mutation_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function nextAttempt(attemptCount: number): string {
  return new Date(Date.now() + Math.min(30 * 60 * 1000, 1000 * 2 ** attemptCount)).toISOString();
}

export function enqueueMutation(input: Omit<OfflineMutation, 'id' | 'createdAt' | 'attemptCount' | 'status'>): OfflineMutation {
  const mutation: OfflineMutation = { ...input, id: mutationId(), createdAt: new Date().toISOString(), attemptCount: 0, status: 'pending' };
  getDatabase().runSync(
    `INSERT INTO sync_outbox (id, entity_type, entity_id, operation, payload, status, attempt_count, created_at, next_attempt_at, idempotency_key)
     VALUES (?, ?, ?, ?, ?, 'pending', 0, ?, ?, ?)`,
    mutation.id, mutation.entityType, mutation.entityId, mutation.operation,
    JSON.stringify(mutation.payload), mutation.createdAt, mutation.createdAt, mutation.id
  );
  setSyncState('queued');
  return mutation;
}

export function listPendingMutations(limit = 25): OfflineMutation[] {
  return getDatabase().getAllSync<OfflineMutation>(
    `SELECT id, entity_type AS entityType, entity_id AS entityId, operation, payload,
            created_at AS createdAt, attempt_count AS attemptCount, status, last_error AS lastError
     FROM sync_outbox WHERE status IN ('pending', 'failed')
     AND (next_attempt_at IS NULL OR next_attempt_at <= ?) ORDER BY created_at LIMIT ?`,
    new Date().toISOString(), limit
  ).map(item => ({ ...item, payload: JSON.parse(String(item.payload)) }));
}

export function markProcessing(id: string): void {
  getDatabase().runSync(`UPDATE sync_outbox SET status = 'processing' WHERE id = ?`, id);
}

export function markSynced(id: string): void {
  getDatabase().runSync(`UPDATE sync_outbox SET status = 'synced', last_error = NULL WHERE id = ?`, id);
}

export function markFailed(id: string, error: string, attemptCount: number): void {
  getDatabase().runSync(`UPDATE sync_outbox SET status = 'failed', attempt_count = ?, last_error = ?, next_attempt_at = ? WHERE id = ?`, attemptCount + 1, error, nextAttempt(attemptCount), id);
}

export function enqueueDelete(entityType: string, entityId: string): OfflineMutation {
  const deletedAt = new Date().toISOString();
  recordTombstone(entityType, entityId, deletedAt);
  return enqueueMutation({ entityType, entityId, operation: 'delete', payload: { id: entityId, deleted_at: deletedAt } });
}

export function countPendingMutations(): number {
  return getDatabase().getFirstSync<{ count: number }>(`SELECT COUNT(*) AS count FROM sync_outbox WHERE status IN ('pending', 'failed')`)?.count ?? 0;
}

export function saveCursor(resource: string, cursor: string): void {
  getDatabase().runSync(`INSERT OR REPLACE INTO sync_cursors (resource, cursor, updated_at) VALUES (?, ?, ?)`, resource, cursor, new Date().toISOString());
}

export function getCursor(resource: string): string | null {
  return getDatabase().getFirstSync<{ cursor: string }>(`SELECT cursor FROM sync_cursors WHERE resource = ?`, resource)?.cursor ?? null;
}

export type { MutationOperation, MutationStatus };
