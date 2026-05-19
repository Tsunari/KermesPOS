import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Alert,
  Stack,
  Chip,
  Divider,
  IconButton,
  Paper
} from '@mui/material';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import CloseIcon from '@mui/icons-material/Close';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SaveIcon from '@mui/icons-material/Save';

const STORAGE_KEY = 'pos.printHotkey';

function formatDisplay(h?: string | null) {
  if (!h) return 'Space';
  return h.replace(/Control/g, 'Ctrl').replace(/Meta/g, 'Meta');
}

function isModifierOnly(keyStr: string) {
  const parts = keyStr.split('+').map(p => p.trim()).filter(Boolean);
  const nonMod = parts.filter(p => !['Control', 'Ctrl', 'Alt', 'Shift', 'Meta', 'Cmd', 'Command'].includes(p));
  return nonMod.length === 0;
}

const HotkeySettings: React.FC = () => {
  const [hotkey, setHotkey] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY));
  const [open, setOpen] = useState(false);
  const [captured, setCaptured] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handler = () => {
      setOpen(true);
      setCaptured(null);
      setError(null);
    };
    // Listen for custom event to open dialog from other components (e.g., badge click)
    window.addEventListener('openHotkeyDialog', handler as EventListener);
    return () => window.removeEventListener('openHotkeyDialog', handler as EventListener);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    setHotkey(saved);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      e.preventDefault();
      const parts: string[] = [];
      if (e.ctrlKey) parts.push('Control');
      if (e.altKey) parts.push('Alt');
      if (e.shiftKey) parts.push('Shift');
      if (e.metaKey) parts.push('Meta');

      let keyPart = e.key === ' ' ? 'Space' : e.key;
      if (keyPart === 'Escape') keyPart = 'Esc';
      parts.push(keyPart);
      const normalized = parts.join('+');
      setCaptured(normalized);
      setError(null);
    };
    window.addEventListener('keydown', onKey, { capture: true });
    return () => window.removeEventListener('keydown', onKey, { capture: true } as any);
  }, [open]);

  const handleSave = () => {
    if (!captured) {
      setError('Press a key to capture it');
      return;
    }
    if (isModifierOnly(captured)) {
      setError('Choose a non-modifier key together with modifiers.');
      return;
    }
    localStorage.setItem(STORAGE_KEY, captured);
    setHotkey(captured);
    try {
      window.dispatchEvent(new CustomEvent('hotkeyChanged', { detail: captured }));
    } catch (err) {
      // ignore
    }
    setOpen(false);
  };

  const handleReset = () => {
    localStorage.removeItem(STORAGE_KEY);
    setHotkey(null);
    try {
      window.dispatchEvent(new CustomEvent('hotkeyChanged', { detail: null }));
    } catch (err) {
      // ignore
    }
    setCaptured(null);
    setError(null);
  };

  const partsForChips = (s?: string | null) => {
    if (!s) return ['Space'];
    return s.split('+').map(p => p.trim()).filter(Boolean).map(p => {
      if (/^Control$/i.test(p) || /^Ctrl$/i.test(p)) return 'Ctrl';
      if (/^Meta$/i.test(p) || /^Cmd$/i.test(p) || /^Command$/i.test(p)) return 'Cmd';
      if (/^Alt$/i.test(p)) return 'Alt';
      if (/^Shift$/i.test(p)) return 'Shift';
      if (p === 'Space') return 'Space';
      return p.length === 1 ? p.toUpperCase() : p;
    });
  };

  return (
    <Box>
      <Stack direction="row" spacing={1} alignItems="center">
        <Chip icon={<KeyboardIcon />} label={formatDisplay(hotkey)} />
        <Button size="small" variant="outlined" onClick={() => { setOpen(true); setCaptured(null); setError(null); }}>Change</Button>
        <Button size="small" variant="text" startIcon={<RestartAltIcon />} onClick={handleReset}>Reset</Button>
      </Stack>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Set Print Hotkey</span>
          <IconButton size="small" onClick={() => setOpen(false)} aria-label="close"><CloseIcon fontSize="small" /></IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Paper variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              <KeyboardIcon color="action" />
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1">Press the key combination</Typography>
                <Typography variant="body2" color="text.secondary">Modifiers (Ctrl, Alt, Shift, Cmd) can be combined with a non-modifier key. The capture is layout-sensitive.</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                {partsForChips(captured || hotkey).map((p, i) => (
                  <Chip key={i} label={p} size="small" color="primary" />
                ))}
              </Box>
            </Paper>

            {error && <Alert severity="error">{error}</Alert>}
            <Typography variant="caption" color="text.secondary">When ready, press the desired key combination — it will be captured immediately. Press Escape to cancel.</Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave} disabled={!captured}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HotkeySettings;
