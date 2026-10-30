import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatCurrencyAmount,
  filterSermons,
  filterBibleBooks,
  validateGivingInput,
  createGivingReceipt,
  SEED_SERMONS,
} from './domainLogic';
import { getChapterVerses } from '../data/bibleData';

test('formatCurrencyAmount converts USD to ZiG, GBP, ZAR accurately', () => {
  assert.equal(formatCurrencyAmount(34.99, 'USD'), '$34.99');
  assert.equal(formatCurrencyAmount(10, 'ZiG'), 'ZiG 148');
  assert.equal(formatCurrencyAmount(100, 'GBP'), '£78');
  assert.equal(formatCurrencyAmount(10, 'ZAR'), 'R185');
});

test('filterSermons filters by series and search query', () => {
  const all = filterSermons(SEED_SERMONS, 'All', '');
  assert.equal(all.length, SEED_SERMONS.length);

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
