import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Radii } from '../theme/colors';
import { MobileUser } from '../auth/authService';
import { saveTestimony, listContent, saveComment, listComments } from '../data/contentRepository';
import { ContentItem } from '../types/domain';
import {
  getGroups,
  Group,
  isGroupMember,
  joinGroup,
  leaveGroup,
  getGroupMessages,
  sendGroupMessage,
  GroupChatMessage,
  createGroup,
  dissolveGroup,
  deleteGroupMessage,
  generateGroupInviteLink,
  toggleGroupMessageReaction,
} from '../data/groupRepository';
import { getEvents, Event } from '../data/eventRepository';
import { trackEvent } from '../analytics/analyticsService';
import { BADGE_TIERS, getBadgeDisplayInfo } from '../services/badgeService';

interface CommunityScreenProps {
  profile: MobileUser | null;
  onRequestAuth?: (prompt?: string) => void;
  onRegisterFabTrigger?: (trigger: () => void) => void;
}

interface ChurchStory {
  id: string;
  author: string;
  shortName: string;
  role: string;
  avatarText: string;
  caption: string;
  scripture: string;
  timeAgo: string;
  verifiedBadge?: 'platinum' | 'gold' | 'silver' | 'developer';
}

interface MemberProfilePreview {
  id: string;
  name: string;
  handle: string;
  avatarText: string;
  role: string;
  campus: string;
  bio: string;
  joinedYear: string;
  testimoniesCount: number;
  followersCount: number;
  followingCount: number;
  badgeType?: 'platinum' | 'gold' | 'silver' | 'developer';
  isFollowing?: boolean;
}

// Official Church Leadership Stories matching Screenshot 1 (WhatsApp Redesign)
const CHURCH_STORIES: ChurchStory[] = [
  {
    id: 'story_joe',
    author: 'Apostle Joe Daniels',
    shortName: 'Apostle Joe',
    role: 'General Overseer',
    avatarText: 'JD',
    caption: 'Great grace upon Gateway Church this Sunday! Expect unusual breakthroughs, financial releases, and open heavens as we enter into supernatural dominion.',
    scripture: 'Zechariah 4:6 • Not by might, nor by power, but by my Spirit, saith the LORD of hosts.',
    timeAgo: '2h ago',
    verifiedBadge: 'gold',
  },
  {
    id: 'story_melinda',
    author: 'Prophetess Melinda Daniels',
    shortName: 'Prophetess',
    role: 'Co-Founder & Passion Ladies',
    avatarText: 'MD',
    caption: 'Women of Grace prayer breakfast was mighty this morning. Daughters of Zion, stand firm in faith; honor and divine strength are your clothing!',
    scripture: 'Proverbs 31:25 • Strength and honour are her clothing; and she shall rejoice in time to come.',
    timeAgo: '4h ago',
    verifiedBadge: 'gold',
  },
  {
    id: 'story_easter',
    author: 'Pastor Easter',
    shortName: 'Pastor Easter',
    role: 'Executive Pastor',
    avatarText: 'PE',
    caption: 'Kingdom governance and discipleship registration for Foundation School is now active. Let us build our lives on apostolic truth.',
    scripture: '1 Corinthians 3:11 • For other foundation can no man lay than that is laid, which is Jesus Christ.',
    timeAgo: '5h ago',
    verifiedBadge: 'gold',
  },
  {
    id: 'story_worship',
    author: 'Ignite Worship Team',
    shortName: 'Worship',
    role: 'Music Ministry',
    avatarText: 'IW',
    caption: 'Vocal rehearsals underway for Sunday Dominion broadcast! The atmosphere of revival is already resounding in the sanctuary. 🎵🕊️',
    scripture: 'Psalm 150:6 • Let every thing that hath breath praise the LORD.',
    timeAgo: '6h ago',
    verifiedBadge: 'silver',
  },
  {
    id: 'story_youth',
    author: 'Gateway Youth',
    shortName: 'Youth',
    role: 'Youth Ministry',
    avatarText: 'GY',
    caption: 'Fire Friday Prayer Rally was electric! Over 200 young adults gathered, passionate for Christ. Supernatural encounters await next Friday!',
    scripture: '1 Timothy 4:12 • Let no man despise thy youth; but be thou an example of the believers.',
    timeAgo: '8h ago',
    verifiedBadge: 'silver',
  },
  {
    id: 'story_developer',
    author: 'mr_juice7',
    shortName: 'Developer',
    role: 'Systems Architect',
    avatarText: 'MJ',
    caption: 'GatewayConnect v2.4 upgrade live! WhatsApp-style fellowship and Instagram praise feed are now fully connected with instant Paynow badges.',
    scripture: 'Colossians 3:23 • And whatsoever ye do, do it heartily, as to the Lord.',
    timeAgo: '12h ago',
    verifiedBadge: 'developer',
  },
];

// Official Leadership Profiles (Purged of dummy accounts)
const COMMUNITY_MEMBERS: Record<string, MemberProfilePreview> = {
  'Apostle Joe Daniels': {
    id: 'usr_apostle_joe',
    name: 'Apostle Joe Daniels',
    handle: '@apostle_joe_daniels',
    avatarText: 'JD',
    role: 'General Overseer & Founder',
    campus: 'Harare Main Sanctuary',
    bio: 'Father, Teacher & Apostolic Overseer of Gateway Church International. Advancing kingdom dominion across the nations.',
    joinedYear: 'Founding Overseer',
    testimoniesCount: 42,
    followersCount: 14200,
    followingCount: 12,
    badgeType: 'gold',
  },
  'Prophetess Melinda Daniels': {
    id: 'usr_prophetess_melinda',
    name: 'Prophetess Melinda Daniels',
    handle: '@prophetess_melinda',
    avatarText: 'MD',
    role: 'Co-Founder & Passion Ladies Director',
    campus: 'Harare Main Sanctuary',
    bio: 'Apostolic and Prophetic teacher raising women of honor, prayer, faith, and noble character.',
    joinedYear: 'Co-Founder',
    testimoniesCount: 28,
    followersCount: 9800,
    followingCount: 15,
    badgeType: 'gold',
  },
  'Pastor Easter': {
    id: 'usr_pastor_easter',
    name: 'Pastor Easter',
    handle: '@pastor_easter',
    avatarText: 'PE',
    role: 'Executive Overseer & Administrator',
    campus: 'Harare Main Sanctuary',
    bio: 'National Executive Overseer & Apostolic Administrator. Championing discipleship and kingdom governance.',
    joinedYear: 'Executive Pastor',
    testimoniesCount: 19,
    followersCount: 5200,
    followingCount: 10,
    badgeType: 'gold',
  },
  'mr_juice7': {
    id: 'usr_developer',
    name: 'mr_juice7',
    handle: '@mr_juice7',
    avatarText: 'MJ',
    role: 'Core Systems Developer & Platform Architect',
    campus: 'BlueWave Tech & Gateway Cloud',
    bio: 'Platform Architect for GatewayConnect. Engineering scalable apostolic tech infrastructure.',
    joinedYear: 'Developer Lead',
    testimoniesCount: 6,
    followersCount: 150,
    followingCount: 5,
    badgeType: 'developer',
  },
  'Tinodaishe Morgan Chibi': {
    id: 'usr_tino',
    name: 'Tinodaishe Morgan Chibi',
    handle: '@tinodaishe_morgan_chibi',
    avatarText: 'TC',
    role: 'Covenant Believer & Media Lead',
    campus: 'Harare Main Campus',
    bio: 'Walking in supernatural dominion & apostolic grace • Gateway Church Harare',
    joinedYear: 'Member since 2021',
    testimoniesCount: 8,
    followersCount: 24,
    followingCount: 2,
    badgeType: 'gold',
  },
};

