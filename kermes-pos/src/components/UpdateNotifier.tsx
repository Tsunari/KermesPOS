import React, { useEffect, useState } from 'react';
import { Snackbar, Alert, Button, LinearProgress, Box, Typography } from '@mui/material';

const UpdateNotifier: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<'info' | 'warning' | 'success' | 'error'>('info');
  const [actionLabel, setActionLabel] = useState<string | null>(null);
  const [actionFn, setActionFn] = useState<(() => void) | null>(null);
  const [progressVisible, setProgressVisible] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);

  useEffect(() => {
    // Subscribe to status events (primary source)
    const unsubStatus = window.electronAPI?.update?.onStatus?.((payload: any) => {
      if (!payload) return;
      if (payload.status === 'available') {
        setSeverity('warning');
        setMessage(`Update available: v${payload.info?.version || ''}`);
        setActionLabel('Open');
        setActionFn(() => () => window.electronAPI?.update?.open?.());
        setOpen(true);
      } else if (payload.status === 'downloaded') {
        setSeverity('success');
        setMessage(`Update downloaded: v${payload.info?.version || ''}`);
        setActionLabel('Install');
        setActionFn(() => () => window.electronAPI?.update?.install?.());
        setOpen(true);
      }
    });

    // Also subscribe to explicit notifications from main process
    const unsubNotif = window.electronAPI?.update?.onNotification?.((payload: any) => {
      if (!payload) return;
      if (payload.type === 'available') {
        setSeverity('warning');
        setMessage(`Update available: v${payload.version || ''}`);
        setActionLabel('Open');
        setActionFn(() => () => window.electronAPI?.update?.open?.());
        setOpen(true);
      } else if (payload.type === 'downloaded') {
        setSeverity('success');
        setMessage(`Update ready: v${payload.version || ''}`);
        setActionLabel('Install');
        setActionFn(() => () => window.electronAPI?.update?.install?.());
        setOpen(true);
      }
    });

    // Subscribe to progress events
    const unsubProgress = window.electronAPI?.update?.onProgress?.((payload: any) => {
      if (!payload) return;
      if (payload.percent !== undefined) {
        setProgressPercent(Math.max(0, Math.min(100, Math.round(payload.percent))));
        setProgressVisible(true);
      }
    });

    // Hide progress when status indicates finished/error
    const unsubStatus2 = window.electronAPI?.update?.onStatus?.((payload: any) => {
      if (!payload) return;
      if (payload.status === 'downloaded' || payload.status === 'not-available' || payload.status === 'error') {
        setProgressVisible(false);
        setProgressPercent(0);
      }
    });

    return () => {
      if (unsubStatus) unsubStatus();
      if (unsubNotif) unsubNotif();
      if (unsubProgress) unsubProgress();
      if (unsubStatus2) unsubStatus2();
    };
  }, []);

  const handleClose = (_?: any, reason?: string) => {
    if (reason === 'clickaway') return;
    setOpen(false);
  };

  const handleAction = () => {
    if (actionFn) actionFn();
    setOpen(false);
  };

  return (
    <>
      {/* Top progress bar shown while downloading */}
      {progressVisible && (
        <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1400 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="body2" sx={{ py: 0.5 }}>Downloading update...</Typography>
            <Typography variant="body2" sx={{ py: 0.5 }}>{progressPercent}%</Typography>
          </Box>
          <LinearProgress variant="determinate" value={progressPercent} sx={{ height: 6 }} />
        </Box>
      )}

      <Snackbar open={open} autoHideDuration={10000} onClose={handleClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert
          onClose={handleClose}
          severity={severity}
          sx={{ width: '100%' }}
          action={
            actionLabel ? (
              <Button color="inherit" size="small" onClick={handleAction}>
                {actionLabel}
              </Button>
            ) : null
          }
        >
          {message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default UpdateNotifier;
