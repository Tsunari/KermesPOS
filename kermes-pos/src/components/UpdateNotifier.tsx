import React, { useEffect, useState } from 'react';
import { Snackbar, Alert, Button } from '@mui/material';

const UpdateNotifier: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<'info' | 'warning' | 'success' | 'error'>('info');
  const [actionLabel, setActionLabel] = useState<string | null>(null);
  const [actionFn, setActionFn] = useState<(() => void) | null>(null);

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

    return () => {
      if (unsubStatus) unsubStatus();
      if (unsubNotif) unsubNotif();
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
  );
};

export default UpdateNotifier;
