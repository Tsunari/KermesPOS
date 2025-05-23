import React from 'react';
import { InputAdornment, TextField, Typography, Box, Button } from '@mui/material';
import CalculateIcon from '@mui/icons-material/Calculate';
import ReactDOM from 'react-dom';
import { useLanguage } from '../../context/LanguageContext';

interface ChangeCalculatorProps {
  total: number;
}

const ChangeCalculator: React.FC<ChangeCalculatorProps> = ({ total }) => {
  const [open, setOpen] = React.useState(false);
  const [given, setGiven] = React.useState('');
  const [focused, setFocused] = React.useState(false);
  const iconButtonRef = React.useRef<HTMLButtonElement>(null);
  const change = given && !isNaN(Number(given)) ? Number(given) - total : 0;
  const { t } = useLanguage();

  // Portal for floating panel
  const panel = (
    <Box
      sx={{
        position: 'fixed',
        top: iconButtonRef.current ? iconButtonRef.current.getBoundingClientRect().top - 100 : 20,
        left: iconButtonRef.current ? iconButtonRef.current.getBoundingClientRect().right + 12 : 200,
        zIndex: 2000,
        width: 340,
        maxWidth: '90vw',
        boxShadow: 6,
        p: 2,
        bgcolor: 'background.paper',
        borderRadius: 3,
        minWidth: 260,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        border: '1px solid',
        borderColor: 'primary.light',
      }}
    >
      <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
        {[1, 2, 5, 10, 20, 50].map((amount) => (
          <Button
            key={amount}
            variant="outlined"
            color="primary"
            size="small"
            sx={{ minWidth: 44, fontWeight: 700, borderRadius: 2, mb: 0.5 }}
            onClick={() => setGiven((prev) => {
              // If input is empty, set to amount. If not, add to current value.
              const prevNum = parseFloat(prev.replace(',', '.')) || 0;
              return (prevNum + amount).toString();
            })}
          >
            {amount}€
          </Button>
        ))}
      </Box>
      <TextField
        label={t('app.changeCalculator.givenAmount')}
        variant="outlined"
        value={given.replace('.', ',')}
        onChange={e => {
          // Accept both comma and dot, but always store as dot for calculation
          let raw = e.target.value.replace(/[^0-9.,]/g, '');
          // Only allow one comma or dot
          raw = raw.replace(/(,|\.){2,}/g, '$1');
          // Enforce max 9 digits before comma and 2 after
          const match = raw.match(/^([0-9]{0,9})([.,]?)([0-9]{0,2})/);
          let formatted = '';
          if (match) {
            formatted = match[1];
            if (match[2]) formatted += ',';
            if (match[3]) formatted += match[3];
          }
          // Store with dot for calculation
          setGiven(formatted.replace(',', '.'));
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        inputMode="decimal"
        InputProps={{
          endAdornment: (
            <>
              <Button
                size="small"
                onClick={() => setGiven('')}
                sx={{
                  minWidth: 0,
                  height: '32px',
                  p: 2,
                  // mr: 0.5,
                  color: 'error.main',
                  borderRadius: '8px',
                  boxShadow: 1,
                  fontWeight: 700,
                  fontSize: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: 1.2,
                  // whiteSpace: 'nowrap',
                  // '&:hover': { background: 'rgba(255,255,255,1)' }
                }}
              >
                {/*✕*/}
                Clear
              </Button>
              <InputAdornment position="end">€</InputAdornment>
            </>
          ),
          sx: { fontSize: 20, fontWeight: 600, borderRadius: 2 },
        }}
        sx={{
          bgcolor: focused ? 'background.default' : 'background.paper',
          borderRadius: 2,
          fontWeight: 600,
          fontSize: 20,
          boxShadow: 1,
        }}
        fullWidth
        autoFocus={open}
      />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
          {t('app.cart.total')}: <span style={{ color: '#1976d2', fontWeight: 700 }}>{total.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span>
        </Typography>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: change < 0 ? 'error.main' : 'success.main' }}>
          {t('app.changeCalculator.change')}: <span style={{ fontWeight: 700 }}>{change >= 0 ? change.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'} €</span>
        </Typography>
      </Box>
    </Box>
  );

  return (
    <>
      <Box sx={{
        position: 'relative',
        display: 'inline-block',
        minWidth: 0
      }}>
        <Button
          ref={iconButtonRef}
          variant="contained"
          color="primary"
          onClick={() => setOpen(o => !o)}
          sx={{
            borderRadius: 3,
            minWidth: 48,
            minHeight: 48,
            width: 48,
            height: 48,
            aspectRatio: '1 / 1',
            p: 0,
            background: open
              ? 'linear-gradient(135deg, #1976d2 60%, #42a5f5 100%)'
              : 'linear-gradient(135deg, #212121 60%, #1976d2 100%)',
            color: open ? 'white' : 'primary.contrastText',
            boxShadow: open ? 4 : 2,
            border: 'none',
            outline: 'none',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            '&:hover': {
              background: 'linear-gradient(135deg, #1565c0 60%, #42a5f5 100%)',
              color: 'white',
              boxShadow: 6,
            },
          }}
        >
          <CalculateIcon fontSize="medium" />
        </Button>
      </Box>
      {open && typeof window !== 'undefined' && iconButtonRef.current &&
        ReactDOM.createPortal(panel, document.body)
      }
    </>
  );
};

export default ChangeCalculator;
