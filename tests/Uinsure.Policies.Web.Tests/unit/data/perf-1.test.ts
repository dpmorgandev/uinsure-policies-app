// @vitest-environment node
// PERF-1 · Fast from cold. First screen interactive in under 2 s on a laptop from a static host. The app records the
// moment its first screen is interactive as the performance mark `docket:interactive`, through `markInteractive`,
// which returns the time since navigation started, so the cold-load budget is measured, not guessed. On a recording
// performance object: its own clock, so a canned number can't pass.
import { expect, test } from 'vitest';
import { markInteractive } from '../../../../src/Uinsure.Policies.Web/app/data/trace';

function recording(now: number): { marks: string[]; perf: Pick<Performance, 'mark' | 'now'> } {
  const marks: string[] = [];
  const perf = {
    mark: (name: string) => {
      marks.push(name);
      return undefined as unknown as PerformanceMark;
    },
    now: () => now,
  } as Pick<Performance, 'mark' | 'now'>;
  return { marks, perf };
}

test('PERF-1 · marking the first screen interactive records the docket:interactive mark once', () => {
  const { marks, perf } = recording(812.5);
  markInteractive(perf);
  expect(marks).toEqual(['docket:interactive']);
});

test('PERF-1 · it returns the time since navigation started, as the clock gives it', () => {
  expect(markInteractive(recording(1937.25).perf)).toBe(1937.25);
});
