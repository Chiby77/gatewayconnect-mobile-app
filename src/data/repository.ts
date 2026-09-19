export interface Repository<T, Query = void> {
  get(query: Query): T | null;
  list(query?: Query): T[];
  save(value: T): void;
  remove(id: string): void;
}

export interface LocalFirstRepository<T> extends Repository<T> {
  saveLocal(value: T): void;
  queueCreate(value: T): void;
  queueUpdate(id: string, patch: Partial<T>): void;
  queueDelete(id: string): void;
}
