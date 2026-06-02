import React from 'react';
import {
  Box,
  Typography,
  Button,
  Tooltip,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Paper,
} from '@mui/material';
import { useLanguage } from '../../context/LanguageContext';
import ChangeCalculator from './ChangeCalculator';
import HotkeySettings from '../HotkeySettings';
import PaymentsIcon from '@mui/icons-material/Payments';         // cash
import CreditCardIcon from '@mui/icons-material/CreditCard';    // card
import CalculateIcon from '@mui/icons-material/Calculate';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import CloseIcon from '@mui/icons-material/Close';
import PrintIcon from '@mui/icons-material/Print';
import PrintDisabledIcon from '@mui/icons-material/PrintDisabled';

import { useSettings } from '../../context/SettingsContext';

interface CartFooterProps {
  total: number;
  onPrint: () => void;
  hasItems: boolean;
  isReceiptPrintingEnabled: boolean;
  onToggleReceiptPrinting: (enabled: boolean) => void;
  hotkey?: string;
  paymentMethod: 'cash' | 'card';
  onPaymentMethodChange: (method: 'cash' | 'card') => void;
}

const CartFooter: React.FC<CartFooterProps> = ({
  total,
  onPrint,
  hasItems,
  isReceiptPrintingEnabled,
  onToggleReceiptPrinting,
  hotkey = 'Space',
  paymentMethod,
  onPaymentMethodChange,
}) => {
  const { t } = useLanguage();
  const { formatPrice } = useSettings();
  const [calculatorOpen, setCalculatorOpen] = React.useState(false);
  const [calculatorMode, setCalculatorMode] = React.useState<'inline' | 'popover'>(() => {
    if (typeof window === 'undefined') return 'inline';
    return (localStorage.getItem('pos.calculatorMode') as 'inline' | 'popover') || 'inline';
  });
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);

  const [position, setPosition] = React.useState<{ x: number; y: number }>(() => {
    try {
      const saved = localStorage.getItem('pos.calculatorPosition');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse calculator position', e);
    }
    return { x: 360, y: 450 }; // Default position next to the cart
  });

  const dragRef = React.useRef<{ isDragging: boolean; startX: number; startY: number; posX: number; posY: number }>({
    isDragging: false,
    startX: 0,
    startY: 0,
    posX: 360,
    posY: 450
  });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input')) return;

    dragRef.current = {
      isDragging: true,
      startX: e.clientX - position.x,
      startY: e.clientY - position.y,
      posX: position.x,
      posY: position.y
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    e.preventDefault();
  };

  const handleMouseMove = React.useCallback((e: MouseEvent) => {
    if (!dragRef.current.isDragging) return;
    const newX = e.clientX - dragRef.current.startX;
    const newY = e.clientY - dragRef.current.startY;
    
    // Bounded coordinates so the calculator card doesn't go off-screen
    const boundedX = Math.max(0, Math.min(window.innerWidth - 290, newX));
    const boundedY = Math.max(0, Math.min(window.innerHeight - 250, newY));

    dragRef.current.posX = boundedX;
    dragRef.current.posY = boundedY;

    setPosition({ x: boundedX, y: boundedY });
  }, []);

  const handleMouseUp = React.useCallback(() => {
    if (dragRef.current.isDragging) {
      dragRef.current.isDragging = false;
      localStorage.setItem('pos.calculatorPosition', JSON.stringify({
        x: dragRef.current.posX,
        y: dragRef.current.posY
      }));
    }
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  React.useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);
  const formatHotkey = (h: string) => {
    if (!h) return 'Space';
    const parts = h.split('+').map(p => p.trim()).filter(Boolean);
    const mapped = parts.map(p => {
      if (/^Control$/i.test(p) || /^Ctrl$/i.test(p)) return 'Ctrl';
      if (/^Meta$/i.test(p) || /^Cmd$/i.test(p) || /^Command$/i.test(p)) return 'Meta';
      if (/^Alt$/i.test(p)) return 'Alt';
      if (/^Shift$/i.test(p)) return 'Shift';
      if (p.length === 1) return p.toUpperCase();
      if (p === 'Space') return 'Space';
      return p;
    });
    return mapped.join('+');
  };

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
        <Typography variant="h6" sx={{ m: 0, flex: 1, fontWeight: 700, fontSize: 18, color: 'text.primary' }}>
          {t('app.cart.total')}: {formatPrice(total)}
        </Typography>
        <Box sx={{ flexShrink: 0, ml: 2, display: 'flex', gap: 1 }}>
          <Tooltip title={isReceiptPrintingEnabled ? (t('app.cart.printReceiptToggleHint') || "Receipt printing is enabled. Click to disable (record sale only).") : (t('app.cart.printReceiptToggleHint') || "Receipt printing is disabled. Click to enable.")}>
            <Button
              variant="outlined"
              color={isReceiptPrintingEnabled ? "primary" : "inherit"}
              onClick={() => onToggleReceiptPrinting(!isReceiptPrintingEnabled)}
              sx={{
                borderRadius: '6px',
                minWidth: 40,
                minHeight: 40,
                width: 40,
                height: 40,
                p: 0,
                borderColor: isReceiptPrintingEnabled ? 'primary.main' : 'divider',
                bgcolor: isReceiptPrintingEnabled ? 'rgba(25, 118, 210, 0.04)' : 'transparent',
                color: isReceiptPrintingEnabled ? 'primary.main' : 'text.secondary',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: 'action.hover',
                },
              }}
            >
              {isReceiptPrintingEnabled ? <PrintIcon fontSize="medium" /> : <PrintDisabledIcon fontSize="medium" />}
            </Button>
          </Tooltip>

          <Button
            ref={triggerRef}
            variant="outlined"
            color={calculatorOpen ? "primary" : "inherit"}
            onClick={() => setCalculatorOpen(prev => !prev)}
            sx={{
              borderRadius: '6px',
              minWidth: 40,
              minHeight: 40,
              width: 40,
              height: 40,
              p: 0,
              borderColor: calculatorOpen ? 'primary.main' : 'divider',
              color: calculatorOpen ? 'primary.main' : 'text.secondary',
              '&:hover': {
                borderColor: 'primary.main',
                color: 'primary.main',
                bgcolor: 'action.hover',
              },
            }}
          >
            <CalculateIcon fontSize="medium" />
          </Button>
        </Box>
      </Box>

      {/* Inline Change Calculator */}
      <ChangeCalculator
        total={total}
        open={calculatorOpen && calculatorMode === 'inline'}
        mode="inline"
        onToggleMode={() => {
          const nextMode = 'popover';
          setCalculatorMode(nextMode);
          localStorage.setItem('pos.calculatorMode', nextMode);
        }}
      />

      {/* Floating Draggable Change Calculator */}
      {calculatorOpen && calculatorMode === 'popover' && (
        <Paper
          elevation={8}
          onMouseDown={handleMouseDown}
          sx={{
            position: 'fixed',
            left: position.x,
            top: position.y,
            width: '280px',
            borderRadius: 2.5,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            boxShadow: theme => theme.palette.mode === 'dark' 
              ? '0 12px 40px rgba(0,0,0,0.65)' 
              : '0 8px 32px rgba(0,0,0,0.12)',
            zIndex: 1300,
            overflow: 'hidden',
            userSelect: 'none',
          }}
        >
          {/* Drag Handle & Header */}
          <Box
            sx={{
              px: 1.5,
              py: 0.75,
              bgcolor: 'action.hover',
              borderBottom: '1px solid',
              borderColor: 'divider',
              cursor: 'grab',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              '&:active': { cursor: 'grabbing' }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <DragIndicatorIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {t('app.changeCalculator.title') || 'Change Calculator'}
              </Typography>
            </Box>
            <IconButton 
              size="small" 
              onClick={() => setCalculatorOpen(false)}
              sx={{ p: 0.25, color: 'text.secondary', '&:hover': { color: 'error.main' } }}
            >
              <CloseIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>

          <Box sx={{ p: 1.5 }}>
            <ChangeCalculator
              total={total}
              open={calculatorOpen}
              mode="popover"
              onToggleMode={() => {
                const nextMode = 'inline';
                setCalculatorMode(nextMode);
                localStorage.setItem('pos.calculatorMode', nextMode);
              }}
            />
          </Box>
        </Paper>
      )}

      {/* Payment Method Toggle */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5, mt: 1.5 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary', flexShrink: 0, fontSize: 12 }}>
          {t('app.cart.paymentMethod') || 'Payment'}
        </Typography>
        <ToggleButtonGroup
          value={paymentMethod}
          exclusive
          onChange={(_, val) => { if (val) onPaymentMethodChange(val); }}
          size="small"
          sx={{
            flex: 1,
            borderRadius: '6px',
            border: '1.5px solid',
            borderColor: 'divider',
            overflow: 'hidden',
            '& .MuiToggleButton-root': {
              flex: 1,
              py: 0.4,
              px: 1,
              fontWeight: 600,
              fontSize: 12,
              textTransform: 'none',
              gap: 0.5,
              border: 'none',
              borderRadius: '0 !important',
              '&:not(:last-of-type)': {
                borderRight: '1.5px solid',
                borderColor: 'divider',
              },
              '&.Mui-selected': {
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                borderColor: 'primary.main',
                '&:hover': { bgcolor: 'primary.dark' },
              },
              '&:not(.Mui-selected)': {
                color: 'text.secondary',
                '&:hover': { bgcolor: 'action.hover' },
              },
            },
          }}
        >
          <ToggleButton value="cash" aria-label="cash payment">
            <PaymentsIcon sx={{ fontSize: 15 }} />
            {t('app.cart.paymentCash') || 'Cash'}
          </ToggleButton>
          <ToggleButton value="card" aria-label="card payment">
            <CreditCardIcon sx={{ fontSize: 15 }} />
            {t('app.cart.paymentCard') || 'Card'}
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Box sx={{ mt: 0.5, position: 'relative' }}>
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
    </Box>
  );
};

export default CartFooter;