import { Route } from 'react-router';
import { Commit } from './commit/Commit';
import { Matrix } from './matrix/Matrix';
import { Node } from './node/Node';
import { Rule } from './rule/Rule';

/** U1's routes, registered in App.tsx under the frame. */
export const u1Routes = (
  <>
    <Route path="rules" element={<Matrix />} />
    <Route path="rules/:ruleId" element={<Rule />} />
    <Route path="plans/:planId/:nodeId" element={<Node />} />
    <Route path="commits/:sha" element={<Commit />} />
  </>
);
