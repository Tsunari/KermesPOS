import React from 'react';
import { 
  Box,
  Typography,
  Button,
  Tooltip
} from '@mui/material';
import { useLanguage } from '../../context/LanguageContext';
import ChangeCalculator from './ChangeCalculator';

interface CartFooterProps {
  total: number;
  onPrint: () => void;
  hasItems: boolean;
}

const CartFooter: React.FC<CartFooterProps> = ({ total, onPrint, hasItems }) => {
  const { t } = useLanguage();

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
            {t('sales.print')}
          </Button>
        </span>
      </Tooltip>
    </Box>
  );
};

export default CartFooter;