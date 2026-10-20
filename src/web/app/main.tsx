import { createRoot } from 'react-dom/client';
import '@fontsource/atkinson-hyperlegible-next/400.css';
import '@fontsource/atkinson-hyperlegible-next/600.css';
import '@fontsource/atkinson-hyperlegible-next/700.css';
import '@fontsource/atkinson-hyperlegible-mono/400.css';
import '@fontsource/atkinson-hyperlegible-mono/600.css';
import '@fontsource/atkinson-hyperlegible-mono/700.css';
import '../kit/tokens/tokens.css';
import './shell/page.css';
import { App } from './shell/App';

const root = document.getElementById('root');
if (root === null) throw new Error('The app needs <div id="root">.');

createRoot(root).render(<App />);
