import { getDatabase } from '../db/database';
import { enqueueMutation } from '../sync/outbox';

export interface Group {
  id: string;
  name: string;
  description: string;
  location: string | null;
  updated_at: string;
}

export function getGroups(): Group[] {
  const database = getDatabase();
  const rows = database.getAllSync<any>(`SELECT * FROM groups ORDER BY name ASC`);
  const groups: Group[] = [];
  for (const row of rows) {
    groups.push({
      id: row.id as string,
      name: row.name as string,
      description: row.description as string,
      location: (row.location as string) || null,
      updated_at: row.updated_at as string,
    });
  }
  return groups;
}

export function isGroupMember(groupId: string, userId: string): boolean {
  const database = getDatabase();
  const row = database.getFirstSync<any>(`SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?`, [groupId, userId]);
  return !!row;
}

export function joinGroup(groupId: string, userId: string): void {
  const database = getDatabase();
  const now = new Date().toISOString();
  
  database.execSync(`SAVEPOINT join_group`);
  try {
    database.runSync(
      `INSERT OR IGNORE INTO group_members (group_id, user_id, role, joined_at) VALUES (?, ?, 'member', ?)`,
      [groupId, userId, now]
    );
    
    enqueueMutation({
      entityType: 'group_members',
      entityId: `${groupId}_${userId}`,
      operation: 'create',
      payload: {
        group_id: groupId,
        user_id: userId,
        role: 'member',
        joined_at: now
      }
    });
    
    database.execSync(`RELEASE SAVEPOINT join_group`);
  } catch (err) {
    database.execSync(`ROLLBACK TO SAVEPOINT join_group`);
    throw err;
  }
}

export function leaveGroup(groupId: string, userId: string): void {
  const database = getDatabase();
  
  database.execSync(`SAVEPOINT leave_group`);
  try {
    database.runSync(
      `DELETE FROM group_members WHERE group_id = ? AND user_id = ?`,
      [groupId, userId]
    );
    
    enqueueMutation({
      entityType: 'group_members',
      entityId: `${groupId}_${userId}`,
      operation: 'delete',
      payload: {
        group_id: groupId,
        user_id: userId
      }
    });
    
    database.execSync(`RELEASE SAVEPOINT leave_group`);
  } catch (err) {
    database.execSync(`ROLLBACK TO SAVEPOINT leave_group`);
    throw err;
  }
}
