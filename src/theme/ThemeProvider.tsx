import { createContext, ReactNode } from 'react';
import { Theme, defaultTheme } from './index';

export const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }): React.ReactElement {
  return <ThemeContext.Provider value={defaultTheme}>{children}</ThemeContext.Provider>;
}
