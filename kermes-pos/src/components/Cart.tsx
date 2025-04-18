import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  List, 
  ListItem, 
  ListItemText, 
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Button,
  Box,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { RootState } from '../store';
import { removeFromCart, clearCart } from '../store/slices/cartSlice';

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

  const handlePrintConfirm = () => {
    const receiptContent = `
      Kermes POS Receipt
      -----------------
      ${cartItems.map(item => `
        ${item.product.name} x${item.quantity}
        $${(item.product.price * item.quantity).toFixed(2)}
      `).join('\n')}
      -----------------
      Total: $${total.toFixed(2)}
      -----------------
      Thank you for your purchase!
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Receipt</title>
            <style>
              body { font-family: monospace; }
              pre { white-space: pre-wrap; }
            </style>
          </head>
          <body>
            <pre>${receiptContent}</pre>
            <script>
              window.onload = function() {
                window.print();
                window.close();
              }
            </script>
          </body>
        </html>
      `);
    }
    setPrintDialogOpen(false);
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      height: '100%'
    }}>
      <Typography variant="h6" gutterBottom>
        Cart
      </Typography>
      <Divider />
      <Box sx={{ 
        flex: 1,
        overflow: 'auto',
        minHeight: 0 // This is important for proper scrolling
      }}>
        {cartItems.length === 0 ? (
          <Typography variant="body1" sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
            Cart is empty
          </Typography>
        ) : (
          <List>
            {cartItems.map((item) => (
              <ListItem key={item.product.id}>
                <ListItemText
                  primary={item.product.name}
                  secondary={`$${item.product.price.toFixed(2)} x ${item.quantity}`}
                />
                <ListItemSecondaryAction>
                  <IconButton 
                    edge="end" 
                    aria-label="delete"
                    onClick={() => handleRemoveItem(item.product.id)}
                    size="small"
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}
      </Box>
      <Divider />
      <Box sx={{ 
        p: 2,
        backgroundColor: 'background.paper',
        borderTop: 1,
        borderColor: 'divider'
      }}>
        <Typography variant="h6" gutterBottom>
          Total: ${total.toFixed(2)}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            variant="outlined" 
            color="error" 
            onClick={handleClearCart}
            fullWidth
          >
            Clear Cart
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handlePrint}
            fullWidth
          >
            Print Receipt
          </Button>
        </Box>
      </Box>

      <Dialog open={printDialogOpen} onClose={() => setPrintDialogOpen(false)}>
        <DialogTitle>Print Receipt</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to print the receipt?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPrintDialogOpen(false)}>Cancel</Button>
          <Button onClick={handlePrintConfirm} variant="contained" color="primary">
            Print
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Cart; 