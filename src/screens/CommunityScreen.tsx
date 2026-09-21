import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Modal, Alert, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Radii } from '../theme/colors';
import { MobileUser } from '../auth/authService';
import { saveTestimony, listContent } from '../data/contentRepository';
import { ContentItem } from '../types/domain';
import { getGroups, Group, isGroupMember, joinGroup, leaveGroup, getGroupMessages, sendGroupMessage, GroupChatMessage } from '../data/groupRepository';
import { getEvents, Event } from '../data/eventRepository';
import { trackEvent } from '../analytics/analyticsService';

interface CommunityScreenProps {
  profile: MobileUser | null;
  onRequestAuth?: (prompt?: string) => void;
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

export function CommunityScreen({ profile, onRequestAuth }: CommunityScreenProps) {
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

  useEffect(() => {
    setGroups(getGroups());
    setTestimonies(listContent('post'));
    setEvents(getEvents());
    const gMap: Record<string, boolean> = {};
    getGroups().forEach(g => { gMap[g.id] = isGroupMember(g.id, profile?.id ?? ''); });
    setJoinedGroups(gMap);
  }, [profile]);

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

    setActiveChatGroup(group);
    setChatMessages(getGroupMessages(group.id));
    setChatInput('');
  };

  const handleSendChatMessage = () => {
    if (!activeChatGroup || !chatInput.trim() || !profile) return;
    const newMsg = sendGroupMessage(
      activeChatGroup.id,
      profile.id,
      profile.name || 'Member',
      chatInput.trim()
    );
    setChatMessages(prev => [...prev, newMsg]);
    setChatInput('');
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
            return (
              <View key={group.id} style={styles.groupCard}>
                <View style={styles.groupTopRow}>
                  <View style={styles.groupIconWrap}>
                    <Ionicons
                      name={group.is_paid ? 'school' : 'people'}
                      size={20}
                      color={group.is_paid ? Colors.gold : Colors.textPrimary}
                    />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.groupName}>{group.name}</Text>
                      {group.is_paid ? (
                        <View style={styles.paidBadge}>
                          <Ionicons name="star" size={9} color={Colors.gold} />
                          <Text style={styles.paidBadgeText}>PREMIUM ($150)</Text>
                        </View>
                      ) : (
                        <View style={styles.freeBadge}>
                          <Text style={styles.freeBadgeText}>FREE</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.groupLocation}>{group.location || 'Harare Central'}</Text>
                  </View>
                </View>

                <Text style={styles.groupDesc}>{group.description}</Text>

                <View style={styles.groupActionsRow}>
                  <Pressable
                    style={styles.chatActionBtn}
                    onPress={() => openGroupChat(group)}
                  >
                    <Ionicons name="chatbubbles" size={14} color={Colors.textInverse} />
                    <Text style={styles.chatActionBtnText}>Open Chat</Text>
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
                  <Text style={styles.chatGroupName} numberOfLines={1}>{activeChatGroup?.name}</Text>
                  <Text style={styles.chatGroupSub}>{activeChatGroup?.category} Fellowship • Active</Text>
                </View>
              </View>
              <Pressable onPress={() => setActiveChatGroup(null)} style={{ padding: 6 }}>
                <Ionicons name="close" size={22} color={Colors.textPrimary} />
              </Pressable>
            </View>

            {/* Message Stream */}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.chatMessagesScroll}>
              {chatMessages.map(msg => {
                const isMe = msg.sender_id === profile?.id;
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
                    <Text style={[styles.chatMsgText, isMe ? styles.chatMsgTextMe : styles.chatMsgTextOther]}>
                      {msg.text}
                    </Text>
                    <Text style={[styles.chatTimeText, isMe ? styles.chatTimeTextMe : styles.chatTimeTextOther]}>
                      {msg.created_at}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>

            {/* Input Bar */}
            <View style={styles.chatInputBar}>
              <TextInput
                value={chatInput}
                onChangeText={setChatInput}
                placeholder="Message fellowship..."
                placeholderTextColor={Colors.textMuted}
                style={styles.chatTextInput}
              />
              <Pressable
                style={[styles.chatSendBtn, !chatInput.trim() && { opacity: 0.5 }]}
                onPress={handleSendChatMessage}
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
                  color={Colors.textInverse}
                />
                <Text style={styles.modalFollowBtnText}>
                  {previewMember && followedMembers[previewMember.id] ? 'Following' : 'Follow'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
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
    marginTop: 10,
  },
  modalFollowBtn: {
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
});
