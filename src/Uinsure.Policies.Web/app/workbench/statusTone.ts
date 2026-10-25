import type { Status } from '../../kit';

// How the API's status word is drawn, on every workbench screen. The word shown is always the API's own.
const STATUS_TONES: Record<string, Status> = { Pending: 'pending', Active: 'pass', Expired: 'warn', Cancelled: 'fail' };

/** HONEST-1: one tone per policy status; a word the API adds later reads warn, never a pass it did not earn. */
export const toneOfStatus = (status: string): Status => STATUS_TONES[status] ?? 'warn';
