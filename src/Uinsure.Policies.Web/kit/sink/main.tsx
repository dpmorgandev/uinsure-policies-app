import { createRoot } from 'react-dom/client';
import '@fontsource/atkinson-hyperlegible-next/400.css';
import '@fontsource/atkinson-hyperlegible-next/600.css';
import '@fontsource/atkinson-hyperlegible-next/700.css';
import '@fontsource/atkinson-hyperlegible-mono/400.css';
import '@fontsource/atkinson-hyperlegible-mono/600.css';
import '@fontsource/atkinson-hyperlegible-mono/700.css';
import '../tokens/tokens.css';
import { Sink } from './Sink';

const root = document.getElementById('root');
if (root === null) throw new Error('The kitchen sink needs <div id="root">.');

createRoot(root).render(<Sink />);
