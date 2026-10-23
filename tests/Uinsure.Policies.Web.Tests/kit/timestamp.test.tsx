import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Timestamp } from '../../../src/Uinsure.Policies.Web/kit/primitives/timestamp/Timestamp';
import { examples } from '../../../src/Uinsure.Policies.Web/kit/primitives/timestamp/timestamp.examples';

afterEach(cleanup);

function utcOf(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>('span[hidden], span[id]');
  if (!el) throw new Error('no UTC span');
  return el;
}

describe('timestamp examples', () => {
  it('has exactly the catalogued states', () => {
    expect(examples.map((e) => e.state)).toEqual(['pop', 'missing']);
  });

  for (const example of examples) {
    it(`renders "${example.state}"`, () => {
      const { container } = render(example.element);
      expect(container.firstChild).not.toBeNull();
    });
  }
});

describe('Timestamp', () => {
  it('shows an ISO instant in UK local time (BST in October)', () => {
    const { container } = render(<Timestamp value="2026-10-19T00:07:57Z" />);
    const time = container.querySelector('time');
    expect(time?.textContent).toBe('2026-10-19 01:07:57 BST');
    expect(time?.getAttribute('datetime')).toBe('2026-10-19T00:07:57.000Z');
  });

  it('shows winter instants on GMT', () => {
    const { container } = render(<Timestamp value="2026-12-01T12:00:00Z" />);
    expect(container.querySelector('time')?.textContent).toBe('2026-12-01 12:00:00 GMT');
  });

  it('reads a DD/MM signature as UK time and reconciles it with ISO', () => {
    const { container } = render(<Timestamp value="19/10/2026 01:05" />);
    const time = container.querySelector('time');
    expect(time?.textContent).toBe('2026-10-19 01:05 BST');
    expect(time?.getAttribute('datetime')).toBe('2026-10-19T00:05:00.000Z');
  });

  it('keeps UTC hidden until asked, then shows it', () => {
    const { container } = render(<Timestamp value="2026-10-19T00:07:57Z" />);
    const button = screen.getByRole('button', { name: 'Show UTC time' });
    expect(button.getAttribute('aria-pressed')).toBe('false');
    expect(utcOf(container).hasAttribute('hidden')).toBe(true);

    fireEvent.click(button);
    expect(button.getAttribute('aria-pressed')).toBe('true');
    const utc = utcOf(container);
    expect(utc.hasAttribute('hidden')).toBe(false);
    expect(utc.textContent).toBe('2026-10-19 00:07:57 UTC');
    expect(button.getAttribute('aria-controls')).toBe(utc.id);

    fireEvent.click(button);
    expect(button.getAttribute('aria-pressed')).toBe('false');
    expect(utcOf(container).hasAttribute('hidden')).toBe(true);
  });

  it('can start with UTC showing', () => {
    const { container } = render(<Timestamp value="19/10/2026 01:05" defaultShowUtc />);
    expect(screen.getByRole('button', { name: 'Show UTC time' }).getAttribute('aria-pressed')).toBe('true');
    expect(utcOf(container).textContent).toBe('2026-10-19 00:05 UTC');
  });

  it('shows an ISO date as it is, with no UTC control', () => {
    const { container } = render(<Timestamp value="2026-10-19" />);
    expect(container.querySelector('time')?.textContent).toBe('2026-10-19');
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('says so when no time was recorded', () => {
    render(<Timestamp value={null} />);
    expect(screen.getByText('no time recorded')).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
    expect(document.querySelector('time')).toBeNull();
  });

  it('treats an empty string as missing', () => {
    render(<Timestamp value="  " />);
    expect(screen.getByText('no time recorded')).toBeTruthy();
  });

  it('shows an unrecognised format as written, and says it was not recognised', () => {
    render(<Timestamp value="yesterday teatime" />);
    expect(screen.getByText('yesterday teatime')).toBeTruthy();
    expect(screen.getByText('format not recognised, shown as written')).toBeTruthy();
  });
});
