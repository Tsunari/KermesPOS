import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Alert,
  LinearProgress,
  CircularProgress,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Paper,
  Divider,
  Stack,
  useTheme,
  Tooltip
} from '@mui/material';
import CloudQueueIcon from '@mui/icons-material/CloudQueue';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import StorageIcon from '@mui/icons-material/Storage';
import LogoutIcon from '@mui/icons-material/Logout';
import { useLanguage } from '../context/LanguageContext';
import { Session } from '../types/session';
import { sessionService } from '../services/sessionService';
import { CartTransaction, cartTransactionService } from '../services/cartTransactionService';
import { firestoreSyncService, PlaceProfile } from '../services/firestoreSyncService';

const SyncPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const theme = useTheme();

  // Authentication state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [profile, setProfile] = useState<PlaceProfile | null>(null);
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Data states
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [sessionTransactions, setSessionTransactions] = useState<CartTransaction[]>([]);
  const [unsyncedCount, setUnsyncedCount] = useState(0);
  const [sessionRevenue, setSessionRevenue] = useState(0);
  
  // Sync states
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncStepText, setSyncStepText] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  // Check login on mount
  useEffect(() => {
    const savedProfile = firestoreSyncService.getPlaceProfile();
    if (savedProfile) {
      setProfile(savedProfile);
      loadSessions();
    }
  }, []);

  // Fetch local sessions
  const loadSessions = async () => {
    try {
      setLoading(true);
      const data = await sessionService.getAllSessions();
      setSessions(data);
      if (data.length > 0) {
        const savedSessionId = localStorage.getItem('pos.selectedSessionId');
        const sessionExists = data.some(s => s.id === savedSessionId);
        if (savedSessionId && sessionExists) {
          setSelectedSessionId(savedSessionId);
        } else {
          setSelectedSessionId(data[0].id);
          localStorage.setItem('pos.selectedSessionId', data[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load local sessions:", err);
      setError(t('app.sync.error_loading_sessions') || "An error occurred while loading local sessions.");
    } finally {
      setLoading(false);
    }
  };

  // Load session transactions stats when selectedSessionId changes
  useEffect(() => {
    if (!selectedSessionId) {
      setSessionTransactions([]);
      setUnsyncedCount(0);
      setSessionRevenue(0);
      return;
    }

    const loadSessionStats = async () => {
      try {
        const session = sessions.find(s => s.id === selectedSessionId);
        if (!session) return;

        const transactions = await cartTransactionService.getTransactions();
        
        // Filter transactions for this session
        const filtered = transactions.filter(tx => {
          if (tx.session_id) {
            return tx.session_id === session.id;
          }
          // Fallback to date range for legacy transactions
          const txDate = new Date(tx.transaction_date);
          const start = new Date(session.startDate);
          const end = session.endDate ? new Date(session.endDate) : new Date();
          return txDate >= start && txDate <= end;
        });

        setSessionTransactions(filtered);
        
        const unsynced = filtered.filter(tx => !tx.synced).length;
        setUnsyncedCount(unsynced);

        const revenue = filtered.reduce((sum, tx) => sum + tx.total_amount, 0);
        setSessionRevenue(revenue);
      } catch (err) {
        console.error("Failed to load session transaction stats:", err);
      }
    };

    loadSessionStats();
  }, [selectedSessionId, sessions]);

  // Handle Cashier/Place login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setAuthLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const placeProfile = await firestoreSyncService.loginPlace(email, password);
      setProfile(placeProfile);
      setSuccess(t('app.sync.login_success') || "Login successful!");
      
      // Load sessions after login
      await loadSessions();
    } catch (err: any) {
      console.error("Login failure:", err);
      setError(err.message || t('app.sync.login_failed') || "Login failed. Check your email and password.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      setLoading(true);
      await firestoreSyncService.logout();
      setProfile(null);
      setSessions([]);
      setSelectedSessionId('');
      setSessionTransactions([]);
      setUnsyncedCount(0);
      setSessionRevenue(0);
      setError(null);
      setSuccess(t('app.sync.logged_out') || "Logged out.");
    } catch (err) {
      console.error("Logout failure:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle synchronization trigger
  const handleSync = async () => {
    if (!selectedSessionId) return;
    const session = sessions.find(s => s.id === selectedSessionId);
    if (!session) return;

    setIsSyncing(true);
    setError(null);
    setSuccess(null);
    setSyncProgress(0);
    setSyncStepText(t('app.sync.sync_starting') || "Starting synchronization...");

    try {
      await firestoreSyncService.syncSession(
        session,
        sessionTransactions,
        (progress, text) => {
          setSyncProgress(progress);
          setSyncStepText(text);
        }
      );
      
      const successText = t('app.sync.sync_success') 
        ? t('app.sync.sync_success').replace('{name}', session.name)
        : `Session "${session.name}" successfully synchronized!`;
      setSuccess(successText);
      // Reload sessions and stats
      await loadSessions();
    } catch (err: any) {
      console.error("Sync failure:", err);
      const errMsg = err.message || t('app.sync.sync_failed') || "A cloud connection error occurred during synchronization.";
      setError(errMsg);

      // If the cloud session was completed, prompt the cashier if they want to sync local state
      if (err.message && err.message.includes("tamamlandı")) {
        const confirmMsg = t('app.sync.prompt_complete_local') || 
          `This session is marked as COMPLETED on the cloud. Do you also want to update the local session status to Completed?`;
        
        if (window.confirm(confirmMsg)) {
          try {
            await sessionService.completeSession(session.id);
            setSuccess(t('app.sync.local_complete_success') || `Local session status successfully updated to Completed!`);
            await loadSessions();
          } catch (localErr) {
            console.error("Failed to complete local session:", localErr);
            setError(t('app.sync.local_complete_error') || "Failed to update local session status.");
          }
        }
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const selectedSession = sessions.find(s => s.id === selectedSessionId);

  return (
    <Box sx={{ p: 4, maxWidth: 900, mx: 'auto' }}>
      {/* Page Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
            <CloudQueueIcon sx={{ fontSize: 36, color: 'primary.main' }} />
            {t('app.sync.title') || 'Cloud Synchronization'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('app.sync.description') || 'Securely transfer your local sales session data to the cloud administration panel'}
          </Typography>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}

      {!profile ? (
        // Login Screen
        <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <Box sx={{ width: '100%', maxWidth: 500 }}>
            <Card sx={{ borderRadius: 3, boxShadow: theme.shadows[6], overflow: 'hidden' }}>
              <Box sx={{ 
                bgcolor: 'primary.main', 
                color: 'primary.contrastText', 
                p: 3, 
                textAlign: 'center',
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`
              }}>
                <LockOpenIcon sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  {t('app.sync.login_title') || "Cashier / Place Login"}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>
                  {t('app.sync.login_subtitle') || "Log in with an authorized account to start the synchronization process"}
                </Typography>
              </Box>
              <CardContent sx={{ p: 4 }}>
                <form onSubmit={handleLogin}>
                  <Stack spacing={3}>
                    <TextField
                      fullWidth
                      label={t('app.sync.email') || "Email"}
                      type="email"
                      variant="outlined"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      disabled={authLoading}
                      required
                    />
                    <TextField
                      fullWidth
                      label={t('app.sync.password') || "Password"}
                      type="password"
                      variant="outlined"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      disabled={authLoading}
                      required
                    />
                    <Button
                      fullWidth
                      type="submit"
                      variant="contained"
                      size="large"
                      disabled={authLoading}
                      sx={{ py: 1.5, borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                    >
                      {authLoading ? <CircularProgress size={24} color="inherit" /> : (t('app.sync.login_btn') || "Login")}
                    </Button>
                  </Stack>
                </form>
              </CardContent>
            </Card>
          </Box>
        </Box>
      ) : (
        // Connected Sync Panel
        <Stack spacing={4}>
          {/* Connection Status Card */}
          <Paper sx={{ 
            p: 3, 
            borderRadius: 3, 
            background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.01)',
            border: `1.5px solid ${theme.palette.divider}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ 
                width: 48, 
                height: 48, 
                borderRadius: '50%', 
                bgcolor: 'success.light', 
                color: 'success.dark',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'pulse 2s infinite'
              }}>
                <LocationOnIcon />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                  {profile.kermesName}
                  <Box component="span" sx={{ 
                    width: 8, 
                    height: 8, 
                    borderRadius: '50%', 
                    bgcolor: 'success.main',
                    display: 'inline-block'
                  }} />
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('app.sync.active_place') || "Active POS Point"} • {profile.email}
                </Typography>
              </Box>
            </Box>

            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={handleLogout}
              startIcon={<LogoutIcon />}
              sx={{ borderRadius: 2, textTransform: 'none' }}
            >
              {t('app.sync.logout_btn') || "Logout"}
            </Button>
          </Paper>

          {/* Sync Operations Card */}
          <Card sx={{ borderRadius: 3, boxShadow: theme.shadows[4] }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CloudUploadIcon color="primary" />
                {t('app.sync.sync_data_title') || "Synchronize Session Data"}
              </Typography>

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : sessions.length === 0 ? (
                <Box sx={{
                  p: 4,
                  borderRadius: 3,
                  border: `2px dashed ${theme.palette.divider}`,
                  textAlign: 'center',
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                }}>
                  <StorageIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                    {t('app.sync.no_session_found') || "No session found to synchronize"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 420, mx: 'auto' }}>
                    {t('app.sync.no_session_desc1') || "To transfer data to the cloud, you must first create a sales session."}{' '}
                    {t('app.sync.no_session_desc2') || "Sessions group sales records for a kermes day."}
                  </Typography>
                  <Stack spacing={1.5} sx={{ textAlign: 'left', maxWidth: 380, mx: 'auto', mb: 4 }}>
                    {[
                      t('app.sync.step1') || "Go to the Sessions page.",
                      t('app.sync.step2') || "Create a new session and enter its name.",
                      t('app.sync.step3') || "Make sales — each transaction is saved to this session.",
                      t('app.sync.step4') || "Come back here and start the synchronization.",
                    ].map((step, i) => (
                      <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                        <Box sx={{
                          width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                          bgcolor: 'primary.main', color: 'primary.contrastText',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontWeight: 800, mt: 0.2,
                        }}>
                          {i + 1}
                        </Box>
                        <Typography variant="body2" color="text.secondary">{step}</Typography>
                      </Box>
                    ))}
                  </Stack>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => navigate('/sessions')}
                    startIcon={<StorageIcon />}
                    sx={{ borderRadius: 2.5, textTransform: 'none', fontWeight: 700, px: 4 }}
                  >
                    {t('app.sync.go_to_sessions') || "Go to Sessions Page"}
                  </Button>
                </Box>
              ) : (
                <Stack spacing={4}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel id="session-select-label">{t('app.sync.session_to_sync') || "Session to Synchronize"}</InputLabel>
                    <Select
                      labelId="session-select-label"
                      value={selectedSessionId}
                      onChange={e => {
                        const newId = e.target.value as string;
                        setSelectedSessionId(newId);
                        localStorage.setItem('pos.selectedSessionId', newId);
                      }}
                      label={t('app.sync.session_to_sync') || "Session to Synchronize"}
                      disabled={isSyncing}
                    >
                      {sessions.map(s => (
                        <MenuItem key={s.id} value={s.id}>
                          {s.name} ({s.status === 'active' ? (t('common.active') || 'Active') : s.status === 'paused' ? (t('app.sync.status_paused') || 'Paused') : (t('app.sync.status_completed') || 'Completed')})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {selectedSession && (
                    <Box sx={{ p: 3, borderRadius: 2, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', border: `1px solid ${theme.palette.divider}` }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <StorageIcon fontSize="small" color="secondary" />
                        {t('app.sync.session_stats') || "Session Statistics"}
                      </Typography>
                      
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2 }}>
                        <Box>
                          <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2, textAlign: 'center', boxShadow: theme.shadows[1] }}>
                            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase' }}>{t('app.sync.total_sales_count') || "Total Sales Count"}</Typography>
                            <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>{sessionTransactions.length}</Typography>
                          </Box>
                        </Box>
                        <Box>
                          <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2, textAlign: 'center', boxShadow: theme.shadows[1] }}>
                            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase' }}>{t('app.sync.total_revenue') || "Total Revenue"}</Typography>
                            <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5, color: 'primary.main' }}>€{sessionRevenue.toFixed(2)}</Typography>
                          </Box>
                        </Box>
                        <Box>
                          <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2, textAlign: 'center', boxShadow: theme.shadows[1] }}>
                            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase' }}>{t('app.sync.unsynced') || "Unsynced"}</Typography>
                            <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5, color: unsyncedCount > 0 ? 'warning.main' : 'success.main' }}>
                              {unsyncedCount}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>

                      {unsyncedCount === 0 && sessionTransactions.length > 0 && (
                        <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 1, color: 'success.main' }}>
                          <CloudDoneIcon />
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {t('app.sync.all_synced_success') || "All transaction data in this session is already fully synchronized and up to date with the cloud database."}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  )}

                  {/* Sync Button & Progress Indicator */}
                  <Box>
                    {isSyncing ? (
                      <Stack spacing={2} sx={{ mt: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                            {syncStepText}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {syncProgress}%
                          </Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={syncProgress} 
                          sx={{ height: 10, borderRadius: 5 }} 
                        />
                      </Stack>
                    ) : (
                      <Button
                        fullWidth
                        variant="contained"
                        size="large"
                        onClick={handleSync}
                        disabled={!selectedSessionId || isSyncing}
                        startIcon={<CloudUploadIcon />}
                        sx={{ py: 2, borderRadius: 2.5, textTransform: 'none', fontWeight: 700, fontSize: 16 }}
                      >
                        {unsyncedCount > 0 
                          ? (t('app.sync.start_sync_with_count') ? t('app.sync.start_sync_with_count').replace('{count}', String(unsyncedCount)) : `Start Cloud Synchronization (${unsyncedCount} New Transactions)`)
                          : (t('app.sync.resync') || "Resynchronize Cloud Data")}
                      </Button>
                    )}
                  </Box>
                </Stack>
              )}
            </CardContent>
          </Card>
        </Stack>
      )}

      {/* Styled JSX for animations */}
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.4); }
          70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(76, 175, 80, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(76, 175, 80, 0); }
        }
      `}</style>
    </Box>
  );
};

export default SyncPage;
