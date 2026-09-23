import { getDatabase } from '../db/database';
import { supabase } from '../remote/supabase';

export interface Group {
  id: string;
  name: string;
  description: string;
  location: string | null;
  category?: string;
  is_paid: boolean;
  price_usd?: number;
  avatar_url?: string;
  updated_at: string;
}

export interface GroupChatMessage {
  id: string;
  group_id: string;
  sender_id: string;
  sender_name: string;
  sender_role?: string;
  text: string;
  created_at: string;
  receipt_status?: 'sent' | 'delivered' | 'read';
  reply_to?: {
    sender_name: string;
    text: string;
  };
  reactions?: string[];
  attachment?: {
    type: 'image' | 'document' | 'link' | 'scripture';
    name: string;
    uri?: string;
    url?: string;
  };
}

export async function fetchGroupsFromDB(): Promise<Group[]> {
  try {
    const { data, error } = await supabase.from('groups').select('*').order('updated_at', { ascending: false });
    if (error) {
      console.warn('Supabase fetch error for groups:', error);
      return [];
    }
    return data as Group[];
  } catch (e) {
    console.error(e);
    return [];
  }
}

export async function fetchGroupMessagesFromDB(groupId: string): Promise<GroupChatMessage[]> {
  try {
    const { data, error } = await supabase.from('group_messages').select('*').eq('group_id', groupId).order('created_at', { ascending: true });
    if (error) {
      console.warn('Supabase fetch error for messages:', error);
      return [];
    }
    return data as GroupChatMessage[];
  } catch (e) {
    console.error(e);
    return [];
  }
}

export async function createGroupInDB(
  name: string,
  description: string,
  category = 'Fellowship',
  isPaid = false
): Promise<Group | null> {
  try {
    const newGroup = {
      name,
      description,
      category,
      is_paid: isPaid,
      location: 'Gateway',
    };
    const { data, error } = await supabase.from('groups').insert([newGroup]).select().single();
    if (error) throw error;
    return data as Group;
  } catch (e) {
    console.error(e);
    return null;
  }
}

export async function sendGroupMessageToDB(msg: Partial<GroupChatMessage>): Promise<GroupChatMessage | null> {
  try {
    const { data, error } = await supabase.from('group_messages').insert([msg]).select().single();
    if (error) throw error;
    return data as GroupChatMessage;
  } catch (e) {
    console.error(e);
    return null;
  }
}

export function generateGroupInviteLink(groupId: string): string {
  return `https://gatewayconnect.joedaniels.org/invite/group/${groupId}`;
}
