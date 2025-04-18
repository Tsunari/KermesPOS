import React from 'react';
import { 
  Box,
  Typography,
  Button
} from '@mui/material';

interface CartFooterProps {
  total: number;
  onPrint: () => void;
}

const CartFooter: React.FC<CartFooterProps> = ({ total, onPrint }) => {
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
      <Button 
        variant="contained" 
        color="primary" 
        onClick={onPrint}
        fullWidth
      >
        Print Receipt
      </Button>
    </Box>
  );
};

export default CartFooter; 