export function CommunityScreen({ profile, onRequestAuth, onRegisterFabTrigger }: CommunityScreenProps) {
  // Curved Segmented Switcher matching Nainesh's redesign: 'chats' | 'communities' | 'feed'
  const [activeSubTab, setActiveSubTab] = useState<'chats' | 'communities' | 'feed'>('chats');
  const [testimonies, setTestimonies] = useState<ContentItem[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [joinedGroups, setJoinedGroups] = useState<Record<string, boolean>>({});
  const [events, setEvents] = useState<Event[]>([]);

  // Search filter for chats
  const [chatSearchQuery, setChatSearchQuery] = useState('');

  // Post Testimony Modal state
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [postTitle, setPostTitle] = useState<string>('');
  const [postBody, setPostBody] = useState<string>('');
  const [postSaved, setPostSaved] = useState<boolean>(false);

  // Instagram Story Viewer Modal state
  const [activeStory, setActiveStory] = useState<ChurchStory | null>(null);
  const storyProgress = useRef(new Animated.Value(0)).current;

  // Group Chat Modal state
  const [activeChatGroup, setActiveChatGroup] = useState<Group | null>(null);
  const [chatMessages, setChatMessages] = useState<GroupChatMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>('');

  // WhatsApp Reply Quoting state
  const [replyingToMessage, setReplyingToMessage] = useState<GroupChatMessage | null>(null);
  const [activeReactionMsgId, setActiveReactionMsgId] = useState<string | null>(null);

  // Profile Preview Modal state
  const [previewMember, setPreviewMember] = useState<MemberProfilePreview | null>(null);
  const [followedMembers, setFollowedMembers] = useState<Record<string, boolean>>({
    usr_apostle_joe: true,
    usr_prophetess_melinda: true,
    usr_pastor_easter: true,
    usr_developer: true,
  });

  // Direct 1-on-1 Messages state
  const [directChatMember, setDirectChatMember] = useState<MemberProfilePreview | null>(null);
  const [directChatInput, setDirectChatInput] = useState<string>('');
  const [directMessages, setDirectMessages] = useState<Record<string, Array<{ id: string; text: string; sender: 'me' | 'them'; time: string }>>>({
    usr_apostle_joe: [
      { id: 'dm_1', text: 'Shalom beloved! May grace and supernatural peace multiply in your life and family.', sender: 'them', time: '10:00 AM' },
      { id: 'dm_2', text: 'Amen Apostle! Thank you for the powerful Sunday teaching on kingdom dominion.', sender: 'me', time: '10:05 AM' },
    ],
    usr_prophetess_melinda: [
      { id: 'dm_3', text: 'Grace and honor! How may our intercessory team stand with you in prayer today?', sender: 'them', time: 'Yesterday' },
    ],
    usr_pastor_easter: [
      { id: 'dm_pe', text: 'Kingdom greetings! Foundation School registration is officially active.', sender: 'them', time: 'Yesterday' },
    ],
    usr_developer: [
      { id: 'dm_dev', text: 'Shalom! Core systems v2.4 upgrade is fully deployed for mobile.', sender: 'them', time: '2d ago' },
    ],
    usr_tino: [
      { id: 'dm_4', text: 'Great seeing you in church! Let us know if you want to connect with media ministry.', sender: 'them', time: '2d ago' },
    ],
  });

  // Instagram Feed States: Likes, Comments, Repost, Save
  const [postLikesMap, setPostLikesMap] = useState<Record<string, { count: number; liked: boolean }>>({});
  const [savedPosts, setSavedPosts] = useState<Record<string, boolean>>({});
  const [activeCommentsPost, setActiveCommentsPost] = useState<ContentItem | null>(null);
  const [commentInput, setCommentInput] = useState('');
  const [commentsMap, setCommentsMap] = useState<Record<string, Array<{ id: string; author: string; handle: string; text: string; time: string; likes: number; liked: boolean }>>>({
    default: [
      { id: 'c1', author: 'Apostle Joe Daniels', handle: '@apostle_joe_daniels', text: 'Amen! Let supernatural increase locate your household! 🙌', time: '1h', likes: 14, liked: false },
      { id: 'c2', author: 'Prophetess Melinda Daniels', handle: '@prophetess_melinda', text: 'Glory to God! Standing with you in persistent faith. 🕊️', time: '35m', likes: 8, liked: false },
    ],
  });
  const [repostPost, setRepostPost] = useState<ContentItem | null>(null);

  // WhatsApp Features State
  const [showFabSheet, setShowFabSheet] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupCategory, setNewGroupCategory] = useState('Atmospheric Worship');
  const [newGroupIsPaid, setNewGroupIsPaid] = useState(false);
  const [showAttachmentTray, setShowAttachmentTray] = useState(false);
  const [showGroupOptionsMenu, setShowGroupOptionsMenu] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({
    group_ignite_worship: 2,
    group_pride_of_lions: 1,
    usr_apostle_joe: 1,
  });
  const totalUnread = Object.values(unreadCounts).reduce((sum, c) => sum + c, 0);

  const isDeveloper = Boolean(
    profile?.is_developer ||
    profile?.role === 'developer' ||
    profile?.badge_type === 'developer' ||
    profile?.handle?.toLowerCase() === '@mr_juice7'
  );

  const isAdmin = Boolean(
    isDeveloper ||
    profile?.role === 'super_admin' ||
    profile?.role === 'moderator' ||
    profile?.badge_type === 'gold' ||
    profile?.badge_type === 'platinum'
  );

  useEffect(() => {
    setGroups(getGroups());
    const initialPosts = listContent('post');
    setTestimonies(initialPosts);
    setEvents(getEvents());

    // Init likes map
    const lMap: Record<string, { count: number; liked: boolean }> = {};
    initialPosts.forEach(p => {
      lMap[p.id] = { count: Number(p.metadata?.likes || 28), liked: false };
    });
    setPostLikesMap(lMap);

    const gMap: Record<string, boolean> = {};
    getGroups().forEach(g => { gMap[g.id] = isGroupMember(g.id, profile?.id ?? ''); });
    setJoinedGroups(gMap);
  }, [profile]);

  useEffect(() => {
    if (onRegisterFabTrigger) {
      onRegisterFabTrigger(() => setShowFabSheet(true));
    }
  }, [onRegisterFabTrigger]);

  // Story auto-advance animation
  useEffect(() => {
    if (activeStory) {
      storyProgress.setValue(0);
      Animated.timing(storyProgress, {
        toValue: 1,
        duration: 5000,
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished) {
          const currentIndex = CHURCH_STORIES.findIndex(s => s.id === activeStory.id);
          if (currentIndex !== -1 && currentIndex < CHURCH_STORIES.length - 1) {
            setActiveStory(CHURCH_STORIES[currentIndex + 1]);
          } else {
            setActiveStory(null);
          }
        }
      });
    }
  }, [activeStory?.id]);

  const handleOpenShare = () => {
    if (!profile) {
      if (onRequestAuth) {
        onRequestAuth('Sign in to share testimonies and praise reports with Gateway Church.');
      } else {
        Alert.alert('Sign In Required', 'Please sign in or create an account to share.');
      }
      return;
    }
    setShowShareModal(true);
  };

  const handleSavePost = () => {
    if (!postTitle.trim() || !postBody.trim()) {
      Alert.alert('Incomplete', 'Please enter both a title and testimony body.');
      return;
    }
    saveTestimony(profile?.id ?? 'anon', postTitle.trim(), postBody.trim());
    setPostTitle('');
    setPostBody('');
    setPostSaved(true);
    const updated = listContent('post');
    setTestimonies(updated);
    trackEvent('testimony_saved');
    setTimeout(() => {
      setPostSaved(false);
      setShowShareModal(false);
    }, 1200);
  };

  const handleTogglePostLike = (postId: string) => {
    setPostLikesMap(prev => {
      const current = prev[postId] || { count: 28, liked: false };
      return {
        ...prev,
        [postId]: {
          count: current.liked ? current.count - 1 : current.count + 1,
          liked: !current.liked,
        },
      };
    });
  };

  const handleToggleSavePost = (postId: string) => {
    setSavedPosts(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  const handleAddComment = () => {
    if (!commentInput.trim() || !activeCommentsPost) return;
    const newComment = {
      id: `comm_${Date.now()}`,
      author: profile?.name || 'Congregation Member',
      handle: profile?.handle || '@believer',
      text: commentInput.trim(),
      time: 'Just now',
      likes: 0,
      liked: false,
    };
    setCommentsMap(prev => ({
      ...prev,
      [activeCommentsPost.id]: [...(prev[activeCommentsPost.id] || prev.default || []), newComment],
    }));
    saveComment(activeCommentsPost.id, profile?.id || null, commentInput.trim());
    setCommentInput('');
  };

  const handleJoinToggle = (group: Group) => {
    if (!profile) {
      if (onRequestAuth) {
        onRequestAuth('Sign in to join church fellowship groups.');
      } else {
        Alert.alert('Sign In Required', 'Please sign in to join fellowship groups.');
      }
      return;
    }

    if (group.is_paid && !joinedGroups[group.id]) {
      Alert.alert(
        'Kingdom Enrollment Required',
        `"${group.name}" is an intensive apostolic curriculum ($150 USD). Activate via your Covenant Partner pass or Administration desk.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Enroll & Enter',
            onPress: () => {
              joinGroup(group.id, profile.id);
              setJoinedGroups(prev => ({ ...prev, [group.id]: true }));
              openGroupChat(group);
            },
          },
        ]
      );
      return;
    }

    if (joinedGroups[group.id]) {
      leaveGroup(group.id, profile.id);
      setJoinedGroups(prev => ({ ...prev, [group.id]: false }));
    } else {
      joinGroup(group.id, profile.id);
      setJoinedGroups(prev => ({ ...prev, [group.id]: true }));
    }
  };

  const openGroupChat = (group: Group) => {
    if (!profile) {
      if (onRequestAuth) {
        onRequestAuth(`Sign in to chat in ${group.name}.`);
      } else {
        Alert.alert('Sign In Required', 'Please sign in to view and send fellowship messages.');
      }
      return;
    }

    if (group.is_paid && !profile.is_premium && !isDeveloper && profile.badge_type !== 'platinum') {
      Alert.alert(
        'Covenant Pass Required',
        `"${group.name}" is an exclusive apostolic curriculum. Please enroll or upgrade your verification badge to join.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Unlock Access', onPress: () => Alert.alert('Enrollment', 'Visit Profile > Badges to subscribe or contact administration.') },
        ]
      );
      return;
    }

    setUnreadCounts(prev => ({ ...prev, [group.id]: 0 }));
    setActiveChatGroup(group);
    setChatMessages(getGroupMessages(group.id));
    setChatInput('');
    setReplyingToMessage(null);
    setShowAttachmentTray(false);
    setShowGroupOptionsMenu(false);
  };

  const handleSendChatMessage = (presetAttachment?: GroupChatMessage['attachment']) => {
    if (!activeChatGroup || (!chatInput.trim() && !presetAttachment) || !profile) return;
    const roleLabel = isDeveloper ? 'Developer' : profile.role === 'super_admin' ? 'Overseer' : profile.role === 'moderator' ? 'Moderator' : undefined;
    const textToSend = chatInput.trim() || (presetAttachment ? `[Attachment: ${presetAttachment.name}]` : '');

    const newMsg = sendGroupMessage(
      activeChatGroup.id,
      profile.id,
      profile.name || 'Member',
      textToSend,
      roleLabel,
      presetAttachment,
      replyingToMessage ? { sender_name: replyingToMessage.sender_name, text: replyingToMessage.text } : undefined
    );

    setChatMessages(prev => [...prev, newMsg]);
    setChatInput('');
    setReplyingToMessage(null);
    setShowAttachmentTray(false);
  };

  const handleMessageReaction = (messageId: string, emoji: string) => {
    if (!activeChatGroup) return;
    const updated = toggleGroupMessageReaction(activeChatGroup.id, messageId, emoji);
    setChatMessages(updated);
    setActiveReactionMsgId(null);
  };

  const handleDeleteMessage = (messageId: string) => {
    if (!activeChatGroup) return;
    Alert.alert('Delete for Everyone', 'Delete this message for everyone in this fellowship?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete for Everyone',
        style: 'destructive',
        onPress: () => {
          deleteGroupMessage(activeChatGroup.id, messageId);
          setChatMessages(prev => prev.filter(m => m.id !== messageId));
        },
      },
    ]);
  };

  const handleDissolveGroup = () => {
    if (!activeChatGroup) return;
    Alert.alert(
      'Dissolve Fellowship Group',
      `Permanently dissolve "${activeChatGroup.name}"? All messages and records will be deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Dissolve Group',
          style: 'destructive',
          onPress: () => {
            dissolveGroup(activeChatGroup.id);
            setActiveChatGroup(null);
            setGroups(getGroups());
            Alert.alert('Group Dissolved', 'Fellowship group has been dissolved.');
          },
        },
      ]
    );
  };

  const handleCreateGroupSubmit = () => {
    if (!newGroupName.trim()) {
      Alert.alert('Name Required', 'Please enter a name for the fellowship group.');
      return;
    }
    const created = createGroup(
      newGroupName.trim(),
      newGroupDesc.trim() || 'Gateway Fellowship Group',
      newGroupCategory.trim() || 'Fellowship',
      newGroupIsPaid,
      profile?.id || 'usr_admin'
    );
    setGroups(getGroups());
    setShowCreateGroupModal(false);
    setNewGroupName('');
    setNewGroupDesc('');
    Alert.alert('Fellowship Group Created', `"${created.name}" is now live.`);
  };

  const handleCopyInviteLink = () => {
    if (!activeChatGroup) return;
    const link = generateGroupInviteLink(activeChatGroup.id);
    Alert.alert('Invite Link Copied', `Share with believers:\n${link}`);
  };

  const openMemberProfile = (name: string) => {
    const existing = COMMUNITY_MEMBERS[name];
    if (existing) {
      setPreviewMember(existing);
    } else {
      setPreviewMember({
        id: `mem_${Date.now()}`,
        name: name,
        handle: `@${name.toLowerCase().replace(/\s+/g, '_')}`,
        avatarText: name.slice(0, 2).toUpperCase(),
        role: 'Gateway Church Member',
        campus: 'Harare Main Campus',
        bio: 'Living in fellowship with Gateway Church International • Walking by faith and not by sight.',
        joinedYear: 'Member',
        testimoniesCount: 1,
        followersCount: 1,
        followingCount: 2,
      });
    }
  };

  const handleOpenDirectChat = (member: MemberProfilePreview) => {
    if (!profile) {
      if (onRequestAuth) {
        onRequestAuth(`Sign in to send a private message to ${member.name}.`);
      } else {
        Alert.alert('Sign In Required', 'Please sign in to send private direct messages.');
      }
      return;
    }
    setUnreadCounts(prev => ({ ...prev, [member.id]: 0 }));
    setPreviewMember(null);
    setDirectChatMember(member);
    setDirectChatInput('');
  };

  const handleSendDirectMessage = () => {
    if (!directChatMember || !directChatInput.trim() || !profile) return;
    const text = directChatInput.trim();
    const newMsg = {
      id: `dm_${Date.now()}`,
      text,
      sender: 'me' as const,
      time: 'Just now',
    };
    setDirectMessages(prev => ({
      ...prev,
      [directChatMember.id]: [...(prev[directChatMember.id] || []), newMsg],
    }));
    setDirectChatInput('');

    // Simulated authentic church leader reply
    if (!directMessages[directChatMember.id] || directMessages[directChatMember.id].length <= 2) {
      setTimeout(() => {
        setDirectMessages(prev => ({
          ...prev,
          [directChatMember.id]: [
            ...(prev[directChatMember.id] || []),
            {
              id: `dm_reply_${Date.now()}`,
              text: `Shalom beloved! We have received your prayer note in faith. The apostolic altar is standing with you in agreement.`,
              sender: 'them' as const,
              time: 'Just now',
            },
          ],
        }));
      }, 1000);
    }
  };

  // Filtered chats for the WhatsApp Chats tab
  const leadershipDirectChats = Object.values(COMMUNITY_MEMBERS).filter(m =>
    !chatSearchQuery.trim() ||
    m.name.toLowerCase().includes(chatSearchQuery.toLowerCase()) ||
    m.role.toLowerCase().includes(chatSearchQuery.toLowerCase())
  );

  const filteredGroups = groups.filter(g =>
    !chatSearchQuery.trim() ||
    g.name.toLowerCase().includes(chatSearchQuery.toLowerCase()) ||
    g.category?.toLowerCase().includes(chatSearchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* 1. Header Matching WhatsApp Redesign (by Nainesh) */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={styles.appLogoCircle}>
            <Ionicons name="chatbubbles" size={18} color="#25D366" />
          </View>
          <View>
            <Text style={styles.appName}>WhatsApp Connect</Text>
            <Text style={styles.appSub}>Gateway International Church</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Pressable style={styles.headerIconBtn} onPress={() => setActiveSubTab('chats')}>
            <Ionicons name="search" size={20} color={Colors.textPrimary} />
          </Pressable>
          <Pressable style={styles.headerShareBtn} onPress={handleOpenShare}>
            <Ionicons name="add" size={18} color="#09090b" />
            <Text style={styles.headerShareBtnText}>Share</Text>
          </Pressable>
        </View>
      </View>

      {/* 2. Top Stories Bar Matching Screenshot 1 (WhatsApp Redesign by Nainesh) */}
      <View style={styles.storiesSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storiesScroll}>
          {/* First Item: "+ Add" with dashed ring border matching Screenshot 1 */}
          <Pressable style={styles.storyItem} onPress={handleOpenShare}>
            <View style={styles.addStoryRingDashed}>
              <Ionicons name="add" size={22} color="#25D366" />
            </View>
            <Text style={styles.storyLabel}>Add</Text>
          </Pressable>

          {/* Real Church Accounts with Glowing Status Rings */}
          {CHURCH_STORIES.map(story => (
            <Pressable
              key={story.id}
              style={styles.storyItem}
              onPress={() => setActiveStory(story)}
            >
              <View style={[styles.storyRingGlowing, story.verifiedBadge === 'gold' && { borderColor: Colors.gold }]}>
                <View style={styles.storyAvatarCircle}>
                  <Text style={styles.storyAvatarText}>{story.avatarText}</Text>
                </View>
              </View>
              <Text style={styles.storyLabel} numberOfLines={1}>
                {story.shortName}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* 3. Curved Segmented Switcher Capsule: [Chats]  [Communities]  [Feed (IG)] */}
      <View style={styles.whatsappCapsuleSwitcher}>
        <Pressable
          style={[styles.whatsappCapsuleBtn, activeSubTab === 'chats' && styles.whatsappCapsuleBtnActive]}
          onPress={() => setActiveSubTab('chats')}
        >
          <Text style={[styles.whatsappCapsuleBtnText, activeSubTab === 'chats' && styles.whatsappCapsuleBtnTextActive]}>
            Chats
          </Text>
          {totalUnread > 0 && (
            <View style={styles.capsuleBadge}>
              <Text style={styles.capsuleBadgeText}>{totalUnread}</Text>
            </View>
          )}
        </Pressable>

        <Pressable
          style={[styles.whatsappCapsuleBtn, activeSubTab === 'communities' && styles.whatsappCapsuleBtnActive]}
          onPress={() => setActiveSubTab('communities')}
        >
          <Text style={[styles.whatsappCapsuleBtnText, activeSubTab === 'communities' && styles.whatsappCapsuleBtnTextActive]}>
            Communities
          </Text>
        </Pressable>

        <Pressable
          style={[styles.whatsappCapsuleBtn, activeSubTab === 'feed' && styles.whatsappCapsuleBtnActive]}
          onPress={() => setActiveSubTab('feed')}
        >
          <Text style={[styles.whatsappCapsuleBtnText, activeSubTab === 'feed' && styles.whatsappCapsuleBtnTextActive]}>
            Feed (IG)
          </Text>
        </Pressable>
      </View>

      {/* 4. Tab: CHATS (WhatsApp Redesign by Nainesh) */}
      {activeSubTab === 'chats' && (
        <View style={styles.chatsListContainer}>
          {/* WhatsApp Search Bar */}
          <View style={styles.chatSearchBar}>
            <Ionicons name="search" size={16} color={Colors.textMuted} />
            <TextInput
              value={chatSearchQuery}
              onChangeText={setChatSearchQuery}
              placeholder="Search chats, leaders, fellowships..."
              placeholderTextColor={Colors.textMuted}
              style={styles.chatSearchInput}
            />
            {chatSearchQuery.length > 0 && (
              <Pressable onPress={() => setChatSearchQuery('')}>
                <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
              </Pressable>
            )}
          </View>

          {/* Section: Direct Pastoral & Leadership Chats */}
          <Text style={styles.chatSectionHeader}>DIRECT LEADERSHIP CHATS</Text>
          {leadershipDirectChats.map(member => {
            const history = directMessages[member.id] || [];
            const lastMsg = history[history.length - 1];
            const unread = unreadCounts[member.id] || 0;
            const badge = member.badgeType || 'gold';

            return (
              <Pressable
                key={member.id}
                style={({ pressed }) => [styles.whatsappChatRow, pressed && { backgroundColor: '#131826' }]}
                onPress={() => handleOpenDirectChat(member)}
              >
                <View style={styles.whatsappChatAvatarRing}>
                  <View style={styles.whatsappChatAvatar}>
                    <Text style={styles.whatsappChatAvatarText}>{member.avatarText}</Text>
                  </View>
                </View>

                <View style={styles.whatsappChatInfo}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <Text style={styles.whatsappChatName} numberOfLines={1}>{member.name}</Text>
                      <Ionicons
                        name="checkmark-circle"
                        size={13}
                        color={badge === 'developer' ? '#818cf8' : badge === 'platinum' ? '#38bdf8' : Colors.gold}
                      />
                    </View>
                    <Text style={styles.whatsappChatTime}>{lastMsg?.time || '10:05am'}</Text>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
                    <Text style={styles.whatsappChatSnippet} numberOfLines={1}>
                      {lastMsg?.text || `${member.role} • Tap to message`}
                    </Text>
                    {unread > 0 && (
                      <View style={styles.whatsappUnreadPill}>
                        <Text style={styles.whatsappUnreadPillText}>{unread}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </Pressable>
            );
          })}

          {/* Section: Fellowship Group Chats */}
          <Text style={[styles.chatSectionHeader, { marginTop: 14 }]}>FELLOWSHIP GROUP CHATS</Text>
          {filteredGroups.map(group => {
            const unread = unreadCounts[group.id] || 0;
            const isMember = !!joinedGroups[group.id];

            return (
              <Pressable
                key={group.id}
                style={({ pressed }) => [styles.whatsappChatRow, pressed && { backgroundColor: '#131826' }]}
                onPress={() => openGroupChat(group)}
              >
                <View style={[styles.whatsappChatAvatarRing, group.is_paid && { borderColor: Colors.gold }]}>
                  <View style={[styles.whatsappChatAvatar, { backgroundColor: group.is_paid ? '#201808' : '#141c2c' }]}>
                    <Ionicons
                      name={group.is_paid ? 'school' : 'people'}
                      size={18}
                      color={group.is_paid ? Colors.gold : '#38bdf8'}
                    />
                  </View>
                </View>

                <View style={styles.whatsappChatInfo}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <Text style={styles.whatsappChatName} numberOfLines={1}>{group.name}</Text>
                      {group.is_paid && (
                        <View style={styles.miniPaidBadge}>
                          <Text style={styles.miniPaidBadgeText}>$150</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.whatsappChatTime}>Today</Text>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
                    <Text style={styles.whatsappChatSnippet} numberOfLines={1}>
                      {group.category} • {group.description}
                    </Text>
                    {unread > 0 && (
                      <View style={styles.whatsappUnreadPill}>
                        <Text style={styles.whatsappUnreadPillText}>{unread}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}

      {/* 5. Tab: COMMUNITIES (Fellowship Groups & Curricula) */}
      {activeSubTab === 'communities' && (
        <View style={styles.groupsList}>
          {groups.map(group => {
            const isMember = !!joinedGroups[group.id];
            const unread = unreadCounts[group.id] || 0;
            const isLockedPaid = group.is_paid && !profile?.is_premium && !isDeveloper && profile?.badge_type !== 'platinum';

            return (
              <View key={group.id} style={styles.groupCard}>
                <View style={styles.groupTopRow}>
                  <View style={[styles.groupIconWrap, isLockedPaid && { borderColor: '#f59e0b' }]}>
                    <Ionicons
                      name={isLockedPaid ? 'lock-closed' : group.is_paid ? 'school' : 'people'}
                      size={20}
                      color={group.is_paid ? Colors.gold : Colors.textPrimary}
                    />
                  </View>
                  <View style={{ flex: 1, gap: 3 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={styles.groupName} numberOfLines={1}>{group.name}</Text>
                      {unread > 0 && (
                        <View style={styles.groupUnreadBadge}>
                          <Text style={styles.groupUnreadBadgeText}>{unread}</Text>
                        </View>
                      )}
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      {group.is_paid ? (
                        <View style={styles.paidBadge}>
                          <Ionicons name="star" size={8} color={Colors.gold} />
                          <Text style={styles.paidBadgeText}>PREMIUM ($150)</Text>
                        </View>
                      ) : (
                        <View style={styles.freeBadge}>
                          <Text style={styles.freeBadgeText}>OPEN</Text>
                        </View>
                      )}
                      <Text style={styles.groupLocation}>• {group.location || 'Harare Central'}</Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.groupDesc}>{group.description}</Text>

                {isDeveloper && (
                  <View style={styles.devGhostIndicator}>
                    <Ionicons name="eye-off" size={11} color="#818cf8" />
                    <Text style={styles.devGhostIndicatorText}>Developer Ghost Oversight Active</Text>
                  </View>
                )}

                <View style={styles.groupActionsRow}>
                  <Pressable
                    style={[styles.chatActionBtn, isLockedPaid && styles.chatActionBtnLocked]}
                    onPress={() => openGroupChat(group)}
                  >
                    <Ionicons
                      name={isLockedPaid ? 'lock-closed' : 'chatbubbles'}
                      size={14}
                      color={isLockedPaid ? '#000000' : Colors.textInverse}
                    />
                    <Text style={[styles.chatActionBtnText, isLockedPaid && { color: '#000000' }]}>
                      {isLockedPaid ? 'Unlock Pass' : 'Open Chat'}
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[styles.joinBtn, isMember && styles.joinedBtn]}
                    onPress={() => handleJoinToggle(group)}
                  >
                    <Ionicons
                      name={isMember ? 'checkmark-circle' : 'add-circle-outline'}
                      size={14}
                      color={isMember ? Colors.success : Colors.gold}
                    />
                    <Text style={[styles.joinBtnText, isMember && styles.joinedBtnText]}>
                      {isMember ? 'Joined' : 'Join Group'}
                    </Text>
                  </Pressable>

                  {isAdmin && (
                    <Pressable
                      style={styles.inviteLinkBtn}
                      onPress={() => {
                        const link = generateGroupInviteLink(group.id);
                        Alert.alert('Group Invite Link', `Official link for ${group.name}:\n${link}`);
                      }}
                    >
                      <Ionicons name="link-outline" size={14} color={Colors.gold} />
                    </Pressable>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* 6. Tab: FEED (Instagram Redesign Style) */}
      {activeSubTab === 'feed' && (
        <View style={styles.feedList}>
          {testimonies.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="chatbubbles-outline" size={40} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No praise posts yet</Text>
              <Text style={styles.emptyBody}>Tap "+ Share" above to post what God has done in your life.</Text>
            </View>
          ) : (
            testimonies.map(t => {
              const authorName = (t.metadata?.author as string) || 'Apostle Joe Daniels';
              const isApostle = authorName.includes('Apostle');
              const likesData = postLikesMap[t.id] || { count: 32, liked: false };
              const isSaved = !!savedPosts[t.id];
              const comments = commentsMap[t.id] || commentsMap.default || [];

              return (
                <View key={t.id} style={styles.igPostCard}>
                  {/* IG Post Header: Avatar with story ring + Author Name + Verified Badge + ... */}
                  <View style={styles.igPostHeader}>
                    <Pressable style={styles.igAuthorRow} onPress={() => openMemberProfile(authorName)}>
                      <View style={styles.igStoryRingBorder}>
                        <View style={styles.igAuthorAvatar}>
                          <Text style={styles.igAuthorAvatarText}>{authorName.slice(0, 2).toUpperCase()}</Text>
                        </View>
                      </View>
                      <View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Text style={styles.igAuthorName}>{authorName}</Text>
                          <Ionicons
                            name="checkmark-circle"
                            size={14}
                            color={isApostle ? Colors.gold : '#38bdf8'}
                          />
                        </View>
                        <Text style={styles.igLocationText}>Harare Main Sanctuary • Harare, Zimbabwe</Text>
                      </View>
                    </Pressable>

                    <Pressable
                      style={{ padding: 6 }}
                      onPress={() => {
                        Alert.alert(
                          authorName,
                          'Choose action for this ministry decree:',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'View Profile', onPress: () => openMemberProfile(authorName) },
                            { text: 'Share to Story', onPress: () => setRepostPost(t) },
                          ]
                        );
                      }}
                    >
                      <Ionicons name="ellipsis-vertical" size={17} color={Colors.textPrimary} />
                    </Pressable>
                  </View>

                  {/* IG Media Container: Beautiful Praise Card */}
                  <Pressable
                    style={styles.igMediaContainer}
                    onPress={() => handleTogglePostLike(t.id)}
                  >
                    <View style={styles.igMediaInner}>
                      <Ionicons name="flame" size={32} color={Colors.gold} style={{ marginBottom: 10 }} />
                      <Text style={styles.igMediaScriptureText}>{t.title}</Text>
                      <Text style={styles.igMediaExhortationText}>
                        "Walking in supernatural dominion and prophetic open doors across the nations."
                      </Text>
                    </View>
                  </Pressable>

                  {/* IG Action Icons Row: Heart | Comment | Paper Plane | Bookmark */}
                  <View style={styles.igActionBar}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                      <Pressable onPress={() => handleTogglePostLike(t.id)} hitSlop={8}>
                        <Ionicons
                          name={likesData.liked ? 'heart' : 'heart-outline'}
                          size={24}
                          color={likesData.liked ? '#ef4444' : Colors.textPrimary}
                        />
                      </Pressable>

                      <Pressable onPress={() => setActiveCommentsPost(t)} hitSlop={8}>
                        <Ionicons name="chatbubble-outline" size={22} color={Colors.textPrimary} />
                      </Pressable>

                      <Pressable onPress={() => setRepostPost(t)} hitSlop={8}>
                        <Ionicons name="paper-plane-outline" size={22} color={Colors.textPrimary} />
                      </Pressable>
                    </View>

                    <Pressable onPress={() => handleToggleSavePost(t.id)} hitSlop={8}>
                      <Ionicons
                        name={isSaved ? 'bookmark' : 'bookmark-outline'}
                        size={22}
                        color={isSaved ? Colors.gold : Colors.textPrimary}
                      />
                    </Pressable>
                  </View>

                  {/* IG Likes Count */}
                  <Text style={styles.igLikesText}>
                    Liked by <Text style={{ fontFamily: Typography.fontBold }}>apostle_joe_daniels</Text> and{' '}
                    <Text style={{ fontFamily: Typography.fontBold }}>{likesData.count} others</Text>
                  </Text>

                  {/* IG Caption */}
                  <View style={styles.igCaptionRow}>
                    <Text style={styles.igCaptionText}>
                      <Text style={styles.igCaptionHandle}>{authorName.toLowerCase().replace(/\s+/g, '_')}{' '}</Text>
                      {t.body}
                    </Text>
                  </View>

                  {/* View all comments link */}
                  <Pressable onPress={() => setActiveCommentsPost(t)} style={{ marginTop: 4 }}>
                    <Text style={styles.igCommentsLink}>
                      View all {comments.length} comments
                    </Text>
                  </Pressable>

                  {/* Timestamp */}
                  <Text style={styles.igTimeAgo}>2 HOURS AGO</Text>
                </View>
              );
            })
          )}
        </View>
      )}

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* Instagram Comments Sheet Modal */}
      <Modal visible={!!activeCommentsPost} animationType="slide" transparent onRequestClose={() => setActiveCommentsPost(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.commentsSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Comments</Text>
              <Pressable onPress={() => setActiveCommentsPost(null)} style={{ padding: 4 }}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
              {activeCommentsPost &&
                (commentsMap[activeCommentsPost.id] || commentsMap.default || []).map(c => (
                  <View key={c.id} style={styles.commentRow}>
                    <View style={styles.commentAvatar}>
                      <Text style={styles.commentAvatarText}>{c.author.slice(0, 2).toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.commentAuthor}>{c.author} <Text style={styles.commentTime}>{c.time}</Text></Text>
                      <Text style={styles.commentBody}>{c.text}</Text>
                    </View>
                    <Pressable style={{ padding: 4 }}>
                      <Ionicons name="heart-outline" size={14} color={Colors.textMuted} />
                    </Pressable>
                  </View>
                ))}
            </ScrollView>

            {/* Comment Input Bar */}
            <View style={styles.commentInputRow}>
              <TextInput
                value={commentInput}
                onChangeText={setCommentInput}
                placeholder="Add an encouraging comment or decree..."
                placeholderTextColor={Colors.textMuted}
                style={styles.commentTextInput}
              />
              <Pressable style={styles.commentSendBtn} onPress={handleAddComment}>
                <Ionicons name="send" size={16} color="#09090b" />
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Instagram Repost Modal */}
      <Modal visible={!!repostPost} animationType="fade" transparent onRequestClose={() => setRepostPost(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.repostSheet}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="paper-plane" size={18} color={Colors.gold} />
                <Text style={styles.modalTitle}>Share & Repost</Text>
              </View>
              <Pressable onPress={() => setRepostPost(null)} style={{ padding: 4 }}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </Pressable>
            </View>

            <Text style={styles.repostPrompt}>
              Share "{repostPost?.title}" with the Gateway community:
            </Text>

            <Pressable
              style={styles.repostOptionBtn}
              onPress={() => {
                Alert.alert('Reposted to Story', 'Decree has been shared to your 24h Church Story!');
                setRepostPost(null);
              }}
            >
              <Ionicons name="camera-outline" size={20} color={Colors.gold} />
              <View style={{ flex: 1 }}>
                <Text style={styles.repostOptionTitle}>Add to Your Church Story</Text>
                <Text style={styles.repostOptionSub}>Visible to all believers for 24 hours</Text>
              </View>
            </Pressable>

            <Pressable
              style={styles.repostOptionBtn}
              onPress={() => {
                Alert.alert('Shared to Chat', 'Decree sent to Ignite Worship Fellowship group.');
                setRepostPost(null);
              }}
            >
              <Ionicons name="chatbubbles-outline" size={20} color="#25D366" />
              <View style={{ flex: 1 }}>
                <Text style={styles.repostOptionTitle}>Send to Fellowship Group</Text>
                <Text style={styles.repostOptionSub}>Share into your connected church groups</Text>
              </View>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* WhatsApp Full In-Chat Group & Direct Modal */}
      <Modal visible={!!activeChatGroup} animationType="slide" transparent onRequestClose={() => setActiveChatGroup(null)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.chatOverlay}
        >
          <View style={styles.chatSheet}>
            {/* WhatsApp Group Chat Header */}
            <View style={styles.chatHeader}>
              <View style={styles.chatHeaderLeft}>
                <View style={styles.chatAvatar}>
                  <Ionicons name={activeChatGroup?.is_paid ? 'school' : 'people'} size={18} color={Colors.gold} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.chatGroupName} numberOfLines={1}>{activeChatGroup?.name}</Text>
                    {isDeveloper && (
                      <View style={styles.ghostPill}>
                        <Ionicons name="eye-off" size={10} color="#a5b4fc" />
                        <Text style={styles.ghostPillText}>Ghost Oversight</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.chatGroupSub}>{activeChatGroup?.category} Fellowship • 42 members</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Pressable onPress={handleCopyInviteLink} style={{ padding: 6 }}>
                  <Ionicons name="link-outline" size={18} color={Colors.gold} />
                </Pressable>
                <Pressable onPress={() => setShowGroupOptionsMenu(prev => !prev)} style={{ padding: 6 }}>
                  <Ionicons name="ellipsis-vertical" size={18} color={Colors.textPrimary} />
                </Pressable>
                <Pressable onPress={() => setActiveChatGroup(null)} style={{ padding: 6 }}>
                  <Ionicons name="close" size={22} color={Colors.textPrimary} />
                </Pressable>
              </View>
            </View>

            {/* Options Dropdown Menu */}
            {showGroupOptionsMenu && (
              <View style={styles.chatOptionsMenu}>
                <Pressable
                  style={styles.chatOptionsMenuItem}
                  onPress={() => {
                    setShowGroupOptionsMenu(false);
                    handleCopyInviteLink();
                  }}
                >
                  <Ionicons name="share-social-outline" size={16} color={Colors.textPrimary} />
                  <Text style={styles.chatOptionsMenuItemText}>Share Fellowship Link</Text>
                </Pressable>
                {(isDeveloper || isAdmin) && (
                  <Pressable
                    style={[styles.chatOptionsMenuItem, { borderTopWidth: 1, borderTopColor: Colors.border }]}
                    onPress={() => {
                      setShowGroupOptionsMenu(false);
                      handleDissolveGroup();
                    }}
                  >
                    <Ionicons name="trash-outline" size={16} color="#ef4444" />
                    <Text style={[styles.chatOptionsMenuItemText, { color: '#ef4444' }]}>Dissolve Group (Admin/Dev)</Text>
                  </Pressable>
                )}
              </View>
            )}

            {/* WhatsApp Message Stream */}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.chatMessagesScroll}>
              {chatMessages.map(msg => {
                const isMe = msg.sender_id === profile?.id;
                const canDelete = isMe || isAdmin || isDeveloper;
                const hasReactions = msg.reactions && msg.reactions.length > 0;

                return (
                  <View
                    key={msg.id}
                    style={[styles.chatBubble, isMe ? styles.chatBubbleMe : styles.chatBubbleOther]}
                  >
                    {!isMe && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                        <Text style={styles.chatSenderName}>{msg.sender_name}</Text>
                        {msg.sender_role ? (
                          <View style={styles.chatRolePill}>
                            <Text style={styles.chatRoleText}>{msg.sender_role}</Text>
                          </View>
                        ) : null}
                      </View>
                    )}

                    {/* WhatsApp Quoted Reply Header */}
                    {msg.reply_to && (
                      <View style={styles.chatQuotedReplyBubble}>
                        <View style={styles.chatQuotedBar} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.chatQuotedSender}>{msg.reply_to.sender_name}</Text>
                          <Text style={styles.chatQuotedText} numberOfLines={1}>{msg.reply_to.text}</Text>
                        </View>
                      </View>
                    )}

                    {/* Attachment preview if any */}
                    {msg.attachment && (
                      <View style={styles.chatAttachmentCard}>
                        <Ionicons
                          name={
                            msg.attachment.type === 'image'
                              ? 'image'
                              : msg.attachment.type === 'document'
                              ? 'document-text'
                              : msg.attachment.type === 'link'
                              ? 'link'
                              : 'book'
                          }
                          size={16}
                          color={Colors.gold}
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.chatAttachmentName} numberOfLines={1}>{msg.attachment.name}</Text>
                          <Text style={styles.chatAttachmentType}>{msg.attachment.type.toUpperCase()}</Text>
                        </View>
                      </View>
                    )}

                    <Text style={[styles.chatMsgText, isMe ? styles.chatMsgTextMe : styles.chatMsgTextOther]}>
                      {msg.text}
                    </Text>

                    {/* Reactions Pill */}
                    {hasReactions && (
                      <View style={styles.chatReactionsPill}>
                        {msg.reactions?.map((r, ri) => (
                          <Text key={ri} style={{ fontSize: 11 }}>{r}</Text>
                        ))}
                      </View>
                    )}

                    <View style={styles.chatMetaRow}>
                      <Text style={[styles.chatTimeText, isMe ? styles.chatTimeTextMe : styles.chatTimeTextOther]}>
                        {msg.created_at}
                      </Text>

                      {/* WhatsApp Read Receipts */}
                      {isMe && (
                        <Ionicons
                          name={
                            msg.receipt_status === 'read'
                              ? 'checkmark-done'
                              : msg.receipt_status === 'delivered'
                              ? 'checkmark-done'
                              : 'checkmark'
                          }
                          size={14}
                          color={msg.receipt_status === 'read' ? '#38bdf8' : Colors.textMuted}
                          style={{ marginLeft: 4 }}
                        />
                      )}

                      {/* Reply Quoting Action Button */}
                      <Pressable
                        onPress={() => setReplyingToMessage(msg)}
                        style={{ marginLeft: 6, padding: 2 }}
                        hitSlop={6}
                      >
                        <Ionicons name="arrow-undo-outline" size={12} color={isMe ? 'rgba(255,255,255,0.7)' : Colors.textMuted} />
                      </Pressable>

                      {/* Reaction Toggle Action */}
                      <Pressable
                        onPress={() => setActiveReactionMsgId(activeReactionMsgId === msg.id ? null : msg.id)}
                        style={{ marginLeft: 6, padding: 2 }}
                        hitSlop={6}
                      >
                        <Ionicons name="happy-outline" size={12} color={isMe ? 'rgba(255,255,255,0.7)' : Colors.textMuted} />
                      </Pressable>

                      {/* Moderation / Delete */}
                      {canDelete && (
                        <Pressable
                          onPress={() => handleDeleteMessage(msg.id)}
                          style={{ marginLeft: 6, padding: 2 }}
                          hitSlop={6}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={12}
                            color={isMe ? 'rgba(255,255,255,0.7)' : Colors.textMuted}
                          />
                        </Pressable>
                      )}
                    </View>

                    {/* Quick Reactions Bar */}
                    {activeReactionMsgId === msg.id && (
                      <View style={styles.quickReactionsBar}>
                        {['🙏', '❤️', '🔥', '✝️', '👍', '😂'].map(emoji => (
                          <Pressable
                            key={emoji}
                            style={styles.quickEmojiBtn}
                            onPress={() => handleMessageReaction(msg.id, emoji)}
                          >
                            <Text style={{ fontSize: 16 }}>{emoji}</Text>
                          </Pressable>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })}
            </ScrollView>

            {/* Quoted Replying Banner */}
            {replyingToMessage && (
              <View style={styles.replyBannerRow}>
                <View style={styles.replyBannerIndicator} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.replyBannerSender}>Replying to {replyingToMessage.sender_name}</Text>
                  <Text style={styles.replyBannerPreview} numberOfLines={1}>{replyingToMessage.text}</Text>
                </View>
                <Pressable onPress={() => setReplyingToMessage(null)} style={{ padding: 4 }}>
                  <Ionicons name="close" size={18} color={Colors.textMuted} />
                </Pressable>
              </View>
            )}

            {/* WhatsApp Paperclip Attachment Tray */}
            {showAttachmentTray && (
              <View style={styles.attachmentTray}>
                <Pressable
                  style={styles.attachmentTrayItem}
                  onPress={() => handleSendChatMessage({ type: 'image', url: 'https://gatewaychurch.org/photos/fellowship.jpg', name: 'Fellowship_Photo.jpg' })}
                >
                  <View style={[styles.attachmentTrayIconCircle, { backgroundColor: '#8b5cf6' }]}>
                    <Ionicons name="image" size={18} color="#ffffff" />
                  </View>
                  <Text style={styles.attachmentTrayLabel}>Photo</Text>
                </Pressable>

                <Pressable
                  style={styles.attachmentTrayItem}
                  onPress={() => handleSendChatMessage({ type: 'document', url: 'https://gatewaychurch.org/docs/dominion_guide.pdf', name: 'Dominion_Study_Guide.pdf' })}
                >
                  <View style={[styles.attachmentTrayIconCircle, { backgroundColor: '#3b82f6' }]}>
                    <Ionicons name="document-text" size={18} color="#ffffff" />
                  </View>
                  <Text style={styles.attachmentTrayLabel}>Document</Text>
                </Pressable>

                <Pressable
                  style={styles.attachmentTrayItem}
                  onPress={() => {
                    if (activeChatGroup) {
                      handleSendChatMessage({ type: 'link', url: generateGroupInviteLink(activeChatGroup.id), name: `${activeChatGroup.name} Link` });
                    }
                  }}
                >
                  <View style={[styles.attachmentTrayIconCircle, { backgroundColor: '#10b981' }]}>
                    <Ionicons name="link" size={18} color="#ffffff" />
                  </View>
                  <Text style={styles.attachmentTrayLabel}>Invite Link</Text>
                </Pressable>

                <Pressable
                  style={styles.attachmentTrayItem}
                  onPress={() => handleSendChatMessage({ type: 'scripture', name: 'Romans 8:37 • More than conquerors' })}
                >
                  <View style={[styles.attachmentTrayIconCircle, { backgroundColor: Colors.gold }]}>
                    <Ionicons name="book" size={18} color="#000000" />
                  </View>
                  <Text style={styles.attachmentTrayLabel}>Scripture</Text>
                </Pressable>
              </View>
            )}

            {/* WhatsApp Input Row */}
            <View style={styles.chatInputRow}>
              <Pressable style={styles.chatEmojiBtn} onPress={() => setShowAttachmentTray(prev => !prev)}>
                <Ionicons name="happy-outline" size={22} color={Colors.textMuted} />
              </Pressable>

              <TextInput
                value={chatInput}
                onChangeText={setChatInput}
                placeholder="Message fellowship..."
                placeholderTextColor={Colors.textMuted}
                style={styles.chatTextInput}
                multiline
              />

              <Pressable style={styles.chatAttachBtn} onPress={() => setShowAttachmentTray(prev => !prev)}>
                <Ionicons name="attach" size={22} color={Colors.gold} />
              </Pressable>

              <Pressable
                style={[styles.whatsappSendBtn, (!chatInput.trim() && !showAttachmentTray) && { backgroundColor: '#1f2937' }]}
                onPress={() => handleSendChatMessage()}
                disabled={!chatInput.trim()}
              >
                <Ionicons name="send" size={17} color={chatInput.trim() ? '#ffffff' : Colors.textMuted} />
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* WhatsApp 1-on-1 Direct Chat Modal */}
      <Modal visible={!!directChatMember} animationType="slide" transparent onRequestClose={() => setDirectChatMember(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.chatOverlay}>
          <View style={styles.chatSheet}>
            <View style={styles.chatHeader}>
              <View style={styles.chatHeaderLeft}>
                <View style={styles.whatsappChatAvatarRing}>
                  <View style={styles.whatsappChatAvatar}>
                    <Text style={styles.whatsappChatAvatarText}>{directChatMember?.avatarText}</Text>
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <Text style={styles.chatGroupName} numberOfLines={1}>{directChatMember?.name}</Text>
                    <Ionicons name="checkmark-circle" size={14} color={Colors.gold} />
                  </View>
                  <Text style={styles.chatGroupSub}>{directChatMember?.role} • Online</Text>
                </View>
              </View>
              <Pressable onPress={() => setDirectChatMember(null)} style={{ padding: 6 }}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.chatMessagesScroll}>
              {directChatMember &&
                (directMessages[directChatMember.id] || []).map(m => {
                  const isMe = m.sender === 'me';
                  return (
                    <View key={m.id} style={[styles.chatBubble, isMe ? styles.chatBubbleMe : styles.chatBubbleOther]}>
                      <Text style={[styles.chatMsgText, isMe ? styles.chatMsgTextMe : styles.chatMsgTextOther]}>
                        {m.text}
                      </Text>
                      <View style={styles.chatMetaRow}>
                        <Text style={[styles.chatTimeText, isMe ? styles.chatTimeTextMe : styles.chatTimeTextOther]}>
                          {m.time}
                        </Text>
                        {isMe && <Ionicons name="checkmark-done" size={14} color="#38bdf8" style={{ marginLeft: 4 }} />}
                      </View>
                    </View>
                  );
                })}
            </ScrollView>

            <View style={styles.chatInputRow}>
              <TextInput
                value={directChatInput}
                onChangeText={setDirectChatInput}
                placeholder={`Message ${directChatMember?.name}...`}
                placeholderTextColor={Colors.textMuted}
                style={styles.chatTextInput}
              />
              <Pressable
                style={[styles.whatsappSendBtn, !directChatInput.trim() && { backgroundColor: '#1f2937' }]}
                onPress={handleSendDirectMessage}
                disabled={!directChatInput.trim()}
              >
                <Ionicons name="send" size={17} color={directChatInput.trim() ? '#ffffff' : Colors.textMuted} />
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Story Viewer Modal */}
      <Modal visible={!!activeStory} animationType="fade" transparent onRequestClose={() => setActiveStory(null)}>
        <View style={styles.storyViewerOverlay}>
          <View style={styles.storyProgressTrack}>
            <Animated.View
              style={[
                styles.storyProgressFill,
                {
                  width: storyProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>

          <View style={styles.storyViewerHeader}>
            <View style={styles.storyViewerAuthor}>
              <View style={styles.storyViewerAvatar}>
                <Text style={styles.storyViewerAvatarText}>{activeStory?.avatarText}</Text>
              </View>
              <View>
                <Text style={styles.storyViewerName}>{activeStory?.author}</Text>
                <Text style={styles.storyViewerTime}>{activeStory?.timeAgo} • {activeStory?.role}</Text>
              </View>
            </View>
            <Pressable onPress={() => setActiveStory(null)} style={{ padding: 6 }}>
              <Ionicons name="close" size={24} color="#ffffff" />
            </Pressable>
          </View>

          <View style={styles.storyViewerBody}>
            <Ionicons name="sparkles" size={32} color={Colors.gold} style={{ alignSelf: 'center', marginBottom: 16 }} />
            <Text style={styles.storyViewerCaption}>{activeStory?.caption}</Text>
            {activeStory?.scripture ? (
              <View style={styles.storyScriptureCard}>
                <Ionicons name="book" size={14} color={Colors.gold} />
                <Text style={styles.storyScriptureText}>{activeStory.scripture}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.storyReactionsBar}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {['❤️', '🙏', '🔥', '⚡', '🙌'].map(emoji => (
                <Pressable
                  key={emoji}
                  style={styles.storyEmojiBtn}
                  onPress={() => {
                    Alert.alert('Decree Sent', `Sent ${emoji} to ${activeStory?.author}`);
                  }}
                >
                  <Text style={{ fontSize: 20 }}>{emoji}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Share Testimony Modal */}
      <Modal visible={showShareModal} animationType="slide" transparent onRequestClose={() => setShowShareModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="sparkles" size={20} color={Colors.gold} />
                <Text style={styles.modalTitle}>Share Praise Report</Text>
              </View>
              <Pressable onPress={() => setShowShareModal(false)} style={{ padding: 4 }}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalSub}>
                Share what the Lord has done to encourage the global congregation.
              </Text>

              <Text style={styles.inputLabel}>Title / Subject</Text>
              <TextInput
                value={postTitle}
                onChangeText={setPostTitle}
                placeholder="e.g. Supernatural Healing & Breakthrough"
                placeholderTextColor={Colors.textMuted}
                style={styles.input}
              />

              <Text style={styles.inputLabel}>Your Testimony / Praise</Text>
              <TextInput
                value={postBody}
                onChangeText={setPostBody}
                placeholder="Describe your breakthrough in faith..."
                placeholderTextColor={Colors.textMuted}
                multiline
                style={[styles.input, { minHeight: 90 }]}
              />

              <Pressable
                style={[styles.btnPrimary, postSaved && { backgroundColor: Colors.success }]}
                onPress={handleSavePost}
              >
                <Ionicons name={postSaved ? 'checkmark-circle' : 'share-social'} size={17} color={Colors.textInverse} />
                <Text style={styles.btnPrimaryText}>{postSaved ? 'Praise Shared!' : 'Publish Praise Report'}</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  appLogoCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(37, 211, 102, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 16,
  },
  appSub: {
    fontFamily: Typography.fontRegular,
    color: Colors.gold,
    fontSize: 10,
  },
  headerIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#181e2c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.gold,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.full,
  },
  headerShareBtnText: {
    fontFamily: Typography.fontBold,
    color: '#09090b',
    fontSize: 12,
  },

  // Stories Section (WhatsApp Redesign)
  storiesSection: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  storiesScroll: {
    paddingHorizontal: 14,
    gap: 12,
  },
  storyItem: {
    alignItems: 'center',
    width: 64,
  },
  addStoryRingDashed: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#25D366',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(37, 211, 102, 0.06)',
  },
  storyRingGlowing: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: '#25D366',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  storyAvatarCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 25,
    backgroundColor: '#161c28',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyAvatarText: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 14,
  },
  storyLabel: {
    fontFamily: Typography.fontRegular,
    color: Colors.textPrimary,
    fontSize: 10.5,
    marginTop: 4,
    textAlign: 'center',
  },

  // Curved Segmented Switcher Capsule (WhatsApp Redesign by Nainesh)
  whatsappCapsuleSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#131826',
    borderRadius: Radii.full,
    padding: 4,
    marginHorizontal: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#20293d',
  },
  whatsappCapsuleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: Radii.full,
  },
  whatsappCapsuleBtnActive: {
    backgroundColor: '#25D366',
  },
  whatsappCapsuleBtnText: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.textMuted,
    fontSize: 12,
  },
  whatsappCapsuleBtnTextActive: {
    color: '#09090b',
    fontFamily: Typography.fontBold,
  },
  capsuleBadge: {
    backgroundColor: '#09090b',
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  capsuleBadgeText: {
    fontFamily: Typography.fontBold,
    color: '#25D366',
    fontSize: 9,
  },

  // Chats Tab Styles
  chatsListContainer: {
    paddingHorizontal: 16,
  },
  chatSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121724',
    borderWidth: 1,
    borderColor: '#222c40',
    borderRadius: Radii.full,
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 8,
    marginBottom: 10,
  },
  chatSearchInput: {
    flex: 1,
    fontFamily: Typography.fontRegular,
    color: Colors.textPrimary,
    fontSize: 12.5,
    padding: 0,
  },
  chatSectionHeader: {
    fontFamily: Typography.fontBold,
    color: Colors.textMuted,
    fontSize: 10.5,
    letterSpacing: 1,
    marginBottom: 6,
    marginTop: 4,
  },
  whatsappChatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    gap: 12,
  },
  whatsappChatAvatarRing: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    borderColor: '#25D366',
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  whatsappChatAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 21,
    backgroundColor: '#161c28',
    alignItems: 'center',
    justifyContent: 'center',
  },
  whatsappChatAvatarText: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 14,
  },
  whatsappChatInfo: {
    flex: 1,
  },
  whatsappChatName: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 14,
  },
  whatsappChatTime: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 10.5,
  },
  whatsappChatSnippet: {
    fontFamily: Typography.fontRegular,
    color: Colors.textSecondary,
    fontSize: 12,
    flex: 1,
    marginRight: 6,
  },
  whatsappUnreadPill: {
    backgroundColor: '#25D366',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  whatsappUnreadPillText: {
    fontFamily: Typography.fontBold,
    color: '#09090b',
    fontSize: 9.5,
  },
  miniPaidBadge: {
    backgroundColor: 'rgba(223, 167, 50, 0.2)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: Colors.gold,
  },
  miniPaidBadgeText: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 8.5,
  },

  // Communities Groups Tab
  groupsList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  groupCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    gap: 8,
  },
  groupTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  groupIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#181e2c',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  groupName: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 14,
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(223, 167, 50, 0.18)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: Radii.sm,
    borderWidth: 0.5,
    borderColor: Colors.gold,
  },
  paidBadgeText: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 8.5,
  },
  freeBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: Radii.sm,
  },
  freeBadgeText: {
    fontFamily: Typography.fontBold,
    color: Colors.success,
    fontSize: 8.5,
  },
  groupLocation: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 11,
  },
  groupDesc: {
    fontFamily: Typography.fontRegular,
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  devGhostIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  devGhostIndicatorText: {
    fontFamily: Typography.fontSemiBold,
    color: '#a5b4fc',
    fontSize: 10,
  },
  groupActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  chatActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.gold,
    paddingVertical: 8,
    borderRadius: Radii.sm,
  },
  chatActionBtnLocked: {
    backgroundColor: '#27272a',
  },
  chatActionBtnText: {
    fontFamily: Typography.fontBold,
    color: '#09090b',
    fontSize: 12,
  },
  joinBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1a1f2c',
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 8,
    borderRadius: Radii.sm,
  },
  joinedBtn: {
    borderColor: Colors.success,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  joinBtnText: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 12,
  },
  joinedBtnText: {
    color: Colors.success,
  },
  inviteLinkBtn: {
    width: 36,
    height: 36,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1f2c',
  },

  // Instagram Feed Styles
  feedList: {
    paddingHorizontal: 12,
    gap: 16,
  },
  igPostCard: {
    backgroundColor: '#0c0f18',
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: '#1e2638',
    overflow: 'hidden',
    paddingBottom: 12,
  },
  igPostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  igAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  igStoryRingBorder: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: Colors.gold,
    padding: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  igAuthorAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 17,
    backgroundColor: '#1c2436',
    alignItems: 'center',
    justifyContent: 'center',
  },
  igAuthorAvatarText: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 12,
  },
  igAuthorName: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 13,
  },
  igLocationText: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: 1,
  },
  igMediaContainer: {
    width: '100%',
    minHeight: 200,
    backgroundColor: '#121724',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  igMediaInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  igMediaScriptureText: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 17,
    textAlign: 'center',
    lineHeight: 23,
    marginBottom: 8,
  },
  igMediaExhortationText: {
    fontFamily: Typography.fontRegular,
    color: Colors.gold,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
  },
  igActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  igLikesText: {
    fontFamily: Typography.fontRegular,
    color: Colors.textPrimary,
    fontSize: 12.5,
    paddingHorizontal: 12,
  },
  igCaptionRow: {
    paddingHorizontal: 12,
    marginTop: 4,
  },
  igCaptionText: {
    fontFamily: Typography.fontRegular,
    color: Colors.textPrimary,
    fontSize: 12.5,
    lineHeight: 17,
  },
  igCaptionHandle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
  },
  igCommentsLink: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 11.5,
    paddingHorizontal: 12,
  },
  igTimeAgo: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 9.5,
    paddingHorizontal: 12,
    marginTop: 4,
  },

  // WhatsApp In-Chat Modal Styles
  chatOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  chatSheet: {
    height: '92%',
    backgroundColor: '#0a0e17',
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    overflow: 'hidden',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#121826',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  chatHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  chatAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1e2638',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatGroupName: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 14,
  },
  chatGroupSub: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 10.5,
  },
  ghostPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  ghostPillText: {
    fontFamily: Typography.fontBold,
    color: '#a5b4fc',
    fontSize: 8.5,
  },
  chatOptionsMenu: {
    position: 'absolute',
    top: 55,
    right: 14,
    backgroundColor: '#181e2e',
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: '#29354d',
    zIndex: 99,
    width: 200,
  },
  chatOptionsMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  chatOptionsMenuItemText: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.textPrimary,
    fontSize: 12,
  },
  chatMessagesScroll: {
    padding: 14,
    gap: 10,
  },
  chatBubble: {
    maxWidth: '82%',
    borderRadius: Radii.md,
    padding: 10,
    gap: 4,
  },
  chatBubbleMe: {
    alignSelf: 'flex-end',
    backgroundColor: '#005c4b', // WhatsApp Dark Green Bubble
    borderBottomRightRadius: 2,
  },
  chatBubbleOther: {
    alignSelf: 'flex-start',
    backgroundColor: '#202c33', // WhatsApp Dark Grey Bubble
    borderBottomLeftRadius: 2,
  },
  chatSenderName: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 11.5,
  },
  chatRolePill: {
    backgroundColor: 'rgba(223, 167, 50, 0.2)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  chatRoleText: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 8.5,
  },
  chatQuotedReplyBubble: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: Radii.sm,
    padding: 6,
    gap: 6,
    marginBottom: 4,
  },
  chatQuotedBar: {
    width: 3,
    backgroundColor: Colors.gold,
    borderRadius: 2,
  },
  chatQuotedSender: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 10.5,
  },
  chatQuotedText: {
    fontFamily: Typography.fontRegular,
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 10,
  },
  chatAttachmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 8,
    borderRadius: Radii.sm,
  },
  chatAttachmentName: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.textPrimary,
    fontSize: 11.5,
  },
  chatAttachmentType: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 9,
  },
  chatMsgText: {
    fontFamily: Typography.fontRegular,
    fontSize: 13,
    lineHeight: 18,
  },
  chatMsgTextMe: {
    color: '#ffffff',
  },
  chatMsgTextOther: {
    color: '#e9edef',
  },
  chatReactionsPill: {
    flexDirection: 'row',
    gap: 3,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 2,
  },
  chatMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: 2,
  },
  chatTimeText: {
    fontFamily: Typography.fontRegular,
    fontSize: 9.5,
  },
  chatTimeTextMe: {
    color: 'rgba(255, 255, 255, 0.6)',
  },
  chatTimeTextOther: {
    color: Colors.textMuted,
  },
  quickReactionsBar: {
    flexDirection: 'row',
    backgroundColor: '#1f2937',
    borderRadius: Radii.full,
    padding: 4,
    gap: 6,
    marginTop: 4,
  },
  quickEmojiBtn: {
    padding: 4,
  },
  replyBannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#182030',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.gold,
    gap: 8,
  },
  replyBannerIndicator: {
    width: 3,
    height: '100%',
    backgroundColor: Colors.gold,
    borderRadius: 2,
  },
  replyBannerSender: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 11,
  },
  replyBannerPreview: {
    fontFamily: Typography.fontRegular,
    color: Colors.textSecondary,
    fontSize: 11,
  },
  attachmentTray: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#121824',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  attachmentTrayItem: {
    alignItems: 'center',
    gap: 4,
  },
  attachmentTrayIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachmentTrayLabel: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.textSecondary,
    fontSize: 10,
  },
  chatInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121824',
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  chatEmojiBtn: {
    padding: 4,
  },
  chatTextInput: {
    flex: 1,
    fontFamily: Typography.fontRegular,
    color: Colors.textPrimary,
    fontSize: 13,
    backgroundColor: '#1c2436',
    borderRadius: Radii.full,
    paddingHorizontal: 14,
    paddingVertical: 7,
    maxHeight: 80,
  },
  chatAttachBtn: {
    padding: 4,
  },
  whatsappSendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#25D366',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Comments Sheet Modal Styles
  commentsSheet: {
    height: '75%',
    backgroundColor: '#0d111a',
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
  },
  commentRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1c2436',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentAvatarText: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 11,
  },
  commentAuthor: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 12,
  },
  commentTime: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 10,
  },
  commentBody: {
    fontFamily: Typography.fontRegular,
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  commentTextInput: {
    flex: 1,
    backgroundColor: '#161c28',
    borderRadius: Radii.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontFamily: Typography.fontRegular,
    color: Colors.textPrimary,
    fontSize: 12.5,
  },
  commentSendBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Repost Modal Styles
  repostSheet: {
    width: '90%',
    backgroundColor: '#101520',
    borderRadius: Radii.lg,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#242e42',
  },
  repostPrompt: {
    fontFamily: Typography.fontRegular,
    color: Colors.textSecondary,
    fontSize: 12.5,
  },
  repostOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#181f30',
    padding: 12,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: '#242e42',
  },
  repostOptionTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 13,
  },
  repostOptionSub: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },

  // Story Fullscreen Viewer Styles
  storyViewerOverlay: {
    flex: 1,
    backgroundColor: '#05070c',
    paddingTop: Platform.OS === 'ios' ? 44 : 20,
    paddingHorizontal: 14,
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  storyProgressTrack: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 8,
  },
  storyProgressFill: {
    height: '100%',
    backgroundColor: Colors.gold,
  },
  storyViewerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  storyViewerAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  storyViewerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyViewerAvatarText: {
    fontFamily: Typography.fontBold,
    color: '#09090b',
    fontSize: 13,
  },
  storyViewerName: {
    fontFamily: Typography.fontBold,
    color: '#ffffff',
    fontSize: 13,
  },
  storyViewerTime: {
    fontFamily: Typography.fontRegular,
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
  },
  storyViewerBody: {
    paddingVertical: 40,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  storyViewerCaption: {
    fontFamily: Typography.fontBold,
    color: '#ffffff',
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 20,
  },
  storyScriptureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(223, 167, 50, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: 'rgba(223, 167, 50, 0.3)',
  },
  storyScriptureText: {
    fontFamily: Typography.fontRegular,
    color: Colors.gold,
    fontSize: 12,
    flex: 1,
    textAlign: 'center',
  },
  storyReactionsBar: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  storyEmojiBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Generic Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalSheet: {
    width: '100%',
    backgroundColor: '#0f1420',
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    padding: 18,
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 15,
  },
  modalSub: {
    fontFamily: Typography.fontRegular,
    color: Colors.textSecondary,
    fontSize: 12,
    marginBottom: 8,
  },
  inputLabel: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.textMuted,
    fontSize: 11,
    marginBottom: 4,
    marginTop: 6,
  },
  input: {
    backgroundColor: '#161c28',
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: '#242e42',
    color: Colors.textPrimary,
    fontFamily: Typography.fontRegular,
    fontSize: 13,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 8,
  },
  btnPrimary: {
    backgroundColor: Colors.gold,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: Radii.md,
    marginTop: 10,
  },
  btnPrimaryText: {
    fontFamily: Typography.fontBold,
    color: '#09090b',
    fontSize: 13,
  },
  emptyCard: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 15,
    marginTop: 10,
  },
  emptyBody: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  groupUnreadBadge: {
    backgroundColor: '#25D366',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  groupUnreadBadgeText: {
    fontFamily: Typography.fontBold,
    color: '#09090b',
    fontSize: 9,
  },
});
