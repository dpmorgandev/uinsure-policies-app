import { Route } from 'react-router';
import { Decisions } from './decisions/Decisions';
import { Harness } from './harness/Harness';
import { Sessions } from './sessions/Sessions';
import { Stats } from './stats/Stats';

/** U5's routes, registered in App.tsx under the frame. */
export const u5Routes = (
  <>
    <Route path="sessions" element={<Sessions />} />
    <Route path="sessions/:file" element={<Sessions />} />
    <Route path="harness" element={<Harness />} />
    <Route path="decisions" element={<Decisions />} />
    <Route path="stats" element={<Stats />} />
  </>
);
