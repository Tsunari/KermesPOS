import React, { ChangeEvent } from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SecurityIcon from '@mui/icons-material/Security';
import PaletteIcon from '@mui/icons-material/Palette';
import LanguageIcon from '@mui/icons-material/Language';
import BackupIcon from '@mui/icons-material/Backup';
import CodeIcon from '@mui/icons-material/Code';
import TouchAppIcon from '@mui/icons-material/TouchApp';
import ModernSwitch from './ui/ModernSwitch';
import { productService } from '../services/productService';
import { useSettings } from '../context/SettingsContext';
import VisibilityIcon from '@mui/icons-material/Visibility';

interface SettingsPageProps {
  devMode: boolean;
  setDevMode: (value: boolean) => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ devMode, setDevMode }) => {
  const {
    useDoubleClick,
    setUseDoubleClick,
    notifications,
    setNotifications,
    security,
    setSecurity,
    appearance,
    setAppearance,
    language,
    setLanguage,
    autoBackup,
    setAutoBackup,
    showDescription,
    setShowDescription,
  } = useSettings();

  const handleDefineDefault = () => {
    if (window.confirm('Are you sure you want to define the current product list as the default? This will update the source code and cannot be undone.')) {
      const jsonString = productService.exportProducts();
      // In a real application, this would make an API call to update the source code
      alert('Default products updated successfully! (Note: In a real application, this would update the source code)');
    }
  };

  const renderSettingItem = (
    icon: React.ReactNode,
    primary: string,
    secondary: string,
    checked: boolean,
    onChange: (checked: boolean) => void,
    isActive: boolean = false
  ) => (
    <ListItem>
      <ListItemIcon>
        {icon}
      </ListItemIcon>
      <ListItemText 
        primary={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {primary}
            {isActive && (
              <Chip
                label="Active"
                size="small"
                color="success"
                sx={{ ml: 1 }}
              />
            )}
          </Box>
        }
        secondary={secondary}
      />
      <ModernSwitch
        edge="end"
        checked={checked}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.checked)}
      />
    </ListItem>
  );

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
          {renderSettingItem(
            <CodeIcon />,
            "Dev Mode",
            "Enable developer features for advanced product management",
            devMode,
            setDevMode,
            true
          )}
          
          <Divider />
          
          {renderSettingItem(
            <TouchAppIcon />,
            "Double-Click to Add",
            "Toggle between double-click and single-click to add items to cart",
            useDoubleClick,
            setUseDoubleClick,
            true
          )}
          
          <Divider />
          
          {renderSettingItem(
            <VisibilityIcon />,
            "Show Descriptions",
            "Display product descriptions in the product grid",
            showDescription,
            setShowDescription,
            true
          )}
          
          <Divider />
          
          {renderSettingItem(
            <NotificationsIcon />,
            "Notifications",
            "Configure notification settings",
            notifications,
            setNotifications
          )}
          
          <Divider />
          
          {renderSettingItem(
            <SecurityIcon />,
            "Security",
            "Manage security settings",
            security,
            setSecurity
          )}
          
          <Divider />
          
          {renderSettingItem(
            <PaletteIcon />,
            "Appearance",
            "Customize the look and feel",
            appearance,
            setAppearance
          )}
          
          <Divider />
          
          {renderSettingItem(
            <LanguageIcon />,
            "Language",
            "Change application language",
            language,
            setLanguage
          )}
          
          <Divider />
          
          {renderSettingItem(
            <BackupIcon />,
            "Auto Backup",
            "Enable automatic data backup",
            autoBackup,
            setAutoBackup
          )}
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