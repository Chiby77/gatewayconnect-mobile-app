import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatCurrencyAmount,
  filterSermons,
  filterBibleBooks,
  validateGivingInput,
  createGivingReceipt,
  detectPrayerCountIncreases,
  markThreadMessagesAsRead,
  resolveStoredTheme,
  startOrResumeDownloadTask,
  pauseDownloadTask,
  resumeDownloadTask,
  cancelDownloadTask,
  advanceActiveDownloadTasks,
  wrapVerseTextIntoLines,
  VERSE_CARD_THEMES,
  loadSearchHistory,
  saveSearchQueryToHistory,
  removeSearchQueryFromHistory,
  parseSermonDurationMinutes,
  sortOfflineSermons,
  resolveSermonStorageStatus,
  STORY_EXPIRATION_MS,
  isStoryExpired,
  filterActiveStories,
  formatStoryTimeRemaining,
  SEED_SERMONS,
  SEED_DOWNLOAD_TASKS,
  SEED_PRAYERS,
  SEED_STORIES,
  SEED_SOCIAL_POSTS,
  SEED_CHAT_THREADS,
  SEED_MINISTRY_PAGES,
} from './domainLogic';
import { getChapterVerses } from '../data/bibleData';

test('formatCurrencyAmount converts USD to ZiG, GBP, ZAR accurately', () => {
  assert.equal(formatCurrencyAmount(34.99, 'USD'), '$34.99');
  assert.equal(formatCurrencyAmount(10, 'ZiG'), 'ZiG 148');
  assert.equal(formatCurrencyAmount(100, 'GBP'), '£78');
  assert.equal(formatCurrencyAmount(10, 'ZAR'), 'R185');
});

test('filterSermons filters by series and search query and includes YouTube, Facebook, and Uploaded sources', () => {
  const all = filterSermons(SEED_SERMONS, 'All', '');
  assert.equal(all.length, SEED_SERMONS.length);
  assert.ok(all.some((s) => s.source === 'youtube'));
  assert.ok(all.some((s) => s.source === 'facebook'));
  assert.ok(all.some((s) => s.source === 'uploaded'));

  const bySeries = filterSermons(SEED_SERMONS, 'Family & Marriage', '');
  assert.equal(bySeries.length, 1);
  assert.equal(bySeries[0].id, 'sermon_4');

  const bySearch = filterSermons(SEED_SERMONS, 'All', 'Circle');
  assert.equal(bySearch.length, 1);
  assert.equal(bySearch[0].id, 'sermon_2');
});

test('filterBibleBooks filters by OT/NT testament and book search', () => {
  const allBooks = filterBibleBooks('ALL', '');
  assert.equal(allBooks.length, 66);

  const otBooks = filterBibleBooks('OT', '');
  assert.equal(otBooks.length, 39);

  const ntBooks = filterBibleBooks('NT', '');
  assert.equal(ntBooks.length, 27);

  const johnMatches = filterBibleBooks('NT', 'john');
  assert.equal(johnMatches.length, 4);
});

test('getChapterVerses returns genuine KJV scripture verses', () => {
  const psalm23 = getChapterVerses('Psalms', 23);
  assert.equal(psalm23.length, 6);
  assert.ok(psalm23[0].text.includes('The LORD is my shepherd'));
});

test('validateGivingInput and createGivingReceipt enforce valid offerings', () => {
  assert.equal(
    validateGivingInput(0, 'EcoCash', '0771234567'),
    'Please enter a valid offering amount greater than zero.'
  );
  assert.equal(
    validateGivingInput(50, 'EcoCash', '   '),
    'Please enter your EcoCash mobile number.'
  );
  assert.equal(validateGivingInput(50, 'EcoCash', '0771234567'), null);
  assert.equal(validateGivingInput(50, 'Card', ''), null);

  const receipt = createGivingReceipt({
    amount: 50,
    currency: 'USD',
    fundId: 'tithe',
    method: 'EcoCash',
    phone: '0771234567',
    nowMs: 1700000123456,
  });
  assert.equal(receipt.id, 'GCZ-GIVE-123456');
  assert.equal(receipt.fund, 'Tithe');
  assert.equal(receipt.formattedAmount, '$50.00');
});

