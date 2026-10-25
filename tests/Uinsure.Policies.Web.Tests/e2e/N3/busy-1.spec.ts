// bug-002 N3 · BUSY-1 · on a 201 sale the outcome reaches the user where they are (inv-009 #4, I10; David 2026-10-23:
// focus, not a redirect). The answer is drawn in the header above the form, the Send button is at its foot, and only
// the error outcomes move focus (SellPolicy.tsx passes a focusKey to those alone).
//
// On the live API (W1's support/api.ts, the node's port). Every expected value is the exchange the page itself saw.
import { expect, live, test } from '../W1/support/api';
import { answered, sell, sellForm, watchApi } from '../W1/support/workbench';
import { freshReference } from '../W3/support/fresh';

test('BUSY-1 · on a 201 sale, focus moves from Sell this policy to the answer stating the 201 and the stored reference', async ({ page, api }) => {
  void api;
  const seen = watchApi(page);
  await sell(page, sellForm(freshReference('N3SF'), { amount: '609.38' }));
  const sale = await answered(seen, 'POST', '/api/policies');
  expect(sale.status, 'setup: the API sold the policy').toBe(201);
  const stored = (sale.responseBody as { reference: string }).reference;
  const focused = (): Promise<{ tag: string; text: string; isSend: boolean }> =>
    page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      const text = el?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
      return { tag: el?.tagName.toLowerCase() ?? '', text, isSend: el?.tagName === 'BUTTON' && /^(Sell this policy|Selling…)$/.test(text) };
    });
  await expect.poll(async () => (await focused()).isSend, { message: 'focus has left the Send button', ...live }).toBe(false);
  const now = await focused();
  expect(now.tag, 'focus is on an element of the page, not the body').not.toBe('body');
  expect(now.text, 'the focused answer states the 201').toContain(String(sale.status));
  expect(now.text, 'the focused answer names the stored reference').toContain(stored);
});
