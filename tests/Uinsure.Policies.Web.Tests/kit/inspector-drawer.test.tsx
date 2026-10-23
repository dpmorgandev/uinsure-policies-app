import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InspectorDrawer } from '../../../src/Uinsure.Policies.Web/kit/layouts/inspector-drawer/InspectorDrawer';
import type { InspectorRequest } from '../../../src/Uinsure.Policies.Web/kit/layouts/inspector-drawer/InspectorDrawer';
import { examples } from '../../../src/Uinsure.Policies.Web/kit/layouts/inspector-drawer/inspector-drawer.examples';

afterEach(cleanup);

const quote: InspectorRequest = {
  number: 1,
  method: 'GET',
  path: '/policies/F3-MVEOSVDQJQ/cancellation-quote?cancellationDate=2027-01-27',
  status: 200,
  outcome: 'ok',
  exchange: 'quotedOn          "2026-10-19"\ntotalRefund       445.11',
  note: 'Shown as recorded.',
};
const cancel: InspectorRequest = {
  number: 2,
  method: 'POST',
  path: '/policies/F3-MVEOSVDQJQ/cancellation',
  status: 201,
  outcome: 'ok',
  exchange: 'request   cancellationDate  "2027-01-27"',
};

function bodyOf(): HTMLElement {
  const toggle = screen.getByRole('button', { name: /requests$/ });
  const id = toggle.getAttribute('aria-controls');
  const body = id ? document.getElementById(id) : null;
  if (!body) throw new Error('no drawer body');
  return body;
}

