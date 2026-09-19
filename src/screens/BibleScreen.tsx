import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { Colors, Typography, Radii } from '../theme/colors';
import { MobileUser } from '../auth/authService';
import { BibleRepository } from '../bible/bibleRepository';
import { ReadingPlanRepository, ActiveReadingPlan, ReadingPlan } from '../bible/readingPlanRepository';
import { BibleColor } from '../types/domain';
import {
  getSuppliedChapter,
  indexSuppliedTranslation,
  installSuppliedBibleDatabase,
  isSuppliedBibleInstalled,
  listSuppliedTranslations,
  searchSuppliedBible,
} from '../bible/suppliedBibleDatabase';

interface BibleScreenProps {
  profile: MobileUser | null;
}

const HIGHLIGHT_COLORS: Record<BibleColor, string> = {
  gold: Colors.highlightGold,
  emerald: Colors.highlightEmerald,
  blue: Colors.highlightBlue,
  rose: Colors.highlightRose,
};

export function BibleScreen({ profile }: BibleScreenProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ReturnType<typeof BibleRepository.search>>([]);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [highlights, setHighlights] = useState<Record<string, BibleColor>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [readingPlans, setReadingPlans] = useState<ReadingPlan[]>([]);
  const [activePlans, setActivePlans] = useState<ActiveReadingPlan[]>([]);
  const [selectedVerse, setSelectedVerse] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [suppliedBibleReady, setSuppliedBibleReady] = useState(false);
  const [suppliedTranslation, setSuppliedTranslation] = useState('eng_kjv');
  const [installProgress, setInstallProgress] = useState<number | null>(null);

  const coreChapter = BibleRepository.getChapter('kjv-core', 19, 23);
  const [suppliedChapter, setSuppliedChapter] = useState<ReturnType<typeof getSuppliedChapter>>([]);

  const activeVersion = suppliedBibleReady ? suppliedTranslation : 'kjv-core';
  const activeChapter = suppliedBibleReady && suppliedChapter.length > 0 ? suppliedChapter : coreChapter;

  useEffect(() => {
    void isSuppliedBibleInstalled().then(ready => {
      setSuppliedBibleReady(ready);
      if (ready) {
        const translations = listSuppliedTranslations();
        const preferred = translations.find(t => t.id === 'eng_kjv') || translations[0];
        if (preferred) {
          setSuppliedTranslation(preferred.id);
          indexSuppliedTranslation(preferred.id);
          setSuppliedChapter(getSuppliedChapter(preferred.id, 'PSA', 23));
        }
      }
    });
  }, []);

  useEffect(() => {
    setBookmarks(BibleRepository.listBookmarks(profile?.id || null));
    setHighlights(BibleRepository.getHighlights(profile?.id || null, activeVersion));
    setNotes(BibleRepository.getNotes(profile?.id || null, activeVersion));
    setReadingPlans(ReadingPlanRepository.getAvailablePlans());
    setActivePlans(ReadingPlanRepository.getActivePlans(profile?.id || null));
  }, [profile, activeVersion]);

  const search = (value: string) => {
    setQuery(value);
    setResults(suppliedBibleReady
      ? searchSuppliedBible(suppliedTranslation, value)
      : BibleRepository.search('kjv-core', value));
  };

  const handleVersePress = (reference: string) => {
    Alert.alert('Verse Options', reference, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: bookmarks.includes(reference) ? 'Remove Bookmark' : '★ Bookmark',
        onPress: () => {
          const isBookmarked = BibleRepository.toggleBookmark(profile?.id || null, activeVersion, reference);
          setBookmarks(isBookmarked ? [...bookmarks, reference] : bookmarks.filter(b => b !== reference));
        },
      },
      {
        text: '🎨 Highlight',
        onPress: () => {
          Alert.alert('Select Color', '', [
            { text: 'Gold', onPress: () => { BibleRepository.setHighlight(profile?.id || null, activeVersion, reference, 'gold'); setHighlights({ ...highlights, [reference]: 'gold' }); } },
            { text: 'Emerald', onPress: () => { BibleRepository.setHighlight(profile?.id || null, activeVersion, reference, 'emerald'); setHighlights({ ...highlights, [reference]: 'emerald' }); } },
            { text: 'Blue', onPress: () => { BibleRepository.setHighlight(profile?.id || null, activeVersion, reference, 'blue'); setHighlights({ ...highlights, [reference]: 'blue' }); } },
            { text: 'Rose', onPress: () => { BibleRepository.setHighlight(profile?.id || null, activeVersion, reference, 'rose'); setHighlights({ ...highlights, [reference]: 'rose' }); } },
            { text: 'Remove', style: 'destructive', onPress: () => { BibleRepository.deleteHighlight(profile?.id || null, activeVersion, reference); const h = { ...highlights }; delete h[reference]; setHighlights(h); } },
          ]);
        },
      },
      {
        text: '📝 Note',
        onPress: () => { setSelectedVerse(reference); setNoteText(notes[reference] || ''); },
      },
    ]);
  };

  const saveNoteForSelected = () => {
    if (selectedVerse) {
      if (noteText.trim() === '') {
        BibleRepository.deleteNote(profile?.id || null, activeVersion, selectedVerse);
        const newNotes = { ...notes }; delete newNotes[selectedVerse]; setNotes(newNotes);
      } else {
        BibleRepository.saveNote(profile?.id || null, activeVersion, selectedVerse, noteText);
        setNotes({ ...notes, [selectedVerse]: noteText });
      }
      setSelectedVerse(null); setNoteText('');
    }
  };

  const importSuppliedBible = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/octet-stream', copyToCacheDirectory: false });
    if (result.canceled || !result.assets[0]) return;
    setInstallProgress(0);
    await installSuppliedBibleDatabase(result.assets[0].uri, setInstallProgress);
    setSuppliedBibleReady(true);
    setInstallProgress(null);
    const translations = listSuppliedTranslations();
    const preferred = translations.find(t => t.id === 'eng_kjv') || translations[0];
    if (preferred) { setSuppliedTranslation(preferred.id); indexSuppliedTranslation(preferred.id); setSuppliedChapter(getSuppliedChapter(preferred.id, 'PSA', 23)); }
  };

  const startPlan = (planId: string) => {
    ReadingPlanRepository.startPlan(planId, profile?.id || null);
    setActivePlans(ReadingPlanRepository.getActivePlans(profile?.id || null));
  };

  const completePlanDay = (plan: ActiveReadingPlan) => {
    if (plan.current_day < plan.days_total) {
      ReadingPlanRepository.markDayComplete(plan.id, profile?.id || null, plan.current_day + 1);
      setActivePlans(ReadingPlanRepository.getActivePlans(profile?.id || null));
    }
  };

  return (
    <>
      {/* Header row */}
      <View style={styles.pageHeader}>
        <Text style={styles.sectionTitle}>Bible</Text>
        <View style={styles.versionPill}>
          <Ionicons name="book" size={12} color={Colors.success} />
          <Text style={styles.versionText}>
            {suppliedBibleReady ? suppliedTranslation.toUpperCase() : 'KJV'} • OFFLINE
          </Text>
        </View>
      </View>

      {/* Reading Plans */}
      <Text style={styles.subTitle}>Reading Plans</Text>
      {activePlans.length > 0 ? activePlans.map(plan => (
        <View key={plan.id} style={styles.card}>
          <Text style={styles.eyebrow}>ACTIVE PLAN • DAY {plan.current_day}/{plan.days_total}</Text>
          <Text style={styles.cardTitle}>{plan.title}</Text>
          <Text style={styles.cardBody}>{plan.description}</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${(plan.current_day / plan.days_total) * 100}%` }]} />
          </View>
          {plan.current_day < plan.days_total ? (
            <Pressable style={styles.btn} onPress={() => completePlanDay(plan)}>
              <Text style={styles.btnText}>Complete Day {plan.current_day + 1}</Text>
            </Pressable>
          ) : (
            <Text style={[styles.cardBody, { color: Colors.success }]}>Plan Complete! 🎉</Text>
          )}
        </View>
      )) : (
        <View style={styles.card}>
          <Text style={styles.eyebrow}>NO ACTIVE PLANS</Text>
          {readingPlans.map(plan => (
            <View key={plan.id} style={{ marginBottom: 16 }}>
              <Text style={styles.cardTitle}>{plan.title}</Text>
              <Text style={styles.cardBody}>{plan.description} ({plan.days_total} days)</Text>
              <Pressable style={styles.btnOutline} onPress={() => startPlan(plan.id)}>
                <Text style={styles.btnOutlineText}>Start Plan</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}

      {/* Expand library button */}
      {!suppliedBibleReady && (
        <Pressable style={styles.expandBtn} onPress={() => void importSuppliedBible()}>
          <Ionicons name="download-outline" size={16} color={Colors.gold} />
          <Text style={styles.expandBtnText}>
            {installProgress === null ? 'Expand Library — Install Full Bible (2.8 GB)' : `Installing ${installProgress}%...`}
          </Text>
        </Pressable>
      )}

      {/* Search */}
      <View style={styles.searchRow}>
        <Ionicons name="search" size={16} color={Colors.textMuted} style={styles.searchIcon} />
        <TextInput
          value={query}
          onChangeText={search}
          placeholder="Search the Bible..."
          placeholderTextColor={Colors.textMuted}
          style={styles.searchInput}
        />
      </View>

      {/* Results or default chapter */}
      {query ? (
        results.map(result => (
          <View key={`${result.reference}-${result.text}`} style={styles.resultCard}>
            <Text style={styles.eyebrow}>{result.reference}</Text>
            <Text style={styles.cardBody}>{result.text}</Text>
          </View>
        ))
      ) : (
        <View style={styles.chapterCard}>
          <Text style={styles.eyebrow}>PSALMS 23</Text>
          {activeChapter.map(verse => {
            const reference = `${verse.bookName} ${verse.chapter}:${verse.verse}`;
            const isBookmarked = bookmarks.includes(reference);
            const bgColor = highlights[reference] ? HIGHLIGHT_COLORS[highlights[reference]] : 'transparent';
            const hasNote = !!notes[reference];
            return (
              <View key={verse.verse} style={{ backgroundColor: bgColor, borderRadius: Radii.sm, paddingHorizontal: 4 }}>
                <Pressable onPress={() => handleVersePress(reference)} style={styles.verseRow}>
                  <Text style={styles.verseNum}>{verse.verse}</Text>
                  <Text style={styles.verseText}>{verse.text}</Text>
                  {isBookmarked && <Text style={{ color: Colors.gold, fontSize: 14 }}>★</Text>}
                </Pressable>
                {hasNote && (
                  <Text style={styles.noteInline}>📝 {notes[reference]}</Text>
                )}
              </View>
            );
          })}
          {selectedVerse && (
            <View style={{ marginTop: 16 }}>
              <Text style={styles.cardTitle}>Note for {selectedVerse}</Text>
              <TextInput
                value={noteText}
                onChangeText={setNoteText}
                placeholder="Add your note here..."
                placeholderTextColor={Colors.textMuted}
                style={[styles.noteInput]}
                multiline
              />
              <Pressable style={styles.btn} onPress={saveNoteForSelected}>
                <Text style={styles.btnText}>Save Note</Text>
              </Pressable>
            </View>
          )}
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 26,
  },
  subTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 20,
    marginTop: 8,
  },
  versionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  versionText: {
    fontFamily: Typography.fontBold,
    color: Colors.success,
    fontSize: 10,
    letterSpacing: 0.8,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  eyebrow: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 8,
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
  progressTrack: {
    height: 4,
    backgroundColor: Colors.bgSecondary,
    borderRadius: Radii.full,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.gold,
    borderRadius: Radii.full,
  },
  btn: {
    backgroundColor: Colors.gold,
    borderRadius: Radii.md,
    paddingVertical: 11,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
    marginTop: 14,
  },
  btnText: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.textInverse,
    fontSize: 13,
  },
  btnOutline: {
    borderWidth: 1.5,
    borderColor: Colors.gold,
    borderRadius: Radii.md,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  btnOutlineText: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.gold,
    fontSize: 13,
  },
  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.gold,
    borderRadius: Radii.md,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.goldMuted,
  },
  expandBtnText: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.gold,
    fontSize: 13,
    flex: 1,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    paddingHorizontal: 14,
    gap: 8,
  },
  searchIcon: { },
  searchInput: {
    flex: 1,
    fontFamily: Typography.fontRegular,
    color: Colors.textPrimary,
    paddingVertical: 13,
    fontSize: 15,
  },
  resultCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.md,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chapterCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  verseRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 8,
  },
  verseNum: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    width: 22,
    fontSize: 13,
    paddingTop: 2,
  },
  verseText: {
    fontFamily: Typography.fontRegular,
    color: Colors.textPrimary,
    flex: 1,
    fontSize: 16,
    lineHeight: 25,
  },
  noteInline: {
    fontFamily: Typography.fontRegular,
    color: Colors.textSecondary,
    fontSize: 12,
    fontStyle: 'italic',
    marginLeft: 34,
    marginBottom: 10,
    marginTop: -4,
  },
  noteInput: {
    fontFamily: Typography.fontRegular,
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    color: Colors.textPrimary,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
    marginTop: 10,
  },
});
