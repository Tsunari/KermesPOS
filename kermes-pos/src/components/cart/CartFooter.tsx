import React from 'react';
import { 
  Box,
  Typography,
  Button,
  Tooltip
} from '@mui/material';

interface CartFooterProps {
  total: number;
  onPrint: () => void;
  hasItems: boolean;
}

const CartFooter: React.FC<CartFooterProps> = ({ total, onPrint, hasItems }) => {
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
        Total: {total.toFixed(2)}€
      </Typography>
      <Tooltip title={hasItems ? "Print Receipt" : "Add items to cart to print receipt"}>
        <span>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={onPrint}
            fullWidth
            disabled={!hasItems}
          >
            Print Receipt
          </Button>
        </span>
      </Tooltip>
    </Box>
  );
};

export default CartFooter; 