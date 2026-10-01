import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, ActivityIndicator, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Radii } from '../theme/colors';
import { listEvents, EventItem } from '../data/contentRepository';
import { MobileUser } from '../auth/authService';

interface EventScreenProps {
  onNavigateHome: () => void;
  profile?: MobileUser | null;
}

export function EventScreen({ onNavigateHome, profile }: EventScreenProps) {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const data = listEvents();
    setEvents(data);
    setLoading(false);
  }, []);

  const handleOpenMap = (location: string) => {
    Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(location)}`).catch(() => {});
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onNavigateHome} style={styles.backBtn} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <View>
          <Text style={styles.eyebrow}>BELIEVERS CALENDAR</Text>
          <Text style={styles.title}>Kingdom Events</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator size="large" color={Colors.gold} style={{ marginTop: 40 }} />
        ) : events.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No upcoming events</Text>
            <Text style={styles.emptyBody}>Check back soon for new services, conferences, and prayer rallies.</Text>
          </View>
        ) : (
          events.map(event => (
            <View key={event.id} style={styles.eventCard}>
              {event.banner_url ? (
                <Image source={{ uri: event.banner_url }} style={styles.bannerImage} resizeMode="cover" />
              ) : (
                <View style={styles.bannerPlaceholder}>
                  <Ionicons name="calendar" size={32} color={Colors.gold} />
                </View>
              )}
              <View style={styles.cardBody}>
                <View style={styles.headerRow}>
                  <View style={styles.dateBadge}>
                    <Text style={styles.dateMonth}>{new Date(event.event_date).toLocaleString('default', { month: 'short' }).toUpperCase()}</Text>
                    <Text style={styles.dateDay}>{new Date(event.event_date).getDate()}</Text>
                  </View>
                  <View style={styles.titleWrap}>
                    {event.category && (
                      <View style={styles.categoryPill}>
                        <Text style={styles.categoryText}>{event.category}</Text>
                      </View>
                    )}
                    <Text style={styles.eventTitle}>{event.title}</Text>
                  </View>
                </View>

                {event.description ? (
                  <Text style={styles.eventDesc} numberOfLines={3}>{event.description}</Text>
                ) : null}

                <View style={styles.infoRow}>
                  <Ionicons name="time-outline" size={16} color={Colors.textMuted} />
                  <Text style={styles.infoText}>{event.event_time}</Text>
                </View>
                
                <Pressable style={styles.infoRow} onPress={() => handleOpenMap(event.location)}>
                  <Ionicons name="location-outline" size={16} color={Colors.gold} />
                  <Text style={[styles.infoText, { color: Colors.gold, textDecorationLine: 'underline' }]}>{event.location}</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 16,
  },
  backBtn: {
    padding: 4,
  },
  eyebrow: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 22,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 18,
  },
  emptyBody: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  eventCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bannerImage: {
    width: '100%',
    height: 140,
  },
  bannerPlaceholder: {
    width: '100%',
    height: 100,
    backgroundColor: 'rgba(223, 167, 50, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    padding: 16,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  dateBadge: {
    backgroundColor: 'rgba(223, 167, 50, 0.15)',
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    minWidth: 50,
  },
  dateMonth: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 10,
  },
  dateDay: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 18,
  },
  titleWrap: {
    flex: 1,
    gap: 4,
  },
  categoryPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radii.full,
  },
  categoryText: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.textMuted,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  eventTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 18,
  },
  eventDesc: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontFamily: Typography.fontRegular,
    color: Colors.textPrimary,
    fontSize: 14,
    flex: 1,
  },
});
