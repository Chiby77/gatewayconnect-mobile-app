import { getDatabase } from '../db/database';
import { enqueueMutation } from '../sync/outbox';

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
}

export const OFFICIAL_GROUPS: Group[] = [
  {
    id: 'group_ignite_worship',
    name: 'Ignite Worship Team',
    description: 'About worship and awakening the consciousness of God. Connects people together in atmospheric praise.',
    category: 'Worship',
    is_paid: false,
    location: 'Harare Sanctuary & Virtual (Fridays @ 5:00 PM CAT)',
    updated_at: '2026-02-01T00:00:00Z',
  },
  {
    id: 'group_pride_of_lions',
    name: 'Pride Of Lions',
    description: "Men's Fellowship & brotherhood where men are groomed and trained in the way of God to be godly husbands, fathers, and leaders.",
    category: 'Men',
    is_paid: false,
    location: 'Belvedere Hub & Virtual (Saturdays @ 7:00 AM CAT)',
    updated_at: '2026-02-01T00:00:00Z',
  },
  {
    id: 'group_passion_ladies',
    name: 'Passion Ladies',
    description: '(by Prophetess Melinda Daniels) Training ladies to be godly women, wives, mothers, and spiritual leaders walking in dignity, grace, and apostolic purpose.',
    category: 'Women',
    is_paid: false,
    location: 'Gateway Center & Virtual',
    updated_at: '2026-02-01T00:00:00Z',
  },
  {
    id: 'group_gymstars_foundation',
    name: 'Gymstars Foundation',
    description: 'Foundation for youth and juniors where we groom and teach the youth to find God at an early age, build character, and excel.',
    category: 'Youth',
    is_paid: false,
    location: 'Main Auditorium & Saturday Morning Sessions',
    updated_at: '2026-02-15T00:00:00Z',
  },
  {
    id: 'group_foundation_school',
    name: 'Foundation School',
    description: 'Enroll to learn about Christ, discipleship, spiritual foundation, and how to build yourself and mature in the Kingdom.',
    category: 'School',
    is_paid: true,
    price_usd: 150,
    location: 'Apostolic Academy Portal',
    updated_at: '2026-02-10T00:00:00Z',
  },
  {
    id: 'group_international_school_of_mentorship',
    name: 'International School of Mentorship',
    description: 'Intensive apostolic mentorship, prophetic impartation, and global kingdom leadership academy with Apostle Joe Daniels.',
    category: 'School',
    is_paid: true,
    price_usd: 150,
    location: 'Global Leadership Academy',
    updated_at: '2026-03-01T00:00:00Z',
  },
];

const INITIAL_MESSAGES: Record<string, Omit<GroupChatMessage, 'id'>[]> = {
  group_ignite_worship: [
    {
      group_id: 'group_ignite_worship',
      sender_id: 'usr_apostle_joe',
      sender_name: 'Apostle Joe Daniels',
      sender_role: 'Senior Pastor',
      text: 'Grace and fire to the Ignite Worship Team! Let our worship continuously awaken the consciousness of God across the nations. 🔥🕊️',
      created_at: 'Today at 09:15',
    },
    {
      group_id: 'group_ignite_worship',
      sender_id: 'usr_chipo',
      sender_name: 'Chipo Ruvimbo Mandaza',
      sender_role: 'Worship Leader',
      text: 'Amen Apostle! The atmosphere for Sunday broadcast is charged. Vocal rehearsals begin at 5:00 PM today.',
      created_at: 'Today at 10:04',
    },
  ],
  group_pride_of_lions: [
    {
      group_id: 'group_pride_of_lions',
      sender_id: 'usr_apostle_joe',
      sender_name: 'Apostle Joe Daniels',
      sender_role: 'Senior Pastor',
      text: 'Welcome to Pride Of Lions men. A man who fears the Lord is a pillar of strength, honor, and priesthood in his home and church.',
      created_at: 'Yesterday at 14:20',
    },
    {
      group_id: 'group_pride_of_lions',
      sender_id: 'usr_pastor_easter',
      sender_name: 'Pastor Easter',
      sender_role: 'Executive Overseer',
      text: 'Amen! God is raising godly husbands and builders of kingdom wealth in this generation.',
      created_at: 'Yesterday at 16:45',
    },
  ],
  group_passion_ladies: [
    {
      group_id: 'group_passion_ladies',
      sender_id: 'usr_prophetess_melinda',
      sender_name: 'Prophetess Melinda Daniels',
      sender_role: 'Co-Founder',
      text: 'Welcome precious daughters of Zion to Passion Ladies! Here we are groomed in purity, wisdom, prayer, and being noble wives and leaders. 👑💖',
      created_at: 'Today at 08:30',
    },
    {
      group_id: 'group_passion_ladies',
      sender_id: 'usr_pastor_grace',
      sender_name: 'Pastor Grace Daniels',
      sender_role: 'Deaconess',
      text: 'Hallelujah Mama Melinda! So grateful for this divine sisterhood.',
      created_at: 'Today at 09:12',
    },
  ],
  group_gymstars_foundation: [
    {
      group_id: 'group_gymstars_foundation',
      sender_id: 'usr_apostle_joe',
      sender_name: 'Apostle Joe Daniels',
      sender_role: 'Senior Pastor',
      text: 'Remember now thy Creator in the days of thy youth! Gymstars, let your light shine boldly in school and community. 🌟',
      created_at: '2 days ago',
    },
  ],
  group_foundation_school: [
    {
      group_id: 'group_foundation_school',
      sender_id: 'usr_apostle_joe',
      sender_name: 'Apostle Joe Daniels',
      sender_role: 'Senior Pastor',
      text: 'Welcome to Foundation School. In this 3-month apostolic curriculum, you are established on the unshakeable rock of Christ doctrine and kingdom authority.',
      created_at: '3 days ago',
    },
    {
      group_id: 'group_foundation_school',
      sender_id: 'usr_developer',
      sender_name: 'mr_juice7',
      sender_role: 'Developer',
      text: 'Course modules and curriculum syllabus are loaded into the portal. Let us dive deep into the Word!',
      created_at: '2 days ago',
    },
  ],
  group_international_school_of_mentorship: [
    {
      group_id: 'group_international_school_of_mentorship',
      sender_id: 'usr_apostle_joe',
      sender_name: 'Apostle Joe Daniels',
      sender_role: 'Senior Pastor',
      text: 'Welcome to the International School of Mentorship. This portal is consecrated for discipleship, leadership calibration, and spiritual acceleration. Prepare your spirits for deep revelation.',
      created_at: '4 days ago',
    },
  ],
};

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

