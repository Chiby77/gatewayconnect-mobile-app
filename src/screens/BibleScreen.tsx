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

  const currentBookMeta = BIBLE_BOOKS.find(b => b.name === selectedBook) || BIBLE_BOOKS[18]; // Psalms default

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
    <>
      {/* Header row */}
      <View style={styles.pageHeader}>
        <Text style={styles.sectionTitle}>Bible</Text>
        <View style={styles.versionPill}>
          <Ionicons name="book" size={12} color={Colors.success} />
          <Text style={styles.versionText}>KJV • OFFLINE</Text>
        </View>
      </View>

      {/* Book & Chapter Navigation Bar */}
      <View style={styles.navBar}>
        <Pressable style={styles.navSelectorBtn} onPress={() => setShowBookPicker(true)}>
          <Ionicons name="book-outline" size={16} color={Colors.gold} />
          <Text style={styles.navSelectorText}>{selectedBook}</Text>
          <Ionicons name="chevron-down" size={14} color={Colors.textMuted} />
        </Pressable>

        <Pressable style={styles.navSelectorBtn} onPress={() => setShowChapterPicker(true)}>
          <Text style={styles.navSelectorText}>Chapter {selectedChapter}</Text>
          <Ionicons name="chevron-down" size={14} color={Colors.textMuted} />
        </Pressable>

        {/* Quick Prev / Next */}
        <View style={styles.prevNextRow}>
          <Pressable
            style={[styles.arrowBtn, selectedChapter <= 1 && styles.arrowBtnDisabled]}
            disabled={selectedChapter <= 1}
            onPress={() => setSelectedChapter(prev => Math.max(1, prev - 1))}
          >
            <Ionicons name="chevron-back" size={18} color={selectedChapter <= 1 ? Colors.textMuted : Colors.gold} />
          </Pressable>
          <Pressable
            style={[styles.arrowBtn, selectedChapter >= currentBookMeta.chaptersCount && styles.arrowBtnDisabled]}
            disabled={selectedChapter >= currentBookMeta.chaptersCount}
            onPress={() => setSelectedChapter(prev => Math.min(currentBookMeta.chaptersCount, prev + 1))}
          >
            <Ionicons name="chevron-forward" size={18} color={selectedChapter >= currentBookMeta.chaptersCount ? Colors.textMuted : Colors.gold} />
          </Pressable>
        </View>
      </View>

      {/* Reading Plans Section */}
      <View style={styles.plansSection}>
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
              <Text style={[styles.cardBody, { color: Colors.success, marginTop: 8 }]}>Plan Complete! 🎉</Text>
            )}
          </View>
        )) : (
          <View style={styles.card}>
            <Text style={styles.eyebrow}>DAILY READING PLAN</Text>
            {readingPlans.slice(0, 1).map(plan => (
              <View key={plan.id}>
                <Text style={styles.cardTitle}>{plan.title}</Text>
                <Text style={styles.cardBody}>{plan.description} ({plan.days_total} days)</Text>
                <Pressable style={styles.btnOutline} onPress={() => startPlan(plan.id)}>
                  <Text style={styles.btnOutlineText}>Start Plan</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Search in Chapter */}
      <View style={styles.searchRow}>
        <Ionicons name="search" size={16} color={Colors.textMuted} style={styles.searchIcon} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={`Search in ${selectedBook}...`}
          placeholderTextColor={Colors.textMuted}
          style={styles.searchInput}
        />
      </View>

      {/* Bible Chapter Verses Display */}
      <View style={styles.chapterCard}>
        <View style={styles.chapterHeader}>
          <Text style={styles.chapterTitle}>{selectedBook.toUpperCase()} {selectedChapter}</Text>
          <Text style={styles.chapterSub}>King James Version</Text>
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
                  {isBookmarked && <Text style={{ color: Colors.gold, fontSize: 14 }}>★</Text>}
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
            <Text style={styles.cardTitle}>Note for {selectedVerse}</Text>
            <TextInput
              value={noteText}
              onChangeText={setNoteText}
              placeholder="Add your reflection or pastor note..."
              placeholderTextColor={Colors.textMuted}
              style={styles.noteInput}
              multiline
            />
            <Pressable style={styles.btn} onPress={saveNoteForSelected}>
              <Text style={styles.btnText}>Save Note</Text>
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
                <Ionicons name="close" size={22} color={Colors.textPrimary} />
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
              placeholder="Search book name..."
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
                <Ionicons name="close" size={22} color={Colors.textPrimary} />
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
    </>
  );
}

const styles = StyleSheet.create({
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sectionTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 26,
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
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  navSelectorBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  navSelectorText: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 14,
  },
  prevNextRow: {
    flexDirection: 'row',
    gap: 6,
  },
  arrowBtn: {
    width: 38,
    height: 38,
    borderRadius: Radii.md,
    backgroundColor: Colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  arrowBtnDisabled: {
    opacity: 0.4,
  },
  plansSection: {
    marginTop: 12,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.md,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 12,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: Typography.fontRegular,
    color: Colors.textPrimary,
    fontSize: 14,
    paddingVertical: 12,
  },
  chapterCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 14,
  },
  chapterHeader: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: 12,
    marginBottom: 16,
  },
  chapterTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 20,
    letterSpacing: 1.2,
  },
  chapterSub: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  verseContainer: {
    borderRadius: Radii.sm,
    paddingVertical: 6,
    paddingHorizontal: 6,
    marginBottom: 4,
  },
  verseRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  verseNum: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 12,
    minWidth: 20,
    marginTop: 2,
  },
  verseText: {
    flex: 1,
    fontFamily: Typography.fontRegular,
    color: Colors.textPrimary,
    fontSize: 15,
    lineHeight: 23,
  },
  noteBox: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: Radii.sm,
    padding: 8,
    marginTop: 6,
    marginLeft: 30,
  },
  noteInline: {
    fontFamily: Typography.fontRegular,
    color: Colors.textSecondary,
    fontSize: 12,
    fontStyle: 'italic',
  },
  noteEditSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  noteInput: {
    backgroundColor: Colors.bgMuted,
    borderRadius: Radii.md,
    padding: 12,
    color: Colors.textPrimary,
    fontFamily: Typography.fontRegular,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    marginTop: 8,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 16,
  },
  cardBody: {
    fontFamily: Typography.fontRegular,
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  eyebrow: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  progressTrack: {
    height: 6,
    backgroundColor: Colors.bgSecondary,
    borderRadius: Radii.full,
    marginVertical: 12,
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
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
    marginTop: 10,
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
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  btnOutlineText: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.gold,
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.bgCard,
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    padding: 20,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 18,
  },
  closeBtn: {
    padding: 4,
  },
  testamentRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  testamentChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radii.full,
    backgroundColor: Colors.bgSecondary,
  },
  testamentChipActive: {
    backgroundColor: Colors.gold,
  },
  testamentChipText: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.textSecondary,
    fontSize: 11,
  },
  testamentChipTextActive: {
    color: Colors.textInverse,
  },
  modalSearchInput: {
    backgroundColor: Colors.bgMuted,
    borderRadius: Radii.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.textPrimary,
    fontFamily: Typography.fontRegular,
    fontSize: 13,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bookGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingBottom: 20,
  },
  bookGridItem: {
    width: '48%',
    backgroundColor: Colors.bgSecondary,
    borderRadius: Radii.md,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bookGridItemActive: {
    borderColor: Colors.gold,
    backgroundColor: 'rgba(245,158,11,0.15)',
  },
  bookGridItemText: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.textPrimary,
    fontSize: 13,
  },
  bookGridItemTextActive: {
    color: Colors.gold,
  },
  bookChaptersBadge: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 10,
  },
  chapterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingBottom: 20,
    justifyContent: 'flex-start',
  },
  chapterGridItem: {
    width: 48,
    height: 48,
    borderRadius: Radii.md,
    backgroundColor: Colors.bgSecondary,
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
    fontSize: 14,
  },
  chapterGridItemTextActive: {
    color: Colors.textInverse,
  },
});