test('detectPrayerCountIncreases detects when someone prays with a petition', () => {
  const previousCounts = {
    pray_1: 18,
    pray_2: 14,
  };
  const updatedPrayers = SEED_PRAYERS.map((p) =>
    p.id === 'pray_1' ? { ...p, prayingCount: 20 } : p
  );
  const increases = detectPrayerCountIncreases(previousCounts, updatedPrayers);
  assert.equal(increases.length, 1);
  assert.equal(increases[0].prayer.id, 'pray_1');
  assert.equal(increases[0].delta, 2);
});

test('markThreadMessagesAsRead updates all message statuses to read and zeroes unreadCount when opening a thread', () => {
  const initialLounge = SEED_CHAT_THREADS.find((t) => t.id === 'chat_sanctuary_lounge')!;
  assert.ok(initialLounge.unreadCount > 0);
  assert.ok(initialLounge.messages.some((m) => m.status !== 'read'));

  const updatedThreads = markThreadMessagesAsRead(SEED_CHAT_THREADS, 'chat_sanctuary_lounge');
  const updatedLounge = updatedThreads.find((t) => t.id === 'chat_sanctuary_lounge')!;
  assert.equal(updatedLounge.unreadCount, 0);
  assert.ok(updatedLounge.messages.every((m) => m.status === 'read'));
});

test('resolveStoredTheme validates stored localStorage theme preference', () => {
  assert.equal(resolveStoredTheme('light'), 'light');
  assert.equal(resolveStoredTheme('dark'), 'dark');
  assert.equal(resolveStoredTheme(null), 'dark');
  assert.equal(resolveStoredTheme('invalid'), 'dark');
});

test('social, stories, chat threads, and ministry pages have valid structures', () => {
  assert.ok(SEED_STORIES.length >= 4);
  assert.ok(SEED_SOCIAL_POSTS.length >= 3);
  assert.ok(SEED_CHAT_THREADS.length >= 4);
  assert.ok(SEED_MINISTRY_PAGES.length >= 3);
});

test('sermon download manager supports start, advance, pause, resume, and cancel transitions', () => {
  const targetSermon = SEED_SERMONS[0];
  let tasks = startOrResumeDownloadTask([], targetSermon, 1000);
  assert.equal(tasks.length, 1);
  assert.equal(tasks[0].sermonId, targetSermon.id);
  assert.equal(tasks[0].status, 'downloading');
  assert.equal(tasks[0].progress, 12);

  // Advance progress
  const step1 = advanceActiveDownloadTasks(tasks, 28, 2000);
  tasks = step1.tasks;
  assert.equal(tasks[0].progress, 40);
  assert.equal(step1.newlyCompleted.length, 0);

  // Pause task
  tasks = pauseDownloadTask(tasks, targetSermon.id, 3000);
  assert.equal(tasks[0].status, 'paused');

  // Advancing while paused does not change progress
  const pausedStep = advanceActiveDownloadTasks(tasks, 30, 4000);
  assert.equal(pausedStep.tasks[0].progress, 40);

  // Resume task and advance to 100% completion
  tasks = resumeDownloadTask(tasks, targetSermon.id, 5000);
  assert.equal(tasks[0].status, 'downloading');
  const finalStep = advanceActiveDownloadTasks(tasks, 65, 6000);
  assert.equal(finalStep.tasks[0].status, 'completed');
  assert.equal(finalStep.tasks[0].progress, 100);
  assert.equal(finalStep.newlyCompleted.length, 1);

  // Cancel task removes it from queue
  const afterCancel = cancelDownloadTask(finalStep.tasks, targetSermon.id);
  assert.equal(afterCancel.length, 0);
});

test('wrapVerseTextIntoLines wraps scripture verses cleanly and VERSE_CARD_THEMES has presets', () => {
  assert.ok(VERSE_CARD_THEMES.length >= 5);
  const lines = wrapVerseTextIntoLines(
    'The LORD is my shepherd; I shall not want. He maketh me to lie down in green pastures.',
    28
  );
  assert.ok(lines.length >= 3);
  assert.ok(lines.every((l) => l.length <= 28));
});

