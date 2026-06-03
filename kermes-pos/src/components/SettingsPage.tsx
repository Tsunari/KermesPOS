import React, { ChangeEvent, useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  Button,
  Select,
  MenuItem,
  FormControl,
  Badge,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  Stack,
  Chip,
  Alert,
  Snackbar,
} from '@mui/material';
import { Link } from 'react-router-dom';
import { useTheme as useMuiTheme } from '@mui/material/styles';

// Icons
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
import InfoIcon from '@mui/icons-material/Info';
import StorageIcon from '@mui/icons-material/Storage';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import SettingsBackupRestoreIcon from '@mui/icons-material/SettingsBackupRestore';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';

import ModernSwitch from './ui/ModernSwitch';
import { useSettings } from '../context/SettingsContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { productService } from '../services/productService';
import { cartTransactionService } from '../services/cartTransactionService';

interface SettingsPageProps {
  devMode: boolean;
  setDevMode: (value: boolean) => void;
  currencyManagedByCloud?: boolean;
}

interface SettingCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  control: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}

const SettingCard: React.FC<SettingCardProps> = ({ icon, title, description, control, active = false, onClick }) => {
  const muiTheme = useMuiTheme();
  return (
    <Card 
      variant="outlined" 
      onClick={onClick}
      sx={{ 
        mb: 2, 
        borderRadius: 2.5, 
        borderColor: active ? 'primary.main' : 'divider',
        boxShadow: active ? '0 4px 12px rgba(65, 120, 245, 0.04)' : 'none',
        bgcolor: active ? (muiTheme.palette.mode === 'dark' ? 'rgba(65, 120, 245, 0.02)' : 'rgba(65, 120, 245, 0.01)') : 'background.paper',
        transition: 'all 0.25s ease',
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': {
          borderColor: 'primary.main',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.02)'
        }
      }}
    >
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Stack direction="row" alignItems="center" spacing={2.5}>
          <Box sx={{ 
            p: 1.5, 
            borderRadius: 2, 
            bgcolor: active ? 'rgba(65, 120, 245, 0.08)' : 'action.hover', 
            color: active ? 'primary.main' : 'text.secondary',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.25s ease'
          }}>
            {icon}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2, mb: 0.5 }}>
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          </Box>
          <Box sx={{ pointerEvents: onClick ? 'none' : 'auto' }}>
            {control}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

const semverCompare = (v1: string, v2: string): number => {
  const p1 = String(v1).replace(/^v/, '').split('.').map(Number);
  const p2 = String(v2).replace(/^v/, '').split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const n1 = isNaN(p1[i]) ? 0 : p1[i];
    const n2 = isNaN(p2[i]) ? 0 : p2[i];
    if (n1 > n2) return 1;
    if (n1 < n2) return -1;
  }
  return 0;
};

