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

interface CartFooterProps {
  total: number;
  onPrint: () => void;
  hasItems: boolean;
  isReceiptPrintingEnabled: boolean;
  onToggleReceiptPrinting: (enabled: boolean) => void;
}

const CartFooter: React.FC<CartFooterProps> = ({ total, onPrint, hasItems, isReceiptPrintingEnabled, onToggleReceiptPrinting }) => {
  const { t } = useLanguage();
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
      <Tooltip title={hasItems ? "" : t('app.cart.addItemsToPrint')}>
        <span>
          <Button
            variant="contained"
            color="primary"
            onClick={onPrint}
            fullWidth
            disabled={!hasItems}
            sx={{ mt: 2, fontWeight: 700, borderRadius: 2 }}
          >
            {isReceiptPrintingEnabled ? t('sales.print') : t('sales.record')}
          </Button>
        </span>
      </Tooltip>
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