test('search history helpers load, deduplicate, prepend, and remove queries accurately', () => {
  const defaults = ['Psalms', 'John', 'Isaiah'];
  assert.deepEqual(loadSearchHistory(null, defaults), defaults);
  assert.deepEqual(loadSearchHistory('invalid-json', defaults), defaults);
  assert.deepEqual(loadSearchHistory(JSON.stringify(['Romans', 'Genesis']), defaults), [
    'Romans',
    'Genesis',
  ]);

  const afterSave = saveSearchQueryToHistory(['Psalms', 'John'], 'Isaiah', 5);
  assert.deepEqual(afterSave, ['Isaiah', 'Psalms', 'John']);

  // Case-insensitive deduplication moves existing query to front
  const afterDedup = saveSearchQueryToHistory(afterSave, 'john', 5);
  assert.deepEqual(afterDedup, ['john', 'Isaiah', 'Psalms']);

  // Removing a query works case-insensitively
  const afterRemove = removeSearchQueryFromHistory(afterDedup, 'ISAIAH');
  assert.deepEqual(afterRemove, ['john', 'Psalms']);
});

test('parseSermonDurationMinutes and sortOfflineSermons order by dateAdded, alphabetical, and duration', () => {
  assert.equal(parseSermonDurationMinutes('42m'), 42);
  assert.equal(parseSermonDurationMinutes('1h 15m'), 75);
  assert.equal(parseSermonDurationMinutes('45:00'), 45);

  const sample = [
    { ...SEED_SERMONS[0], title: 'Zebra Sermon', duration: '25m', savedAtMs: 1000 },
    { ...SEED_SERMONS[1], title: 'Alpha Sermon', duration: '55m', savedAtMs: 3000 },
    { ...SEED_SERMONS[2], title: 'Middle Sermon', duration: '40m', savedAtMs: 2000 },
  ];

  const byDate = sortOfflineSermons(sample, 'dateAdded');
  assert.deepEqual(
    byDate.map((s) => s.title),
    ['Alpha Sermon', 'Middle Sermon', 'Zebra Sermon']
  );

  const byAlpha = sortOfflineSermons(sample, 'alphabetical');
  assert.deepEqual(
    byAlpha.map((s) => s.title),
    ['Alpha Sermon', 'Middle Sermon', 'Zebra Sermon']
  );

  const byDuration = sortOfflineSermons(sample, 'duration');
  assert.deepEqual(
    byDuration.map((s) => s.duration),
    ['55m', '40m', '25m']
  );
});

test('resolveSermonStorageStatus distinguishes fully downloaded, partially downloaded, queued, and not downloaded items', () => {
  const fullSermon = SEED_SERMONS.find((s) => s.id === 'sermon_uploaded_1')!;
  const partialSermon = SEED_SERMONS.find((s) => s.id === 'sermon_2')!;
  const queuedSermon = SEED_SERMONS.find((s) => s.id === 'sermon_fb_live_1')!;
  const notSavedSermon = SEED_SERMONS.find((s) => s.id === 'sermon_4')!;

  const fullStatus = resolveSermonStorageStatus(
    fullSermon,
    [fullSermon],
    SEED_DOWNLOAD_TASKS
  );
  assert.equal(fullStatus.status, 'fully_downloaded');
  assert.equal(fullStatus.progress, 100);

  const partialStatus = resolveSermonStorageStatus(
    partialSermon,
    [fullSermon],
    SEED_DOWNLOAD_TASKS
  );
  assert.equal(partialStatus.status, 'partially_downloaded');
  assert.equal(partialStatus.progress, 45);

  const queuedStatus = resolveSermonStorageStatus(
    queuedSermon,
    [fullSermon],
    SEED_DOWNLOAD_TASKS
  );
  assert.equal(queuedStatus.status, 'in_queue');
  assert.equal(queuedStatus.progress, 0);

  const noneStatus = resolveSermonStorageStatus(
    notSavedSermon,
    [fullSermon],
    SEED_DOWNLOAD_TASKS
  );
  assert.equal(noneStatus.status, 'not_downloaded');
});

test('24-hour story expiration helpers filter expired stories and format remaining time', () => {
  const now = 1711800000000;
  const freshStory = { id: 's1', createdAtMs: now - 2 * 60 * 60 * 1000 }; // 2 hours old
  const expiredStory = { id: 's2', createdAtMs: now - (STORY_EXPIRATION_MS + 1000) }; // 24h + 1s old

  assert.equal(isStoryExpired(freshStory, now), false);
  assert.equal(isStoryExpired(expiredStory, now), true);

  const active = filterActiveStories([freshStory, expiredStory], now);
  assert.equal(active.length, 1);
  assert.equal(active[0].id, 's1');
  assert.equal(formatStoryTimeRemaining(freshStory, now), '22h left');
  assert.equal(formatStoryTimeRemaining(expiredStory, now), 'Expired');
});


