import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Modal, Alert, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Radii } from '../theme/colors';
import { MobileUser } from '../auth/authService';
import { saveTestimony, listContent } from '../data/contentRepository';
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
} from '../data/groupRepository';
import { getEvents, Event } from '../data/eventRepository';
import { trackEvent } from '../analytics/analyticsService';

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
  isFollowing?: boolean;
}

const CHURCH_STORIES: ChurchStory[] = [
  {
    id: 'story_joe',
    author: 'Apostle Joe Daniels',
    shortName: 'Apostle',
    role: 'Senior Pastor',
    avatarText: 'JD',
    caption: 'Great grace upon Gateway Church this Sunday! Expect unusual breakthroughs and open heavens as we enter into supernatural dominion.',
    scripture: 'Zechariah 4:6 • Not by might, nor by power, but by my Spirit, saith the LORD of hosts.',
    timeAgo: '2h ago',
  },
  {
    id: 'story_cynthia',
    author: 'Prophetess Melinda Daniels',
    shortName: 'Prophetess',
    role: 'Co-Founder & Passion Ladies',
    avatarText: 'MD',
    caption: 'Women of Grace prayer breakfast was powerful this morning. Daughters of Zion, keep standing in faith for your families!',
    scripture: 'Proverbs 31:25 • Strength and honour are her clothing; and she shall rejoice in time to come.',
    timeAgo: '4h ago',
  },
  {
    id: 'story_worship',
    author: 'Ignite Worship Team',
    shortName: 'Worship',
    role: 'Music Ministry',
    avatarText: 'IW',
    caption: 'Rehearsing for Sunday Dominion Service! The sound of revival is already resounding in the sanctuary.',
    scripture: 'Psalm 150:6 • Let every thing that hath breath praise the LORD.',
    timeAgo: '6h ago',
  },
  {
    id: 'story_youth',
    author: 'Gymstars Youth',
    shortName: 'Youth',
    role: 'Youth Ministry',
    avatarText: 'GY',
    caption: 'Fire Friday was electric! Over 200 young adults gathered, passionate for Christ. Don’t miss next week!',
    scripture: '1 Timothy 4:12 • Let no man despise thy youth; but be thou an example of the believers.',
    timeAgo: '8h ago',
  },
  {
    id: 'story_missions',
    author: 'Global Missions Gateway',
    shortName: 'Missions',
    role: 'Outreach & Missions',
    avatarText: 'GM',
    caption: 'Food hampers and school supplies distributed to 150 families in Bulawayo rural outreach. Glory to God!',
    scripture: 'Matthew 25:40 • Inasmuch as ye have done it unto one of the least of these, ye have done it unto me.',
    timeAgo: '12h ago',
  },
];

const COMMUNITY_MEMBERS: Record<string, MemberProfilePreview> = {
  'Apostle Joe Daniels': {
    id: 'usr_apostle_joe',
    name: 'Apostle Joe Daniels',
    handle: '@apostle_joe_daniels',
    avatarText: 'JD',
    role: 'Senior Pastor & Founder',
    campus: 'Harare Main Sanctuary',
    bio: 'Father, Teacher & Apostolic Overseer of Gateway Church International. Advancing kingdom dominion across the nations.',
    joinedYear: 'Founding Overseer',
    testimoniesCount: 42,
    followersCount: 14200,
    followingCount: 12,
  },
  'Prophetess Melinda Daniels': {
    id: 'usr_prophetess_melinda',
    name: 'Prophetess Melinda Daniels',
    handle: '@prophetess_melinda',
    avatarText: 'MD',
    role: 'Co-Founder & Passion Ladies',
    campus: 'Harare Main Sanctuary',
    bio: 'Apostolic and Prophetic teacher raising women of honor, prayer, and faith.',
    joinedYear: 'Co-Founder',
    testimoniesCount: 28,
    followersCount: 9800,
    followingCount: 15,
  },
  'Tinodaishe Morgan Chibi': {
    id: 'usr_tino',
    name: 'Tinodaishe Morgan Chibi',
    handle: '@tinodaishe_morgan_chibi',
    avatarText: 'TC',
    role: 'Covenant Partner & Media Lead',
    campus: 'Harare Main Campus',
    bio: 'Walking in supernatural dominion & apostolic grace • Gateway Church Harare',
    joinedYear: 'Member since 2021',
    testimoniesCount: 8,
    followersCount: 24,
    followingCount: 2,
  },
};

