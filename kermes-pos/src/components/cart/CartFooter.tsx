import React from 'react';
import { 
  Box,
  Typography,
  Button
} from '@mui/material';

interface CartFooterProps {
  total: number;
  onClearCart: () => void;
  onPrint: () => void;
}

const CartFooter: React.FC<CartFooterProps> = ({ total, onClearCart, onPrint }) => {
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
        Total: ${total.toFixed(2)}
      </Typography>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button 
          variant="outlined" 
          color="error" 
          onClick={onClearCart}
          fullWidth
        >
          Clear Cart
        </Button>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={onPrint}
          fullWidth
        >
          Print Receipt
        </Button>
      </Box>
    </Box>
  );
};

export default CartFooter; 