import React from 'react';
import { Box, Paper, Typography, TextField, Switch, FormControlLabel, Slider, Button, Stack } from '@mui/material';
import { useMenuConfig } from '../context/MenuConfigContext';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';

const MenuSettings: React.FC = () => {
  const { config, setConfig, resetConfig } = useMenuConfig();
  const navigate = useNavigate();
  return (
    <Box sx={{ p: 3, maxWidth: 720, mx: 'auto' }}>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/settings')}
          variant="outlined"
          size="small"
        >
          Go Back
        </Button>
        <Typography variant="h4">Menu Settings</Typography>
      </Stack>
      <Paper sx={{ p: 3 }}>
        <Stack spacing={2}>
          <TextField label="Title" value={config.title} onChange={e => setConfig(c => ({ ...c, title: e.target.value }))} />
          <TextField label="Currency" value={config.currency} onChange={e => setConfig(c => ({ ...c, currency: e.target.value }))} sx={{ width: 160 }} />
          <FormControlLabel control={<Switch checked={config.showCategories} onChange={(_, v) => setConfig(c => ({ ...c, showCategories: v }))} />} label="Show categories" />
          <Box>
            <Typography gutterBottom>Columns: {config.columns}</Typography>
            <Slider min={1} max={3} step={1} value={config.columns} onChange={(_, v) => setConfig(c => ({ ...c, columns: v as number }))} sx={{ maxWidth: 300 }} />
          </Box>
          <Box>
            <Typography gutterBottom>Font size: {config.fontSize}px</Typography>
            <Slider min={12} max={28} step={1} value={config.fontSize} onChange={(_, v) => setConfig(c => ({ ...c, fontSize: v as number }))} sx={{ maxWidth: 300 }} />
          </Box>
          <Stack direction="row" spacing={2}>
            <Button component="a" href="/customer-menu.html" target="_blank" rel="noopener" variant="contained">Open Customer Menu</Button>
            <Button color="inherit" variant="outlined" onClick={() => {
              const ok = window.confirm('Reset menu settings to defaults?');
              if (ok) resetConfig();
            }}>Reset Defaults</Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
};

export default MenuSettings;
