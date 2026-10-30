import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const rulesContent = fs.readFileSync('firestore.rules', 'utf-8');

test('Dirty Dozen #1-4: Default deny, verified email, strict keys & anti-update-gap present', () => {
  assert.ok(rulesContent.includes('match /{document=**} {\n      allow read, write: if false;\n    }'));
  assert.ok(rulesContent.includes('request.auth.token.email_verified == true'));
  assert.ok(rulesContent.includes('isValidPublicUserProfile(incoming())'));
  assert.ok(rulesContent.includes('isValidPrayerRequest(incoming())'));
  assert.ok(rulesContent.includes('affectedKeys().hasOnly'));
});

test('Dirty Dozen #5-8: PII isolation, Master Gate parent existence, regex ID guard, and size limits', () => {
  assert.ok(rulesContent.includes('match /private/{docId}'));
  assert.ok(rulesContent.includes('exists(/databases/$(database)/documents/users/$(userId))'));
  assert.ok(rulesContent.includes("id.matches('^[a-zA-Z0-9_\\\\-]+$')"));
  assert.ok(rulesContent.includes('data.body.size() >= 1 && data.body.size() <= 1000'));
});

test('Dirty Dozen #9-12: Server timestamps, immutable fields, terminal state locking, and query enforcer', () => {
  assert.ok(rulesContent.includes('incoming().createdAt == request.time'));
  assert.ok(rulesContent.includes('incoming().updatedAt == request.time'));
  assert.ok(rulesContent.includes('incoming().authorId == existing().authorId'));
  assert.ok(rulesContent.includes("existing().status == 'active'"));
  assert.ok(rulesContent.includes('allow list: if isVerifiedUser() && resource.data.ownerId == request.auth.uid'));
});
