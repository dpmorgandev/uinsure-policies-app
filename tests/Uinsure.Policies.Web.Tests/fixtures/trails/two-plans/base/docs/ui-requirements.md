# UI requirements (fixture excerpt)

Cut from docs/ui-requirements.md section 2 as it stands: two of the ui plan's rules, under their own headings,
in the real file's order. The heading carries no priority; the priority is a column of its own.

## 2. Functional requirements

### Trail data (the compiler)

| ID | Priority | Requirement | Draft interpretation |
|---|---|---|---|
| DATA-1 | MUST | One compiled data file | A Node script compiles the trail into a versioned `trace.json` at build time. The SPA reads only that file: no runtime reads of the repo, no server |

### Navigation and overview

| ID | Priority | Requirement | Draft interpretation |
|---|---|---|---|
| NAV-1 | MUST | Overview answers the question first | The landing screen states, from the data: rules built / total, tests passing, nodes done, attempts and FAILs taken, human decisions recorded. Each figure links to its source screen |
