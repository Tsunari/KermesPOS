import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  List, 
  Typography,
  Box,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import { RootState } from '../store';
import { removeFromCart, clearCart, updateQuantity } from '../store/slices/cartSlice';
import CartItemRow from './cart/CartItemRow';
import CartFooter from './cart/CartFooter';
import PrintDialog from './cart/PrintDialog';
import { printReceipt } from '../utils/printing';

// Main Cart component
const Cart: React.FC = () => {
  const dispatch = useDispatch();
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const total = useSelector((state: RootState) => state.cart.total);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);

  const handleRemoveItem = (id: string) => {
    dispatch(removeFromCart(id));
  };

  const handleClearCart = () => {
    dispatch(clearCart());
  };

  const handlePrint = () => {
    setPrintDialogOpen(true);
  };

  const handleIncrementQuantity = (id: string, currentQuantity: number) => {
    dispatch(updateQuantity({ id, quantity: currentQuantity + 1 }));
  };

  const handleDecrementQuantity = (id: string, currentQuantity: number) => {
    if (currentQuantity > 1) {
      dispatch(updateQuantity({ id, quantity: currentQuantity - 1 }));
    } else {
      dispatch(removeFromCart(id));
    }
  };

  const handlePrintConfirm = () => {
    printReceipt(cartItems, total);
    setPrintDialogOpen(false);
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      height: '100%'
    }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 1
      }}>
        <Typography variant="h6">
          Cart
        </Typography>
        {cartItems.length > 0 && (
          <Tooltip title="Clear Cart">
            <IconButton 
              color="error" 
              size="small" 
              onClick={handleClearCart}
              aria-label="clear cart"
            >
              <DeleteSweepIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      <Divider />
      
      {/* Scrollable area with fixed height */}
      <Box sx={{ 
        height: 'calc(100% - 120px)', // Fixed height, leaving space for header and footer
        overflow: 'auto',
        mb: 2
      }}>
        {cartItems.length === 0 ? (
          <Typography variant="body1" sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
            Cart is empty
          </Typography>
        ) : (
          <List>
            {cartItems.map((item) => (
              <CartItemRow
                key={item.product.id}
                item={item}
                onIncrement={handleIncrementQuantity}
                onDecrement={handleDecrementQuantity}
                onRemove={handleRemoveItem}
              />
            ))}
          </List>
        )}
      </Box>
      
      <CartFooter 
        total={total}
        onPrint={handlePrint}
        hasItems={cartItems.length > 0}
      />

      <PrintDialog 
        open={printDialogOpen}
        onClose={() => setPrintDialogOpen(false)}
        onConfirm={handlePrintConfirm}
      />
    </Box>
  );
};

export default Cart; 