/**
 * Why an offline change could not be uploaded, in words a trainer understands.
 *
 * Firestore reports every rule rejection as the same opaque
 * "Missing or insufficient permissions." string, which tells the user nothing.
 * This module maps the underlying failure to a cause and a next step.
 */

export type SyncFailureReason =
  | 'permissions'
  | 'auth-required'
  | 'rules-outdated'
  | 'network'
  | 'quota'
  | 'invalid-data'
  | 'conflict'
  | 'unknown';

export interface SyncFailureDiagnosis {
  reason: SyncFailureReason;
  /** Headline shown in the UI. */
  title: string;
  /** One-line explanation of what happened. */
  detail: string;
  /** What the user can actually do about it. */
  action: string;
  /** True when retrying later might succeed without the user changing anything. */
  retryable: boolean;
  /** Raw error text, kept for the details disclosure. */
  raw: string;
}

function errorCode(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code?: unknown }).code;
    if (typeof code === 'string') return code.toLowerCase();
  }
  return '';
}

export function diagnoseSyncFailure(error: unknown, actionType?: string): SyncFailureDiagnosis {
  const raw = error instanceof Error
    ? (error.message || error.name)
    : (error && typeof error === 'object' && 'code' in error
      ? String((error as { code?: unknown }).code ?? 'Unknown error')
      : String(error ?? 'Unknown error'));
  // Firebase carries the real cause in `code` (e.g. permission-denied), so both
  // the code and the message are searched.
  const text = `${errorCode(error)} ${raw}`.toLowerCase();

  const base = { raw };

  if (text.includes('permission') || text.includes('insufficient') || text.includes('permission-denied')) {
    return {
      ...base,
      reason: 'permissions',
      title: 'The server refused this change',
      detail:
        'Your account signed in correctly, but the database rules rejected this write. This usually means the app is newer than the rules deployed on the server.',
      action:
        'Your change is still saved on this device. The app admins need to deploy the latest firestore.rules; until then this item cannot be uploaded.',
      retryable: false,
    };
  }

  if (text.includes('unauthenticated') || text.includes('auth/') || text.includes('invalid-credential')) {
    return {
      ...base,
      reason: 'auth-required',
      title: 'You need to sign in again',
      detail:
        'This change was made with a device-only session (for example a quick PIN login), so the server has no verified account to write it against.',
      action:
        'Connect to the internet and sign in with your account password, then retry the upload. Your offline changes stay saved until then.',
      retryable: true,
    };
  }

  if (
    text.includes('network') || text.includes('offline') || text.includes('unavailable') ||
    text.includes('failed to fetch') || text.includes('timeout') || text.includes('disconnected') ||
    text.includes('deadline') || text.includes('unreachable') || text.includes('network-request-failed')
  ) {
    return {
      ...base,
      reason: 'network',
      title: 'Connection problem',
      detail: 'The device could not reach the server while uploading this change.',
      action: 'Reconnect and the app will retry automatically. Nothing has been lost.',
      retryable: true,
    };
  }

  if (text.includes('quota') || text.includes('resource-exhausted') || text.includes('too many')) {
    return {
      ...base,
      reason: 'quota',
      title: 'Server limit reached',
      detail: 'The server is temporarily refusing writes (rate or quota limit).',
      action: 'Wait a few minutes and retry. Your change is still saved on this device.',
      retryable: true,
    };
  }

  if (text.includes('invalid') || text.includes('validation') || text.includes('failed-precondition')) {
    return {
      ...base,
      reason: 'invalid-data',
      title: 'This change is no longer valid',
      detail: 'The stored change did not pass the server\u2019s validation rules, so it can never be accepted as-is.',
      action: 'You can clear this item and re-apply the change while online.',
      retryable: false,
    };
  }

  if (text.includes('conflict') || text.includes('aborted') || text.includes('already-exists')) {
    return {
      ...base,
      reason: 'conflict',
      title: 'Changed on another device',
      detail: 'Another device edited the same record after this change was saved here.',
      action: 'Re-apply the change on this device to bring it back in sync.',
      retryable: false,
    };
  }

  return {
    ...base,
    reason: 'unknown',
    title: 'Upload failed',
    detail: `The server rejected "${actionType ?? 'this change'}".`,
    action: 'Your change is still saved on this device. Retry when you are online.',
    retryable: true,
  };
}

/** True when a failure can never succeed on retry without user action. */
export function isPermanentFailure(diagnosis: SyncFailureDiagnosis): boolean {
  return !diagnosis.retryable;
}
