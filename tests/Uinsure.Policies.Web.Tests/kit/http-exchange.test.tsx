import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpExchange } from '../../../src/Uinsure.Policies.Web/kit/patterns/http-exchange/HttpExchange';
import { examples } from '../../../src/Uinsure.Policies.Web/kit/patterns/http-exchange/http-exchange.examples';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('HttpExchange', () => {
  it('has an example for each state in the catalog row', () => {
    expect(examples.map((e) => e.state)).toEqual(['2xx', 'problem', 'unreachable', 'long']);
  });

  it.each(examples)('renders the example: $state', ({ element }) => {
    render(element);
    expect(screen.getByRole('article')).toBeTruthy();
    expect(screen.getByRole('heading', { level: 3 }).textContent).toContain('/policies/');
  });

  it('2xx: the status line carries the code as a word, a glyph and a colour, then time and size', () => {
    render(examples[0]!.element);
    const code = screen.getByText('200');
    expect(code.closest('[data-status]')?.getAttribute('data-status')).toBe('pass');
    expect(screen.getByText('52 ms')).toBeTruthy();
    expect(screen.getByText('412 B')).toBeTruthy();
    expect(screen.getByRole('article').getAttribute('data-outcome')).toBe('success');
  });

  it('2xx: the response body is shown exactly, in a named group', () => {
    render(examples[0]!.element);
    const body = screen.getByRole('group', { name: 'Response body' });
    expect(body.querySelector('pre')?.textContent).toMatch(/totalRefund\s+445\.11/);
    expect(body.querySelector('pre')?.textContent).toMatch(/ruleApplied\s+"CANCEL-1c"/);
  });

  it('2xx: headers are folded away until asked for, then shown as names and values', async () => {
    render(examples[0]!.element);
    const trigger = screen.getByRole('button', { name: 'Response headers (1)' });
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    await userEvent.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText('Content-Type').tagName).toBe('DT');
    expect(screen.getByText('application/json').tagName).toBe('DD');
  });

  it('a request with no body says so', () => {
    render(examples[0]!.element);
    expect(screen.getByText('No request body.')).toBeTruthy();
  });

  it('problem: marked as a failure, with its headers open because a failure\'s detail starts open', () => {
    render(examples[1]!.element);
    expect(screen.getByText('422').closest('[data-status]')?.getAttribute('data-status')).toBe('fail');
    expect(screen.getByRole('article').getAttribute('data-outcome')).toBe('problem');
    expect(screen.getByRole('button', { name: 'Response headers (1)' }).getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('group', { name: 'Response body' }).textContent).toContain('/problems/cancel-3');
  });

  it('unreachable: says no response came back, in words, and has no response body', () => {
    render(examples[2]!.element);
    expect(screen.getByRole('article').getAttribute('data-outcome')).toBe('unreachable');
    expect(screen.getByText('No response')).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toContain('The API did not answer');
    expect(screen.queryByRole('group', { name: 'Response body' })).toBeNull();
    expect(screen.queryByRole('button', { name: /Copy curl/ })).toBeNull();
  });

  it('with neither a response nor a failure, it is waiting', () => {
    render(<HttpExchange request={{ method: 'GET', url: '/policies/F3-MVEOSVDQJQ' }} />);
    expect(screen.getByText('Waiting for a response')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('long: the request, its body and the long lines are all there, wrapping inside the box', () => {
    render(examples[3]!.element);
    expect(screen.getByRole('heading', { level: 3 }).textContent).toContain('#2');
    expect(screen.getByRole('group', { name: 'Request body' }).textContent).toContain('2027-01-27');
    expect(screen.getByRole('group', { name: 'Response body' }).textContent).toContain('REF-c1b44418…');
    expect(screen.getByText('201').closest('[data-status]')?.getAttribute('data-status')).toBe('pass');
  });

  it('offers a copyable curl, named for its request', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    render(examples[0]!.element);
    const block = screen.getByRole('group', { name: 'curl for request #1' });
    expect(block.querySelector('code')?.textContent).toContain("curl -X GET 'http://localhost:5080/policies/F3-MVEOSVDQJQ/cancellation-quote");
    await userEvent.click(within(block).getByRole('button', { name: 'Copy curl' }));
    expect(await screen.findByRole('button', { name: 'Copied' })).toBeTruthy();
    expect(writeText).toHaveBeenCalledTimes(1);
  });

  it('is named by its request line', () => {
    render(<HttpExchange n={3} request={{ method: 'DELETE', url: '/x' }} response={{ status: 404 }} />);
    const article = screen.getByRole('article', { name: '#3 DELETE /x' });
    expect(article).toBeTruthy();
    expect(within(article).getByText('No response body.')).toBeTruthy();
  });
});