// Custom created groups store
let customGroups: Group[] = [];
let localGroupMessages: Record<string, GroupChatMessage[]> = {};

export function getGroups(): Group[] {
  return [...OFFICIAL_GROUPS, ...customGroups];
}

export function createGroup(
  name: string,
  description: string,
  category = 'Fellowship',
  isPaid = false,
  creatorId = 'usr_admin'
): Group {
  const newGroup: Group = {
    id: `group_${Date.now()}`,
    name: name.trim(),
    description: description.trim(),
    category: category.trim(),
    is_paid: isPaid,
    location: 'Gateway Harare & Virtual',
    updated_at: new Date().toISOString(),
  };
  customGroups.push(newGroup);
  try {
    joinGroup(newGroup.id, creatorId);
  } catch {}
  return newGroup;
}

export function dissolveGroup(groupId: string): boolean {
  customGroups = customGroups.filter(g => g.id !== groupId);
  delete localGroupMessages[groupId];
  return true;
}

export function deleteGroupMessage(groupId: string, messageId: string): boolean {
  if (localGroupMessages[groupId]) {
    localGroupMessages[groupId] = localGroupMessages[groupId].filter(m => m.id !== messageId);
  }
  return true;
}

export function generateGroupInviteLink(groupId: string): string {
  return `https://gatewayconnect.joedaniels.org/invite/group/${groupId}`;
}

export function isGroupMember(groupId: string, userId: string): boolean {
  if (!userId) return false;
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
    database.execSync(`RELEASE SAVEPOINT leave_group`);
  } catch (err) {
    database.execSync(`ROLLBACK TO SAVEPOINT leave_group`);
    throw err;
  }
}

export function getGroupMessages(groupId: string): GroupChatMessage[] {
  const initial = (INITIAL_MESSAGES[groupId] || []).map((m, idx) => ({
    ...m,
    id: `init_${groupId}_${idx}`,
    receipt_status: 'read' as const,
  }));
  const dynamic = localGroupMessages[groupId] || [];
  return [...initial, ...dynamic];
}

export function sendGroupMessage(
  groupId: string,
  senderId: string,
  senderName: string,
  text: string,
  senderRole?: string,
  attachment?: GroupChatMessage['attachment'],
  replyTo?: GroupChatMessage['reply_to']
): GroupChatMessage {
  const newMsg: GroupChatMessage = {
    id: `msg_${Date.now()}`,
    group_id: groupId,
    sender_id: senderId,
    sender_name: senderName,
    sender_role: senderRole,
    text: text.trim(),
    created_at: 'Just now',
    receipt_status: 'read',
    attachment,
    reply_to: replyTo,
    reactions: [],
  };

  if (!localGroupMessages[groupId]) {
    localGroupMessages[groupId] = [];
  }
  localGroupMessages[groupId].push(newMsg);

  // Also persist in SQLite messages table
  try {
    const db = getDatabase();
    db.runSync(
      `INSERT OR REPLACE INTO messages (id, conversation_id, sender_id, body, status, created_at)
       VALUES (?, ?, ?, ?, 'complete', ?)`,
      [newMsg.id, groupId, senderId, text.trim(), new Date().toISOString()]
    );
  } catch {}

  return newMsg;
}

export function toggleGroupMessageReaction(groupId: string, messageId: string, emoji: string): GroupChatMessage[] {
  if (localGroupMessages[groupId]) {
    const msg = localGroupMessages[groupId].find(m => m.id === messageId);
    if (msg) {
      if (!msg.reactions) msg.reactions = [];
      if (msg.reactions.includes(emoji)) {
        msg.reactions = msg.reactions.filter(r => r !== emoji);
      } else {
        msg.reactions.push(emoji);
      }
    }
  }
  return getGroupMessages(groupId);
}
