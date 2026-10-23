import { createContext, useContext } from 'react';
import type { ThemeChoice } from '../../kit';
import type { TraceLoad } from '../data/trace';

/** trace.json is read once by the frame: until it answers there is no snapshot, and no screen may claim one. */
export type TraceState = { state: 'loading' } | TraceLoad;

export interface ShellValue {
  trace: TraceState;
  theme: ThemeChoice;
  setTheme: (choice: ThemeChoice) => void;
}

const ShellContext = createContext<ShellValue | null>(null);

export const ShellProvider = ShellContext.Provider;

export function useShell(): ShellValue {
  const value = useContext(ShellContext);
  if (value === null) throw new Error('A screen renders inside the frame.');
  return value;
}
