import { Route } from 'react-router';
import { Harness } from './harness/Harness';
import { Sessions } from './sessions/Sessions';
import { Stats } from './stats/Stats';

/** U5's routes, registered in App.tsx under the frame. */
export const u5Routes = (
  <>
    <Route path="sessions" element={<Sessions />} />
    <Route path="harness" element={<Harness />} />
    <Route path="stats" element={<Stats />} />
  </>
);
