import { HashRouter, Route, Routes } from 'react-router';
import { About } from '../explorer/about/About';
import { Activity } from '../explorer/activity/Activity';
import { Overview } from '../explorer/overview/Overview';
import { u1Routes } from '../explorer/u1Routes';
import { Frame } from './Frame';
import { NotBuiltPage } from './NotBuiltPage';

// Hash routing: the build is static, so the host never needs a rewrite rule.
export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Frame />}>
          <Route index element={<Overview />} />
          <Route path="about" element={<About />} />
          <Route path="plans/:planId/:nodeId/activity" element={<Activity />} />
          {u1Routes}
          <Route path="*" element={<NotBuiltPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
