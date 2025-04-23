import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Paper,
  Alert,
  DialogActions,
} from '@mui/material';

interface PrinterSettingsProps {
  onSave: (printerName: string) => void;
  handlePrinterSettingsClose: () => void;
}

const PrinterSettings: React.FC<PrinterSettingsProps> = ({ onSave, handlePrinterSettingsClose }) => {
  const [printers, setPrinters] = useState<string[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const loadPrinters = async () => {
    try {
      setLoading(true);
      if (window.electronAPI && window.electronAPI.listPrinters) {
        const availablePrinters = await window.electronAPI.listPrinters();
        setPrinters(availablePrinters.map((printer) => printer.name));
      } else {
        throw new Error('Electron API not available or listPrinters is undefined');
      }
    } catch (err) {
      setError('Failed to load available printers');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrinters();
  }, []);

  useEffect(() => {
    const savedPrinter = localStorage.getItem('selectedPrinter');
    if (savedPrinter && printers.includes(savedPrinter)) {
      setSelectedPrinter(savedPrinter);
    } else {
      setSelectedPrinter(''); // Reset to empty if the saved printer is not in the available options
    }
  }, [printers]);

  const handlePrinterSelect = (printerName: string) => {
    setSelectedPrinter(printerName);
    localStorage.setItem('selectedPrinter', printerName); // Save to localStorage
  };

  const handleSave = () => {
    try {
      onSave(selectedPrinter);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to save printer settings');
      console.error(err);
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Select Printer
      </Typography>

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

      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel id="printer-select-label">Printer</InputLabel>
        <Select
          labelId="printer-select-label"
          value={selectedPrinter} // Show the actual selected printer
          label="Printer"
          onChange={(e) => handlePrinterSelect(e.target.value)}
          disabled={loading}
        >
          {printers.map((printer) => (
            <MenuItem key={printer} value={printer}>
              {printer}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <DialogActions>
        <Button onClick={handlePrinterSettingsClose}>Cancel</Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSave}
          disabled={loading || !selectedPrinter}
        >
          Save
        </Button>
      </DialogActions>
    </Paper>
  );
};

export default PrinterSettings;