import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'vanilla' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Check local storage or default to 'dark'
    const savedTheme = localStorage.getItem('app-theme') as Theme;
    return savedTheme || 'dark';
  });

  useEffect(() => {
    // Remove all theme classes
    document.body.classList.remove('theme-light', 'theme-vanilla', 'theme-dark');
    
    // Add the selected theme class (if not default light which is mapped to :root)
    if (theme !== 'light') {
      document.body.classList.add(`theme-${theme}`);
    } else {
      // It uses :root by default, but we can explicitly add theme-light if needed
      document.body.classList.add('theme-light');
    }

    // Save to local storage
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
