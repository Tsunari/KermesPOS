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
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Popover,
} from '@mui/material';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import PrintIcon from '@mui/icons-material/Print';
import SettingsIcon from '@mui/icons-material/Settings';
import { RootState } from '../store';
import { removeFromCart, clearCart, updateQuantity } from '../store/slices/cartSlice';
import CartItemRow from './cart/CartItemRow';
import CartFooter from './cart/CartFooter';
import PrinterSettings from './PrinterSettings';
import ReceiptPreview from './cart/ReceiptPreview';
import { CartItem } from '../types/index';
import { printCart } from '../services/printerService';
import { useSettings } from '../context/SettingsContext';
import { useLanguage } from '../contexts/LanguageContext';

const Cart: React.FC = () => {
  const { t } = useLanguage();
  const dispatch = useDispatch();
  const theme = useTheme();
  const { showScrollbars } = useSettings();
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const total = useSelector((state: RootState) => state.cart.total);
  const [printerSettingsOpen, setPrinterSettingsOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [previewAnchorEl, setPreviewAnchorEl] = useState<HTMLElement | null>(null);

  const handleRemoveItem = (id: string) => {
    dispatch(removeFromCart(id));
  };

  const handleClearCart = () => {
    dispatch(clearCart());
  };

  const handlePrint = async () => {
    try {
      const success = await printCart(cartItems, total);
      if (success) {
        setSuccessMessage(t('app.cart.printSuccess'));
      } else {
        setErrorMessage(t('app.cart.printFailed'));
      }
    } catch (error) {
      setErrorMessage(t('app.cart.printFailed'));
    }
  };

  const handlePrinterSettingsOpen = () => {
    setPrinterSettingsOpen(true);
  };

  const handlePrinterSettingsClose = () => {
    setPrinterSettingsOpen(false);
  };

  const handlePrinterSettingsSave = (config: any) => {
    try {
      console.log(t('app.cart.printerSettingsSaved'), config);
      setSuccessMessage(t('app.cart.printerSettingsSavedSuccess'));
      handlePrinterSettingsClose();
    } catch (error) {
      console.error(t('app.cart.settingsError'), error);
      setErrorMessage(t('app.cart.printerSettingsSaveFailed'));
    }
  };

  const handlePrintPreviewOpen = (event: React.MouseEvent<HTMLElement>) => {
    setPreviewAnchorEl(event.currentTarget);
  };

  const handlePrintPreviewClose = () => {
    setPreviewAnchorEl(null);
  };

  const previewOpen = Boolean(previewAnchorEl);

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
      height: '100%',
      '&::-webkit-scrollbar': {
        width: '8px',
      },
      '&::-webkit-scrollbar-track': {
        background: theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.grey[100],
        borderRadius: '4px',
      },
      '&::-webkit-scrollbar-thumb': {
        background: theme.palette.mode === 'dark' ? theme.palette.grey[700] : theme.palette.grey[400],
        borderRadius: '4px',
        '&:hover': {
          background: theme.palette.mode === 'dark' ? theme.palette.grey[600] : theme.palette.grey[500],
        },
      },
    }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 1
      }}>
        <Typography variant="h6">
          {t('sales.cart')}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {cartItems.length > 0 && (
            <>
              <Tooltip title={t('app.cart.previewReceipt')}>
                <IconButton
                  onMouseEnter={handlePrintPreviewOpen}
                  onMouseLeave={handlePrintPreviewClose}
                  disabled={cartItems.length === 0}
                  color="primary"
                >
                  <PrintIcon />
                </IconButton>
              </Tooltip>
              <Popover
                open={previewOpen}
                anchorEl={previewAnchorEl}
                onClose={handlePrintPreviewClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                sx={{
                  pointerEvents: 'none',
                }}
              >
                <Box sx={{ p: 2 }}>
                  <ReceiptPreview items={cartItems} total={total} />
                </Box>
              </Popover>
              <Tooltip title={t('app.cart.printerSettings')}>
                <IconButton 
                  color="primary" 
                  size="small" 
                  onClick={handlePrinterSettingsOpen}
                  aria-label={t('app.cart.printerSettings')}
                  sx={{ mr: 1 }}
                >
                  <SettingsIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title={t('app.cart.clearCart')}>
                <IconButton 
                  color="error" 
                  size="small" 
                  onClick={handleClearCart}
                  aria-label={t('app.cart.clearCart')}
                >
                  <DeleteSweepIcon />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>
      </Box>
      <Divider />
      
      <Box sx={{ 
        height: 'calc(100% - 120px)',
        overflow: 'auto',
        mb: 2,
        ...(!showScrollbars && {
          '&::-webkit-scrollbar': {
            display: 'none',
          },
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }),
      }}>
        {cartItems.length === 0 ? (
          <Typography variant="body1" sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
            {t('app.cart.emptyCart')}
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
                    {groupedItems[category].map((item: CartItem) => (
                      <CartItemRow
                        key={item.product.id}
                        item={item}
                        onRemove={handleRemoveItem}
                        onIncrement={(id, quantity) => dispatch(updateQuantity({ id, quantity: quantity + 1 }))}
                        onDecrement={(id, quantity) => {
                          if (quantity > 1) {
                            dispatch(updateQuantity({ id, quantity: quantity - 1 }));
                          } else {
                            dispatch(removeFromCart(id));
                          }
                        }}
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
      
      <Dialog
        open={printerSettingsOpen}
        onClose={handlePrinterSettingsClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{t('printer.title')}</DialogTitle>
        <DialogContent>
          <PrinterSettings onSave={handlePrinterSettingsSave} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handlePrinterSettingsClose}>{t('common.cancel')}</Button>
        </DialogActions>
      </Dialog>
      
      <Snackbar 
        open={!!errorMessage} 
        autoHideDuration={6000} 
        onClose={() => setErrorMessage(null)}
      >
        <Alert onClose={() => setErrorMessage(null)} severity="error" sx={{ width: '100%' }}>
          {errorMessage}
        </Alert>
      </Snackbar>
      
      <Snackbar 
        open={!!successMessage} 
        autoHideDuration={6000} 
        onClose={() => setSuccessMessage(null)}
      >
        <Alert onClose={() => setSuccessMessage(null)} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Cart; 