import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Modal, Image, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Radii } from '../theme/colors';
import { MobileUser } from '../auth/authService';
import { saveTestimony, listContent } from '../data/contentRepository';
import { ContentItem } from '../types/domain';
import { getGroups, Group, isGroupMember, joinGroup, leaveGroup } from '../data/groupRepository';
import { getEvents, Event } from '../data/eventRepository';
import { trackEvent } from '../analytics/analyticsService';

interface CommunityScreenProps {
  profile: MobileUser | null;
  onRequestAuth?: (prompt?: string) => void;
}

interface ChurchStory {
  id: string;
  author: string;
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
}

const CHURCH_STORIES: ChurchStory[] = [
  {
    id: 'story_joe',
    author: 'Apostle Joe Daniels',
    role: 'Senior Pastor',
    avatarText: 'JD',
    caption: 'Great grace upon Gateway Church this Sunday! Expect unusual breakthroughs and open heavens as we enter into supernatural dominion.',
    scripture: 'Zechariah 4:6 • Not by might, nor by power, but by my Spirit, saith the LORD of hosts.',
    timeAgo: '2h ago',
  },
  {
    id: 'story_cynthia',
    author: 'Pastor Cynthia Daniels',
    role: 'Passion Women Ministry',
    avatarText: 'CD',
    caption: 'Women of Grace prayer breakfast was powerful this morning. Daughters of Zion, keep standing in faith for your families!',
    scripture: 'Proverbs 31:25 • Strength and honour are her clothing; and she shall rejoice in time to come.',
    timeAgo: '4h ago',
  },
  {
    id: 'story_worship',
    author: 'Gateway Praise & Worship',
    role: 'Music Ministry',
    avatarText: 'GW',
    caption: 'Rehearsing for Sunday Dominion Service! The sound of revival is already resounding in the sanctuary.',
    scripture: 'Psalm 150:6 • Let every thing that hath breath praise the LORD.',
    timeAgo: '6h ago',
  },
  {
    id: 'story_youth',
    author: 'Ignite Youth Fellowship',
    role: 'Youth Ministry',
    avatarText: 'IY',
    caption: 'Fire Friday was electric! Over 200 young adults gathered, passionate for Christ. Don’t miss next week!',
    scripture: '1 Timothy 4:12 • Let no man despise thy youth; but be thou an example of the believers.',
    timeAgo: '8h ago',
  },
  {
    id: 'story_missions',
    author: 'Global Missions Gateway',
    role: 'Outreach & Missions',
    avatarText: 'GM',
    caption: 'Food hampers and school supplies distributed to 150 families in Bulawayo rural outreach. Glory to God!',
    scripture: 'Matthew 25:40 • Inasmuch as ye have done it unto one of the least of these, ye have done it unto me.',
    timeAgo: '12h ago',
  },
];

