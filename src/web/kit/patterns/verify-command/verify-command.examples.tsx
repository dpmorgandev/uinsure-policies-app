import type { JSX } from 'react';
import { VerifyCommand } from './VerifyCommand';

// All of it is from the "Re-check the order" region of the rule mockup: the command, the SHAs
// (94a7473 red, 92ede9e green, from the requirements matrix) and the note about recorded output.
export const examples: { state: string; element: JSX.Element }[] = [
  {
    state: 'pop',
    element: (
      <VerifyCommand
        intro="Run this in a clone. It lists the commits from the red SHA to the green SHA in the order they were made, with each one's TDD trailer."
        command={'git log --reverse --format="%h %(trailers:key=TDD,valueonly) %s" 94a7473^..92ede9e'}
        expect={
          <>
            Expect <code>94a7473</code> first with trailer red and <code>92ede9e</code> last with trailer green.
          </>
        }
        note="The command is filled in from the SHAs in the requirements matrix; the page has no recorded output for it."
      />
    ),
  },
];
