import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Switch,
  FormControlLabel,
  Button,
  Paper,
  Divider,
  Alert,
} from '@mui/material';
import { getAvailablePrinters, updatePrinterConfig } from '../services/printerService';

interface PrinterSettingsProps {
  onSave: (config: any) => void;
}

const PrinterSettings: React.FC<PrinterSettingsProps> = ({ onSave }) => {
  const [printers, setPrinters] = useState<string[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<string>('TSP100III');
  const [paperWidth, setPaperWidth] = useState<number>(72);
  const [fontSize, setFontSize] = useState<number>(12);
  const [bold, setBold] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  useEffect(() => {
    const loadPrinters = async () => {
      try {
        setLoading(true);
        const availablePrinters = await getAvailablePrinters();
        setPrinters(availablePrinters);
      } catch (err) {
        setError('Failed to load available printers');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadPrinters();
  }, []);

  const handleSave = () => {
    try {
      const config = {
        printerName: selectedPrinter,
        paperWidth,
        fontSize,
        bold,
      };
      
      updatePrinterConfig(config);
      onSave(config);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to save printer settings');
      console.error(err);
    }
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        TSP100III Series Printer Settings
      </Typography>
      <Divider sx={{ mb: 3 }} />
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Printer settings saved successfully!
        </Alert>
      )}
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        <Box sx={{ flex: '1 1 50%', minWidth: '300px' }}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="printer-select-label">Printer</InputLabel>
            <Select
              labelId="printer-select-label"
              value={selectedPrinter}
              label="Printer"
              onChange={(e) => setSelectedPrinter(e.target.value)}
              disabled={loading}
            >
              {printers.map((printer) => (
                <MenuItem key={printer} value={printer}>
                  {printer}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Typography gutterBottom>Paper Width (mm)</Typography>
          <Slider
            value={paperWidth}
            onChange={(_, value) => setPaperWidth(value as number)}
            min={58}
            max={112}
            step={1}
            marks={[
              { value: 58, label: '58mm' },
              { value: 72, label: '72mm' },
              { value: 80, label: '80mm' },
              { value: 112, label: '112mm' },
            ]}
            sx={{ mb: 3 }}
          />
        </Box>
        
        <Box sx={{ flex: '1 1 50%', minWidth: '300px' }}>
          <Typography gutterBottom>Font Size</Typography>
          <Slider
            value={fontSize}
            onChange={(_, value) => setFontSize(value as number)}
            min={8}
            max={16}
            step={1}
            marks={[
              { value: 8, label: '8' },
              { value: 12, label: '12' },
              { value: 16, label: '16' },
            ]}
            sx={{ mb: 3 }}
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={bold}
                onChange={(e) => setBold(e.target.checked)}
                color="primary"
              />
            }
            label="Bold Text"
            sx={{ mb: 2 }}
          />
        </Box>
      </Box>
      
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSave}
          disabled={loading}
        >
          Save Settings
        </Button>
      </Box>
    </Paper>
  );
};

export default PrinterSettings; 