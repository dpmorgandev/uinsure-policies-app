import { Route } from 'react-router';
import { Plan } from './plan/Plan';
import { Walkthrough } from './walkthrough/Walkthrough';

/** U2's routes, registered in App.tsx under the frame. */
export const u2Routes = (
  <>
    <Route path="plans/:planId" element={<Plan />} />
    <Route path="plans/:planId/:nodeId/commits" element={<Walkthrough />} />
  </>
);
