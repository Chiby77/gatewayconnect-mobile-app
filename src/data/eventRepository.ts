import { getDatabase } from '../db/database';

export interface Event {
  id: string;
  title: string;
  event_date: string;
  event_time: string;
  location: string;
  description: string | null;
  banner_url: string | null;
  category: string | null;
  created_at: string;
}

export function getEvents(): Event[] {
  const database = getDatabase();
  const rows = database.getAllSync<any>(`SELECT * FROM events ORDER BY event_date ASC, event_time ASC`);
  const events: Event[] = [];
  for (const row of rows) {
    events.push({
      id: row.id as string,
      title: row.title as string,
      event_date: row.event_date as string,
      event_time: row.event_time as string,
      location: row.location as string,
      description: (row.description as string) || null,
      banner_url: (row.banner_url as string) || null,
      category: (row.category as string) || null,
      created_at: row.created_at as string,
    });
  }
  return events;
}