describe('inspector-drawer examples', () => {
  it('has exactly the catalogued states', () => {
    expect(examples.map((e) => e.state)).toEqual(['closed', 'open', 'one request', 'problem']);
  });

  it.each(examples)('renders the example: $state', ({ element }) => {
    render(element);
    expect(screen.getByRole('complementary', { name: 'The requests as sent' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /requests$/ })).toBeTruthy();
  });

  it('closed: only the bar shows, with the count, and the toggle says it is collapsed', () => {
    render(examples[0]!.element);
    expect(screen.getByText('Closed · 2 requests')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Show requests' }).getAttribute('aria-expanded')).toBe('false');
    expect(bodyOf().hasAttribute('hidden')).toBe(true);
    expect(screen.queryByRole('list')).toBeNull();
    expect(screen.queryByRole('separator')).toBeNull();
  });

  it('open: two requests, newest first, the latest with its exchange', () => {
    render(examples[1]!.element);
    expect(screen.getByText('Open · 2 requests')).toBeTruthy();
    const items = within(screen.getByRole('list')).getAllByRole('listitem');
    expect(items.map((item) => item.querySelector('span')?.textContent)).toEqual(['#2', '#1']);
    expect(within(items[0]!).getByText('latest')).toBeTruthy();
    expect(within(items[0]!).getByRole('region', { name: 'Request #2, request and response' }).textContent).toContain(
      'REF-c1b44418…',
    );
    expect(within(items[1]!).queryByRole('region')).toBeNull();
  });

  it('one request: the singular count and the quote as recorded', () => {
    render(examples[2]!.element);
    expect(screen.getByText('Open · 1 request')).toBeTruthy();
    const region = screen.getByRole('region', { name: 'Request #1, request and response' });
    expect(region.textContent).toContain('reference         "F3-MVEOSVDQJQ"');
    expect(region.textContent).toContain('totalRefund       445.11');
    expect(screen.getByText(/positional because the data excerpt/)).toBeTruthy();
  });

  it('problem: the 422 shows as a failure, in a word, a glyph and a colour', () => {
    const { container } = render(examples[3]!.element);
    const tag = container.querySelector('[data-status="fail"]');
    expect(tag).not.toBeNull();
    expect(tag?.textContent).toContain('422');
    expect(tag?.textContent).toContain('(problem)');
    expect(tag?.querySelector('svg')).not.toBeNull();
    expect(screen.getByRole('region', { name: 'Request #1, request and response' }).textContent).toContain(
      'ruleId      "CANCEL-3"',
    );
  });
});

describe('InspectorDrawer', () => {
  it('is a labelled complementary landmark with a heading', () => {
    render(<InspectorDrawer requests={[quote]} defaultOpen />);
    expect(screen.getByRole('heading', { level: 3, name: 'The requests as sent' })).toBeTruthy();
    expect(screen.getByRole('complementary', { name: 'The requests as sent' })).toBeTruthy();
  });

  it('takes another heading level', () => {
    render(<InspectorDrawer requests={[quote]} headingLevel={2} />);
    expect(screen.getByRole('heading', { level: 2, name: 'The requests as sent' })).toBeTruthy();
  });

  it('is an ordered list marked reversed, because the newest comes first', () => {
    render(<InspectorDrawer requests={[cancel, quote]} defaultOpen />);
    const list = screen.getByRole('list');
    expect(list.tagName).toBe('OL');
    expect(list.hasAttribute('reversed')).toBe(true);
  });

  it('opens and closes from the keyboard, keeping aria-expanded and aria-controls true', async () => {
    const onOpenChange = vi.fn();
    render(<InspectorDrawer requests={[cancel, quote]} onOpenChange={onOpenChange} />);
    await userEvent.tab();
    const toggle = screen.getByRole('button', { name: 'Show requests' });
    expect(document.activeElement).toBe(toggle);
    await userEvent.keyboard('{Enter}');
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    const hide = screen.getByRole('button', { name: 'Hide requests' });
    expect(hide.getAttribute('aria-expanded')).toBe('true');
    expect(bodyOf().hasAttribute('hidden')).toBe(false);
    expect(screen.getByText('Open · 2 requests')).toBeTruthy();
    await userEvent.keyboard('{Enter}');
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(screen.getByRole('button', { name: 'Show requests' }).getAttribute('aria-expanded')).toBe('false');
    expect(bodyOf().hasAttribute('hidden')).toBe(true);
  });

  it('when controlled, follows `open` and only reports the press', async () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(<InspectorDrawer requests={[quote]} open={false} onOpenChange={onOpenChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Show requests' }));
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(screen.getByRole('button', { name: 'Show requests' })).toBeTruthy();
    rerender(<InspectorDrawer requests={[quote]} open onOpenChange={onOpenChange} />);
    expect(screen.getByRole('button', { name: 'Hide requests' })).toBeTruthy();
  });

  it('shows a request still waiting for its answer, and says so in the live region', () => {
    const { container } = render(
      <InspectorDrawer requests={[{ number: 1, method: 'GET', path: '/policies/F3-MVEOSVDQJQ', outcome: 'pending' }]} defaultOpen />,
    );
    expect(container.querySelector('[data-status="pending"]')?.textContent).toContain('Waiting');
    expect(screen.getByRole('status').textContent).toBe('Request #1 sent, waiting for the response');
  });

  it('announces the latest answer in the live region', () => {
    render(<InspectorDrawer requests={[cancel, quote]} />);
    expect(screen.getByRole('status').textContent).toBe('Request #2 answered 201');
  });

  it('says plainly when nothing has been sent', () => {
    render(<InspectorDrawer requests={[]} defaultOpen />);
    expect(screen.getByText('Open · 0 requests')).toBeTruthy();
    expect(screen.getByText('No request has been sent yet.')).toBeTruthy();
    expect(screen.queryByRole('list')).toBeNull();
    expect(screen.getByRole('status').textContent).toBe('');
  });

  describe('resizing', () => {
    it('is a focusable horizontal separator with its limits and value', () => {
      render(<InspectorDrawer requests={[quote]} defaultOpen defaultHeight={256} minHeight={96} maxHeight={640} />);
      const splitter = screen.getByRole('separator', { name: 'Resize the inspector' });
      expect(splitter.getAttribute('aria-orientation')).toBe('horizontal');
      expect(splitter.getAttribute('aria-valuemin')).toBe('96');
      expect(splitter.getAttribute('aria-valuemax')).toBe('640');
      expect(splitter.getAttribute('aria-valuenow')).toBe('256');
      expect(splitter.getAttribute('tabindex')).toBe('0');
      expect(splitter.getAttribute('aria-controls')).toBe(bodyOf().id);
      expect(bodyOf().style.height).toBe('256px');
    });

    it('Up makes it taller and Down shorter, and the body follows', async () => {
      render(<InspectorDrawer requests={[quote]} defaultOpen defaultHeight={256} />);
      const splitter = screen.getByRole('separator');
      splitter.focus();
      await userEvent.keyboard('{ArrowUp}');
      expect(splitter.getAttribute('aria-valuenow')).toBe('280');
      expect(bodyOf().style.height).toBe('280px');
      await userEvent.keyboard('{ArrowDown}{ArrowDown}');
      expect(splitter.getAttribute('aria-valuenow')).toBe('232');
      expect(bodyOf().style.height).toBe('232px');
      await userEvent.keyboard('{PageUp}');
      expect(splitter.getAttribute('aria-valuenow')).toBe('328');
      await userEvent.keyboard('{PageDown}');
      expect(splitter.getAttribute('aria-valuenow')).toBe('232');
    });

    it('Home and End go to the limits, and nothing goes past them', async () => {
      render(<InspectorDrawer requests={[quote]} defaultOpen minHeight={96} maxHeight={640} />);
      const splitter = screen.getByRole('separator');
      splitter.focus();
      await userEvent.keyboard('{End}');
      expect(splitter.getAttribute('aria-valuenow')).toBe('640');
      await userEvent.keyboard('{ArrowUp}{PageUp}');
      expect(splitter.getAttribute('aria-valuenow')).toBe('640');
      await userEvent.keyboard('{Home}');
      expect(splitter.getAttribute('aria-valuenow')).toBe('96');
      await userEvent.keyboard('{ArrowDown}{PageDown}');
      expect(splitter.getAttribute('aria-valuenow')).toBe('96');
    });

    it('keeps the height it was given when closed and opened again', async () => {
      render(<InspectorDrawer requests={[quote]} defaultOpen defaultHeight={256} />);
      screen.getByRole('separator').focus();
      await userEvent.keyboard('{ArrowUp}');
      await userEvent.click(screen.getByRole('button', { name: 'Hide requests' }));
      expect(screen.queryByRole('separator')).toBeNull();
      await userEvent.click(screen.getByRole('button', { name: 'Show requests' }));
      expect(screen.getByRole('separator').getAttribute('aria-valuenow')).toBe('280');
    });

    it('starts inside the limits even when asked for a height outside them', () => {
      render(<InspectorDrawer requests={[quote]} defaultOpen defaultHeight={5000} maxHeight={640} />);
      expect(screen.getByRole('separator').getAttribute('aria-valuenow')).toBe('640');
    });
  });
});
