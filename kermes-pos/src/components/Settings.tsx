import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Alert,
  Snackbar,
  Divider,
  Switch,
  FormControlLabel,
  Tooltip,
} from '@mui/material';
import { productService } from '../services/productService';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import RestoreIcon from '@mui/icons-material/Restore';
import CodeIcon from '@mui/icons-material/Code';

interface SettingsProps {
  refreshProducts: () => void;
}

const Settings: React.FC<SettingsProps> = ({ refreshProducts }) => {
  const [importJson, setImportJson] = useState('');
  const [devMode, setDevMode] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const handleExport = () => {
    const jsonString = productService.exportProducts();
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'products.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setSnackbar({
      open: true,
      message: 'Products exported successfully!',
      severity: 'success',
    });
  };

  const handleImport = () => {
    if (productService.importProducts(importJson)) {
      setSnackbar({
        open: true,
        message: 'Products imported successfully!',
        severity: 'success',
      });
      setImportJson('');
      refreshProducts();
    } else {
      setSnackbar({
        open: true,
        message: 'Failed to import products. Please check the JSON format.',
        severity: 'error',
      });
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset to the default product list? This cannot be undone.')) {
      productService.resetToDefault();
      setSnackbar({
        open: true,
        message: 'Products reset to default successfully!',
        severity: 'success',
      });
      refreshProducts();
    }
  };

  const handleDefineDefault = () => {
    if (window.confirm('Are you sure you want to define the current product list as the default? This will update the source code and cannot be undone.')) {
      const jsonString = productService.exportProducts();
      setSnackbar({
        open: true,
        message: 'Default products updated successfully! (Note: In a real application, this would update the source code)',
        severity: 'success',
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Developer Settings
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <FormControlLabel
            control={
              <Switch
                checked={devMode}
                onChange={(e) => setDevMode(e.target.checked)}
                color="primary"
              />
            }
            label="Dev Mode"
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Enable developer features for advanced product management.
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Tooltip title={!devMode ? "Enable Dev Mode to use this feature" : ""}>
            <span>
              <Button
                variant="contained"
                color="warning"
                startIcon={<CodeIcon />}
                onClick={handleDefineDefault}
                disabled={!devMode}
              >
                Define Default Products
              </Button>
            </span>
          </Tooltip>
        </Box>
        
        <Divider sx={{ my: 3 }} />
        
        <Typography variant="h6" gutterBottom>
          Product Management
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
          >
            Export Products
          </Button>
          
          <Button
            variant="outlined"
            color="error"
            startIcon={<RestoreIcon />}
            onClick={handleReset}
          >
            Reset to Default
          </Button>
        </Box>
        
        <Divider sx={{ my: 3 }} />
        
        <Typography variant="h6" gutterBottom>
          Import Products
        </Typography>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          Paste your products JSON here to import. The format should match the export format.
        </Typography>
        
        <TextField
          multiline
          rows={10}
          fullWidth
          value={importJson}
          onChange={(e) => setImportJson(e.target.value)}
          placeholder='{"products": [...]}'
          sx={{ mb: 2 }}
        />
        
        <Button
          variant="contained"
          startIcon={<UploadIcon />}
          onClick={handleImport}
          disabled={!importJson.trim()}
        >
          Import Products
        </Button>
      </Paper>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Settings; 