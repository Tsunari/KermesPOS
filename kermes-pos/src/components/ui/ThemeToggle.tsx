import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

export const ThemeToggle: React.FC = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const { t } = useLanguage();

  return (
    <Tooltip title={isDarkMode ? (t('app.appbar.lightMode') || 'Switch to Light Mode') : (t('app.appbar.darkMode') || 'Switch to Dark Mode')}>
      <IconButton 
      color="primary" 
      size="large" 
      onClick={toggleTheme}
      sx={{ 
        mb: 1,
        borderRadius: 2,
         bgcolor: 'background.default', 
         '&:hover': { bgcolor: 'primary.light', color: 'primary.main' } 
         }}>
        {isDarkMode ? <Brightness7Icon /> : <Brightness4Icon />}
      </IconButton>
    </Tooltip>
  );
}; 