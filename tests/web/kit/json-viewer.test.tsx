import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { JsonViewer } from '../../../src/web/kit/patterns/json-viewer/JsonViewer';
import { examples } from '../../../src/web/kit/patterns/json-viewer/json-viewer.examples';

afterEach(cleanup);

function example(state: string) {
  const found = examples.find((e) => e.state === state);
  if (!found) throw new Error(`no example for ${state}`);
  return found.element;
}

function pending() {
  let resolve: () => void = () => {};
  const promise = new Promise<void>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe('json-viewer examples', () => {
  it('has exactly the catalogued states', () => {
    expect(examples.map((e) => e.state)).toEqual(['pop', 'long', 'malformed']);
  });

  it.each(examples)('renders the example: $state', ({ element }) => {
    render(element);
    expect(screen.getByRole('button', { name: /^Raw JSON:/ })).toBeTruthy();
  });

  it('pop: collapsed by default, with the document hidden until it is opened', async () => {
    render(example('pop'));
    const trigger = screen.getByRole('button', { name: /Raw JSON: quote response/ });
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('group', { name: 'Raw JSON: quote response' })).toBeNull();
    await userEvent.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    const group = screen.getByRole('group', { name: 'Raw JSON: quote response' });
    expect(group.querySelector('code')?.textContent).toBe(
      [
        '{',
        '  "reference": "F3-MVEOSVDQJQ",',
        '  "quotedOn": "2026-10-19",',
        '  "cancellationDate": "2027-01-27",',
        '  "ruleApplied": "CANCEL-1c",',
        '  "totalRefund": 445.11',
        '}',
      ].join('\n'),
    );
  });

  it('long: when open, keeps the long text whole', () => {
    render(example('long'));
    const group = screen.getByRole('group', { name: /Raw JSON: quote response with a long detail/ });
    expect(group.textContent).toContain('Status_at_22_59_UTC_on_an_end_date_in_BST_is_Active.');
  });

  it('malformed: says so in words before the document, and shows the text as received', async () => {
    const { container } = render(example('malformed'));
    expect(container.querySelector('[data-state="malformed"]')).not.toBeNull();
    expect(screen.getByText('Malformed JSON.')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: /Raw JSON: quote response, cut off/ }));
    const code = screen.getByRole('group', { name: /Raw JSON/ }).querySelector('code');
    expect(code?.textContent).toBe('{"reference":"F3-MVEOSVDQJQ","quotedOn":"2026-10-19","cancellationDate":');
  });
});

describe('JsonViewer', () => {
  it('keeps every number exactly as written, so money does not lose a zero', async () => {
    render(<JsonViewer label="term" json='{"amount":615.40,"refundAmount":0.00,"daysInTerm":365}' defaultOpen />);
    const code = screen.getByRole('group').querySelector('code');
    expect(code?.textContent).toBe('{\n  "amount": 615.40,\n  "refundAmount": 0.00,\n  "daysInTerm": 365\n}');
  });

  it('indents nested objects and arrays, and keeps empty ones on one line', () => {
    render(<JsonViewer label="nested" json='{"terms":[{"term":1}],"refunds":[],"cancellation":{}}' defaultOpen />);
    const code = screen.getByRole('group').querySelector('code');
    expect(code?.textContent).toBe(
      ['{', '  "terms": [', '    {', '      "term": 1', '    }', '  ],', '  "refunds": [],', '  "cancellation": {}', '}'].join('\n'),
    );
  });

  it('does not re-indent inside strings: commas, colons and braces in text stay put', () => {
    render(<JsonViewer label="text" json={'{"note":"a, b: {c} \\"quoted\\" [d]"}'} defaultOpen />);
    const code = screen.getByRole('group').querySelector('code');
    expect(code?.textContent).toBe('{\n  "note": "a, b: {c} \\"quoted\\" [d]"\n}');
  });

  it('starts open only when asked', () => {
    const { unmount } = render(<JsonViewer label="x" json='{"a":1}' />);
    expect(screen.getByRole('button', { name: /Raw JSON: x/ }).getAttribute('aria-expanded')).toBe('false');
    unmount();
    render(<JsonViewer label="x" json='{"a":1}' defaultOpen />);
    expect(screen.getByRole('button', { name: /Raw JSON: x/ }).getAttribute('aria-expanded')).toBe('true');
  });

  it('counts the lines in the summary', () => {
    render(<JsonViewer label="x" json='{"a":1}' />);
    expect(screen.getByRole('button', { name: 'Raw JSON: x (3 lines)' })).toBeTruthy();
  });

  it('reports the parser message for a malformed document and does not repair it', () => {
    render(<JsonViewer label="x" json="{oops" defaultOpen />);
    expect(screen.getByText(/It is shown as received, not repaired\./)).toBeTruthy();
    expect(screen.getByRole('group').querySelector('code')?.textContent).toBe('{oops');
  });

  it('treats an empty document as malformed rather than showing nothing', () => {
    const { container } = render(<JsonViewer label="x" json="" />);
    expect(container.querySelector('[data-state="malformed"]')).not.toBeNull();
  });

  it('copies the formatted text to the clipboard function it is given', async () => {
    const onCopy = vi.fn().mockResolvedValue(undefined);
    render(<JsonViewer label="x" json='{"a":1}' defaultOpen onCopy={onCopy} />);
    fireEvent.click(screen.getByRole('button', { name: 'Copy JSON' }));
    expect(await screen.findByRole('button', { name: 'Copied' })).toBeTruthy();
    expect(onCopy).toHaveBeenCalledWith('{\n  "a": 1\n}');
  });

  it('BUSY-1: while copying it is disabled, busy, says what is happening, and cannot be fired twice', async () => {
    const copy = pending();
    const onCopy = vi.fn(() => copy.promise);
    render(<JsonViewer label="x" json='{"a":1}' defaultOpen onCopy={onCopy} />);
    fireEvent.click(screen.getByRole('button', { name: 'Copy JSON' }));

    const busy = screen.getByRole('button', { name: 'Copying JSON…' }) as HTMLButtonElement;
    expect(busy.disabled).toBe(true);
    expect(busy.getAttribute('aria-busy')).toBe('true');
    expect(busy.getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(busy);
    fireEvent.click(busy);
    expect(onCopy).toHaveBeenCalledTimes(1);

    await act(async () => {
      copy.resolve();
      await copy.promise;
    });
    expect((screen.getByRole('button', { name: 'Copied' }) as HTMLButtonElement).disabled).toBe(false);
  });

  it('lets the caller word the copy control', () => {
    render(<JsonViewer label="x" json='{"a":1}' defaultOpen copyLabel="Copy verdict" />);
    expect(screen.getByRole('button', { name: 'Copy verdict' })).toBeTruthy();
  });
});
