import { getDatabase } from '../db/database';
import { isSupabaseConfigured, supabase } from './supabase';
import { syncNow } from '../sync/syncEngine';

export function startRealtimePersistence(): () => void {
  if (!isSupabaseConfigured) return () => undefined;
  const channel = supabase.channel('gatewayconnect-mobile-sync');
  
  const triggerSync = () => { void syncNow(); };

  channel.on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, triggerSync);
  channel.on('postgres_changes', { event: '*', schema: 'public', table: 'prayer_requests' }, triggerSync);
  channel.on('postgres_changes', { event: '*', schema: 'public', table: 'groups' }, triggerSync);
  channel.on('postgres_changes', { event: '*', schema: 'public', table: 'post_comments' }, triggerSync);
  channel.on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, triggerSync);
  
  channel.subscribe();
  return () => { void supabase.removeChannel(channel); };
}
