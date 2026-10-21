import { StatusTag } from '../../kit';
import type { TraceState } from './ShellContext';

/** HONEST-1: while trace.json is read, or when it cannot be, a page says so and names the file. It states no snapshot. */
export function DataNotice({ trace }: { trace: Exclude<TraceState, { state: 'ready' }> }) {
  if (trace.state === 'loading') {
    return (
      <p className="s-notice" role="status">
        <StatusTag status="pending">Loading</StatusTag> trace.json is being read.
      </p>
    );
  }
  return (
    <p className="s-notice" role="alert">
      <StatusTag status="fail">Could not load</StatusTag> {trace.reason}.
    </p>
  );
}
