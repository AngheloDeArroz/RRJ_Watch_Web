
"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes"
import type { ThemeProviderProps } from "next-themes/dist/types"

interface AnimationState {
  x: number;
  y: number;
  isAnimating: boolean;
}

const ThemeContext = React.createContext<{
  toggleTheme: (event: React.MouseEvent<HTMLElement>) => void;
} | undefined>(undefined);

export function useThemeToggle() {
  const context = React.useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useThemeToggle must be used within a ThemeProvider");
  }
  return context;
}

function ThemeProviderInternal({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useTheme();
  const [animation, setAnimation] = React.useState<AnimationState>({ 
    x: 0, 
    y: 0, 
    isAnimating: false 
  });

  const toggleTheme = (event: React.MouseEvent<HTMLElement>) => {
    const { clientX, clientY } = event;
    setAnimation({ x: clientX, y: clientY, isAnimating: true });
    
    document.documentElement.classList.add('no-transitions');
    
    // The actual theme change is deferred to allow the animation to start
    setTimeout(() => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
        setTimeout(() => {
          document.documentElement.classList.remove('no-transitions');
        }, 100);
    }, 0);
  };

  React.useEffect(() => {
    if (animation.isAnimating) {
      const timer = setTimeout(() => {
        setAnimation({ ...animation, isAnimating: false });
      }, 1000); // Must match animation duration
      return () => clearTimeout(timer);
    }
  }, [animation]);

  return (
    <ThemeContext.Provider value={{ toggleTheme }}>
      {children}
      {animation.isAnimating && (
        <div
          className="fixed top-0 left-0 w-screen h-screen z-50 pointer-events-none"
          style={{ 
            clipPath: `circle(0% at ${animation.x}px ${animation.y}px)`,
            animation: 'expand 1s ease-out forwards',
          }}
        />
      )}
    </ThemeContext.Provider>
  );
}


export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={true} 
      {...props}
    >
      <ThemeProviderInternal>{children}</ThemeProviderInternal>
    </NextThemesProvider>
  )
}
