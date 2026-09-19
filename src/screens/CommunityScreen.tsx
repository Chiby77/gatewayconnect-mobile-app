import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Radii } from '../theme/colors';
import { MobileUser } from '../auth/authService';
import { saveTestimony, listContent } from '../data/contentRepository';
import { ContentItem } from '../types/domain';
import { getGroups, Group, isGroupMember, joinGroup, leaveGroup } from '../data/groupRepository';
import { getEvents, Event } from '../data/eventRepository';
import { trackEvent } from '../analytics/analyticsService';
import { SermonCard } from './SermonCard';
import { TestimonyCard } from './TestimonyCard';

interface CommunityScreenProps {
  profile: MobileUser | null;
}

export function CommunityScreen({ profile }: CommunityScreenProps) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [saved, setSaved] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [joinedGroups, setJoinedGroups] = useState<Record<string, boolean>>({});
  const [sermons, setSermons] = useState<ContentItem[]>([]);
  const [testimonies, setTestimonies] = useState<ContentItem[]>([]);
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    setGroups(getGroups());
    setSermons(listContent('sermon'));
    setTestimonies(listContent('post'));
    setEvents(getEvents());
    const gMap: Record<string, boolean> = {};
    getGroups().forEach(g => { gMap[g.id] = isGroupMember(g.id, profile?.id ?? ''); });
    setJoinedGroups(gMap);
  }, [profile]);

  const handleSaveTestimony = () => {
    if (!title.trim() || !body.trim()) return;
    saveTestimony(profile?.id ?? '', title.trim(), body.trim());
    setTitle(''); setBody(''); setSaved(true);
    trackEvent('testimony_saved');
    setTimeout(() => setSaved(false), 3000);
  };

  const handleJoinToggle = (groupId: string) => {
    if (joinedGroups[groupId]) {
      leaveGroup(groupId, profile?.id ?? '');
    } else {
      joinGroup(groupId, profile?.id ?? '');
    }
    setJoinedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };


  return (
    <>
      <Text style={styles.sectionTitle}>Community</Text>

      {/* Share testimony */}
      <View style={styles.card}>
        <Text style={styles.eyebrow}>CHURCH FEED</Text>
        <Text style={styles.cardTitle}>Share your testimony</Text>
        <Text style={styles.cardBody}>Your story is saved and will be shared when you reconnect.</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Title"
          placeholderTextColor={Colors.textMuted}
          style={styles.input}
        />
        <TextInput
          value={body}
          onChangeText={setBody}
          placeholder="Share a testimony or encouragement"
          placeholderTextColor={Colors.textMuted}
          style={[styles.input, styles.multiline]}
          multiline
        />
        <Pressable style={styles.btn} onPress={handleSaveTestimony}>
          <Ionicons name={saved ? 'checkmark-circle' : 'send'} size={14} color={Colors.textInverse} />
          <Text style={styles.btnText}>{saved ? 'Saved!' : 'Save testimony'}</Text>
        </Pressable>
      </View>

      {/* Testimonies feed */}
      {testimonies.length > 0 && (
        <>
          <Text style={styles.subTitle}>Testimonies</Text>
          {testimonies.map(t => (
            <TestimonyCard key={t.id} testimony={t} profile={profile} />
          ))}
        </>
      )}

      {/* Fellowship Groups */}
      <Text style={styles.subTitle}>Fellowship Groups</Text>
      {groups.length === 0 ? (
        <View style={styles.card}>
          <Text style={styles.cardBody}>No groups yet. Connect to the internet to load groups from your church.</Text>
        </View>
      ) : groups.map(group => (
        <View key={group.id} style={styles.card}>
          <Text style={styles.eyebrow}>GROUP</Text>
          <Text style={styles.cardTitle}>{group.name}</Text>
          {group.description ? <Text style={styles.cardBody}>{group.description}</Text> : null}
          <Pressable
            style={joinedGroups[group.id] ? styles.btnOutlineActive : styles.btn}
            onPress={() => handleJoinToggle(group.id)}
          >
            <Text style={joinedGroups[group.id] ? styles.btnOutlineActiveText : styles.btnText}>
              {joinedGroups[group.id] ? '✓ Joined' : 'Join Group'}
            </Text>
          </Pressable>
        </View>
      ))}

      {/* Sermons */}
      {sermons.length > 0 && (
        <>
          <Text style={styles.subTitle}>Sermons</Text>
          {sermons.map(s => <SermonCard key={s.id} sermon={s} />)}
        </>
      )}

      {/* Events */}
      <Text style={styles.subTitle}>Upcoming Events</Text>
      {events.length === 0 ? (
        <View style={styles.card}>
          <Text style={styles.cardBody}>No upcoming events right now. Connect to the internet to load new events.</Text>
        </View>
      ) : events.map(evt => (
        <View key={evt.id} style={styles.card}>
          <Text style={styles.eyebrow}>{evt.category?.toUpperCase() || 'EVENT'}</Text>
          <Text style={styles.cardTitle}>{evt.title}</Text>
          <View style={styles.eventMeta}>
            <Ionicons name="calendar-outline" size={13} color={Colors.textMuted} />
            <Text style={styles.metaText}>{evt.event_date} at {evt.event_time}</Text>
          </View>
          {evt.location ? (
            <View style={styles.eventMeta}>
              <Ionicons name="location-outline" size={13} color={Colors.textMuted} />
              <Text style={styles.metaText}>{evt.location}</Text>
            </View>
          ) : null}
          {evt.description ? <Text style={styles.cardBody}>{evt.description}</Text> : null}
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 26,
    marginTop: 8,
  },
  subTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 20,
    marginTop: 8,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 0,
  },
  eyebrow: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  cardTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 17,
  },
  cardBody: {
    fontFamily: Typography.fontRegular,
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 6,
  },
  input: {
    fontFamily: Typography.fontRegular,
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    color: Colors.textPrimary,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginTop: 12,
  },
  multiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  btn: {
    backgroundColor: Colors.gold,
    borderRadius: Radii.md,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignSelf: 'flex-start',
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btnText: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.textInverse,
    fontSize: 13,
  },
  btnOutlineActive: {
    borderWidth: 1.5,
    borderColor: Colors.success,
    borderRadius: Radii.md,
    paddingVertical: 11,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
    marginTop: 12,
    backgroundColor: 'rgba(34,197,94,0.1)',
  },
  btnOutlineActiveText: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.success,
    fontSize: 13,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  metaText: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 13,
  },
});
