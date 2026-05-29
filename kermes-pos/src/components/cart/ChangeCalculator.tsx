import React from 'react';
import { InputAdornment, TextField, Typography, Box, Button, Collapse, IconButton, Tooltip } from '@mui/material';
import { useLanguage } from '../../context/LanguageContext';
import { useSettings } from '../../context/SettingsContext';
import LaunchIcon from '@mui/icons-material/Launch';
import VerticalAlignBottomIcon from '@mui/icons-material/VerticalAlignBottom';

interface ChangeCalculatorProps {
  total: number;
  open: boolean;
  mode?: 'inline' | 'popover';
  onToggleMode?: () => void;
}

const ChangeCalculator: React.FC<ChangeCalculatorProps> = ({ total, open, mode = 'inline', onToggleMode }) => {
  const [given, setGiven] = React.useState('');
  const { formatPrice, currency } = useSettings();
  const change = given && !isNaN(Number(given)) ? Number(given) - total : 0;
  const { t } = useLanguage();

  const currencySymbols: Record<string, string> = {
    EUR: '€',
    USD: '$',
    TRY: '₺'
  };
  const currencySymbol = currencySymbols[currency] || '€';

  // Automatically clear input when calculator is closed
  React.useEffect(() => {
    if (!open) {
      setGiven('');
    }
  }, [open]);

  const calculatorContent = (
    <Box
      sx={{
        p: 1.25,
        bgcolor: 'action.hover',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        gap: 1.25,
        mb: mode === 'inline' ? 1.5 : 0,
        mt: mode === 'inline' ? 0.5 : 0,
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* Quick Cash Buttons */}
      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
        {[1, 2, 5, 10, 20, 50].map((amount) => (
          <Button
            key={amount}
            variant="outlined"
            color="primary"
            size="small"
            sx={{
              flex: 1,
              fontWeight: 700,
              borderRadius: 1.5,
              px: 0,
              py: 0.25,
              fontSize: 11,
              minWidth: '35px',
              bgcolor: 'background.paper'
            }}
            onClick={() => setGiven((prev) => {
              const prevNum = parseFloat(prev.replace(',', '.')) || 0;
              return (prevNum + amount).toString();
            })}
          >
            {currency === 'USD' ? `${currencySymbol}${amount}` : `${amount}${currencySymbol}`}
          </Button>
        ))}
      </Box>

      {/* Given Input Field */}
      <TextField
        label={t('app.changeCalculator.givenAmount')}
        variant="outlined"
        size="small"
        value={given.replace('.', ',')}
        onChange={e => {
          let raw = e.target.value.replace(/[^0-9.,]/g, '');
          raw = raw.replace(/(,|\.){2,}/g, '$1');
          const match = raw.match(/^([0-9]{0,9})([.,]?)([0-9]{0,2})/);
          let formatted = '';
          if (match) {
            formatted = match[1];
            if (match[2]) formatted += ',';
            if (match[3]) formatted += match[3];
          }
          setGiven(formatted.replace(',', '.'));
        }}
        inputMode="decimal"
        InputProps={{
          endAdornment: (
            <>
              <Button
                size="small"
                onClick={() => setGiven('')}
                sx={{
                  minWidth: 0,
                  height: '24px',
                  px: 1,
                  color: 'error.main',
                  borderRadius: '4px',
                  fontWeight: 700,
                  fontSize: 11,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 1,
                }}
              >
                Clear
              </Button>
              <InputAdornment position="end" sx={{ '& .MuiTypography-root': { fontSize: 13 } }}>{currencySymbol}</InputAdornment>
            </>
          ),
          sx: { fontSize: 14, fontWeight: 600, borderRadius: 1.5, bgcolor: 'background.paper' },
        }}
        sx={{
          borderRadius: 1.5,
        }}
        fullWidth
        autoFocus={open}
      />

      {/* Result Row */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 30 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, color: change < 0 ? 'error.main' : 'success.main', fontSize: 13 }}>
          {t('app.changeCalculator.change')}: <span style={{ fontWeight: 700 }}>{change >= 0 ? formatPrice(change) : formatPrice(0)}</span>
        </Typography>
        {onToggleMode && (
          <Tooltip title={mode === 'inline' ? t('app.changeCalculator.float') || 'Float to Popover' : t('app.changeCalculator.dock') || 'Dock in Footer'}>
            <IconButton
              size="small"
              onClick={onToggleMode}
              sx={{
                color: 'primary.main',
                p: 0.5,
                '&:hover': { bgcolor: 'action.hover' }
              }}
            >
              {mode === 'inline' ? <LaunchIcon sx={{ fontSize: 16 }} /> : <VerticalAlignBottomIcon sx={{ fontSize: 16 }} />}
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Box>
  );

  if (mode === 'popover') {
    return calculatorContent;
  }

  return (
    <Collapse in={open} timeout="auto" unmountOnExit sx={{ width: '100%' }}>
      {calculatorContent}
    </Collapse>
  );
};

export default ChangeCalculator;
