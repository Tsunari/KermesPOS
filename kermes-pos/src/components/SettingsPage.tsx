import React, { ChangeEvent, useState, useEffect } from 'react';
import { Box, Typography, Paper, Divider, List, ListItem, ListItemIcon, ListItemText, Chip, Button, Select, MenuItem, FormControl, Badge } from '@mui/material';
import { Link } from 'react-router-dom';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SecurityIcon from '@mui/icons-material/Security';
import PaletteIcon from '@mui/icons-material/Palette';
import LanguageIcon from '@mui/icons-material/Language';
import BackupIcon from '@mui/icons-material/Backup';
import CodeIcon from '@mui/icons-material/Code';
import TouchAppIcon from '@mui/icons-material/TouchApp';
import SystemUpdateIcon from '@mui/icons-material/SystemUpdate';
import VisibilityIcon from '@mui/icons-material/Visibility';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ModernSwitch from './ui/ModernSwitch';
// import { productService } from '../services/productService';
import { useSettings } from '../context/SettingsContext';
import { useLanguage } from '../context/LanguageContext';

interface SettingsPageProps {
  devMode: boolean;
  setDevMode: (value: boolean) => void;
}

/**
 * The `SettingsPage` component renders a settings interface for the application.
 * It provides various configurable options such as appearance, notifications, 
 * security, language, and more. Each setting is displayed as a list item with 
 * an associated control (e.g., switch, dropdown, or button).
 *
 * @param {SettingsPageProps} props - The props for the `SettingsPage` component.
 * @param {boolean} props.devMode - Indicates whether the developer mode is enabled.
 * @param {(checked: boolean) => void} props.setDevMode - Callback to toggle developer mode.
 *
 * @returns {JSX.Element} The rendered `SettingsPage` component.
 *
 * @remarks
 * - This component uses the `useSettings` and `useLanguage` hooks to manage 
 *   application settings and localization.
 * - The `renderSettingItem` function is used to render individual settings 
 *   with a consistent layout and behavior.
 * - Includes a section for "About" information, displaying the app version 
 *   and a brief description.
 *
 * @example
 * ```tsx
 * <SettingsPage 
 *   devMode={true} 
 *   setDevMode={(checked) => console.log('Dev mode:', checked)} 
 * />
 * ```
 */
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
    autoBackup,
    setAutoBackup,
    showDescription,
    setShowDescription,
  } = useSettings();

  const { language, setLanguage, t } = useLanguage();

  // Update notification state
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateVersion, setUpdateVersion] = useState<string>('');

  // Listen for update status from electron
  useEffect(() => {
    if (typeof window !== 'undefined' && window.electronAPI?.update?.onStatus) {
      const unsubscribe = window.electronAPI.update.onStatus((payload: any) => {
        if (payload?.status === 'available' && payload?.info?.version) {
          setUpdateAvailable(true);
          setUpdateVersion(payload.info.version);
        } else if (payload?.status === 'not-available' || payload?.status === 'downloaded') {
          setUpdateAvailable(false);
        }
      });

      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, []);

  const handleOpenUpdate = () => {
    try {
      window.electronAPI?.update?.open?.();
    } catch (error) {
      console.error('Failed to open update window:', error);
    }
  };

  // const handleDefineDefault = () => {
  //   if (window.confirm(t('settings.developer.defineDefaultDescription'))) {
  //   productService.exportProducts();
  //     alert(t('settings.developer.defineDefaultSuccess'));
  //   }
  // };

  const renderSettingItem = (
    icon: React.ReactNode,
    primary: string,
    secondary: string,
    checked: boolean,
    onChange: (checked: boolean) => void,
    isActive: boolean = false,
    linkTo?: string
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
                label={t('common.active')}
                size="small"
                color="success"
                variant="outlined"
                sx={{ ml: 0 }}
              />
            )}
          </Box>
        }
        secondary={secondary}
      />
      {linkTo ? (
        <Button component={Link} to={linkTo} variant="outlined" size="small">
          {t('common.configure')}
        </Button>
      ) : (
        <ModernSwitch
          edge="end"
          checked={checked}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.checked)}
        />
      )}
    </ListItem>
  );

  const renderFormItem = (
    icon: React.ReactNode,
    primary: string,
    secondary: string,
    formControl: React.ReactNode,
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
                label={t('common.active')}
                size="small"
                color="success"
                variant="outlined"
                sx={{ ml: 0 }}
              />
            )}
          </Box>
        }
        secondary={secondary}
      />
      {formControl}
    </ListItem>
  );

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        {t('settings.title')}
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        {/* <Typography variant="h6" gutterBottom>
          {t('settings.appearance.title')}
        </Typography> */}

        <List>

          {renderSettingItem(
            <PaletteIcon />,
            t('settings.appearance.title'),
            t('settings.appearance.darkModeDescription'),
            appearance,
            setAppearance,
            true,
            "/settings/appearance"
          )}

          <Divider />

          {renderSettingItem(
            <VisibilityIcon />,
            t('settings.showDescription'),
            t('settings.showDescriptionDescription'),
            showDescription,
            setShowDescription,
            true
          )}

          <Divider />

          {renderSettingItem(
            <TouchAppIcon />,
            t('settings.doubleClick'),
            t('settings.doubleClickDescription'),
            useDoubleClick,
            setUseDoubleClick,
            true
          )}

          <Divider />

          {renderFormItem(
            <LanguageIcon />,
            t('settings.language.title'),
            t('settings.language.selectLanguage'),
            <FormControl sx={{ minWidth: 120 }}>
              <Select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                size="small"
              >
                <MenuItem value="en">{t('settings.language.languages.en')}</MenuItem>
                <MenuItem value="de">{t('settings.language.languages.de')}</MenuItem>
                <MenuItem value="tr">{t('settings.language.languages.tr')}</MenuItem>
              </Select>
            </FormControl>,
            true
          )}

          <Divider />

          {renderSettingItem(
            <CodeIcon />,
            t('settings.developer.devMode'),
            t('settings.developer.devModeDescription'),
            devMode,
            setDevMode,
            true
          )}

          <Divider />

          {renderSettingItem(
            <NotificationsIcon />,
            t('settings.notifications.enable'),
            t('settings.notifications.description'),
            notifications,
            setNotifications
          )}

          <Divider />

          {renderSettingItem(
            <SecurityIcon />,
            t('settings.security.enable'),
            t('settings.security.description'),
            security,
            setSecurity
          )}

          <Divider />

          {renderSettingItem(
            <BackupIcon />,
            t('settings.backup.autoBackup'),
            t('settings.backup.description'),
            autoBackup,
            setAutoBackup
          )}

          <Divider />

          <ListItem>
            <ListItemIcon>
              <MenuBookIcon />
            </ListItemIcon>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {t('products.title')}
                  <Chip
                    label={t('common.active')}
                    size="small"
                    color="success"
                    variant="outlined"
                    sx={{ ml: 0 }}
                  />
                </Box>
              }
              secondary={t('settings.menu.description') || 'Customer-facing menu showing name and price only'}
            />
            <Button component="a" href="/customer-menu.html" target="_blank" rel="noopener" variant="outlined" color="primary" sx={{ minWidth: 0, padding: '5px', mr: 1 }}>
              {t('common.show')}
            </Button>
            <Button component={Link} to="/settings/menu" variant="contained" color="primary" sx={{ minWidth: 0, padding: '5px' }}>
              {t('common.configure')}
            </Button>
          </ListItem>

          <Divider />

          <ListItem>
            <ListItemIcon>
              <Badge 
                badgeContent={updateAvailable ? '!' : 0} 
                color="error"
                overlap="circular"
              >
                <SystemUpdateIcon />
              </Badge>
            </ListItemIcon>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {t('app.updates.check') || 'Check for Updates'}
                  {updateAvailable ? (
                    <Chip
                      label={`v${updateVersion} ${t('app.updates.available') || 'Available'}`}
                      size="small"
                      color="warning"
                      variant="filled"
                      sx={{ ml: 0, fontWeight: 600 }}
                    />
                  ) : (
                    <Chip
                      label={t('common.active')}
                      size="small"
                      color="success"
                      variant="outlined"
                      sx={{ ml: 0 }}
                    />
                  )}
                </Box>
              }
              secondary={
                updateAvailable 
                  ? t('app.updates.newVersionAvailable') || `A new version (${updateVersion}) is available for download.`
                  : t('app.updates.checkDescription') || 'Check for and install software updates'
              }
            />
            <Button
              variant={updateAvailable ? "contained" : "outlined"}
              color={updateAvailable ? "warning" : "primary"}
              onClick={handleOpenUpdate}
              sx={{ minWidth: 0, padding: '5px' }}
            >
              {updateAvailable ? t('app.updates.download') || 'Update' : t('app.updates.check') || 'Check'}
            </Button>
          </ListItem>
        </List>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          {t('settings.about.title')}
        </Typography>
        <Typography variant="body1" paragraph>
          {t('settings.about.description')}
        </Typography>
        <Typography variant="body2" paragraph>
          Support:{' '}
          <Button
            variant="text"
            color="primary"
            component="a"
            href="mailto:talebelergfc@gmail.com?subject=Kermes%20POS%20Support"
            sx={{ textTransform: 'none', padding: '5px', minWidth: 0 }}
          >
            talebelergfc@gmail.com
          </Button>
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('settings.about.version')} {require('../../package.json').version || 'Problem with fetching version'}
        </Typography>
      </Paper>
    </Box>
  );
};

export default SettingsPage;