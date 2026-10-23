// U10 (W3 carry, "no shared API data"): each test sells a policy no other test, repeat or run has sold. The W3 specs
// sold fixed references (W3CLAIMPOST0001, …), so under --repeat-each, or beside another session's run on the same API,
// the second sale of the same reference answered 409 (SELL-1) and the test failed in setup.
import { randomBytes } from 'node:crypto';

/** SELL-1's reference shape after normalisation: ^[A-Z0-9-]{3,20}$. */
const MAX = 20;

/** `prefix` (at most 10 characters) then 10 random base-36 characters: a reference no other sale has used. */
export function freshReference(prefix: string): string {
  if (!/^[A-Z0-9-]{1,10}$/.test(prefix)) throw new Error(`setup: a fresh reference's prefix is 1 to 10 of A-Z, 0-9, -: ${prefix}`);
  const tail = BigInt(`0x${randomBytes(8).toString('hex')}`).toString(36).toUpperCase().padStart(10, '0').slice(-10);
  return `${prefix}${tail}`.slice(0, MAX);
}
