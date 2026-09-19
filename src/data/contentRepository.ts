import { getDatabase } from '../db/database';
import { enqueueMutation } from '../sync/outbox';
import { ContentItem } from '../types/domain';

function id(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export function listContent(type?: ContentItem['type']): ContentItem[] {
  const query = type
    ? `SELECT id, type, title, body, metadata, created_at AS createdAt, updated_at AS updatedAt FROM content_items WHERE type = ? ORDER BY updated_at DESC`
    : `SELECT id, type, title, body, metadata, created_at AS createdAt, updated_at AS updatedAt FROM content_items ORDER BY updated_at DESC`;
  const rows = type ? getDatabase().getAllSync<any>(query, type) : getDatabase().getAllSync<any>(query);
  return rows.map(row => ({ ...row, metadata: JSON.parse(row.metadata || '{}') }));
}

export interface PrayerRequest {
  id: string;
  user_id: string | null;
  title: string;
  body: string;
  is_anonymous: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

export function listPrayerRequests(): PrayerRequest[] {
  const query = `SELECT * FROM prayer_requests ORDER BY updated_at DESC`;
  const rows = getDatabase().getAllSync<any>(query);
  return rows.map(row => ({
    ...row,
    is_anonymous: Boolean(row.is_anonymous)
  }));
}

export function savePrayerRequest(userId: string | null, title: string, body: string, isAnonymous = false): string {
  const requestId = id('prayer');
  const now = new Date().toISOString();
  getDatabase().runSync(
    `INSERT INTO prayer_requests (id, user_id, title, body, is_anonymous, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)`,
    requestId, userId, title, body, isAnonymous ? 1 : 0, now, now
  );
  enqueueMutation({ entityType: 'prayer_request', entityId: requestId, operation: 'create', payload: { id: requestId, user_id: userId, title, request_text: body, is_anonymous: isAnonymous, created_at: now } });
  return requestId;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string | null;
  body: string;
  status: string;
  created_at: string;
}

export function listComments(postId: string): Comment[] {
  const query = `SELECT * FROM community_comments WHERE post_id = ? ORDER BY created_at ASC`;
  return getDatabase().getAllSync<any>(query, postId);
}

export function saveComment(postId: string, userId: string | null, body: string): string {
  const commentId = id('comment');
  const now = new Date().toISOString();
  getDatabase().runSync(`INSERT INTO community_comments (id, post_id, user_id, body, status, created_at) VALUES (?, ?, ?, ?, 'pending', ?)`, commentId, postId, userId, body, now);
  enqueueMutation({ entityType: 'comment', entityId: commentId, operation: 'create', payload: { id: commentId, post_id: postId, user_id: userId, text: body, created_at: now } });
  return commentId;
}

export function saveMessage(conversationId: string, userId: string | null, body: string): string {
  const messageId = id('message');
  const now = new Date().toISOString();
  getDatabase().runSync(`INSERT INTO messages (id, conversation_id, sender_id, body, status, created_at) VALUES (?, ?, ?, ?, 'pending', ?)`, messageId, conversationId, userId, body, now);
  enqueueMutation({ entityType: 'message', entityId: messageId, operation: 'create', payload: { id: messageId, group_id: conversationId, sender_id: userId, message: body, created_at: now } });
  return messageId;
}

export function saveTestimony(userId: string | null, title: string, body: string): string {
  const testimonyId = id('testimony');
  const now = new Date().toISOString();
  getDatabase().runSync(
    `INSERT INTO content_items (id, type, title, body, metadata, created_at, updated_at) VALUES (?, 'post', ?, ?, ?, ?, ?)`,
    testimonyId, title, body, JSON.stringify({ userId, status: 'pending', category: 'Praise & Testimony' }), now, now
  );
  enqueueMutation({ entityType: 'post', entityId: testimonyId, operation: 'create', payload: { id: testimonyId, user_id: userId, title, content: body, category: 'Praise & Testimony', created_at: now } });
  return testimonyId;
}
