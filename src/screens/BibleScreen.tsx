import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Radii } from '../theme/colors';
import { MobileUser } from '../auth/authService';
import { BibleRepository } from '../bible/bibleRepository';
import { ReadingPlanRepository, ActiveReadingPlan, ReadingPlan } from '../bible/readingPlanRepository';
import { BibleColor } from '../types/domain';
import { BIBLE_BOOKS, BibleBook, getChapterVerses, VerseItem } from '../data/bibleData';

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
  const [selectedBook, setSelectedBook] = useState<string>('Psalms');
  const [selectedChapter, setSelectedChapter] = useState<number>(23);
  const [showBookPicker, setShowBookPicker] = useState<boolean>(false);
  const [showChapterPicker, setShowChapterPicker] = useState<boolean>(false);
  const [testamentFilter, setTestamentFilter] = useState<'ALL' | 'OT' | 'NT'>('ALL');
  const [bookSearch, setBookSearch] = useState<string>('');
  const [showPlans, setShowPlans] = useState<boolean>(false);

  const [query, setQuery] = useState('');
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [highlights, setHighlights] = useState<Record<string, BibleColor>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [readingPlans, setReadingPlans] = useState<ReadingPlan[]>([]);
  const [activePlans, setActivePlans] = useState<ActiveReadingPlan[]>([]);
  const [selectedVerse, setSelectedVerse] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  const activeVersion = 'KJV';
  const currentVerses: VerseItem[] = getChapterVerses(selectedBook, selectedChapter);

  useEffect(() => {
    setBookmarks(BibleRepository.listBookmarks(profile?.id || null));
    setHighlights(BibleRepository.getHighlights(profile?.id || null, activeVersion));
    setNotes(BibleRepository.getNotes(profile?.id || null, activeVersion));
    setReadingPlans(ReadingPlanRepository.getAvailablePlans());
    setActivePlans(ReadingPlanRepository.getActivePlans(profile?.id || null));
  }, [profile]);

  const currentBookMeta = BIBLE_BOOKS.find(b => b.name === selectedBook) || BIBLE_BOOKS[18];

  const handleVersePress = (reference: string) => {
    Alert.alert('Verse Options', reference, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: bookmarks.includes(reference) ? '★ Remove Bookmark' : '★ Bookmark',
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
        text: '📝 Add Note',
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

  const filteredBooks = BIBLE_BOOKS.filter(b => {
    if (testamentFilter === 'OT' && b.testament !== 'OT') return false;
    if (testamentFilter === 'NT' && b.testament !== 'NT') return false;
    if (bookSearch.trim() && !b.name.toLowerCase().includes(bookSearch.toLowerCase())) return false;
    return true;
  });

  return (
    <View style={styles.container}>
      {/* Header row */}
      <View style={styles.pageHeader}>
        <View>
          <Text style={styles.sectionTitle}>Holy Bible</Text>
          <Text style={styles.sectionSubtitle}>Complete 66 Books • Sample Chapter Library</Text>
        </View>
        <View style={styles.versionPill}>
          <Ionicons name="shield-checkmark" size={12} color={Colors.success} />
          <Text style={styles.versionText}>KJV • OFFLINE</Text>
        </View>
      </View>

      {/* Book & Chapter Navigation Bar */}
      <View style={styles.navBar}>
        <Pressable style={styles.navSelectorBtn} onPress={() => setShowBookPicker(true)}>
          <Ionicons name="book-outline" size={15} color={Colors.gold} />
          <Text style={styles.navSelectorText}>{selectedBook}</Text>
          <Ionicons name="chevron-down" size={13} color={Colors.textMuted} />
        </Pressable>

        <Pressable style={styles.navSelectorBtn} onPress={() => setShowChapterPicker(true)}>
          <Text style={styles.navSelectorText}>Ch {selectedChapter}</Text>
          <Ionicons name="chevron-down" size={13} color={Colors.textMuted} />
        </Pressable>

        {/* Quick Prev / Next */}
        <View style={styles.prevNextRow}>
          <Pressable
            style={[styles.arrowBtn, selectedChapter <= 1 && styles.arrowBtnDisabled]}
            disabled={selectedChapter <= 1}
            onPress={() => setSelectedChapter(prev => Math.max(1, prev - 1))}
          >
            <Ionicons name="chevron-back" size={16} color={selectedChapter <= 1 ? Colors.textMuted : Colors.gold} />
          </Pressable>
          <Pressable
            style={[styles.arrowBtn, selectedChapter >= currentBookMeta.chaptersCount && styles.arrowBtnDisabled]}
            disabled={selectedChapter >= currentBookMeta.chaptersCount}
            onPress={() => setSelectedChapter(prev => Math.min(currentBookMeta.chaptersCount, prev + 1))}
          >
            <Ionicons name="chevron-forward" size={16} color={selectedChapter >= currentBookMeta.chaptersCount ? Colors.textMuted : Colors.gold} />
          </Pressable>
        </View>
      </View>

      {/* Collapsible Reading Plan Header */}
      <Pressable style={styles.plansToggleBanner} onPress={() => setShowPlans(!showPlans)}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="calendar-outline" size={14} color={Colors.gold} />
          <Text style={styles.plansToggleText}>
            {activePlans.length > 0
              ? `Reading Plan: Day ${activePlans[0].current_day}/${activePlans[0].days_total} Active`
              : 'Daily Reading Plans'}
          </Text>
        </View>
        <Ionicons name={showPlans ? 'chevron-up' : 'chevron-down'} size={14} color={Colors.textMuted} />
      </Pressable>

      {/* Collapsible Reading Plans Section */}
      {showPlans && (
        <View style={styles.plansSection}>
          {activePlans.length > 0 ? activePlans.map(plan => (
            <View key={plan.id} style={styles.planCard}>
              <Text style={styles.eyebrow}>ACTIVE PLAN • DAY {plan.current_day}/{plan.days_total}</Text>
              <Text style={styles.planTitle}>{plan.title}</Text>
              <Text style={styles.planBody}>{plan.description}</Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${(plan.current_day / plan.days_total) * 100}%` }]} />
              </View>
              {plan.current_day < plan.days_total ? (
                <Pressable style={styles.btnSmall} onPress={() => completePlanDay(plan)}>
                  <Text style={styles.btnSmallText}>Complete Day {plan.current_day + 1}</Text>
                </Pressable>
              ) : (
                <Text style={[styles.planBody, { color: Colors.success, marginTop: 4 }]}>Plan Complete! 🎉</Text>
              )}
            </View>
          )) : (
            <View style={styles.planCard}>
              <Text style={styles.eyebrow}>DAILY READING PLAN</Text>
              {readingPlans.slice(0, 1).map(plan => (
                <View key={plan.id}>
                  <Text style={styles.planTitle}>{plan.title}</Text>
                  <Text style={styles.planBody}>{plan.description} ({plan.days_total} days)</Text>
                  <Pressable style={styles.btnSmall} onPress={() => startPlan(plan.id)}>
                    <Text style={styles.btnSmallText}>Start Plan</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Search in Chapter */}
      <View style={styles.searchRow}>
        <Ionicons name="search" size={14} color={Colors.textMuted} style={styles.searchIcon} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={`Search in ${selectedBook} ${selectedChapter}...`}
          placeholderTextColor={Colors.textMuted}
          style={styles.searchInput}
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={14} color={Colors.textMuted} />
          </Pressable>
        )}
      </View>

      {/* Bible Chapter Verses Display */}
      <View style={styles.chapterCard}>
        <View style={styles.chapterHeader}>
          <Text style={styles.chapterTitle}>{selectedBook.toUpperCase()} {selectedChapter}</Text>
          <Text style={styles.chapterSub}>King James Version (KJV)</Text>
        </View>

        {currentVerses
          .filter(v => !query || v.text.toLowerCase().includes(query.toLowerCase()))
          .map(verse => {
            const reference = `${selectedBook} ${selectedChapter}:${verse.verse}`;
            const isBookmarked = bookmarks.includes(reference);
            const bgColor = highlights[reference] ? HIGHLIGHT_COLORS[highlights[reference]] : 'transparent';
            const hasNote = !!notes[reference];

            return (
              <View key={verse.verse} style={[styles.verseContainer, { backgroundColor: bgColor }]}>
                <Pressable onPress={() => handleVersePress(reference)} style={styles.verseRow}>
                  <Text style={styles.verseNum}>{verse.verse}</Text>
                  <Text style={styles.verseText}>{verse.text}</Text>
                  {isBookmarked && <Text style={{ color: Colors.gold, fontSize: 13, marginLeft: 4 }}>★</Text>}
                </Pressable>
                {hasNote && (
                  <View style={styles.noteBox}>
                    <Text style={styles.noteInline}>📝 {notes[reference]}</Text>
                  </View>
                )}
              </View>
            );
          })}

        {selectedVerse && (
          <View style={styles.noteEditSection}>
            <Text style={styles.noteSectionTitle}>Note for {selectedVerse}</Text>
            <TextInput
              value={noteText}
              onChangeText={setNoteText}
              placeholder="Add your personal revelation or study note..."
              placeholderTextColor={Colors.textMuted}
              style={styles.noteInput}
              multiline
            />
            <Pressable style={styles.btnSmall} onPress={saveNoteForSelected}>
              <Text style={styles.btnSmallText}>Save Note</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Book Picker Modal */}
      <Modal visible={showBookPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Book (66 Books)</Text>
              <Pressable onPress={() => setShowBookPicker(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={Colors.textPrimary} />
              </Pressable>
            </View>

            {/* Testament Filter */}
            <View style={styles.testamentRow}>
              {(['ALL', 'OT', 'NT'] as const).map(t => (
                <Pressable
                  key={t}
                  style={[styles.testamentChip, testamentFilter === t && styles.testamentChipActive]}
                  onPress={() => setTestamentFilter(t)}
                >
                  <Text style={[styles.testamentChipText, testamentFilter === t && styles.testamentChipTextActive]}>
                    {t === 'ALL' ? 'All (66)' : t === 'OT' ? 'Old Testament (39)' : 'New Testament (27)'}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Book Search Input */}
            <TextInput
              value={bookSearch}
              onChangeText={setBookSearch}
              placeholder="Search book name (e.g. Genesis, Matthew)..."
              placeholderTextColor={Colors.textMuted}
              style={styles.modalSearchInput}
            />

            <ScrollView style={{ maxHeight: 380 }}>
              <View style={styles.bookGrid}>
                {filteredBooks.map(b => (
                  <Pressable
                    key={b.name}
                    style={[styles.bookGridItem, selectedBook === b.name && styles.bookGridItemActive]}
                    onPress={() => {
                      setSelectedBook(b.name);
                      setSelectedChapter(1);
                      setShowBookPicker(false);
                      setShowChapterPicker(true);
                    }}
                  >
                    <Text style={[styles.bookGridItemText, selectedBook === b.name && styles.bookGridItemTextActive]}>
                      {b.name}
                    </Text>
                    <Text style={styles.bookChaptersBadge}>{b.chaptersCount} ch</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Chapter Picker Modal */}
      <Modal visible={showChapterPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedBook} — Select Chapter</Text>
              <Pressable onPress={() => setShowChapterPicker(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={Colors.textPrimary} />
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 380 }}>
              <View style={styles.chapterGrid}>
                {Array.from({ length: currentBookMeta.chaptersCount }, (_, i) => i + 1).map(ch => (
                  <Pressable
                    key={ch}
                    style={[styles.chapterGridItem, selectedChapter === ch && styles.chapterGridItemActive]}
                    onPress={() => {
                      setSelectedChapter(ch);
                      setShowChapterPicker(false);
                    }}
                  >
                    <Text style={[styles.chapterGridItemText, selectedChapter === ch && styles.chapterGridItemTextActive]}>
                      {ch}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  sectionTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 19,
  },
  sectionSubtitle: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: 1,
  },
  versionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#121216',
    borderRadius: Radii.full,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  versionText: {
    fontFamily: Typography.fontBold,
    color: Colors.success,
    fontSize: 9,
    letterSpacing: 0.8,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  navSelectorBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#121216',
    borderRadius: Radii.sm,
    paddingVertical: 9,
    paddingHorizontal: 11,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  navSelectorText: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 12,
  },
  prevNextRow: {
    flexDirection: 'row',
    gap: 5,
  },
  arrowBtn: {
    width: 34,
    height: 34,
    borderRadius: Radii.sm,
    backgroundColor: '#121216',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  arrowBtnDisabled: {
    opacity: 0.35,
  },
  plansToggleBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#121216',
    borderRadius: Radii.sm,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.25)',
  },
  plansToggleText: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.textSecondary,
    fontSize: 11,
  },
  plansSection: {
    marginTop: 2,
  },
  planCard: {
    backgroundColor: '#121216',
    borderRadius: Radii.sm,
    padding: 11,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  planTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 13,
  },
  planBody: {
    fontFamily: Typography.fontRegular,
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  eyebrow: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 8,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  progressTrack: {
    height: 4,
    backgroundColor: '#1c1c24',
    borderRadius: Radii.full,
    marginTop: 6,
    marginBottom: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.gold,
    borderRadius: Radii.full,
  },
  btnSmall: {
    backgroundColor: Colors.gold,
    borderRadius: Radii.sm,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  btnSmallText: {
    fontFamily: Typography.fontBold,
    color: Colors.textInverse,
    fontSize: 10,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121216',
    borderRadius: Radii.sm,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontFamily: Typography.fontRegular,
    color: Colors.textPrimary,
    fontSize: 12,
    paddingVertical: 7,
  },
  chapterCard: {
    backgroundColor: '#121216',
    borderRadius: Radii.md,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chapterHeader: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: 8,
    marginBottom: 10,
  },
  chapterTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 15,
    letterSpacing: 1.2,
  },
  chapterSub: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: 1,
  },
  verseContainer: {
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderRadius: Radii.sm,
    marginBottom: 2,
  },
  verseRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  verseNum: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 11,
    width: 22,
    marginTop: 2,
  },
  verseText: {
    fontFamily: Typography.fontRegular,
    color: Colors.textPrimary,
    fontSize: 14,
    lineHeight: 21,
    flex: 1,
  },
  noteBox: {
    backgroundColor: 'rgba(217, 119, 6, 0.08)',
    borderRadius: Radii.sm,
    padding: 6,
    marginTop: 4,
    marginLeft: 22,
    borderLeftWidth: 2,
    borderLeftColor: Colors.gold,
  },
  noteInline: {
    fontFamily: Typography.fontRegular,
    color: Colors.textSecondary,
    fontSize: 11,
  },
  noteEditSection: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  noteSectionTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 12,
    marginBottom: 6,
  },
  noteInput: {
    backgroundColor: '#18181f',
    borderRadius: Radii.sm,
    padding: 8,
    color: Colors.textPrimary,
    fontFamily: Typography.fontRegular,
    fontSize: 12,
    minHeight: 60,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#121216',
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    padding: 16,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 15,
  },
  closeBtn: {
    padding: 4,
  },
  testamentRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  testamentChip: {
    flex: 1,
    backgroundColor: '#18181f',
    borderRadius: Radii.full,
    paddingVertical: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  testamentChipActive: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  testamentChipText: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.textSecondary,
    fontSize: 10,
  },
  testamentChipTextActive: {
    color: Colors.textInverse,
  },
  modalSearchInput: {
    backgroundColor: '#18181f',
    borderRadius: Radii.sm,
    paddingHorizontal: 11,
    paddingVertical: 8,
    color: Colors.textPrimary,
    fontFamily: Typography.fontRegular,
    fontSize: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bookGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  bookGridItem: {
    width: '31%',
    backgroundColor: '#18181f',
    borderRadius: Radii.sm,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bookGridItemActive: {
    borderColor: Colors.gold,
    backgroundColor: 'rgba(217, 119, 6, 0.12)',
  },
  bookGridItemText: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 11,
    textAlign: 'center',
  },
  bookGridItemTextActive: {
    color: Colors.gold,
  },
  bookChaptersBadge: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 8,
    marginTop: 1,
  },
  chapterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chapterGridItem: {
    width: 44,
    height: 40,
    backgroundColor: '#18181f',
    borderRadius: Radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chapterGridItemActive: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  chapterGridItemText: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 12,
  },
  chapterGridItemTextActive: {
    color: Colors.textInverse,
  },
});
