import { HashRouter, Routes } from 'react-router';

// Hash routing: the build is static, so the host never needs a rewrite rule. Routes arrive with the screens.
export function App() {
  return (
    <HashRouter>
      <Routes />
    </HashRouter>
  );
}