const COMMUNITY_MEMBERS: Record<string, MemberProfilePreview> = {
  'Apostle Joe Daniels': {
    id: 'mem_joe',
    name: 'Apostle Joe Daniels',
    handle: '@apostle_joe',
    avatarText: 'JD',
    role: 'Senior Pastor & Overseer',
    campus: 'Harare Main Sanctuary',
    bio: 'Father, Teacher & Apostolic Overseer of Gateway Church International. Advancing kingdom dominion across the nations.',
    joinedYear: 'Founding Overseer',
    testimoniesCount: 42,
  },
  'Tinodaishe Chibi': {
    id: 'mem_tino',
    name: 'Tinodaishe Chibi',
    handle: '@tino_c',
    avatarText: 'TC',
    role: 'Covenant Partner & Media Lead',
    campus: 'Harare Main Campus',
    bio: 'Software Engineer & Tech Lead at BlueWave Technologies • Walking in supernatural wisdom and kingdom prosperity.',
    joinedYear: 'Member since 2021',
    testimoniesCount: 8,
  },
  'Sister Rutendo Moyo': {
    id: 'mem_rutendo',
    name: 'Sister Rutendo Moyo',
    handle: '@rutendo_m',
    avatarText: 'RM',
    role: 'Passion Ladies Deaconess',
    campus: 'Bulawayo Campus',
    bio: 'Saved by Grace, standing on the promises of God. Mother of 3, passionate about intercession and worship.',
    joinedYear: 'Member since 2023',
    testimoniesCount: 5,
  },
  'Brother Tendai Kondo': {
    id: 'mem_tendai',
    name: 'Brother Tendai Kondo',
    handle: '@tendai_k',
    avatarText: 'TK',
    role: 'Pride of Lions Men Fellowship',
    campus: 'Chitungwiza Branch',
    bio: 'Kingdom Entrepreneur & Deacon. Believing God for financial breakthrough and church building expansion.',
    joinedYear: 'Member since 2022',
    testimoniesCount: 4,
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

  // Stories Modal state
  const [activeStory, setActiveStory] = useState<ChurchStory | null>(null);

  // Profile Preview Modal state
  const [previewMember, setPreviewMember] = useState<MemberProfilePreview | null>(null);

  useEffect(() => {
    setGroups(getGroups());
    setTestimonies(listContent('post'));
    setEvents(getEvents());
    const gMap: Record<string, boolean> = {};
    getGroups().forEach(g => { gMap[g.id] = isGroupMember(g.id, profile?.id ?? ''); });
    setJoinedGroups(gMap);
  }, [profile]);

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

  const handleJoinToggle = (groupId: string) => {
    if (!profile) {
      if (onRequestAuth) {
        onRequestAuth('Sign in to join church fellowship groups and receive ministry updates.');
      } else {
        Alert.alert('Sign In Required', 'Please sign in to join fellowship groups.');
      }
      return;
    }
    if (joinedGroups[groupId]) {
      leaveGroup(groupId, profile.id);
    } else {
      joinGroup(groupId, profile.id);
    }
    setJoinedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const handleMessageMember = (member: MemberProfilePreview) => {
    if (!profile) {
      if (onRequestAuth) {
        onRequestAuth(`Sign in to send a private message to ${member.name}.`);
      } else {
        Alert.alert('Sign In Required', `Please sign in to send a direct message to ${member.name}.`);
      }
      return;
    }
    Alert.alert('Direct Message', `Opening direct messaging thread with ${member.name}...`);
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
      });
    }
  };

  return (
    <>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>FELLOWSHIP & GRACE</Text>
          <Text style={styles.title}>Community Hub</Text>
        </View>

        <Pressable style={styles.shareBtn} onPress={handleOpenShare}>
          <Ionicons name="add-circle" size={16} color={Colors.textInverse} />
          <Text style={styles.shareBtnText}>Share Story</Text>
        </Pressable>
      </View>

      {/* Stories Bar (WhatsApp / Instagram Style) */}
      <View style={styles.storiesSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storiesScroll}>
          {/* Your Story item */}
          <Pressable style={styles.storyItem} onPress={handleOpenShare}>
            <View style={styles.yourStoryRing}>
              <View style={styles.yourStoryAvatar}>
                <Ionicons name="person" size={22} color={Colors.gold} />
              </View>
              <View style={styles.addStoryPlus}>
                <Ionicons name="add" size={12} color="#ffffff" />
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
                {story.author.split(' ')[0]}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Sub Tabs: Feed vs Groups vs Events */}
      <View style={styles.subTabRow}>
        <Pressable
          style={[styles.subTabBtn, activeSubTab === 'feed' && styles.subTabBtnActive]}
          onPress={() => setActiveSubTab('feed')}
        >
          <Ionicons
            name="chatbubbles"
            size={14}
            color={activeSubTab === 'feed' ? Colors.gold : Colors.textMuted}
          />
          <Text style={[styles.subTabBtnText, activeSubTab === 'feed' && styles.subTabBtnTextActive]}>
            Church Feed
          </Text>
        </Pressable>

        <Pressable
          style={[styles.subTabBtn, activeSubTab === 'groups' && styles.subTabBtnActive]}
          onPress={() => setActiveSubTab('groups')}
        >
          <Ionicons
            name="people"
            size={14}
            color={activeSubTab === 'groups' ? Colors.gold : Colors.textMuted}
          />
          <Text style={[styles.subTabBtnText, activeSubTab === 'groups' && styles.subTabBtnTextActive]}>
            Groups ({groups.length})
          </Text>
        </Pressable>

        <Pressable
          style={[styles.subTabBtn, activeSubTab === 'events' && styles.subTabBtnActive]}
          onPress={() => setActiveSubTab('events')}
        >
          <Ionicons
            name="calendar"
            size={14}
            color={activeSubTab === 'events' ? Colors.gold : Colors.textMuted}
          />
          <Text style={[styles.subTabBtnText, activeSubTab === 'events' && styles.subTabBtnTextActive]}>
            Events ({events.length})
          </Text>
        </Pressable>
      </View>

      {/* FEED TAB */}
      {activeSubTab === 'feed' && (
        <View style={styles.feedContainer}>
          {/* Seeded and User Testimonies */}
          {testimonies.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="chatbubbles-outline" size={42} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>Be the first to share</Text>
              <Text style={styles.emptyBody}>
                Share how God has favored and restored you at Gateway Church.
              </Text>
              <Pressable style={styles.btnSmall} onPress={handleOpenShare}>
                <Text style={styles.btnSmallText}>Post a Testimony</Text>
              </Pressable>
            </View>
          ) : (
            testimonies.map(t => {
              const authorName = t.metadata?.author ? String(t.metadata.author) : 'Church Member';
              const campus = t.metadata?.campus ? String(t.metadata.campus) : 'Gateway Church';
              const initial = authorName.slice(0, 2).toUpperCase();

              return (
                <View key={t.id} style={styles.postCard}>
                  {/* Post Top Bar */}
                  <View style={styles.postHeader}>
                    <Pressable
                      style={styles.authorRow}
                      onPress={() => openMemberProfile(authorName)}
                    >
                      <View style={styles.postAvatar}>
                        <Text style={styles.postAvatarText}>{initial}</Text>
                      </View>
                      <View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Text style={styles.postAuthorName}>{authorName}</Text>
                          <Ionicons name="checkmark-circle" size={14} color={Colors.gold} />
                        </View>
                        <Text style={styles.postAuthorSub}>{campus} • Verified Member</Text>
                      </View>
                    </Pressable>

                    <Pressable
                      style={styles.viewProfileBtn}
                      onPress={() => openMemberProfile(authorName)}
                    >
                      <Text style={styles.viewProfileBtnText}>View Profile</Text>
                    </Pressable>
                  </View>

                  {/* Content */}
                  <Text style={styles.postTitle}>{t.title}</Text>
                  <Text style={styles.postBody}>{t.body}</Text>

                  {/* Actions (Like & Comments) */}
                  <View style={styles.postActions}>
                    <Pressable
                      style={styles.actionPill}
                      onPress={() => {
                        if (!profile) {
                          if (onRequestAuth) onRequestAuth('Sign in to like testimonies.');
                          else Alert.alert('Sign In Required', 'Sign in to like testimonies.');
                        } else {
                          Alert.alert('Blessed', 'You celebrated this testimony! 🙏');
                        }
                      }}
                    >
                      <Ionicons name="heart-outline" size={16} color={Colors.gold} />
                      <Text style={styles.actionPillText}>Amen (24)</Text>
                    </Pressable>

                    <Pressable
                      style={styles.actionPill}
                      onPress={() => {
                        if (!profile) {
                          if (onRequestAuth) onRequestAuth('Sign in to post comments.');
                          else Alert.alert('Sign In Required', 'Sign in to comment on testimonies.');
                        } else {
                          Alert.alert('Comments', 'Comments are enabled for authenticated members.');
                        }
                      }}
                    >
                      <Ionicons name="chatbubble-ellipses-outline" size={15} color={Colors.textMuted} />
                      <Text style={styles.actionPillText}>Comments (8)</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })
          )}
        </View>
      )}

      {/* GROUPS TAB */}
      {activeSubTab === 'groups' && (
        <View style={styles.feedContainer}>
          {groups.map(group => (
            <View key={group.id} style={styles.groupCard}>
              <View style={styles.groupHeader}>
                <View style={styles.groupIconWrap}>
                  <Ionicons name="people" size={24} color={Colors.gold} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.groupName}>{group.name}</Text>
                  {group.location ? (
                    <View style={styles.locationRow}>
                      <Ionicons name="location-outline" size={12} color={Colors.textMuted} />
                      <Text style={styles.groupLocation}>{group.location}</Text>
                    </View>
                  ) : null}
                </View>
              </View>

              {group.description ? (
                <Text style={styles.groupDesc}>{group.description}</Text>
              ) : null}

              <Pressable
                style={joinedGroups[group.id] ? styles.btnJoined : styles.btnJoin}
                onPress={() => handleJoinToggle(group.id)}
              >
                <Ionicons
                  name={joinedGroups[group.id] ? 'checkmark-circle' : 'person-add-outline'}
                  size={15}
                  color={joinedGroups[group.id] ? Colors.success : Colors.textInverse}
                />
                <Text style={joinedGroups[group.id] ? styles.btnJoinedText : styles.btnJoinText}>
                  {joinedGroups[group.id] ? '✓ Joined Fellowship' : 'Join Group'}
                </Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}

      {/* EVENTS TAB */}
      {activeSubTab === 'events' && (
        <View style={styles.feedContainer}>
          {events.map(ev => (
            <View key={ev.id} style={styles.eventCard}>
              <View style={styles.eventDateBadge}>
                <Text style={styles.eventDateText}>
                  {ev.event_date ? ev.event_date.slice(0, 10) : 'SUNDAY'}
                </Text>
                <Text style={styles.eventTimeText}>{ev.event_time || '09:00 AM'}</Text>
              </View>

              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.eventTitle}>{ev.title}</Text>
                {ev.location ? (
                  <View style={styles.locationRow}>
                    <Ionicons name="location" size={12} color={Colors.gold} />
                    <Text style={styles.eventLocation}>{ev.location}</Text>
                  </View>
                ) : null}
                {ev.description ? (
                  <Text style={styles.eventDesc} numberOfLines={2}>{ev.description}</Text>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Story Viewer Modal (IG / WhatsApp Full Screen Style) */}
      <Modal visible={!!activeStory} animationType="fade" transparent>
        <View style={styles.storyModalOverlay}>
          <View style={styles.storyModalSheet}>
            {/* Top Progress Indicator */}
            <View style={styles.storyProgressBar}>
              <View style={styles.storyProgressFill} />
            </View>

            {/* Story Author Header */}
            <View style={styles.storyAuthorHeader}>
              <View style={styles.storyAuthorInfo}>
                <View style={styles.storyAvatarMini}>
                  <Text style={styles.storyAvatarMiniText}>{activeStory?.avatarText}</Text>
                </View>
                <View>
                  <Text style={styles.storyAuthorName}>{activeStory?.author}</Text>
                  <Text style={styles.storyAuthorRole}>{activeStory?.role} • {activeStory?.timeAgo}</Text>
                </View>
              </View>
              <Pressable onPress={() => setActiveStory(null)} style={{ padding: 6 }}>
                <Ionicons name="close" size={24} color="#ffffff" />
              </Pressable>
            </View>

            {/* Story Main Body */}
            <View style={styles.storyContentWrap}>
              <View style={styles.storyScripturePill}>
                <Ionicons name="book" size={14} color={Colors.gold} />
                <Text style={styles.storyScriptureText}>{activeStory?.scripture}</Text>
              </View>

              <Text style={styles.storyCaption}>{activeStory?.caption}</Text>
            </View>

            {/* Bottom Interaction */}
            <View style={styles.storyBottomBar}>
              <Pressable
                style={styles.storyReplyInput}
                onPress={() => {
                  if (!profile) {
                    setActiveStory(null);
                    if (onRequestAuth) onRequestAuth('Sign in to reply to church stories.');
                    else Alert.alert('Sign In Required', 'Sign in to reply to stories.');
                  } else {
                    Alert.alert('Story Reply', `Sent encouraging message to ${activeStory?.author}! 🙏`);
                    setActiveStory(null);
                  }
                }}
              >
                <Text style={styles.storyReplyInputText}>Send encouraging reply...</Text>
              </Pressable>

              <Pressable
                style={styles.storyHeartBtn}
                onPress={() => Alert.alert('Amen', 'Blessed by this word! 🔥')}
              >
                <Ionicons name="heart" size={26} color={Colors.gold} />
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Member Profile Preview Modal (Viewable by Guest and Members) */}
      <Modal visible={!!previewMember} animationType="slide" transparent>
        <View style={styles.profileModalOverlay}>
          <View style={styles.profileModalSheet}>
            <View style={styles.profileModalHeader}>
              <Text style={styles.profileModalEyebrow}>CHURCH MEMBER PROFILE</Text>
              <Pressable onPress={() => setPreviewMember(null)} style={{ padding: 4 }}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </Pressable>
            </View>

            {/* Avatar & Identifiers */}
            <View style={styles.memberProfileTop}>
              <View style={styles.memberLargeAvatar}>
                <Text style={styles.memberLargeAvatarText}>{previewMember?.avatarText}</Text>
              </View>
              <Text style={styles.memberLargeName}>{previewMember?.name}</Text>
              <Text style={styles.memberHandle}>{previewMember?.handle}</Text>
              <View style={styles.memberRoleBadge}>
                <Ionicons name="ribbon" size={12} color={Colors.gold} />
                <Text style={styles.memberRoleBadgeText}>{previewMember?.role}</Text>
              </View>
            </View>

            {/* Details */}
            <View style={styles.memberDetailsBox}>
              <View style={styles.detailRow}>
                <Ionicons name="location-outline" size={16} color={Colors.gold} />
                <Text style={styles.detailText}>{previewMember?.campus}</Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="calendar-outline" size={16} color={Colors.gold} />
                <Text style={styles.detailText}>{previewMember?.joinedYear}</Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="chatbubbles-outline" size={16} color={Colors.gold} />
                <Text style={styles.detailText}>{previewMember?.testimoniesCount} Testimonies Shared</Text>
              </View>
              <Text style={styles.memberBioText}>{previewMember?.bio}</Text>
            </View>

            {/* Message Action Button */}
            <Pressable
              style={styles.memberMessageBtn}
              onPress={() => previewMember && handleMessageMember(previewMember)}
            >
              <Ionicons name="mail" size={16} color={Colors.textInverse} />
              <Text style={styles.memberMessageBtnText}>Send Message to {previewMember?.name.split(' ')[0]}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Share Testimony Modal */}
      <Modal visible={showShareModal} animationType="slide" transparent>
        <View style={styles.profileModalOverlay}>
          <View style={styles.profileModalSheet}>
            <View style={styles.profileModalHeader}>
              <Text style={styles.profileModalEyebrow}>POST TO CHURCH FEED</Text>
              <Pressable onPress={() => setShowShareModal(false)} style={{ padding: 4 }}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </Pressable>
            </View>

            <Text style={styles.modalSheetTitle}>Share Your Testimony</Text>
            <Text style={styles.modalSheetSub}>
              Inspire the saints across Harare, Zimbabwe, and the nations.
            </Text>

            <TextInput
              value={postTitle}
              onChangeText={setPostTitle}
              placeholder="Testimony Title (e.g. Healed from Migraines)"
              placeholderTextColor={Colors.textMuted}
              style={styles.modalInput}
            />

            <TextInput
              value={postBody}
              onChangeText={setPostBody}
              placeholder="Describe what God has done..."
              placeholderTextColor={Colors.textMuted}
              style={[styles.modalInput, { height: 110, textAlignVertical: 'top' }]}
              multiline
            />

            <Pressable
              style={[styles.modalSubmitBtn, postSaved && { backgroundColor: Colors.success }]}
              onPress={handleSavePost}
            >
              <Ionicons name={postSaved ? 'checkmark-circle' : 'send'} size={16} color={Colors.textInverse} />
              <Text style={styles.modalSubmitBtnText}>
                {postSaved ? 'Published to Church Feed!' : 'Post Testimony'}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  eyebrow: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 10,
    letterSpacing: 1.4,
  },
  title: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 22,
    marginTop: 2,
  },
  shareBtn: {
    backgroundColor: Colors.gold,
    borderRadius: Radii.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  shareBtnText: {
    fontFamily: Typography.fontBold,
    color: Colors.textInverse,
    fontSize: 12,
  },
  storiesSection: {
    marginVertical: 10,
  },
  storiesScroll: {
    gap: 14,
    paddingVertical: 4,
  },
  storyItem: {
    alignItems: 'center',
    width: 64,
  },
  yourStoryRing: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 2,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  yourStoryAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addStoryPlus: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.bg,
  },
  storyRing: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    borderColor: Colors.gold,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.forestGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyAvatarText: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 14,
  },
  storyLabel: {
    fontFamily: Typography.fontRegular,
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },
  subTabRow: {
    flexDirection: 'row',
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    padding: 4,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  subTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: Radii.md,
  },
  subTabBtnActive: {
    backgroundColor: Colors.forestGreen,
  },
  subTabBtnText: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.textMuted,
    fontSize: 12,
  },
  subTabBtnTextActive: {
    color: Colors.gold,
  },
  feedContainer: {
    gap: 14,
    paddingBottom: 24,
  },
  postCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  postAvatar: {
    width: 38,
    height: 38,
    borderRadius: Radii.full,
    backgroundColor: Colors.forestGreen,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  postAvatarText: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 13,
  },
  postAuthorName: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 14,
  },
  postAuthorSub: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 11,
  },
  viewProfileBtn: {
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.full,
  },
  viewProfileBtnText: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.gold,
    fontSize: 11,
  },
  postTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 16,
    lineHeight: 22,
  },
  postBody: {
    fontFamily: Typography.fontRegular,
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  postActions: {
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 10,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.bg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.full,
  },
  actionPillText: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.textSecondary,
    fontSize: 11,
  },
  groupCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  groupIconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radii.md,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  groupName: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 15,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  groupLocation: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 11,
  },
  groupDesc: {
    fontFamily: Typography.fontRegular,
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  btnJoin: {
    backgroundColor: Colors.gold,
    borderRadius: Radii.md,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  btnJoinText: {
    fontFamily: Typography.fontBold,
    color: Colors.textInverse,
    fontSize: 13,
  },
  btnJoined: {
    backgroundColor: 'rgba(16,185,129,0.12)',
    borderWidth: 1,
    borderColor: Colors.success,
    borderRadius: Radii.md,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  btnJoinedText: {
    fontFamily: Typography.fontBold,
    color: Colors.success,
    fontSize: 13,
  },
  eventCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    gap: 14,
  },
  eventDateBadge: {
    backgroundColor: Colors.forestGreen,
    borderRadius: Radii.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.gold,
    minWidth: 70,
  },
  eventDateText: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 11,
  },
  eventTimeText: {
    fontFamily: Typography.fontRegular,
    color: Colors.textInverse,
    fontSize: 10,
    marginTop: 2,
  },
  eventTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 15,
  },
  eventLocation: {
    fontFamily: Typography.fontRegular,
    color: Colors.gold,
    fontSize: 11,
  },
  eventDesc: {
    fontFamily: Typography.fontRegular,
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  storyModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
  },
  storyModalSheet: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 50 : 36,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    paddingBottom: 30,
  },
  storyProgressBar: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 16,
  },
  storyProgressFill: {
    height: '100%',
    width: '75%',
    backgroundColor: Colors.gold,
  },
  storyAuthorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  storyAuthorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  storyAvatarMini: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.forestGreen,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  storyAvatarMiniText: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 12,
  },
  storyAuthorName: {
    fontFamily: Typography.fontBold,
    color: '#ffffff',
    fontSize: 14,
  },
  storyAuthorRole: {
    fontFamily: Typography.fontRegular,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
  },
  storyContentWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 20,
  },
  storyScripturePill: {
    backgroundColor: 'rgba(245,158,11,0.18)',
    borderWidth: 1,
    borderColor: Colors.gold,
    borderRadius: Radii.full,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  storyScriptureText: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.gold,
    fontSize: 12,
    textAlign: 'center',
  },
  storyCaption: {
    fontFamily: Typography.fontRegular,
    color: '#ffffff',
    fontSize: 18,
    lineHeight: 28,
    textAlign: 'center',
  },
  storyBottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  storyReplyInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: Radii.full,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  storyReplyInputText: {
    fontFamily: Typography.fontRegular,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
  },
  storyHeartBtn: {
    padding: 6,
  },
  profileModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  profileModalSheet: {
    backgroundColor: Colors.bgCard,
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    padding: 22,
    maxHeight: '88%',
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  profileModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  profileModalEyebrow: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 10,
    letterSpacing: 1.2,
  },
  memberProfileTop: {
    alignItems: 'center',
    gap: 6,
    marginVertical: 10,
  },
  memberLargeAvatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.forestGreen,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.gold,
  },
  memberLargeAvatarText: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 22,
  },
  memberLargeName: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 18,
  },
  memberHandle: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 13,
  },
  memberRoleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245,158,11,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.full,
    borderWidth: 0.5,
    borderColor: Colors.gold,
    marginTop: 4,
  },
  memberRoleBadgeText: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 11,
  },
  memberDetailsBox: {
    backgroundColor: Colors.bg,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginVertical: 12,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontFamily: Typography.fontRegular,
    color: Colors.textSecondary,
    fontSize: 12,
  },
  memberBioText: {
    fontFamily: Typography.fontRegular,
    color: Colors.textPrimary,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 8,
  },
  memberMessageBtn: {
    backgroundColor: Colors.gold,
    borderRadius: Radii.md,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  memberMessageBtnText: {
    fontFamily: Typography.fontBold,
    color: Colors.textInverse,
    fontSize: 14,
  },
  modalSheetTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 18,
  },
  modalSheetSub: {
    fontFamily: Typography.fontRegular,
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
    marginBottom: 14,
  },
  modalInput: {
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.textPrimary,
    fontFamily: Typography.fontRegular,
    fontSize: 14,
    marginBottom: 12,
  },
  modalSubmitBtn: {
    backgroundColor: Colors.gold,
    borderRadius: Radii.md,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  modalSubmitBtnText: {
    fontFamily: Typography.fontBold,
    color: Colors.textInverse,
    fontSize: 14,
  },
  emptyCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    padding: 32,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginVertical: 12,
  },
  emptyTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 16,
  },
  emptyBody: {
    fontFamily: Typography.fontRegular,
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
  },
  btnSmall: {
    backgroundColor: Colors.gold,
    borderRadius: Radii.md,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 8,
  },
  btnSmallText: {
    fontFamily: Typography.fontBold,
    color: Colors.textInverse,
    fontSize: 12,
  },
});
