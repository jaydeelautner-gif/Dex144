// Verifies failed offline uploads are diagnosed, explained and clearable.
import assert from 'node:assert/strict';
import { diagnoseSyncFailure, isPermanentFailure } from '../src/utils/syncDiagnostics';

// The opaque Firestore error users actually see must be explained, not repeated.
const perms = diagnoseSyncFailure(new Error('Missing or insufficient permissions.'), 'SYNC_USER_PROFILE');
assert.equal(perms.reason, 'permissions');
assert.ok(!/missing or insufficient/i.test(perms.detail), 'the raw server string must not be the explanation');
assert.match(perms.detail, /rules rejected/i);
assert.ok(perms.action.length > 20, 'tells the user what to do');
assert.equal(isPermanentFailure(perms), true, 'a rules rejection cannot be fixed by retrying');

// Device-only sessions need a password login, not a retry.
const auth = diagnoseSyncFailure({ code: 'unauthenticated' }, 'REGISTER_POKEPET');
assert.equal(auth.reason, 'auth-required');
assert.match(auth.action, /password/i);
assert.equal(auth.retryable, true);

// Network failures are transient and auto-retryable.
for (const msg of ['Failed to fetch', 'The client is offline.', 'unavailable', 'Deadline exceeded']) {
  const d = diagnoseSyncFailure(new Error(msg));
  assert.equal(d.reason, 'network', `${msg} -> network`);
  assert.equal(d.retryable, true);
  assert.match(d.action, /retry|automatic/i);
}

assert.equal(diagnoseSyncFailure(new Error('RESOURCE_EXHAUSTED: quota')).reason, 'quota');
assert.equal(diagnoseSyncFailure(new Error('conflict: aborted')).reason, 'conflict');
assert.equal(isPermanentFailure(diagnoseSyncFailure(new Error('invalid data'))), true);
assert.equal(diagnoseSyncFailure(undefined).reason, 'unknown');
assert.ok(diagnoseSyncFailure(new Error('weird')).raw.includes('weird'), 'raw text preserved for details');

console.log('Sync diagnostics tests passed: permissions, auth, network, quota, conflict, invalid, unknown mapped with user-facing explanations and retryability.');
