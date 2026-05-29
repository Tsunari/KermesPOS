import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Alert,
  Snackbar,
  Divider,
  Tooltip,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  RadioGroup,
  Radio,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Chip,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Stack
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { productService } from '../services/productService';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import RestoreIcon from '@mui/icons-material/Restore';
import CodeIcon from '@mui/icons-material/Code';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import HistoryIcon from '@mui/icons-material/History';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useVariableContext } from '../context/VariableContext';
import { useLanguage } from '../context/LanguageContext';
import { useSettings } from '../context/SettingsContext';

interface ImportExportProps {
  devMode: boolean;
}

interface ValidationResult {
  valid: boolean;
  error?: string;
  line?: number;
  type?: 'syntax' | 'schema';
}

const ImportExport: React.FC<ImportExportProps> = ({ devMode }) => {
  const theme = useTheme();
  const { setProducts } = useVariableContext();
  const { t } = useLanguage();
  const { formatPrice } = useSettings();
  const [importJson, setImportJson] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [backups, setBackups] = useState<{ timestamp: number; count: number }[]>([]);
  const [validation, setValidation] = useState<ValidationResult>({ valid: false });
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [importStrategy, setImportStrategy] = useState<'merge' | 'overwrite'>('merge');
  const [parsedProducts, setParsedProducts] = useState<any[]>([]);
  
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Load backups history on mount
  useEffect(() => {
    setBackups(productService.getLocalBackups());
  }, []);

  // Validate JSON on input change
  useEffect(() => {
    if (!importJson.trim()) {
      setValidation({ valid: false });
      setParsedProducts([]);
      return;
    }
    const result = validateJsonSchema(importJson);
    setValidation(result);
    if (result.valid) {
      try {
        const parsed = JSON.parse(importJson);
        setParsedProducts(parsed.products);
      } catch (e) {
        setParsedProducts([]);
      }
    } else {
      setParsedProducts([]);
    }
  }, [importJson]);

  const validateJsonSchema = (jsonStr: string): ValidationResult => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!parsed || typeof parsed !== 'object') {
        return { valid: false, error: 'Root must be a JSON object containing "products"', type: 'schema' };
      }
      if (!parsed.products || !Array.isArray(parsed.products)) {
        return { valid: false, error: 'JSON must contain a root "products" array', type: 'schema' };
      }
      
      // Detailed schema checks
      for (let i = 0; i < parsed.products.length; i++) {
        const p = parsed.products[i];
        const num = i + 1;
        if (!p.id) return { valid: false, error: `Product at position ${num} is missing required "id"`, type: 'schema' };
        if (!p.name) return { valid: false, error: `Product ID "${p.id}" (pos ${num}) is missing required "name"`, type: 'schema' };
        if (p.price === undefined || typeof p.price !== 'number') {
          return { valid: false, error: `Product ID "${p.id}" has an invalid "price" (must be a number)`, type: 'schema' };
        }
        if (!p.category || !['food', 'drink', 'dessert'].includes(p.category)) {
          return { valid: false, error: `Product ID "${p.id}" has an invalid "category" (must be 'food', 'drink', or 'dessert')`, type: 'schema' };
        }
      }
      return { valid: true };
    } catch (err: any) {
      let line = undefined;
      const msg = err.message || 'Syntax parsing error';
      // Estimate line number if possible
      const match = msg.match(/at line (\d+)/i) || msg.match(/position (\d+)/i);
      if (match) {
        line = parseInt(match[1]);
      }
      return { valid: false, error: msg, line, type: 'syntax' };
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };
  
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith(".json") || file.type === "application/json") {
        try {
          const text = await file.text();
          setImportJson(text);
          setSnackbar({
            open: true,
            message: 'Products JSON loaded from file!',
            severity: 'success'
          });
        } catch (err) {
          setSnackbar({
            open: true,
            message: 'Error reading dropped JSON file.',
            severity: 'error'
          });
        }
      } else {
        setSnackbar({
          open: true,
          message: 'Invalid file format. Please drop a .json file.',
          severity: 'error'
        });
      }
    }
  };

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
      message: 'Products catalog exported successfully!',
      severity: 'success',
    });
  };

  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(importJson);
      setImportJson(JSON.stringify(parsed, null, 2));
      setSnackbar({
        open: true,
        message: 'JSON structure formatted beautifully!',
        severity: 'success'
      });
    } catch (e) {
      setSnackbar({
        open: true,
        message: 'Cannot format: JSON is invalid.',
        severity: 'error'
      });
    }
  };

  const handleCopyTemplate = () => {
    const template = {
      products: [
        {
          id: "1001",
          name: t('products.name') + " (Food)",
          price: 10.99,
          category: "food",
          description: t('products.description') + "...",
          inStock: true
        },
        {
          id: "2001",
          name: t('products.name') + " (Drink)",
          price: 4.50,
          category: "drink",
          description: t('products.description') + "...",
          inStock: true
        }
      ]
    };
    navigator.clipboard.writeText(JSON.stringify(template, null, 2));
    setSnackbar({
      open: true,
      message: t('importExport.exampleTemplate') + '!',
      severity: 'success'
    });
  };

  const handleApplyImport = () => {
    let success = false;
    if (importStrategy === 'merge') {
      success = productService.mergeProducts(importJson);
    } else {
      success = productService.importProducts(importJson);
    }

    if (success) {
      setProducts(productService.getAllProducts());
      setBackups(productService.getLocalBackups());
      setIsPreviewOpen(false);
      setImportJson('');
      setSnackbar({
        open: true,
        message: 'Products successfully imported and catalog updated!',
        severity: 'success',
      });
    } else {
      setSnackbar({
        open: true,
        message: 'Failed to apply import. Please re-check the formatting.',
        severity: 'error',
      });
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset to the default product list? A local snapshot will be created.')) {
      productService.resetToDefault();
      setProducts(productService.getAllProducts());
      setBackups(productService.getLocalBackups());
      setSnackbar({
        open: true,
        message: 'Products reset to default successfully!',
        severity: 'success',
      });
    }
  };

  const handleRestore = (timestamp: number) => {
    if (window.confirm(t('importExport.snapshotRestoreConfirm'))) {
      if (productService.restoreFromBackup(timestamp)) {
        setProducts(productService.getAllProducts());
        setBackups(productService.getLocalBackups());
        setSnackbar({
          open: true,
          message: t('importExport.snapshotRestoreSuccess'),
          severity: 'success',
        });
      } else {
        setSnackbar({
          open: true,
          message: 'Failed to restore snapshot.',
          severity: 'error',
        });
      }
    }
  };

  const handleDefineDefault = () => {
    if (window.confirm('Are you sure you want to define the current product list as the default? (Mock action for Dev Mode)')) {
      setSnackbar({
        open: true,
        message: 'Default products defined! (Mock action: in source code this updates JSON)',
        severity: 'success',
      });
    }
  };

  const getCategoryCount = (cat: string) => {
    return parsedProducts.filter(p => p.category === cat).length;
  };

  return (
    <Box sx={{ p: 1, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
        {t('importExport.title') || 'Import/Export Products'}
      </Typography>

      <Grid container spacing={3}>
        {/* Left Column: Export & Snapshots */}
        <Grid size={{ xs: 12, md: 5, lg: 4 }}>
          <Stack spacing={3}>
            {/* Export Card */}
            <Paper elevation={0} sx={{ p: 3, border: `1.5px solid ${theme.palette.divider}`, borderRadius: 3, bgcolor: 'background.paper', position: 'relative', overflow: 'hidden' }}>
              <Box sx={{ position: 'absolute', top: 0, right: 0, width: '4px', height: '100%', bgcolor: 'primary.main' }} />
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700 }}>
                <DownloadIcon color="primary" /> {t('importExport.exportTitle')}
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {t('importExport.exportDesc')}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  onClick={handleExport}
                  sx={{ borderRadius: 2, flexGrow: 1 }}
                >
                  {t('importExport.exportTitle')}
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<RestoreIcon />}
                  onClick={handleReset}
                  sx={{ borderRadius: 2 }}
                >
                  {t('common.reset')}
                </Button>
              </Box>
              
              {devMode && (
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="outlined"
                    color="warning"
                    fullWidth
                    startIcon={<CodeIcon />}
                    onClick={handleDefineDefault}
                    sx={{ borderRadius: 2 }}
                  >
                    Define Default
                  </Button>
                </Box>
              )}
            </Paper>

            {/* Time Machine backups */}
            <Paper elevation={0} sx={{ p: 3, border: `1.5px solid ${theme.palette.divider}`, borderRadius: 3, bgcolor: 'background.paper' }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700 }}>
                <HistoryIcon color="secondary" /> {t('importExport.snapshotsTitle') || 'Database Time Machine'}
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {t('importExport.snapshotsDesc')}
              </Typography>

              <Divider sx={{ my: 2 }} />

              {backups.length === 0 ? (
                <Box sx={{ py: 3, textStyle: 'italic', textAlign: 'center', color: 'text.secondary' }}>
                  {t('importExport.noSnapshots') || 'No snapshots available.'}
                </Box>
              ) : (
                <List disablePadding>
                  {backups.map((b, idx) => (
                    <React.Fragment key={b.timestamp}>
                      {idx > 0 && <Divider variant="inset" component="li" />}
                      <ListItem
                        disableGutters
                        secondaryAction={
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleRestore(b.timestamp)}
                            sx={{ borderRadius: 1.5, fontSize: '0.75rem', py: 0.5 }}
                          >
                            Restore
                          </Button>
                        }
                      >
                        <ListItemText
                          primary={
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {new Date(b.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} ({new Date(b.timestamp).toLocaleDateString()})
                            </Typography>
                          }
                          secondary={
                            <Typography variant="caption" color="text.secondary">
                              {t('importExport.itemsCount').replace('{count}', String(b.count)) || `${b.count} products`}
                            </Typography>
                          }
                        />
                      </ListItem>
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Paper>
          </Stack>
        </Grid>

        {/* Right Column: Advanced Import */}
        <Grid size={{ xs: 12, md: 7, lg: 8 }}>
          <Paper elevation={0} sx={{ p: 3, border: `1.5px solid ${theme.palette.divider}`, borderRadius: 3, bgcolor: 'background.paper' }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700 }}>
              <UploadIcon color="primary" /> {t('importExport.importTitle')}
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {t('importExport.importDesc')}
            </Typography>

            {/* Drag & Drop zone */}
            <Box
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById('json-file-input')?.click()}
              sx={{
                border: dragActive ? `2px dashed ${theme.palette.primary.main}` : `2px dashed ${theme.palette.divider}`,
                borderRadius: 2.5,
                p: 4,
                textAlign: 'center',
                cursor: 'pointer',
                bgcolor: dragActive ? 'rgba(37, 99, 235, 0.04)' : 'rgba(0, 0, 0, 0.01)',
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  bgcolor: 'rgba(37, 99, 235, 0.01)'
                },
                transition: 'all 0.25s ease',
                mb: 3
              }}
            >
              <input
                type="file"
                id="json-file-input"
                accept="application/json"
                hidden
                onChange={async (e) => {
                  const file = e.target.files && e.target.files[0];
                  if (!file) return;
                  try {
                    const text = await file.text();
                    setImportJson(text);
                    setSnackbar({ open: true, message: 'JSON file loaded!', severity: 'success' });
                  } catch (err) {
                    setSnackbar({ open: true, message: 'Failed to read JSON file.', severity: 'error' });
                  }
                  e.target.value = '';
                }}
              />
              <FileUploadIcon color="primary" sx={{ fontSize: 44, mb: 1, opacity: 0.8 }} />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {t('importExport.dropzoneIdle')}
              </Typography>
            </Box>

            {/* Form actions / templates helper */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                {t('importExport.orPaste')}
              </Typography>
              <Box>
                <Button size="small" variant="text" onClick={handleCopyTemplate} sx={{ fontSize: '0.75rem', textTransform: 'none', mr: 1 }}>
                  Template Structure
                </Button>
                {importJson.trim() && (
                  <Button size="small" variant="text" onClick={handleFormatJson} sx={{ fontSize: '0.75rem', textTransform: 'none' }}>
                    Format JSON
                  </Button>
                )}
              </Box>
            </Box>

            {/* Custom Modern Editor block */}
            <TextField
              multiline
              rows={12}
              fullWidth
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
              placeholder='{"products": [...]}'
              InputProps={{
                sx: {
                  fontFamily: 'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
                  fontSize: '0.870rem',
                  lineHeight: '1.45',
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.02)',
                  borderRadius: 2,
                  '& .MuiInputBase-input': {
                    scrollbarWidth: 'thin',
                  }
                }
              }}
              sx={{ mb: 3 }}
            />

            {/* Real-time Syntax & Schema Validation Alerts */}
            {importJson.trim() && (
              <Box sx={{ mb: 3 }}>
                {validation.valid ? (
                  <Alert severity="success" icon={<CheckCircleIcon />} sx={{ borderRadius: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {t('importExport.validateSuccess')}
                    </Typography>
                    <Typography variant="caption" display="block">
                      Loaded {parsedProducts.length} items successfully. Click review below to proceed.
                    </Typography>
                  </Alert>
                ) : (
                  <Alert severity="error" icon={<ErrorIcon />} sx={{ borderRadius: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {validation.type === 'syntax' ? 'JSON Format Error' : 'Database Schema Error'}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 500, display: 'block' }}>
                      {validation.type === 'syntax'
                        ? t('importExport.validateErrorSyntax').replace('{error}', validation.error || '').replace('{line}', String(validation.line || '?'))
                        : t('importExport.validateErrorSchema').replace('{error}', validation.error || '')}
                    </Typography>
                  </Alert>
                )}
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<PlayArrowIcon />}
                disabled={!validation.valid}
                onClick={() => setIsPreviewOpen(true)}
                sx={{ borderRadius: 2, px: 3 }}
              >
                Review Import Preview
              </Button>
              {importJson.trim() && (
                <Button
                  variant="outlined"
                  onClick={() => setImportJson('')}
                  sx={{ borderRadius: 2 }}
                >
                  Clear
                </Button>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Import Dry Run Dialog */}
      <Dialog
        open={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, p: 1 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
          {t('importExport.dryRunTitle') || 'Import Dry-Run Preview'}
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" paragraph>
            {t('importExport.dryRunDesc')}
          </Typography>

          <Grid container spacing={3} sx={{ mb: 3 }}>
            {/* Checklist */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2.5, bgcolor: 'action.hover' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <CheckCircleIcon color="success" fontSize="small" /> {t('importExport.dryRunChecklist')}
                </Typography>
                <List disablePadding sx={{ '& .MuiListItemText-primary': { fontSize: '0.8rem' } }}>
                  <ListItem disableGutters sx={{ py: 0.3 }}>
                    <ListItemText primary="✓ Parsing successful (JSON Valid)" />
                  </ListItem>
                  <ListItem disableGutters sx={{ py: 0.3 }}>
                    <ListItemText primary="✓ Core structure intact (Products Array Exists)" />
                  </ListItem>
                  <ListItem disableGutters sx={{ py: 0.3 }}>
                    <ListItemText primary="✓ Items properties verified (ID, Category, Price)" />
                  </ListItem>
                </List>
              </Paper>
            </Grid>

            {/* Counters */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                  Import Summary
                </Typography>
                <Grid container spacing={1.5} textAlign="center">
                  <Grid size={{ xs: 4 }}>
                    <Box sx={{ p: 1, bgcolor: 'rgba(65, 120, 245, 0.06)', borderRadius: 2 }}>
                      <Typography variant="h6" color="primary.main" sx={{ fontWeight: 800 }}>{getCategoryCount('food')}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Food</Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 4 }}>
                    <Box sx={{ p: 1, bgcolor: 'rgba(240, 98, 146, 0.06)', borderRadius: 2 }}>
                      <Typography variant="h6" color="secondary.main" sx={{ fontWeight: 800 }}>{getCategoryCount('drink')}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Drink</Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 4 }}>
                    <Box sx={{ p: 1, bgcolor: 'rgba(76, 175, 80, 0.06)', borderRadius: 2 }}>
                      <Typography variant="h6" color="success.main" sx={{ fontWeight: 800 }}>{getCategoryCount('dessert')}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Dessert</Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>

          {/* Strategy selection */}
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
            {t('importExport.modeLabel')}
          </Typography>
          <RadioGroup
            value={importStrategy}
            onChange={(e) => setImportStrategy(e.target.value as any)}
            sx={{ mb: 3 }}
          >
            <Paper variant="outlined" sx={{ px: 2, py: 0.5, borderRadius: 2, mb: 1.5, '&:hover': { borderColor: 'primary.main' } }}>
              <FormControlLabel
                value="merge"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Smart Merge</Typography>
                    <Typography variant="caption" color="text.secondary">Appends new products, updates existing products with matching IDs, and preserves non-overlapping current database items.</Typography>
                  </Box>
                }
              />
            </Paper>
            <Paper variant="outlined" sx={{ px: 2, py: 0.5, borderRadius: 2, '&:hover': { borderColor: 'error.main' } }}>
              <FormControlLabel
                value="overwrite"
                control={<Radio color="error" />}
                label={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'error.main' }}>Complete Overwrite</Typography>
                    <Typography variant="caption" color="text.secondary">Completely replaces your current product database with the imported products. This action creates an automatic snapshot before executing.</Typography>
                  </Box>
                }
              />
            </Paper>
          </RadioGroup>

          {/* Mini Table preview */}
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
            Import Items List ({parsedProducts.length})
          </Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 200, borderRadius: 2 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{t('products.name')}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{t('products.category')}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>{t('products.price')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {parsedProducts.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{p.id}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{p.name}</TableCell>
                    <TableCell>
                      <Chip label={p.category} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 20 }} />
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>{formatPrice(p.price)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setIsPreviewOpen(false)} variant="outlined" sx={{ borderRadius: 2 }}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleApplyImport} variant="contained" color={importStrategy === 'overwrite' ? 'error' : 'primary'} sx={{ borderRadius: 2 }}>
            {t('importExport.actionApply')}
          </Button>
        </DialogActions>
      </Dialog>

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

export default ImportExport;