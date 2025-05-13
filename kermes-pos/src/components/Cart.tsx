import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  List, 
  Typography,
  Box,
  Divider,
  IconButton,
  Tooltip,
  Button,
  useTheme,
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
import CancelIcon from '@mui/icons-material/Cancel';
import { RootState } from '../store';
import { removeFromCart, clearCart, updateQuantity } from '../store/slices/cartSlice';
import CartItemRow from './cart/CartItemRow';
import CartFooter from './cart/CartFooter';
import PrinterSettings from './PrinterSettings';
import ReceiptPreview from './cart/receipt/ReceiptPreview';
import { CartItem } from '../types/index';
import { generateReceiptContent } from '../services/printerService';
import { useSettings } from '../context/SettingsContext';
import { useLanguage } from '../context/LanguageContext';
import { getCategoryStyle } from '../utils/categoryUtils';
import { cartTransactionService } from '../services/cartTransactionService';

interface CartProps {
  devMode?: boolean;
}

const Cart: React.FC<CartProps> = ({ devMode }) => {
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
  const [selectedPrinter, setSelectedPrinter] = useState<string>('');
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    const savedPrinter = localStorage.getItem('selectedPrinter');
    setSelectedPrinter(savedPrinter || "");
  }, []);

  const handleRemoveItem = (id: string) => {
    dispatch(removeFromCart(id));
  };

  const handleClearCart = () => {
    dispatch(clearCart());
  };

  const handlePrintCart = async () => {
    setIsPrinting(true);
    const cartData = {
      items: cartItems.map((item) => ({
        name: item.product.name.normalize('NFC'),
        quantity: item.quantity,
        price: item.product.price,
      })),
      total,
    };

    try {
      // Save transaction to IndexedDB
      await cartTransactionService.saveTransaction(cartItems, total, 'cash'); // or use a real payment method
      setSuccessMessage(t('sales.receiptPrinted'));
    } catch (error) {
      setErrorMessage(t('sales.errorSavingTransaction'));
      console.error('Failed to save transaction:', error);
    }

    if (window.electronAPI) {
      console.log('Sending cart data to Electron API:', cartData);
      window.electronAPI.printCart(cartData, { name: selectedPrinter || "" });
    } else {
      console.error('Electron API not available');
    }

    // Clear the cart after printing and saving
    dispatch(clearCart());
  };

  const handleCancelPrint = () => {
    // Always call the cancelPrintRequest, TypeScript will complain but it's available at runtime
    if (isPrinting) {
      (window.electronAPI as any).cancelPrintRequest?.();
    }
    setIsPrinting(false);
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
                  onClick={previewOpen ? handlePrintPreviewClose : handlePrintPreviewOpen}
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
              >
                <Box sx={{ p: 2 }}>
                  <ReceiptPreview items={cartItems} total={total} />
                </Box>
              </Popover>
              {devMode && (
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
              )}
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
              {devMode && (
                <Tooltip title={`${t('app.cart.cancelPrint') || 'Cancel Printing'} (EXPERIMENTAL)`}>
                  <IconButton color="error" onClick={handleCancelPrint}>
                    <CancelIcon />
                  </IconButton>
                </Tooltip>
              )}
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
                const categoryStyle = getCategoryStyle(category, theme);
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
        onPrint={handlePrintCart}
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
          <PrinterSettings 
            onSave={handlePrinterSettingsSave} 
            handlePrinterSettingsClose={handlePrinterSettingsClose} // Added missing prop
          />
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