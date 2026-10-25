// DATA-4 · NotBuiltRegion and its NotBuiltYet import are gone from app/shell/Rung.tsx once no screen uses them
// (bug-002 N4; bug-002/N2 review A3 R3, P2). N2 removed the last two uses, which leaves the shell exporting a way to
// draw a region as "not built yet" that no screen reaches, and the kit's placeholder imported for nothing.
// Read from the source, as the import rules are: no screen may come to need it again by accident.
import { readFileSync } from 'node:fs';
import { URL as NodeURL, fileURLToPath } from 'node:url';
import { expect, test } from 'vitest';

const rung = readFileSync(fileURLToPath(new NodeURL('../../../../src/Uinsure.Policies.Web/app/shell/Rung.tsx', import.meta.url)), 'utf8');

test('DATA-4 · app/shell/Rung.tsx no longer exports NotBuiltRegion', () => {
  expect(rung, 'Rung.tsx declares no NotBuiltRegion').not.toMatch(/\bNotBuiltRegion\b/);
});

test('DATA-4 · app/shell/Rung.tsx no longer imports the kit NotBuiltYet', () => {
  expect(rung, 'Rung.tsx imports no NotBuiltYet').not.toMatch(/\bNotBuiltYet\b/);
});
