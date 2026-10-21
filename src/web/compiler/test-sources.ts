// Reads a rule's tests by name from the test sources at the ref (RULE-1). A web test is named by its title after the
// `<ID> · ` tag; a C# test by its method, under each `[Trait("Rule", "<ID>")]` above it.

export interface TestName {
  rule: string;
  name: string;
  file: string;
  line: number;
}

const ID = '[A-Z][A-Z0-9]*-\\d+[a-z]?(?:/\\d+)?';
const WEB_TITLE = new RegExp(`\\b(?:test|it)(?:\\.\\w+)*\\(\\s*(['"\`])(${ID}) · (.*?)\\1`);
const TRAIT = new RegExp(`\\[Trait\\("Rule",\\s*"(${ID})"\\)\\]`);
const METHOD = /^\s*public\s+(?:async\s+)?(?:Task|void)\s+(\w+)\s*\(/;

export const isTestSource = (path: string): boolean => /\.(test|spec)\.tsx?$|\.cs$/.test(path);

export function parseTests(file: string, source: string): TestName[] {
  const found: TestName[] = [];
  let traits: string[] = [];
  source.split(/\r?\n/).forEach((text, index) => {
    const line = index + 1;
    if (file.endsWith('.cs')) {
      const trait = TRAIT.exec(text);
      if (trait) traits.push(trait[1] ?? '');
      const method = METHOD.exec(text);
      if (method) {
        for (const rule of new Set(traits)) found.push({ rule, name: method[1] ?? '', file, line });
        traits = [];
      }
    } else {
      const title = WEB_TITLE.exec(text);
      if (title) found.push({ rule: title[2] ?? '', name: title[3] ?? '', file, line });
    }
  });
  return found;
}
