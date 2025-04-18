import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  List, 
  Typography,
  Box,
  Divider,
  IconButton,
  Tooltip,
  ListItem,
  ListItemText,
  Button,
  Paper,
  useTheme,
  alpha,
} from '@mui/material';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import { RootState } from '../store';
import { removeFromCart, clearCart, updateQuantity } from '../store/slices/cartSlice';
import CartItemRow from './cart/CartItemRow';
import CartFooter from './cart/CartFooter';
import PrintDialog from './cart/PrintDialog';
import { printReceipt } from '../utils/printing';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';

// Main Cart component
const Cart: React.FC = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
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

  // Group items by category
  const groupedItems = cartItems.reduce((groups, item) => {
    const category = item.product.category || 'Other';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(item);
    return groups;
  }, {} as Record<string, typeof cartItems>);

  // Get category-specific styling - matching exactly with CategorySection
  const getCategoryStyle = (category: string) => {
    switch (category.toLowerCase()) {
      case 'food':
        return {
          bgColor: alpha(theme.palette.primary.main, 0.05),
          borderColor: theme.palette.primary.main,
          name: 'Food',
        };
      case 'drink':
        return {
          bgColor: alpha(theme.palette.info.main, 0.05),
          borderColor: theme.palette.info.main,
          name: 'Drinks',
        };
      case 'dessert':
        return {
          bgColor: alpha(theme.palette.secondary.main, 0.05),
          borderColor: theme.palette.secondary.main,
          name: 'Desserts',
        };
      default:
        return {
          bgColor: alpha(theme.palette.grey[500], 0.05),
          borderColor: theme.palette.grey[500],
          name: 'Other',
        };
    }
  };

  // Define the order of categories to ensure food is always at the top
  const categoryOrder = ['food', 'drink', 'dessert', 'Other'];

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
            {categoryOrder
              .filter(category => groupedItems[category] && groupedItems[category].length > 0)
              .map(category => {
                const categoryStyle = getCategoryStyle(category);
                return (
                  <React.Fragment key={category}>
                    <Box
                      sx={{
                        p: 1,
                        backgroundColor: categoryStyle.bgColor,
                        borderLeft: 3,
                        borderColor: categoryStyle.borderColor,
                      }}
                    >
                      <Typography
                        variant="subtitle2"
                        sx={{
                          color: categoryStyle.borderColor,
                          fontWeight: 'bold',
                          pl: 1,
                        }}
                      >
                        {categoryStyle.name}
                      </Typography>
                    </Box>
                    {groupedItems[category].map((item) => (
                      <CartItemRow
                        key={item.product.id}
                        item={item}
                        onRemove={handleRemoveItem}
                        onIncrement={handleIncrementQuantity}
                        onDecrement={handleDecrementQuantity}
                      />
                    ))}
                    <Divider />
                  </React.Fragment>
                );
              })}
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