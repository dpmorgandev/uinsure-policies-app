// DATA-7 · Bounded to docs/ and git. The compiler reads docs/ and git, never .claude/; what the explorer needs from
// the harness comes from the generated docs/trace/harness.json. On the `bounded` fixture trail, with a .claude/
// planted after the replay (bounded/README.md).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import { compile, compilerDir, filesUnder, replayTrail, writeIn } from './support/trail';

// Text that exists only in the planted .claude/.
const SENTINEL = 'sentinel-from-dot-claude';

function plantDotClaude(root: string): void {
  writeIn(root, '.claude/agents/sentinel.md', `---\nname: ${SENTINEL}-agent\ndescription: An agent that exists only under .claude/.\ntools: Read\nskills: [${SENTINEL}-skill]\n---\n`);
  writeIn(root, '.claude/skills/sentinel/SKILL.md', `---\nname: ${SENTINEL}-skill\ndescription: A skill that exists only under .claude/.\n---\n`);
  writeIn(root, '.claude/settings.json', `${JSON.stringify({ note: SENTINEL, hooks: {} }, null, 1)}\n`);
}

test('DATA-7 · the compiler compiles with read access to docs/ and git alone, never .claude/', () => {
  const trail = replayTrail('bounded', plantDotClaude);
  try {
    // Node's permission model: the compiler's own files, docs/ and .git/ may be read; any other read is refused.
    // git itself runs as a child process.
    const run = compile(trail.root, {
      permissions: {
        read: [join(compilerDir, '*'), join(trail.root, 'docs', '*'), join(trail.root, '.git', '*')],
        write: [join(trail.root, 'src', 'web', 'public', '*')],
      },
    });
    expect(run.status, run.output).toBe(0);
    expect(run.trace?.compiledAt?.sha).toBe(trail.head);
  } finally {
    trail.cleanup();
  }
});

test("DATA-7 · the harness in trace.json is docs/trace/harness.json's, and nothing from .claude/ reaches the output", () => {
  const trail = replayTrail('bounded', plantDotClaude);
  try {
    const run = compile(trail.root);
    expect(run.status, run.output).toBe(0);
    expect(run.trace?.harness?.agents?.map((a) => a.name)).toEqual(['fixture-tester']);
    const leaks = filesUnder(run.publicDir).filter((rel) => readFileSync(join(run.publicDir, rel), 'utf8').includes(SENTINEL));
    expect(leaks, 'no written file holds text from .claude/').toEqual([]);
  } finally {
    trail.cleanup();
  }
});
