/** The repository the footer and commit links point at. */
export const REPO = 'https://github.com/dpmorgandev/uinsure-policies-api';

/** NAV-3: links out are built from IDs in trace.json, never from free text. */
export const commitUrl = (sha: string): string => `${REPO}/commit/${sha}`;

export const pullUrl = (number: string): string => `${REPO}/pull/${number}`;

/** A file at a commit, at a line when the source names one. */
export const blobUrl = (sha: string, path: string, line?: number): string =>
  `${REPO}/blob/${sha}/${path}${line === undefined ? '' : `#L${line}`}`;

/** A directory at a commit. */
export const treeUrl = (sha: string, path: string): string => `${REPO}/tree/${sha}/${path}`;