const SettingsPage: React.FC<SettingsPageProps> = ({ devMode, setDevMode, currencyManagedByCloud = false }) => {
  const muiTheme = useMuiTheme();
  const { isDarkMode, toggleTheme } = useTheme();
  const {
    useDoubleClick,
    setUseDoubleClick,
    notifications,
    setNotifications,
    security,
    setSecurity,
    autoBackup,
    setAutoBackup,
    showDescription,
    setShowDescription,
    showPageScrollbars,
    setShowPageScrollbars,
    showComponentScrollbars,
    setShowComponentScrollbars,
    setAppearance,
    setShowScrollbars,
    currency,
    setCurrency,
  } = useSettings();

  const { language, setLanguage, t } = useLanguage();

  // Active Category Tab index (persisted in localStorage)
  const [activeTab, setActiveTabState] = useState(() => {
    const saved = localStorage.getItem('settings_active_tab');
    return saved ? parseInt(saved, 10) : 0;
  });

  const setActiveTab = (newValue: number) => {
    setActiveTabState(newValue);
    localStorage.setItem('settings_active_tab', newValue.toString());
  };
  
  // Update system states
  const [updateAvailable, setUpdateAvailable] = useState<boolean>(() => {
    return !!localStorage.getItem('pending_update_version');
  });
  const [updateVersion, setUpdateVersion] = useState<string>(() => {
    return localStorage.getItem('pending_update_version') || '';
  });

  // Diagnostic states
  const [dbStats, setDbStats] = useState({
    productsCount: 0,
    transactionsCount: 0,
    estimatedBytes: 0,
  });

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Load diagnostics and updates on mount
  useEffect(() => {
    loadDiagnostics();

    // Check on mount if we've already updated to or past the pending version
    const runningVersion = require('../../package.json').version;
    const pendingVersion = localStorage.getItem('pending_update_version');
    if (pendingVersion && semverCompare(runningVersion, pendingVersion) >= 0) {
      localStorage.removeItem('pending_update_version');
      setUpdateAvailable(false);
      setUpdateVersion('');
    }

    // Listen for update status from electron
    if (typeof window !== 'undefined' && window.electronAPI?.update?.onStatus) {
      const unsubscribe = window.electronAPI.update.onStatus((payload: any) => {
        if (payload?.status === 'available' && payload?.info?.version) {
          localStorage.setItem('pending_update_version', payload.info.version);
          setUpdateAvailable(true);
          setUpdateVersion(payload.info.version);
        } else if (payload?.status === 'not-available') {
          localStorage.removeItem('pending_update_version');
          setUpdateAvailable(false);
          setUpdateVersion('');
        }
      });

      let unsubscribeApplied: (() => void) | undefined;
      if (window.electronAPI.update.onApplied) {
        unsubscribeApplied = window.electronAPI.update.onApplied(() => {
          localStorage.removeItem('pending_update_version');
          setUpdateAvailable(false);
          setUpdateVersion('');
        });
      }

      return () => {
        if (unsubscribe) unsubscribe();
        if (unsubscribeApplied) unsubscribeApplied();
      };
    }
  }, []);

  const loadDiagnostics = async () => {
    try {
      const products = productService.getAllProducts();
      let transactionsList = [];
      try {
        transactionsList = await cartTransactionService.getTransactions();
      } catch (err) {
        console.warn('Failed to load transactions for diagnostics', err);
      }

      // Approximate storage bytes calculation
      const productsLen = localStorage.getItem('products')?.length || 0;
      const settingsLen = localStorage.getItem('settings')?.length || 0;
      const backupsLen = localStorage.getItem('products_backups')?.length || 0;
      const totalBytes = (productsLen + settingsLen + backupsLen) * 2; // rough UTF-16 bytes estimation

      setDbStats({
        productsCount: products.length,
        transactionsCount: transactionsList.length,
        estimatedBytes: totalBytes,
      });
    } catch (e) {
      console.error('Diagnostics loading failed:', e);
    }
  };

  const handleOpenUpdate = () => {
    try {
      window.electronAPI?.update?.open?.();
    } catch (error) {
      console.error('Failed to open update window:', error);
    }
  };

  const handleFactoryReset = () => {
    if (window.confirm(t('settings.factoryReset.confirm') || 'Reset all options to default?')) {
      // Clear settings from localStorage
      localStorage.removeItem('settings');
      
      // Trigger contexts reload to defaults
      setUseDoubleClick(false);
      setNotifications(true);
      setSecurity(false);
      setAutoBackup(false);
      setShowDescription(false);
      setShowPageScrollbars(false);
      setShowComponentScrollbars(true);
      
      // Update states
      setSnackbar({
        open: true,
        message: t('settings.factoryReset.success') || 'Settings reset to default successfully!',
        severity: 'success'
      });
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ p: 1, maxWidth: 1100, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
        {t('settings.title')}
      </Typography>

      <Grid container spacing={3}>
        {/* Left Column: Sidebar Category Selector */}
        <Grid size={{ xs: 12, md: 4, lg: 3 }}>
          <Paper 
            elevation={0} 
            sx={{ 
              border: `1.5px solid ${muiTheme.palette.divider}`, 
              borderRadius: 3, 
              overflow: 'hidden',
              bgcolor: 'background.paper',
            }}
          >
            <Tabs
              orientation="vertical"
              value={activeTab}
              onChange={handleTabChange}
              sx={{
                borderRight: 0,
                '& .MuiTabs-indicator': {
                  left: 0,
                  width: '4px',
                  borderRadius: '0 4px 4px 0',
                },
                '& .MuiTab-root': {
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  textAlign: 'left',
                  py: 2.8,
                  px: 3,
                  fontWeight: 700,
                  fontSize: '1.12rem',
                  color: 'text.secondary',
                  borderBottom: `1px solid ${muiTheme.palette.divider}`,
                  textTransform: 'none',
                  transition: 'all 0.2s ease',
                  '&.Mui-selected': {
                    color: 'primary.main',
                    bgcolor: muiTheme.palette.mode === 'dark' ? 'rgba(37, 99, 235, 0.04)' : 'rgba(37, 99, 235, 0.01)',
                  },
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                },
              }}
            >
              <Tab icon={<PaletteIcon sx={{ mr: 1, fontSize: 20 }} />} iconPosition="start" label={t('settings.tabs.appearance') || 'Appearance'} />
              <Tab icon={<TouchAppIcon sx={{ mr: 1, fontSize: 20 }} />} iconPosition="start" label={t('settings.tabs.behavior') || 'Behavior'} />
              <Tab icon={<LanguageIcon sx={{ mr: 1, fontSize: 20 }} />} iconPosition="start" label={t('settings.tabs.language') || 'Language'} />
              <Tab icon={<BackupIcon sx={{ mr: 1, fontSize: 20 }} />} iconPosition="start" label={t('settings.tabs.security') || 'Security & Backup'} />
              <Tab 
                icon={
                  <Badge variant="dot" color="error" invisible={!updateAvailable}>
                    <InfoIcon sx={{ mr: 1, fontSize: 20 }} />
                  </Badge>
                } 
                iconPosition="start" 
                label={t('settings.tabs.system') || 'System & About'} 
              />
            </Tabs>
          </Paper>
        </Grid>

        {/* Right Column: Tab Panel Content */}
        <Grid size={{ xs: 12, md: 8, lg: 9 }}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              border: `1.5px solid ${muiTheme.palette.divider}`, 
              borderRadius: 3, 
              bgcolor: 'background.paper',
              minHeight: 400
            }}
          >
            {/* TAB 0: APPEARANCE */}
            {activeTab === 0 && (
              <Box>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 800, mb: 3 }}>
                  {t('settings.tabs.appearance') || 'Appearance Settings'}
                </Typography>

                <SettingCard
                  icon={<PaletteIcon />}
                  title={t('settings.appearance.darkMode')}
                  description={t('settings.appearance.darkModeDescription')}
                  control={
                    <ModernSwitch
                      checked={isDarkMode}
                      onChange={toggleTheme}
                    />
                  }
                  active={isDarkMode}
                  onClick={toggleTheme}
                />

                <SettingCard
                  icon={<VisibilityIcon />}
                  title={t('settings.appearance.pageScrollbars')}
                  description={t('settings.appearance.pageScrollbarsDescription')}
                  control={
                    <ModernSwitch
                      checked={showPageScrollbars}
                      onChange={(e) => setShowPageScrollbars(e.target.checked)}
                    />
                  }
                  active={showPageScrollbars}
                  onClick={() => setShowPageScrollbars(!showPageScrollbars)}
                />

                <SettingCard
                  icon={<ViewColumnIcon />}
                  title={t('settings.appearance.componentScrollbars')}
                  description={t('settings.appearance.componentScrollbarsDescription')}
                  control={
                    <ModernSwitch
                      checked={showComponentScrollbars}
                      onChange={(e) => setShowComponentScrollbars(e.target.checked)}
                    />
                  }
                  active={showComponentScrollbars}
                  onClick={() => setShowComponentScrollbars(!showComponentScrollbars)}
                />
              </Box>
            )}

            {/* TAB 1: BEHAVIOR */}
            {activeTab === 1 && (
              <Box>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 800, mb: 3 }}>
                  {t('settings.tabs.behavior') || 'General & Behavior'}
                </Typography>

                <SettingCard
                  icon={<VisibilityIcon />}
                  title={t('settings.showDescription')}
                  description={t('settings.showDescriptionDescription')}
                  control={
                    <ModernSwitch
                      checked={showDescription}
                      onChange={(e) => setShowDescription(e.target.checked)}
                    />
                  }
                  active={showDescription}
                  onClick={() => setShowDescription(!showDescription)}
                />

                <SettingCard
                  icon={<TouchAppIcon />}
                  title={t('settings.doubleClick')}
                  description={t('settings.doubleClickDescription')}
                  control={
                    <ModernSwitch
                      checked={useDoubleClick}
                      onChange={(e) => setUseDoubleClick(e.target.checked)}
                    />
                  }
                  active={useDoubleClick}
                  onClick={() => setUseDoubleClick(!useDoubleClick)}
                />

                <SettingCard
                  icon={<MenuBookIcon />}
                  title={t('settings.menu.configuratorTitle')}
                  description={t('settings.menu.configuratorDescription')}
                  control={
                    <Button 
                      component={Link} 
                      to="/settings/menu" 
                      variant="contained" 
                      size="small"
                      sx={{ borderRadius: 2 }}
                    >
                      {t('common.configure')}
                    </Button>
                  }
                  active={true}
                />
              </Box>
            )}

            {/* TAB 2: LANGUAGE */}
            {activeTab === 2 && (
              <Box>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 800, mb: 3 }}>
                  {t('settings.language.title')}
                </Typography>

                <SettingCard
                  icon={<LanguageIcon />}
                  title={t('settings.language.selectLanguage')}
                  description={t('settings.language.description')}
                  control={
                    <FormControl sx={{ minWidth: 140 }}>
                      <Select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value as any)}
                        size="small"
                        sx={{ borderRadius: 2 }}
                      >
                        <MenuItem value="en">{t('settings.language.languages.en')}</MenuItem>
                        <MenuItem value="de">{t('settings.language.languages.de')}</MenuItem>
                        <MenuItem value="tr">{t('settings.language.languages.tr')}</MenuItem>
                      </Select>
                    </FormControl>
                  }
                  active={true}
                />

                <SettingCard
                  icon={<AttachMoneyIcon />}
                  title={t('settings.currency.title')}
                  description={t('settings.currency.description')}
                  control={
                    <Stack spacing={1} alignItems="flex-start">
                      <FormControl sx={{ minWidth: 140 }}>
                        <Select
                          value={currency}
                          onChange={(e) => setCurrency(e.target.value as any)}
                          size="small"
                          sx={{ borderRadius: 2 }}
                          disabled={currencyManagedByCloud}
                        >
                          <MenuItem value="EUR">{t('settings.currency.options.eur')}</MenuItem>
                          <MenuItem value="USD">{t('settings.currency.options.usd')}</MenuItem>
                          <MenuItem value="TRY">{t('settings.currency.options.try')}</MenuItem>
                        </Select>
                      </FormControl>
                      {currencyManagedByCloud && (
                        <Typography variant="caption" color="text.secondary">
                          {t('settings.currency.cloudManagedHint')}
                        </Typography>
                      )}
                    </Stack>
                  }
                  active={currencyManagedByCloud}
                />
              </Box>
            )}

            {/* TAB 3: SECURITY & BACKUP */}
            {activeTab === 3 && (
              <Box>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 800, mb: 3 }}>
                  {t('settings.tabs.security')}
                </Typography>

                <SettingCard
                  icon={<CodeIcon />}
                  title={t('settings.developer.devMode')}
                  description={t('settings.developer.devModeDescription')}
                  control={
                    <ModernSwitch
                      checked={devMode}
                      onChange={(e) => setDevMode(e.target.checked)}
                    />
                  }
                  active={devMode}
                  onClick={() => setDevMode(!devMode)}
                />

                <SettingCard
                  icon={<NotificationsIcon />}
                  title={t('settings.notifications.enable')}
                  description={t('settings.notifications.description')}
                  control={
                    <ModernSwitch
                      checked={notifications}
                      onChange={(e) => setNotifications(e.target.checked)}
                    />
                  }
                  active={notifications}
                  onClick={() => setNotifications(!notifications)}
                />

                <SettingCard
                  icon={<SecurityIcon />}
                  title={t('settings.security.enable')}
                  description={t('settings.security.description')}
                  control={
                    <ModernSwitch
                      checked={security}
                      onChange={(e) => setSecurity(e.target.checked)}
                    />
                  }
                  active={security}
                  onClick={() => setSecurity(!security)}
                />

                <SettingCard
                  icon={<BackupIcon />}
                  title={t('settings.backup.autoBackup')}
                  description={t('settings.backup.description')}
                  control={
                    <ModernSwitch
                      checked={autoBackup}
                      onChange={(e) => setAutoBackup(e.target.checked)}
                    />
                  }
                  active={autoBackup}
                  onClick={() => setAutoBackup(!autoBackup)}
                />
              </Box>
            )}

            {/* TAB 4: SYSTEM & ABOUT */}
            {activeTab === 4 && (
              <Box>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 800, mb: 3 }}>
                  {t('settings.about.title')}
                </Typography>

                {/* About Content */}
                <Typography variant="body2" paragraph sx={{ lineHeight: 1.6, color: 'text.secondary' }}>
                  {t('settings.about.description')}
                </Typography>
                <Typography variant="body2" paragraph sx={{ mb: 3 }}>
                  <strong>{t('settings.about.supportEmail')}:</strong>{' '}
                  <Button
                    variant="text"
                    color="primary"
                    component="a"
                    href="mailto:talebelergfc@gmail.com?subject=Kermes%20POS%20Support"
                    sx={{ textTransform: 'none', px: 0.5, py: 0, minWidth: 0, fontWeight: 700 }}
                  >
                    talebelergfc@gmail.com
                  </Button>
                </Typography>

                <Grid container spacing={3} sx={{ mb: 3 }}>
                  {/* Info widgets */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2.5, display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(37, 99, 235, 0.06)', color: 'primary.main' }}>
                        <StorageIcon />
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 600 }}>
                          {t('settings.diagnostics.title') || 'System Diagnostics'}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {dbStats.productsCount} {t('settings.diagnostics.products')} | {dbStats.transactionsCount} {t('settings.diagnostics.sales')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {t('settings.diagnostics.approxSize')}: {(dbStats.estimatedBytes / 1024).toFixed(1)} KB
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Paper 
                      variant="outlined" 
                      sx={{ 
                        p: 2.5, 
                        borderRadius: 2.5, 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 2,
                        borderColor: updateAvailable ? 'warning.main' : 'divider',
                        bgcolor: updateAvailable ? 'rgba(237, 108, 2, 0.02)' : 'transparent'
                      }}
                    >
                      <Box sx={{ 
                        p: 1.5, 
                        borderRadius: 2, 
                        bgcolor: updateAvailable ? 'rgba(237, 108, 2, 0.08)' : 'rgba(0, 0, 0, 0.03)', 
                        color: updateAvailable ? 'warning.main' : 'text.secondary' 
                      }}>
                        <SystemUpdateIcon />
                      </Box>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 600 }}>
                          {t('settings.about.version') || 'Version'}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          v{require('../../package.json').version || 'Unknown'}
                        </Typography>
                        {updateAvailable && (
                          <Chip 
                            label={`v${updateVersion} ${t('app.updates.available')}`} 
                            size="small" 
                            color="warning" 
                            sx={{ mt: 0.5, height: 20, fontSize: '0.65rem', fontWeight: 700 }} 
                          />
                        )}
                      </Box>
                      {updateAvailable ? (
                        <Button 
                          variant="contained" 
                          color="warning" 
                          size="small" 
                          onClick={handleOpenUpdate}
                          sx={{ borderRadius: 1.5, px: 2 }}
                        >
                          {t('app.updates.download')}
                        </Button>
                      ) : (
                        <Button 
                          variant="outlined" 
                          size="small" 
                          onClick={handleOpenUpdate}
                          sx={{ borderRadius: 1.5, px: 2 }}
                        >
                          {t('app.updates.check')}
                        </Button>
                      )}
                    </Paper>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                {/* Actions */}
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                  {t('settings.about.administrativeActions')}
                </Typography>
                
                <Stack direction="row" spacing={2}>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<SettingsBackupRestoreIcon />}
                    onClick={handleFactoryReset}
                    sx={{ borderRadius: 2 }}
                  >
                    {t('settings.factoryReset.button') || 'Reset All Settings'}
                  </Button>
                  <Button
                    variant="outlined"
                    endIcon={<OpenInNewIcon />}
                    component="a"
                    href="/customer-menu.html"
                    target="_blank"
                    rel="noopener"
                    sx={{ borderRadius: 2 }}
                  >
                    {t('settings.about.openCustomerMenu')}
                  </Button>
                </Stack>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%', borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SettingsPage;