import assert from 'node:assert/strict';
import { resolveCloudProgress, type ProgressState } from '../src/hooks/useGameProgress';

const local: ProgressState = { rb: ['rb-badge-1'], sv: ['sv-badge-1'] };

assert.equal(
  resolveCloudProgress(local, undefined, false),
  local,
  'profiles without a gameProgress field keep local progress'
);
assert.equal(
  resolveCloudProgress(local, {}, true),
  local,
  'pending local edits are not replaced by a remote snapshot'
);

const cleared = resolveCloudProgress(local, {}, false);
assert.deepEqual(cleared.rb, []);
assert.deepEqual(cleared.sv, []);

const adopted = resolveCloudProgress(local, { rb: ['rb-badge-2'] }, false);
assert.deepEqual(adopted.rb, ['rb-badge-2']);
assert.deepEqual(adopted.sv, []);

console.log('Game progress sync tests passed.');
