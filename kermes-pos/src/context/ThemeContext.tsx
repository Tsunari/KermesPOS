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
        main: '#1976d2',
      },
      secondary: {
        main: '#dc004e',
      },
      background: {
        default: isDarkMode ? '#121212' : '#f5f5f5',
        paper: isDarkMode ? '#1e1e1e' : '#ffffff',
      },
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: isDarkMode ? '#1e1e1e' : '#1976d2',
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