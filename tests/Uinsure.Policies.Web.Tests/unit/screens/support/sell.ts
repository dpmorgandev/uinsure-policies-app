// The sell screen (src/Uinsure.Policies.Web/app/workbench/sell/SellPolicy.tsx) in jsdom, on the API's own sale, recorded
// in docs/ui/fixture/api/003-sell-1-new-reference-201.json (exchange 0, the POST answered 201). Send anyway is on, so the
// form's own checks let the empty form through to the stub fetch.
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { notFound, recordedExchange, renderAppAt } from './app';

export const sale = recordedExchange('003-sell-1-new-reference-201.json', 0);
export const sold = sale.responseBody as { reference: string; status: string };

/** The recorded 201 for the sale; anything that isn't the API is the frame's trace.json read. */
export function stubTheSale(): void {
  vi.stubGlobal('fetch', async (input: string) =>
    String(input) === '/api/policies'
      ? new Response(JSON.stringify(sale.responseBody), {
          status: sale.status,
          headers: { 'content-type': sale.responseHeaders['content-type'] ?? 'application/json' },
        })
      : notFound(),
  );
}

/** Opens the sell screen, turns send anyway on, and presses Sell this policy; resolves with the button once the 201 is drawn. */
export async function sellThroughTheScreen(): Promise<HTMLElement> {
  stubTheSale();
  renderAppAt('workbench/sell');
  const user = userEvent.setup();
  await user.click(await screen.findByRole('switch', { name: 'Send anyway' }));
  const send = screen.getByRole('button', { name: 'Sell this policy' });
  await user.click(send);
  await screen.findByText(new RegExp(`The API answered ${sale.status}: ${sold.reference}`));
  return send;
}
