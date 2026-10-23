import { useMemo, useState } from 'react';
import { Search } from '../../kit';
import type { SearchResult } from '../../kit';
import { searchIndex, searchTrace } from '../data/trace';
import type { SearchEntry } from '../data/trace';
import { blobUrl } from './repo';
import { useShell } from './ShellContext';

// A common letter would otherwise list every path in the trail.
const MAX_MATCHES = 30;

/** NAV-4: one input over every rule ID, node, SHA and file path in trace.json. A path opens on GitHub at the snapshot. */
export function SiteSearch() {
  const { trace } = useShell();
  const [query, setQuery] = useState('');
  const snapshotSha = trace.state === 'ready' ? trace.snapshot.sha : null;
  const index = useMemo(() => (trace.state === 'ready' ? searchIndex(trace.trace) : []), [trace]);

  const results = useMemo(() => {
    const hrefOf = (entry: SearchEntry): string =>
      entry.kind === 'path' && snapshotSha !== null ? blobUrl(snapshotSha, entry.href) : entry.href;
    return searchTrace(index, query)
      .slice(0, MAX_MATCHES)
      .map((entry): SearchResult => ({ id: `${entry.kind}:${entry.label}`, kind: entry.kind, label: entry.label, detail: entry.detail ?? undefined, href: hrefOf(entry) }));
  }, [index, query, snapshotSha]);

  const open = (result: SearchResult): void => {
    if (result.kind === 'path') window.open(result.href, '_blank', 'noreferrer');
    else window.location.hash = result.href;
  };

  return <Search value={query} onValueChange={setQuery} results={results} onSelect={open} />;
}
