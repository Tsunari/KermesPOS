import React from 'react';
import { 
  Box,
  Typography,
  Button,
  Tooltip
} from '@mui/material';
import { useLanguage } from '../../context/LanguageContext';

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
      <Typography variant="h6" gutterBottom>
        {t('app.cart.total')}: {total.toFixed(2).replace('.', ',')}€
      </Typography>
      <Tooltip title={hasItems ? "" : t('app.cart.addItemsToPrint')}>
        <span>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={onPrint}
            fullWidth
            disabled={!hasItems}
          >
            {"LOL"}
          </Button>
        </span>
      </Tooltip>
    </Box>
  );
};

export default CartFooter; 