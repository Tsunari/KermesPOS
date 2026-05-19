import React from 'react';
import {
  Box,
  Typography,
  Button,
  Tooltip,
  IconButton,
  Popover
} from '@mui/material';
import { useLanguage } from '../../context/LanguageContext';
import ChangeCalculator from './ChangeCalculator';
import ModernSwitch from '../ui/ModernSwitch';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import HotkeySettings from '../HotkeySettings';

interface CartFooterProps {
  total: number;
  onPrint: () => void;
  hasItems: boolean;
  isReceiptPrintingEnabled: boolean;
  onToggleReceiptPrinting: (enabled: boolean) => void;
  hotkey?: string;
}

const CartFooter: React.FC<CartFooterProps> = ({ total, onPrint, hasItems, isReceiptPrintingEnabled, onToggleReceiptPrinting, hotkey = 'Space' }) => {
  const { t } = useLanguage();
  const formatHotkey = (h: string) => {
    if (!h) return 'Space';
    const parts = h.split('+').map(p => p.trim()).filter(Boolean);
    const mapped = parts.map(p => {
      if (/^Control$/i.test(p) || /^Ctrl$/i.test(p)) return 'Ctrl';
      if (/^Meta$/i.test(p) || /^Cmd$/i.test(p) || /^Command$/i.test(p)) return 'Meta';
      if (/^Alt$/i.test(p)) return 'Alt';
      if (/^Shift$/i.test(p)) return 'Shift';
      // key: if single char show uppercase, else title-case
      if (p.length === 1) return p.toUpperCase();
      if (p === 'Space') return 'Space';
      return p;
    });
    return mapped.join('+');
  };
  const [infoAnchorEl, setInfoAnchorEl] = React.useState<HTMLElement | null>(null);

  return (
    <Box sx={{
      p: 2,
      backgroundColor: 'background.paper',
      borderTop: 1,
      borderColor: 'divider',
      position: 'sticky',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 10
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, minHeight: 48 }}>
        <Typography variant="h6" gutterBottom sx={{ m: 0, flex: 1, fontWeight: 700, fontSize: 18, color: 'text.primary' }}>
          {t('app.cart.total')}: {total.toFixed(2).replace('.', ',')}€
        </Typography>
        <Box sx={{ flexShrink: 0, ml: 2 }}>
          <ChangeCalculator total={total} />
        </Box>
      </Box>
      <Box sx={{ mt: 2, position: 'relative' }}>
        {hasItems ? (
          <Button
            variant="contained"
            color="primary"
            onClick={onPrint}
            sx={{ width: '100%', fontWeight: 700, borderRadius: 2, py: 1.25, pr: '72px' }}
          >
            {isReceiptPrintingEnabled ? t('sales.print') : t('sales.record')}
          </Button>
        ) : (
          <Tooltip title={t('app.cart.addItemsToPrint')}>
            <span>
              <Button
                variant="contained"
                color="primary"
                disabled
                sx={{ width: '100%', fontWeight: 700, borderRadius: 2, py: 1.25, pr: '72px' }}
              >
                {isReceiptPrintingEnabled ? t('sales.print') : t('sales.record')}
              </Button>
            </span>
          </Tooltip>
        )}

        <Tooltip
          title={(
            <span>
              Hotkey: {formatHotkey(hotkey)} —
              <Box
                component="button"
                onClick={(e)=>{e.preventDefault(); e.stopPropagation(); window.dispatchEvent(new CustomEvent('openHotkeyDialog'));}}
                sx={{ ml: 0.5, p: 0, border: 'none', bgcolor: 'transparent', color: 'primary.main', textDecoration: 'underline', cursor: 'pointer' }}
              >
                Change
              </Box>
            </span>
          )}
        >
          <Box
            component="button"
            onClick={(e)=>{e.preventDefault(); window.dispatchEvent(new CustomEvent('openHotkeyDialog'));}}
            sx={{
              position: 'absolute',
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 12,
              px: 1,
              py: 0.6,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'primary.dark',
              cursor: 'pointer',
              boxShadow: 1,
              minWidth: '56px',
              textAlign: 'center'
            }}
            aria-label="Change hotkey"
          >
            {formatHotkey(hotkey)}
          </Box>
        </Tooltip>

        {/* Render hidden HotkeySettings so its dialog can open via the custom event */}
        <Box sx={{ display: 'none' }}>
          <HotkeySettings />
        </Box>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 2, mb: 0.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}
            component="label"
            htmlFor="print-receipt-toggle"
          >
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
              {t('app.cart.printReceiptToggle')}
            </Typography>
            <ModernSwitch
              id="print-receipt-toggle"
              checked={isReceiptPrintingEnabled}
              onChange={(_, checked) => onToggleReceiptPrinting(checked)}
            />
          </Box>
          <IconButton
            size="small"
            aria-label={t('app.cart.printReceiptToggleHint')}
            onClick={(e) => setInfoAnchorEl(e.currentTarget)}
            sx={{ ml: 0.5 }}
          >
            <InfoOutlinedIcon fontSize="small" />
          </IconButton>
        </Box>
        <Popover
          open={Boolean(infoAnchorEl)}
          anchorEl={infoAnchorEl}
          onClose={() => setInfoAnchorEl(null)}
          anchorOrigin={{ vertical: 'center', horizontal: 'right' }}
          transformOrigin={{ vertical: 'center', horizontal: 'left' }}
          disableRestoreFocus
        >
          <Box sx={{ p: 1.5, maxWidth: 260 }}>
            <Typography variant="body2">{t('app.cart.printReceiptToggleHint')}</Typography>
          </Box>
        </Popover>
      </Box>
    </Box>
  );
};

export default CartFooter;