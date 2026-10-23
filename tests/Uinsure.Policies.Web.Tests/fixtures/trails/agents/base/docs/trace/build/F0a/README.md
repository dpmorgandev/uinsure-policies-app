# build/F0a: Harness · owner: David · built in-session, no loop

Written by the main session at the end of F0a. Unlike other node READMEs it isn't generated:
F0a has no loop events or verdicts to render.

## Completeness

`node .claude/scripts/render-trace.mjs check build F0a` → `OK (git-only, F0a)`.

**Hooks not yet live: witnessed by git and trailers only.** F0a built the hooks it is now guarded by.
Every F0a commit is on `main`, and the activity hook records only on `feature/*` branches, so
F0a has no activity, loop or verdict receipts. Its evidence is the git history.

Re-verify: `git log --oneline --grep='(build/F0a)'`