export function CommunityScreen({ profile, onRequestAuth, onRegisterFabTrigger }: CommunityScreenProps) {
  const [activeSubTab, setActiveSubTab] = useState<'feed' | 'groups' | 'events'>('feed');
  const [testimonies, setTestimonies] = useState<ContentItem[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [joinedGroups, setJoinedGroups] = useState<Record<string, boolean>>({});
  const [events, setEvents] = useState<Event[]>([]);

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

  // Profile Preview Modal state
  const [previewMember, setPreviewMember] = useState<MemberProfilePreview | null>(null);
  const [followedMembers, setFollowedMembers] = useState<Record<string, boolean>>({
    usr_apostle_joe: true,
    usr_prophetess_melinda: true,
  });

  // 1-on-1 Direct Chat Modal state
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
    usr_tino: [
      { id: 'dm_4', text: 'Great seeing you in church! Let us know if you would like to volunteer in media & sound ministry.', sender: 'them', time: '2d ago' },
    ],
  });

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
    profile?.badge_type === 'blue'
  );

  useEffect(() => {
    setGroups(getGroups());
    setTestimonies(listContent('post'));
    setEvents(getEvents());
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
        onRequestAuth('Sign in to share testimonies and encourage the church community with your story.');
      } else {
        Alert.alert('Sign In Required', 'Please sign in or create an account to share your testimony.');
      }
      return;
    }
    setShowShareModal(true);
  };

  const handleSavePost = () => {
    if (!postTitle.trim() || !postBody.trim()) {
      Alert.alert('Incomplete', 'Please enter both a title and your testimony text.');
      return;
    }
    saveTestimony(profile?.id ?? 'anon', postTitle.trim(), postBody.trim());
    setPostTitle('');
    setPostBody('');
    setPostSaved(true);
    setTestimonies(listContent('post'));
    trackEvent('testimony_saved');
    setTimeout(() => {
      setPostSaved(false);
      setShowShareModal(false);
    }, 1500);
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
        `${group.name} is a 3-month apostolic curriculum ($150 USD / ZiG equivalent). Contact administration desk to activate full pass!`,
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

    if (group.is_paid && !profile.is_premium && !isDeveloper) {
      Alert.alert(
        'Covenant Pass Required',
        `"${group.name}" is an exclusive apostolic curriculum. Please enroll or activate your Covenant Partner pass to join.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Unlock Access', onPress: () => Alert.alert('Enrollment', 'Contact administrator or visit Store for registration.') },
        ]
      );
      return;
    }

    setUnreadCounts(prev => ({ ...prev, [group.id]: 0 }));
    setActiveChatGroup(group);
    setChatMessages(getGroupMessages(group.id));
    setChatInput('');
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
      presetAttachment
    );
    setChatMessages(prev => [...prev, newMsg]);
    setChatInput('');
    setShowAttachmentTray(false);
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

  const handleToggleFollow = (memberId: string) => {
    if (!profile) {
      if (onRequestAuth) {
        onRequestAuth('Sign in to follow members of the congregation.');
      } else {
        Alert.alert('Sign In Required', 'Please sign in to follow church members.');
      }
      return;
    }
    setFollowedMembers(prev => ({ ...prev, [memberId]: !prev[memberId] }));
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

    // Simulated reply after short interval
    if (!directMessages[directChatMember.id] || directMessages[directChatMember.id].length <= 2) {
      setTimeout(() => {
        setDirectMessages(prev => ({
          ...prev,
          [directChatMember.id]: [
            ...(prev[directChatMember.id] || []),
            {
              id: `dm_reply_${Date.now()}`,
              text: `Blessings! Thank you for reaching out to ${directChatMember.name}. We have received your note in faith.`,
              sender: 'them' as const,
              time: 'Just now',
            },
          ],
        }));
      }, 1200);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>FELLOWSHIP & GRACE</Text>
          <Text style={styles.title}>Community Hub</Text>
        </View>

        <Pressable style={styles.shareBtn} onPress={handleOpenShare}>
          <Ionicons name="add-circle" size={15} color={Colors.textInverse} />
          <Text style={styles.shareBtnText}>Share Story</Text>
        </Pressable>
      </View>

      {/* Stories Bar (Instagram Style) */}
      <View style={styles.storiesSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storiesScroll}>
          {/* Your Story item */}
          <Pressable style={styles.storyItem} onPress={handleOpenShare}>
            <View style={styles.yourStoryRing}>
              <View style={styles.yourStoryAvatar}>
                <Ionicons name="person" size={20} color={Colors.gold} />
              </View>
              <View style={styles.addStoryPlus}>
                <Ionicons name="add" size={10} color="#ffffff" />
              </View>
            </View>
            <Text style={styles.storyLabel}>Your Story</Text>
          </Pressable>

          {/* Church Stories */}
          {CHURCH_STORIES.map(story => (
            <Pressable
              key={story.id}
              style={styles.storyItem}
              onPress={() => setActiveStory(story)}
            >
              <View style={styles.storyRing}>
                <View style={styles.storyAvatar}>
                  <Text style={styles.storyAvatarText}>{story.avatarText}</Text>
                </View>
              </View>
              <Text style={styles.storyLabel} numberOfLines={1}>
                {story.shortName || story.author.split(' ')[0]}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Sub Tabs: Feed vs Groups (4 Free + 2 Paid) vs Events */}
      <View style={styles.subTabRow}>
        <Pressable
          style={[styles.subTabBtn, activeSubTab === 'feed' && styles.subTabBtnActive]}
          onPress={() => setActiveSubTab('feed')}
        >
          <Ionicons name="newspaper-outline" size={13} color={activeSubTab === 'feed' ? Colors.textInverse : Colors.textMuted} />
          <Text style={[styles.subTabBtnText, activeSubTab === 'feed' && styles.subTabBtnTextActive]}>
            Church Feed
          </Text>
        </Pressable>

        <Pressable
          style={[styles.subTabBtn, activeSubTab === 'groups' && styles.subTabBtnActive]}
          onPress={() => setActiveSubTab('groups')}
        >
          <Ionicons name="people-outline" size={13} color={activeSubTab === 'groups' ? Colors.textInverse : Colors.textMuted} />
          <Text style={[styles.subTabBtnText, activeSubTab === 'groups' && styles.subTabBtnTextActive]}>
            Fellowship Groups (6)
          </Text>
        </Pressable>

        <Pressable
          style={[styles.subTabBtn, activeSubTab === 'events' && styles.subTabBtnActive]}
          onPress={() => setActiveSubTab('events')}
        >
          <Ionicons name="calendar-outline" size={13} color={activeSubTab === 'events' ? Colors.textInverse : Colors.textMuted} />
          <Text style={[styles.subTabBtnText, activeSubTab === 'events' && styles.subTabBtnTextActive]}>
            Upcoming Events
          </Text>
        </Pressable>
      </View>

      {/* Main Tab Content */}
      {activeSubTab === 'feed' && (
        <View style={styles.feedList}>
          {testimonies.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="chatbubbles-outline" size={40} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No community stories yet</Text>
              <Text style={styles.emptyBody}>Tap "+ Share Story" to share what God has done in your life.</Text>
            </View>
          ) : (
            testimonies.map(t => {
              const authorName = (t.metadata?.author as string) || 'Church Member';
              const isApostle = authorName.includes('Apostle');
              return (
                <View key={t.id} style={styles.feedCard}>
                  {/* Post Header */}
                  <View style={styles.postHeader}>
                    <Pressable
                      style={styles.authorRow}
                      onPress={() => openMemberProfile(authorName)}
                    >
                      <View style={[styles.authorAvatar, isApostle && { borderColor: Colors.gold }]}>
                        <Text style={styles.authorAvatarText}>{authorName.slice(0, 2).toUpperCase()}</Text>
                      </View>
                      <View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Text style={styles.authorName}>{authorName}</Text>
                          {isApostle && <Ionicons name="checkmark-circle" size={13} color={Colors.gold} />}
                        </View>
                        <Text style={styles.postTime}>Today • Harare Main Sanctuary</Text>
                      </View>
                    </Pressable>

                    <Pressable
                      style={[styles.followBtn, followedMembers[authorName] && styles.followBtnActive]}
                      onPress={() => handleToggleFollow(authorName)}
                    >
                      <Text style={[styles.followBtnText, followedMembers[authorName] && styles.followBtnTextActive]}>
                        {followedMembers[authorName] ? 'Following' : '+ Follow'}
                      </Text>
                    </Pressable>
                  </View>

                  {/* Post Content */}
                  <Text style={styles.postTitle}>{t.title}</Text>
                  <Text style={styles.postBody}>{t.body}</Text>

                  {/* Reactions */}
                  <View style={styles.reactionsRow}>
                    <Pressable style={styles.reactionBtn}>
                      <Ionicons name="heart" size={14} color="#ef4444" />
                      <Text style={styles.reactionCount}>{String(t.metadata?.likes || 12)}</Text>
                    </Pressable>
                    <Pressable style={styles.reactionBtn}>
                      <Ionicons name="chatbubble-outline" size={13} color={Colors.textMuted} />
                      <Text style={styles.reactionCount}>Amen</Text>
                    </Pressable>
                    <Pressable style={styles.reactionBtn}>
                      <Ionicons name="share-social-outline" size={13} color={Colors.textMuted} />
                      <Text style={styles.reactionCount}>Share</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })
          )}
        </View>
      )}

      {/* Fellowship Groups Tab (4 Free + 2 Paid Premium) */}
      {activeSubTab === 'groups' && (
        <View style={styles.groupsList}>
          {groups.map(group => {
            const isMember = !!joinedGroups[group.id];
            const unread = unreadCounts[group.id] || 0;
            const isLockedPaid = group.is_paid && !profile?.is_premium && !isDeveloper;

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
                    <Text style={styles.devGhostIndicatorText}>Developer God-Mode Oversight Active (Ghost)</Text>
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

      {/* Upcoming Events Tab */}
      {activeSubTab === 'events' && (
        <View style={styles.eventsList}>
          {events.map(ev => (
            <View key={ev.id} style={styles.eventCard}>
              <View style={styles.eventDateBadge}>
                <Ionicons name="calendar" size={16} color={Colors.gold} />
                <Text style={styles.eventDateText}>{ev.event_date}</Text>
              </View>
              <Text style={styles.eventTitle}>{ev.title}</Text>
              <Text style={styles.eventTime}>{ev.event_time} • {ev.location}</Text>
              <Text style={styles.eventDesc}>{ev.description}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Instagram Story Fullscreen Viewer Modal */}
      <Modal visible={!!activeStory} animationType="fade" transparent onRequestClose={() => setActiveStory(null)}>
        <View style={styles.storyViewerOverlay}>
          {/* Progressive Progress Bar */}
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

          {/* Top Bar with Author and Close */}
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

          {/* Story Body */}
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

          {/* Interactive Reactions */}
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

      {/* In-App WhatsApp-style Group Chat Modal */}
      <Modal visible={!!activeChatGroup} animationType="slide" transparent onRequestClose={() => setActiveChatGroup(null)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.chatOverlay}
        >
          <View style={styles.chatSheet}>
            {/* Group Chat Header */}
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
                  <Text style={styles.chatGroupSub}>{activeChatGroup?.category} Fellowship • Active</Text>
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

            {/* Message Stream */}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.chatMessagesScroll}>
              {chatMessages.map(msg => {
                const isMe = msg.sender_id === profile?.id;
                const canDelete = isMe || isAdmin || isDeveloper;
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

                      {/* Moderation / Message Owner Delete */}
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
                  </View>
                );
              })}
            </ScrollView>

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
                    <Ionicons name="book" size={18} color="#ffffff" />
                  </View>
                  <Text style={styles.attachmentTrayLabel}>Scripture</Text>
                </Pressable>
              </View>
            )}

            {/* Input Bar */}
            <View style={styles.chatInputBar}>
              <Pressable
                style={styles.attachBtn}
                onPress={() => setShowAttachmentTray(prev => !prev)}
              >
                <Ionicons
                  name={showAttachmentTray ? 'close-circle' : 'attach'}
                  size={22}
                  color={showAttachmentTray ? Colors.gold : Colors.textMuted}
                />
              </Pressable>
              <TextInput
                value={chatInput}
                onChangeText={setChatInput}
                placeholder="Message fellowship..."
                placeholderTextColor={Colors.textMuted}
                style={styles.chatTextInput}
              />
              <Pressable
                style={[styles.chatSendBtn, !chatInput.trim() && { opacity: 0.5 }]}
                onPress={() => handleSendChatMessage()}
                disabled={!chatInput.trim()}
              >
                <Ionicons name="send" size={16} color={Colors.textInverse} />
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Member Profile Modal */}
      <Modal visible={!!previewMember} animationType="slide" transparent onRequestClose={() => setPreviewMember(null)}>
        <View style={styles.profileModalOverlay}>
          <View style={styles.profileModalCard}>
            <Pressable onPress={() => setPreviewMember(null)} style={styles.profileModalCloseBtn}>
              <Ionicons name="close" size={22} color={Colors.textPrimary} />
            </Pressable>

            <View style={styles.profileModalAvatarWrap}>
              <Text style={styles.profileModalAvatarText}>{previewMember?.avatarText}</Text>
            </View>

            <Text style={styles.profileModalName}>{previewMember?.name}</Text>
            <Text style={styles.profileModalHandle}>{previewMember?.handle}</Text>

            <View style={styles.profileStatsRow}>
              <View style={styles.profileStatItem}>
                <Text style={styles.profileStatNum}>{previewMember?.testimoniesCount}</Text>
                <Text style={styles.profileStatLabel}>Posts</Text>
              </View>
              <View style={styles.profileStatItem}>
                <Text style={styles.profileStatNum}>{previewMember?.followersCount}</Text>
                <Text style={styles.profileStatLabel}>Followers</Text>
              </View>
              <View style={styles.profileStatItem}>
                <Text style={styles.profileStatNum}>{previewMember?.followingCount}</Text>
                <Text style={styles.profileStatLabel}>Following</Text>
              </View>
            </View>

            <Text style={styles.profileModalBio}>{previewMember?.bio}</Text>

            <View style={styles.profileModalActions}>
              <Pressable
                style={[styles.modalFollowBtn, previewMember && followedMembers[previewMember.id] && styles.modalFollowBtnActive]}
                onPress={() => previewMember && handleToggleFollow(previewMember.id)}
              >
                <Ionicons
                  name={previewMember && followedMembers[previewMember.id] ? 'checkmark' : 'person-add'}
                  size={15}
                  color={previewMember && followedMembers[previewMember.id] ? Colors.gold : Colors.textInverse}
                />
                <Text style={[styles.modalFollowBtnText, previewMember && followedMembers[previewMember.id] && { color: Colors.gold }]}>
                  {previewMember && followedMembers[previewMember.id] ? 'Following' : 'Follow'}
                </Text>
              </Pressable>

              <Pressable
                style={styles.modalMessageBtn}
                onPress={() => {
                  if (previewMember) {
                    handleOpenDirectChat(previewMember);
                  }
                }}
              >
                <Ionicons name="chatbubble-ellipses" size={15} color={Colors.gold} />
                <Text style={styles.modalMessageBtnText}>Message</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* 1-on-1 Private Direct Chat Modal */}
      <Modal visible={!!directChatMember} animationType="slide" transparent onRequestClose={() => setDirectChatMember(null)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.chatOverlay}
        >
          <View style={styles.chatSheet}>
            {/* Direct Chat Header */}
            <View style={styles.chatHeader}>
              <View style={styles.chatHeaderLeft}>
                <View style={[styles.chatAvatar, styles.directChatAvatar]}>
                  <Text style={styles.directChatAvatarText}>
                    {directChatMember?.avatarText || 'M'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.chatGroupName} numberOfLines={1}>{directChatMember?.name}</Text>
                  <Text style={styles.chatGroupSub}>{directChatMember?.role || directChatMember?.handle} • Private Chat</Text>
                </View>
              </View>
              <Pressable onPress={() => setDirectChatMember(null)} style={{ padding: 6 }}>
                <Ionicons name="close" size={22} color={Colors.textPrimary} />
              </Pressable>
            </View>

            {/* Direct Messages Stream */}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.chatMessagesScroll}>
              <View style={styles.directChatEncryptedBanner}>
                <Ionicons name="lock-closed" size={12} color={Colors.gold} />
                <Text style={styles.directChatEncryptedText}>
                  Private 1-on-1 conversation with {directChatMember?.name}
                </Text>
              </View>
              {(directChatMember ? (directMessages[directChatMember.id] || []) : []).map(msg => {
                const isMe = msg.sender === 'me';
                return (
                  <View
                    key={msg.id}
                    style={[styles.chatBubble, isMe ? styles.chatBubbleMe : styles.chatBubbleOther]}
                  >
                    <Text style={[styles.chatMsgText, isMe ? styles.chatMsgTextMe : styles.chatMsgTextOther]}>
                      {msg.text}
                    </Text>
                    <Text style={[styles.chatTimeText, isMe ? styles.chatTimeTextMe : styles.chatTimeTextOther]}>
                      {msg.time}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>

            {/* Input Bar */}
            <View style={styles.chatInputBar}>
              <TextInput
                value={directChatInput}
                onChangeText={setDirectChatInput}
                placeholder={`Message ${directChatMember?.name ? directChatMember.name.split(' ')[0] : 'member'}...`}
                placeholderTextColor={Colors.textMuted}
                style={styles.chatTextInput}
              />
              <Pressable
                style={[styles.chatSendBtn, !directChatInput.trim() && { opacity: 0.5 }]}
                onPress={handleSendDirectMessage}
                disabled={!directChatInput.trim()}
              >
                <Ionicons name="send" size={16} color={Colors.textInverse} />
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Post Testimony Modal */}
      <Modal visible={showShareModal} animationType="slide" transparent onRequestClose={() => setShowShareModal(false)}>
        <View style={styles.shareModalOverlay}>
          <View style={styles.shareModalCard}>
            <View style={styles.shareModalHeader}>
              <Text style={styles.shareModalTitle}>Share Testimony / Story</Text>
              <Pressable onPress={() => setShowShareModal(false)}>
                <Ionicons name="close" size={22} color={Colors.textPrimary} />
              </Pressable>
            </View>

            <TextInput
              value={postTitle}
              onChangeText={setPostTitle}
              placeholder="Title of what God did..."
              placeholderTextColor={Colors.textMuted}
              style={styles.shareInput}
            />
            <TextInput
              value={postBody}
              onChangeText={setPostBody}
              placeholder="Share the details to glorify Jesus and encourage the church..."
              placeholderTextColor={Colors.textMuted}
              multiline
              style={[styles.shareInput, { minHeight: 90, textAlignVertical: 'top' }]}
            />

            <Pressable style={styles.shareSubmitBtn} onPress={handleSavePost}>
              <Text style={styles.shareSubmitBtnText}>{postSaved ? 'Posted to Feed!' : 'Post Story'}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* WhatsApp Floating Action Button (FAB) (fallback if not registered at viewport root) */}
      {!onRegisterFabTrigger && (
        <Pressable
          style={styles.whatsappFab}
          onPress={() => setShowFabSheet(true)}
        >
          <Ionicons name="chatbubbles" size={24} color="#ffffff" />
          {totalUnread > 0 && (
            <View style={styles.fabBadge}>
              <Text style={styles.fabBadgeText}>{totalUnread > 99 ? '99+' : totalUnread}</Text>
            </View>
          )}
        </Pressable>
      )}

      {/* FAB Action Sheet Modal */}
      <Modal visible={showFabSheet} animationType="slide" transparent onRequestClose={() => setShowFabSheet(false)}>
        <View style={styles.fabSheetOverlay}>
          <Pressable style={styles.fabSheetBackdrop} onPress={() => setShowFabSheet(false)} />
          <View style={styles.fabSheetCard}>
            <View style={styles.fabSheetHandle} />
            <Text style={styles.fabSheetTitle}>Start a Conversation</Text>

            <Pressable
              style={styles.fabSheetItem}
              onPress={() => {
                setShowFabSheet(false);
                setPreviewMember(COMMUNITY_MEMBERS['Apostle Joe Daniels']);
              }}
            >
              <View style={[styles.fabSheetIconCircle, { backgroundColor: '#38bdf8' }]}>
                <Ionicons name="person-add" size={18} color="#ffffff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fabSheetItemTitle}>New Direct Chat</Text>
                <Text style={styles.fabSheetItemSub}>Message a leader or fellowship member</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </Pressable>

            <Pressable
              style={styles.fabSheetItem}
              onPress={() => {
                setShowFabSheet(false);
                if (isAdmin || isDeveloper) {
                  setShowCreateGroupModal(true);
                } else {
                  Alert.alert('Leader Access Required', 'Creating official church fellowship groups is reserved for pastors, ministers, and verified leaders.');
                }
              }}
            >
              <View style={[styles.fabSheetIconCircle, { backgroundColor: Colors.gold }]}>
                <Ionicons name="people" size={18} color="#ffffff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fabSheetItemTitle}>New Fellowship Group</Text>
                <Text style={styles.fabSheetItemSub}>
                  {isAdmin || isDeveloper ? 'Create open or covenant fellowship group' : 'Pastoral & Verified Leaders only'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </Pressable>

            <Pressable
              style={styles.fabSheetItem}
              onPress={() => {
                setShowFabSheet(false);
                setActiveSubTab('groups');
              }}
            >
              <View style={[styles.fabSheetIconCircle, { backgroundColor: '#10b981' }]}>
                <Ionicons name="compass-outline" size={18} color="#ffffff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fabSheetItemTitle}>Browse Fellowships</Text>
                <Text style={styles.fabSheetItemSub}>Explore active church fellowship channels</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Create Fellowship Group Modal */}
      <Modal visible={showCreateGroupModal} animationType="slide" transparent onRequestClose={() => setShowCreateGroupModal(false)}>
        <View style={styles.createGroupOverlay}>
          <View style={styles.createGroupCard}>
            <View style={styles.createGroupHeader}>
              <Text style={styles.createGroupTitle}>Create Fellowship Group</Text>
              <Pressable onPress={() => setShowCreateGroupModal(false)} style={{ padding: 4 }}>
                <Ionicons name="close" size={22} color={Colors.textPrimary} />
              </Pressable>
            </View>

            <TextInput
              value={newGroupName}
              onChangeText={setNewGroupName}
              placeholder="Group Name (e.g. Young Professionals Cell)"
              placeholderTextColor={Colors.textMuted}
              style={styles.createGroupInput}
            />

            <TextInput
              value={newGroupDesc}
              onChangeText={setNewGroupDesc}
              placeholder="Description of group purpose and schedule..."
              placeholderTextColor={Colors.textMuted}
              multiline
              style={[styles.createGroupInput, { minHeight: 70, textAlignVertical: 'top' }]}
            />

            <Text style={styles.createGroupSectionLabel}>Fellowship Ministry Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginVertical: 6 }}>
              {['Atmospheric Worship', 'Men of Valor', 'Women of Grace', 'Discipleship', 'Youth & Young Adults', 'Kingdom Mentorship'].map(cat => (
                <Pressable
                  key={cat}
                  style={[styles.categoryPill, newGroupCategory === cat && styles.categoryPillActive]}
                  onPress={() => setNewGroupCategory(cat)}
                >
                  <Text style={[styles.categoryPillText, newGroupCategory === cat && styles.categoryPillTextActive]}>{cat}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <Pressable
              style={styles.paidToggleRow}
              onPress={() => setNewGroupIsPaid(prev => !prev)}
            >
              <Ionicons name={newGroupIsPaid ? 'checkbox' : 'square-outline'} size={20} color={newGroupIsPaid ? Colors.gold : Colors.textMuted} />
              <View style={{ flex: 1 }}>
                <Text style={styles.paidToggleLabel}>Require Covenant Pass / Paid ($150)</Text>
                <Text style={styles.paidToggleSub}>Restrict group to approved curriculum students</Text>
              </View>
            </Pressable>

            <Pressable style={styles.createGroupSubmitBtn} onPress={handleCreateGroupSubmit}>
              <Text style={styles.createGroupSubmitText}>Launch Fellowship Group</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  eyebrow: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 8,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 18,
    marginTop: 1,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.gold,
    borderRadius: Radii.sm,
    paddingVertical: 6,
    paddingHorizontal: 11,
  },
  shareBtnText: {
    fontFamily: Typography.fontBold,
    color: Colors.textInverse,
    fontSize: 11,
  },
  storiesSection: {
    marginVertical: 4,
  },
  storiesScroll: {
    gap: 12,
  },
  storyItem: {
    alignItems: 'center',
    width: 66,
  },
  yourStoryRing: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  yourStoryAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#16161e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addStoryPlus: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyRing: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#0c1a14',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyAvatarText: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 13,
  },
  storyLabel: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.textPrimary,
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  },
  subTabRow: {
    flexDirection: 'row',
    backgroundColor: '#121216',
    borderRadius: Radii.sm,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  subTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 7,
    borderRadius: Radii.sm,
  },
  subTabBtnActive: {
    backgroundColor: Colors.gold,
  },
  subTabBtnText: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.textMuted,
    fontSize: 11,
  },
  subTabBtnTextActive: {
    color: Colors.textInverse,
  },
  feedList: {
    gap: 10,
  },
  feedCard: {
    backgroundColor: '#121216',
    borderRadius: Radii.md,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  authorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#18181f',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  authorAvatarText: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 11,
  },
  authorName: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 12,
  },
  postTime: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 9,
  },
  followBtn: {
    backgroundColor: '#1a1a22',
    borderRadius: Radii.sm,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  followBtnActive: {
    borderColor: Colors.gold,
    backgroundColor: 'rgba(217, 119, 6, 0.1)',
  },
  followBtnText: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 10,
  },
  followBtnTextActive: {
    color: Colors.gold,
  },
  postTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 14,
  },
  postBody: {
    fontFamily: Typography.fontRegular,
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  reactionsRow: {
    flexDirection: 'row',
    gap: 14,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#1a1a22',
  },
  reactionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reactionCount: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 11,
  },
  groupsList: {
    gap: 10,
  },
  groupCard: {
    backgroundColor: '#121216',
    borderRadius: Radii.md,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  groupTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  groupIconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radii.sm,
    backgroundColor: '#18181f',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  groupName: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 13,
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(217, 119, 6, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: Radii.sm,
  },
  paidBadgeText: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 8,
  },
  freeBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: Radii.sm,
  },
  freeBadgeText: {
    fontFamily: Typography.fontBold,
    color: Colors.success,
    fontSize: 8,
  },
  groupLocation: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 10,
  },
  groupDesc: {
    fontFamily: Typography.fontRegular,
    color: Colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },
  groupActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  chatActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: Colors.gold,
    borderRadius: Radii.sm,
    paddingVertical: 7,
  },
  chatActionBtnText: {
    fontFamily: Typography.fontBold,
    color: Colors.textInverse,
    fontSize: 11,
  },
  joinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#18181f',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.sm,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  joinedBtn: {
    borderColor: Colors.success,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  joinBtnText: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.gold,
    fontSize: 11,
  },
  joinedBtnText: {
    color: Colors.success,
  },
  eventsList: {
    gap: 8,
  },
  eventCard: {
    backgroundColor: '#121216',
    borderRadius: Radii.md,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  eventDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  eventDateText: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 11,
  },
  eventTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 14,
  },
  eventTime: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 11,
  },
  eventDesc: {
    fontFamily: Typography.fontRegular,
    color: Colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
  emptyCard: {
    backgroundColor: '#121216',
    borderRadius: Radii.md,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  emptyTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 14,
  },
  emptyBody: {
    fontFamily: Typography.fontRegular,
    color: Colors.textSecondary,
    fontSize: 11,
    textAlign: 'center',
  },
  storyViewerOverlay: {
    flex: 1,
    backgroundColor: '#000000',
    paddingTop: Platform.OS === 'ios' ? 44 : 24,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    paddingBottom: 36,
  },
  storyProgressTrack: {
    height: 2.5,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: Radii.full,
    overflow: 'hidden',
    marginBottom: 12,
  },
  storyProgressFill: {
    height: '100%',
    backgroundColor: '#ffffff',
  },
  storyViewerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  storyViewerAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  storyViewerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.forestGreen,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.gold,
  },
  storyViewerAvatarText: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 13,
  },
  storyViewerName: {
    fontFamily: Typography.fontBold,
    color: '#ffffff',
    fontSize: 13,
  },
  storyViewerTime: {
    fontFamily: Typography.fontRegular,
    color: 'rgba(255,255,255,0.65)',
    fontSize: 10,
  },
  storyViewerBody: {
    paddingHorizontal: 12,
  },
  storyViewerCaption: {
    fontFamily: Typography.fontBold,
    color: '#ffffff',
    fontSize: 18,
    lineHeight: 26,
    textAlign: 'center',
  },
  storyScriptureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: Radii.md,
    padding: 12,
    marginTop: 18,
  },
  storyScriptureText: {
    fontFamily: Typography.fontRegular,
    color: '#ffffff',
    fontSize: 12,
    flex: 1,
    fontStyle: 'italic',
  },
  storyReactionsBar: {
    alignItems: 'center',
  },
  storyEmojiBtn: {
    padding: 8,
  },
  chatOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  chatSheet: {
    backgroundColor: '#0c0c10',
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    paddingTop: 14,
    height: '85%',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  chatHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  chatAvatar: {
    width: 34,
    height: 34,
    borderRadius: Radii.sm,
    backgroundColor: '#18181f',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  chatGroupName: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 13,
  },
  chatGroupSub: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 10,
  },
  chatMessagesScroll: {
    padding: 14,
    gap: 10,
  },
  chatBubble: {
    maxWidth: '82%',
    padding: 10,
    borderRadius: Radii.md,
  },
  chatBubbleMe: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.forestGreen,
    borderBottomRightRadius: 2,
  },
  chatBubbleOther: {
    alignSelf: 'flex-start',
    backgroundColor: '#18181f',
    borderBottomLeftRadius: 2,
  },
  chatSenderName: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 10,
  },
  chatRolePill: {
    backgroundColor: 'rgba(217, 119, 6, 0.15)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: Radii.sm,
  },
  chatRoleText: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 8,
  },
  chatMsgText: {
    fontFamily: Typography.fontRegular,
    fontSize: 12,
    lineHeight: 17,
  },
  chatMsgTextMe: {
    color: '#ffffff',
  },
  chatMsgTextOther: {
    color: Colors.textPrimary,
  },
  chatTimeText: {
    fontFamily: Typography.fontRegular,
    fontSize: 8,
    marginTop: 4,
  },
  chatTimeTextMe: {
    color: 'rgba(255,255,255,0.6)',
    alignSelf: 'flex-end',
  },
  chatTimeTextOther: {
    color: Colors.textMuted,
    alignSelf: 'flex-end',
  },
  chatInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#121216',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  chatTextInput: {
    flex: 1,
    backgroundColor: '#18181f',
    borderRadius: Radii.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
    color: Colors.textPrimary,
    fontFamily: Typography.fontRegular,
    fontSize: 12,
  },
  chatSendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    padding: 24,
  },
  profileModalCard: {
    backgroundColor: '#121216',
    borderRadius: Radii.xl,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    position: 'relative',
    gap: 6,
  },
  profileModalCloseBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    padding: 4,
  },
  profileModalAvatarWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#0c1a14',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.gold,
    marginBottom: 4,
  },
  profileModalAvatarText: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 22,
  },
  profileModalName: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 16,
  },
  profileModalHandle: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 11,
  },
  profileStatsRow: {
    flexDirection: 'row',
    gap: 24,
    marginVertical: 10,
  },
  profileStatItem: {
    alignItems: 'center',
  },
  profileStatNum: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 14,
  },
  profileStatLabel: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 10,
  },
  profileModalBio: {
    fontFamily: Typography.fontRegular,
    color: Colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
  },
  profileModalActions: {
    width: '100%',
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  modalFollowBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.gold,
    borderRadius: Radii.sm,
    paddingVertical: 10,
  },
  modalFollowBtnActive: {
    backgroundColor: '#1a1a22',
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  modalFollowBtnText: {
    fontFamily: Typography.fontBold,
    color: Colors.textInverse,
    fontSize: 12,
  },
  modalMessageBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1a1a22',
    borderWidth: 1,
    borderColor: Colors.gold,
    borderRadius: Radii.sm,
    paddingVertical: 10,
  },
  modalMessageBtnText: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 12,
  },
  directChatAvatar: {
    backgroundColor: '#1a1a22',
    borderWidth: 1.5,
    borderColor: Colors.gold,
  },
  directChatAvatarText: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 13,
  },
  directChatEncryptedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(223,167,50,0.08)',
    borderRadius: Radii.sm,
    marginBottom: 12,
  },
  directChatEncryptedText: {
    fontFamily: Typography.fontRegular,
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  shareModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    padding: 20,
  },
  shareModalCard: {
    backgroundColor: '#121216',
    borderRadius: Radii.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  shareModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shareModalTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 15,
  },
  shareInput: {
    backgroundColor: '#18181f',
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: Colors.textPrimary,
    fontFamily: Typography.fontRegular,
    fontSize: 12,
  },
  shareSubmitBtn: {
    backgroundColor: Colors.gold,
    borderRadius: Radii.sm,
    paddingVertical: 11,
    alignItems: 'center',
  },
  shareSubmitBtnText: {
    fontFamily: Typography.fontBold,
    color: Colors.textInverse,
    fontSize: 12,
  },
  // WhatsApp Features & Moderation Styles
  ghostPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: '#6366f1',
  },
  ghostPillText: {
    fontFamily: Typography.fontBold,
    color: '#a5b4fc',
    fontSize: 9,
  },
  chatOptionsMenu: {
    backgroundColor: '#181820',
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    marginHorizontal: 12,
    marginBottom: 8,
    overflow: 'hidden',
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
  chatAttachmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.25)',
    padding: 8,
    borderRadius: Radii.sm,
    marginBottom: 6,
    borderLeftWidth: 3,
    borderLeftColor: Colors.gold,
  },
  chatAttachmentName: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.textPrimary,
    fontSize: 11,
  },
  chatAttachmentType: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 8,
    marginTop: 1,
  },
  chatMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 3,
  },
  attachBtn: {
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachmentTray: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#14141c',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  attachmentTrayItem: {
    alignItems: 'center',
    gap: 5,
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
  whatsappFab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#25D366',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    zIndex: 99,
  },
  fabBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  fabBadgeText: {
    fontFamily: Typography.fontBold,
    color: '#ffffff',
    fontSize: 9,
  },
  fabSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  fabSheetBackdrop: {
    flex: 1,
  },
  fabSheetCard: {
    backgroundColor: '#16161e',
    borderTopLeftRadius: Radii.lg,
    borderTopRightRadius: Radii.lg,
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  fabSheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 4,
  },
  fabSheetTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 16,
    marginBottom: 4,
  },
  fabSheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1c1c26',
    padding: 12,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  fabSheetIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabSheetItemTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 13,
  },
  fabSheetItemSub: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  createGroupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 20,
  },
  createGroupCard: {
    backgroundColor: '#16161e',
    borderRadius: Radii.lg,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  createGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  createGroupTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 16,
  },
  createGroupInput: {
    backgroundColor: '#1c1c26',
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.textPrimary,
    fontFamily: Typography.fontRegular,
    fontSize: 12,
  },
  createGroupSectionLabel: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  categoryPill: {
    backgroundColor: '#1c1c26',
    borderRadius: Radii.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryPillActive: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  categoryPillText: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.textMuted,
    fontSize: 10,
  },
  categoryPillTextActive: {
    color: Colors.textInverse,
    fontFamily: Typography.fontBold,
  },
  paidToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#1c1c26',
    padding: 10,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 4,
  },
  paidToggleLabel: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 11,
  },
  paidToggleSub: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 9,
    marginTop: 1,
  },
  createGroupSubmitBtn: {
    backgroundColor: Colors.gold,
    borderRadius: Radii.sm,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  createGroupSubmitText: {
    fontFamily: Typography.fontBold,
    color: Colors.textInverse,
    fontSize: 13,
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
    color: '#000000',
    fontSize: 9,
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
    marginVertical: 4,
  },
  devGhostIndicatorText: {
    fontFamily: Typography.fontSemiBold,
    color: '#a5b4fc',
    fontSize: 10,
  },
  chatActionBtnLocked: {
    backgroundColor: Colors.gold,
  },
  inviteLinkBtn: {
    width: 34,
    height: 34,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a22',
  },
});
