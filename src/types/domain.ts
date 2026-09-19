export type BibleColor = 'gold' | 'emerald' | 'blue' | 'rose';
export type MutationOperation = 'create' | 'update' | 'delete' | 'action';
export type MutationStatus = 'pending' | 'processing' | 'failed' | 'synced';

export interface BibleVerse {
  versionId: string;
  bookId: number;
  bookName: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface BibleSearchResult extends BibleVerse {
  reference: string;
}

export interface OfflineMutation {
  id: string;
  entityType: string;
  entityId: string;
  operation: MutationOperation;
  payload: unknown;
  createdAt: string;
  attemptCount: number;
  status: MutationStatus;
  lastError?: string;
}

export interface ContentItem {
  id: string;
  type: 'sermon' | 'devotional' | 'event' | 'post' | 'product';
  title: string;
  body: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
