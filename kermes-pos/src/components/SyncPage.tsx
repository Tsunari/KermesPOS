import React, { useState, useEffect } from 'react';
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
        setSelectedSessionId(data[0].id);
      }
    } catch (err) {
      console.error("Failed to load local sessions:", err);
      setError("Lokal oturumlar yüklenirken bir hata oluştu.");
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
      setSuccess("Giriş işlemi başarılı!");
      
      // Load sessions after login
      await loadSessions();
    } catch (err: any) {
      console.error("Login failure:", err);
      setError(err.message || "Giriş yapılamadı. E-posta veya şifreyi kontrol edin.");
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
      setSuccess("Oturum kapatıldı.");
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
    setSyncStepText("Senkronizasyon başlatılıyor...");

    try {
      await firestoreSyncService.syncSession(
        session,
        sessionTransactions,
        (progress, text) => {
          setSyncProgress(progress);
          setSyncStepText(text);
        }
      );
      
      setSuccess(`"${session.name}" oturumu başarıyla senkronize edildi!`);
      // Reload sessions and stats
      await loadSessions();
    } catch (err: any) {
      console.error("Sync failure:", err);
      setError(err.message || "Senkronizasyon sırasında bulut bağlantı hatası oluştu.");
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
            {t('app.sync.title') || 'Bulut Senkronizasyonu'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('app.sync.description') || 'Lokal satış oturumu verilerinizi güvenli bir şekilde bulut yönetim paneline aktarın'}
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
                  Satış Noktası Girişi
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>
                  Senkronizasyon işlemini başlatmak için yetkili hesapla giriş yapın
                </Typography>
              </Box>
              <CardContent sx={{ p: 4 }}>
                <form onSubmit={handleLogin}>
                  <Stack spacing={3}>
                    <TextField
                      fullWidth
                      label="E-posta"
                      type="email"
                      variant="outlined"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      disabled={authLoading}
                      required
                    />
                    <TextField
                      fullWidth
                      label="Şifre"
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
                      {authLoading ? <CircularProgress size={24} color="inherit" /> : "Giriş Yap"}
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
                  Aktif Satış Noktası • {profile.email}
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
              Oturumu Kapat
            </Button>
          </Paper>

          {/* Sync Operations Card */}
          <Card sx={{ borderRadius: 3, boxShadow: theme.shadows[4] }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CloudUploadIcon color="primary" />
                Oturum Verilerini Senkronize Et
              </Typography>

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : sessions.length === 0 ? (
                <Alert severity="warning" sx={{ borderRadius: 2 }}>
                  Senkronize edilecek herhangi bir lokal oturum kaydı bulunamadı. Lütfen önce POS ana ekranında bir oturum başlatıp satış yapın.
                </Alert>
              ) : (
                <Stack spacing={4}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel id="session-select-label">Senkronize Edilecek Oturum</InputLabel>
                    <Select
                      labelId="session-select-label"
                      value={selectedSessionId}
                      onChange={e => setSelectedSessionId(e.target.value as string)}
                      label="Senkronize Edilecek Oturum"
                      disabled={isSyncing}
                    >
                      {sessions.map(s => (
                        <MenuItem key={s.id} value={s.id}>
                          {s.name} ({s.status === 'active' ? 'Aktif' : s.status === 'paused' ? 'Duraklatıldı' : 'Tamamlandı'})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {selectedSession && (
                    <Box sx={{ p: 3, borderRadius: 2, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', border: `1px solid ${theme.palette.divider}` }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <StorageIcon fontSize="small" color="secondary" />
                        Oturum İstatistikleri
                      </Typography>
                      
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2 }}>
                        <Box>
                          <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2, textAlign: 'center', boxShadow: theme.shadows[1] }}>
                            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase' }}>Toplam Satış Adedi</Typography>
                            <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>{sessionTransactions.length}</Typography>
                          </Box>
                        </Box>
                        <Box>
                          <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2, textAlign: 'center', boxShadow: theme.shadows[1] }}>
                            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase' }}>Toplam Tutar</Typography>
                            <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5, color: 'primary.main' }}>€{sessionRevenue.toFixed(2)}</Typography>
                          </Box>
                        </Box>
                        <Box>
                          <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2, textAlign: 'center', boxShadow: theme.shadows[1] }}>
                            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase' }}>Senkronize Edilmeyen</Typography>
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
                            Bu oturumdaki tüm işlem verileri zaten bulut veritabanıyla tam uyumlu ve güncel.
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
                          ? `Bulut Senkronizasyonunu Başlat (${unsyncedCount} Yeni İşlem)` 
                          : "Bulut Verilerini Yeniden Senkronize Et"}
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
