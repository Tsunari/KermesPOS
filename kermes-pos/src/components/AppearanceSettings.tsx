import React from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Button,
  Stack,
} from '@mui/material';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';
import ModernSwitch from './ui/ModernSwitch';
import PaletteIcon from '@mui/icons-material/Palette';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';

const AppearanceSettings: React.FC = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const { 
    showPageScrollbars,
    setShowPageScrollbars,
    showComponentScrollbars,
    setShowComponentScrollbars
  } = useSettings();
  const navigate = useNavigate();

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/settings')}
          variant="outlined"
          size="small"
        >
          Go Back
        </Button>
        <Typography variant="h4">
          Appearance Settings
        </Typography>
      </Stack>
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Theme & Display
        </Typography>
        
        <List>
          <ListItem>
            <ListItemIcon>
              <PaletteIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Dark Mode" 
              secondary="Toggle between light and dark theme"
            />
            <ModernSwitch
              edge="end"
              checked={isDarkMode}
              onChange={toggleTheme}
            />
          </ListItem>
          
          <Divider />
          
          <ListItem>
            <ListItemIcon>
              <VisibilityIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Page Scrollbars" 
              secondary="Show or hide scrollbars for the main page content"
            />
            <ModernSwitch
              edge="end"
              checked={showPageScrollbars}
              onChange={(e) => setShowPageScrollbars(e.target.checked)}
            />
          </ListItem>
          
          <Divider />
          
          <ListItem>
            <ListItemIcon>
              <ViewColumnIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Component Scrollbars" 
              secondary="Show or hide scrollbars for components like lists and tables"
            />
            <ModernSwitch
              edge="end"
              checked={showComponentScrollbars}
              onChange={(e) => setShowComponentScrollbars(e.target.checked)}
            />
          </ListItem>
        </List>
      </Paper>
    </Box>
  );
};

export default AppearanceSettings; 