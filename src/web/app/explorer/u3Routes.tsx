import { Route } from 'react-router';
import { Finding } from './finding/Finding';
import { Loop } from './loop/Loop';
import { Plan } from './plan/Plan';
import { Verdict } from './verdict/Verdict';

/** U3's routes, registered in App.tsx under the frame. */
export const u3Routes = (
  <>
    <Route path="plans/:planId" element={<Plan />} />
    <Route path="plans/:planId/:nodeId/loop" element={<Loop />} />
    <Route path="plans/:planId/:nodeId/verdicts/:round/:agent" element={<Verdict />} />
    <Route path="plans/:planId/:nodeId/findings/:round" element={<Finding />} />
  </>
);
