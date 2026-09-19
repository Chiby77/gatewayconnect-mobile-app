import { getDatabase } from '../db/database';

export type ConflictResolution = 'local' | 'remote' | 'merge';

export interface ConflictRecord {
  entityType: string;
  entityId: string;
  local: Record<string, unknown>;
  remote: Record<string, unknown>;
}

function timestamp(value: Record<string, unknown>): number {
  const raw = value.updated_at || value.updatedAt || value.created_at || value.createdAt;
  const parsed = raw ? Date.parse(String(raw)) : 0;
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function resolveConflict(conflict: ConflictRecord): { resolution: ConflictResolution; value: Record<string, unknown> } {
  if (conflict.entityType === 'bible_highlight') {
    return { resolution: 'merge', value: { ...conflict.remote, ...conflict.local } };
  }
  if (conflict.entityType === 'comment' || conflict.entityType === 'message') {
    return { resolution: 'remote', value: conflict.remote };
  }
  return timestamp(conflict.local) >= timestamp(conflict.remote)
    ? { resolution: 'local', value: conflict.local }
    : { resolution: 'remote', value: conflict.remote };
}

export function recordTombstone(entityType: string, entityId: string, deletedAt = new Date().toISOString()): void {
  getDatabase().runSync(
    `INSERT OR REPLACE INTO sync_tombstones (entity_type, entity_id, deleted_at) VALUES (?, ?, ?)`,
    entityType, entityId, deletedAt
  );
}

export function hasTombstone(entityType: string, entityId: string): boolean {
  return Boolean(getDatabase().getFirstSync<{ entity_id: string }>(
    `SELECT entity_id FROM sync_tombstones WHERE entity_type = ? AND entity_id = ?`, entityType, entityId
  ));
}
