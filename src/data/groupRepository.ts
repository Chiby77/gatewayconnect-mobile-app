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
    const { data: msgs, error: msgError } = await supabase.from('messages').select('*').eq('group_id', groupId).order('created_at', { ascending: true });
    if (msgError) {
      console.warn('Supabase fetch error for messages:', msgError);
      return [];
    }
    
    // Fetch reactions for these messages
    const msgIds = msgs.map(m => m.id);
    const { data: reactionsData } = await supabase.from('message_reactions').select('message_id, emoji').in('message_id', msgIds);
    
    // Group reactions by message_id
    const reactionsByMsg: Record<string, string[]> = {};
    if (reactionsData) {
      reactionsData.forEach(r => {
        if (!reactionsByMsg[r.message_id]) reactionsByMsg[r.message_id] = [];
        reactionsByMsg[r.message_id].push(r.emoji);
      });
    }

    return msgs.map(m => ({
      ...m,
      reactions: reactionsByMsg[m.id] || []
    })) as GroupChatMessage[];
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
    const { data, error } = await supabase.from('messages').insert([msg]).select().single();
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
export async function checkIsGroupMember(groupId: string, userId: string): Promise<boolean> {
  const { data, error } = await supabase.from('group_members').select('*').eq('group_id', groupId).eq('user_id', userId).single();
  return !!data && !error;
}
export async function fetchUserGroups(userId: string): Promise<Record<string, boolean>> {
  const { data, error } = await supabase.from('group_members').select('group_id').eq('user_id', userId);
  if (error || !data) return {};
  const map: Record<string, boolean> = {};
  data.forEach(row => map[row.group_id] = true);
  return map;
}
export async function joinGroupInDB(groupId: string, userId: string) {
  await supabase.from('group_members').insert({ group_id: groupId, user_id: userId });
}
export async function leaveGroupInDB(groupId: string, userId: string) {
  await supabase.from('group_members').delete().eq('group_id', groupId).eq('user_id', userId);
}
export async function dissolveGroupInDB(groupId: string) {
  await supabase.from('groups').delete().eq('id', groupId);
}
export async function deleteGroupMessageInDB(messageId: string) {
  await supabase.from('messages').delete().eq('id', messageId);
}
export async function toggleGroupMessageReactionInDB(messageId: string, emoji: string, userId: string, userName: string) {
  const { data: existing } = await supabase.from('message_reactions').select('id').eq('message_id', messageId).eq('user_id', userId).eq('emoji', emoji).single();
  
  if (existing) {
    await supabase.from('message_reactions').delete().eq('id', existing.id);
  } else {
    await supabase.from('message_reactions').insert({
      message_id: messageId,
      chat_type: 'group',
      user_id: userId,
      user_name: userName,
      emoji: emoji
    });
  }
}




