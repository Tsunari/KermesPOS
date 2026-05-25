import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeProvider as MUIThemeProvider, createTheme } from '@mui/material/styles';
import { GlobalStyles } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { useSettings } from './SettingsContext';

type ThemeContextType = {
  isDarkMode: boolean;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Always start with dark mode for new users
    const savedTheme = localStorage.getItem('theme');
    if (!savedTheme) {
      localStorage.setItem('theme', 'dark');
      return true;
    }
    return savedTheme === 'dark';
  });

  const { showPageScrollbars, showComponentScrollbars } = useSettings();

  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  const theme = createTheme({
    palette: {
      mode: isDarkMode ? 'dark' : 'light',
      primary: {
        main: isDarkMode ? '#4178f5' : '#2563eb',   // vivid modern royal/cobalt blue
        light: isDarkMode ? '#6b9afe' : '#eff6ff',  // modern soft blue background tint
        dark: isDarkMode ? '#2456d0' : '#1d4ed8',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#f06292',
        light: '#f48fb1',
        dark: '#c2185b',
      },
      background: {
        // Dark: #121212 root → #1e1e1e paper
        // Light: sophisticated calming soft slate-zinc scheme (no blinding pure white paper backgrounds!)
        default: isDarkMode ? '#121212' : '#e4e7eb',
        paper:   isDarkMode ? '#1e1e1e' : '#f4f5f7',
      },
      text: {
        primary: isDarkMode ? 'rgba(255,255,255,0.95)' : 'rgba(15,23,42,0.9)', // slate-900
        secondary: isDarkMode ? 'rgba(255,255,255,0.65)' : 'rgba(71,85,105,0.8)', // slate-600
      },
      divider: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.06)',
    },
    shape: {
      borderRadius: 10,    // default border-radius for MUI components
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      fontWeightMedium: 500,
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: {
            // Sidebar AppBar — both modes handled via sx in App.tsx
            backgroundColor: isDarkMode ? '#272727' : '#ffffff',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: 'none',
            fontWeight: 600,
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: 6,   // rectangular — square with soft corners
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
          },
        },
      },
    },
  });

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      <MUIThemeProvider theme={theme}>
        <CssBaseline />
        <GlobalStyles
          styles={{
            'html, body': {
              scrollbarWidth: showPageScrollbars ? 'auto' : 'none',
              msOverflowStyle: showPageScrollbars ? 'auto' : 'none',
              '&::-webkit-scrollbar': {
                display: showPageScrollbars ? 'block' : 'none',
                width: '8px',
                height: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: isDarkMode ? '#1e1e1e' : '#f5f5f5',
              },
              '&::-webkit-scrollbar-thumb': {
                background: isDarkMode ? '#424242' : '#bdbdbd',
                borderRadius: '4px',
                '&:hover': {
                  background: isDarkMode ? '#616161' : '#9e9e9e',
                },
              },
            },
            '*': {
              scrollbarWidth: showComponentScrollbars ? 'auto' : 'none',
              msOverflowStyle: showComponentScrollbars ? 'auto' : 'none',
              '&::-webkit-scrollbar': {
                display: showComponentScrollbars ? 'block' : 'none',
                width: '8px',
                height: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: isDarkMode ? '#1e1e1e' : '#f5f5f5',
              },
              '&::-webkit-scrollbar-thumb': {
                background: isDarkMode ? '#424242' : '#bdbdbd',
                borderRadius: '4px',
                '&:hover': {
                  background: isDarkMode ? '#616161' : '#9e9e9e',
                },
              },
            },
            'input::-webkit-outer-spin-button, input::-webkit-inner-spin-button': {
              WebkitAppearance: showComponentScrollbars ? 'auto' : 'none',
              margin: 0,
            },
            'input[type=number]': {
              MozAppearance: showComponentScrollbars ? 'textfield' : 'none',
            },
          }}
        />
        {children}
      </MUIThemeProvider>
    </ThemeContext.Provider>
  );
}; 