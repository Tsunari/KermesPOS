import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SecurityIcon from '@mui/icons-material/Security';
import PaletteIcon from '@mui/icons-material/Palette';
import LanguageIcon from '@mui/icons-material/Language';
import BackupIcon from '@mui/icons-material/Backup';
import CodeIcon from '@mui/icons-material/Code';
import ModernSwitch from './ui/ModernSwitch';
import { productService } from '../services/productService';

interface SettingsPageProps {
  devMode: boolean;
  setDevMode: (value: boolean) => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ devMode, setDevMode }) => {
  const [notifications, setNotifications] = useState(true);
  const [security, setSecurity] = useState(true);
  const [appearance, setAppearance] = useState(false);
  const [language, setLanguage] = useState(false);
  const [autoBackup, setAutoBackup] = useState(false);

  const handleDefineDefault = () => {
    if (window.confirm('Are you sure you want to define the current product list as the default? This will update the source code and cannot be undone.')) {
      const jsonString = productService.exportProducts();
      // In a real application, this would make an API call to update the source code
      alert('Default products updated successfully! (Note: In a real application, this would update the source code)');
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Application Settings
        </Typography>
        
        <List>
          <ListItem>
            <ListItemIcon>
              <CodeIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Dev Mode" 
              secondary="Enable developer features for advanced product management"
            />
            <ModernSwitch
              edge="end"
              checked={devMode}
              onChange={(e) => setDevMode(e.target.checked)}
            />
          </ListItem>
          
          <Divider />
          
          <ListItem>
            <ListItemIcon>
              <NotificationsIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Notifications" 
              secondary="Configure notification settings"
            />
            <ModernSwitch
              edge="end"
              checked={notifications}
              onChange={(e) => setNotifications(e.target.checked)}
            />
          </ListItem>
          
          <Divider />
          
          <ListItem>
            <ListItemIcon>
              <SecurityIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Security" 
              secondary="Manage security settings"
            />
            <ModernSwitch
              edge="end"
              checked={security}
              onChange={(e) => setSecurity(e.target.checked)}
            />
          </ListItem>
          
          <Divider />
          
          <ListItem>
            <ListItemIcon>
              <PaletteIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Appearance" 
              secondary="Customize the look and feel"
            />
            <ModernSwitch
              edge="end"
              checked={appearance}
              onChange={(e) => setAppearance(e.target.checked)}
            />
          </ListItem>
          
          <Divider />
          
          <ListItem>
            <ListItemIcon>
              <LanguageIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Language" 
              secondary="Change application language"
            />
            <ModernSwitch
              edge="end"
              checked={language}
              onChange={(e) => setLanguage(e.target.checked)}
            />
          </ListItem>
          
          <Divider />
          
          <ListItem>
            <ListItemIcon>
              <BackupIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Auto Backup" 
              secondary="Enable automatic data backup"
            />
            <ModernSwitch
              edge="end"
              checked={autoBackup}
              onChange={(e) => setAutoBackup(e.target.checked)}
            />
          </ListItem>
        </List>
      </Paper>
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          About
        </Typography>
        <Typography variant="body1" paragraph>
          Kermes POS is a point-of-sale system designed for managing products, 
          processing sales, and generating reports.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Version 1.0.0
        </Typography>
      </Paper>
    </Box>
  );
};

export default SettingsPage; 