import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Divider,
  IconButton,
  Tooltip,
  Card,
  Button,
  useTheme,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
  Snackbar,
  Alert
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PrintIcon from '@mui/icons-material/Print';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import PaymentsIcon from '@mui/icons-material/Payments';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SaveIcon from '@mui/icons-material/Save';
import { useLanguage } from '../../context/LanguageContext';
import { useVariableContext } from '../../context/VariableContext';
import { cartTransactionService, CartTransaction } from '../../services/cartTransactionService';
import { CartItem, Product } from '../../types/index';

const RecentOrdersPanel: React.FC = () => {
  const { t } = useLanguage();
  const theme = useTheme();
  
  // Retrieve docking and editing states from VariableContext
  const {
    setRecentOrdersOpen,
    recentOrdersDockPosition,
    setRecentOrdersDockPosition,
    editingTransaction,
    setEditingTransaction
  } = useVariableContext();

  const [transactions, setTransactions] = useState<CartTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination states
  const [limit, setLimit] = useState(15);
  const [hasMore, setHasMore] = useState(false);

  // Success/Error toast states
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Local editing states (items and payment method)
  const [editItems, setEditItems] = useState<CartItem[]>([]);
  const [editPaymentMethod, setEditPaymentMethod] = useState<'cash' | 'card'>('cash');

  const loadData = async () => {
    try {
      setLoading(true);
      const allTransactions = await cartTransactionService.getTransactions();
      
      // Sort descending by transaction date (newest first)
      allTransactions.sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime());
      
      setHasMore(allTransactions.length > limit);
      setTransactions(allTransactions.slice(0, limit));
    } catch (err) {
      console.error('Error loading recent transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Listen for transactionSaved event to reload transactions list
    const handleTransactionSaved = () => {
      loadData();
    };

    window.addEventListener('transactionSaved', handleTransactionSaved);
    return () => {
      window.removeEventListener('transactionSaved', handleTransactionSaved);
    };
  }, [limit]); // Re-run loadData when pagination limit changes

  // Listener to intercept products clicked in grid when editing order is active
  useEffect(() => {
    if (!editingTransaction) return;

    const handleAddProductToEdit = (event: Event) => {
      const product = (event as CustomEvent).detail as Product;
      setEditItems((prevItems) => {
        const existing = prevItems.find((item) => item.product.id === product.id);
        if (existing) {
          return prevItems.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        } else {
          return [...prevItems, { product, quantity: 1 }];
        }
      });
      setSuccessMessage(`${product.name} ${t('common.add') || 'added'}`);
    };

    window.addEventListener('addProductToEditOrder', handleAddProductToEdit);
    return () => {
      window.removeEventListener('addProductToEditOrder', handleAddProductToEdit);
    };
  }, [editingTransaction, t]);

  const handleClose = () => {
    setRecentOrdersOpen(false);
    setEditingTransaction(null); // Clear editing if panel closed
  };

  const handleLoadMore = () => {
    setLimit((prev) => prev + 15);
  };

  // Reprint Receipt Function
  const handleReprintReceipt = (tx: CartTransaction) => {
    try {
      const items: CartItem[] = JSON.parse(tx.items_data);
      const cartData = {
        items: items.map((item) => ({
          name: item.product.name.normalize('NFC'),
          quantity: item.quantity,
          price: item.product.price,
        })),
        total: tx.total_amount,
      };

      if (window.electronAPI) {
        const selectedPrinter = localStorage.getItem('selectedPrinter') || '';
        console.log('Sending reprint request to Electron API:', cartData);
        window.electronAPI.printCart(cartData, { name: selectedPrinter });
        setSuccessMessage(t('sales.receiptPrinted') || 'Receipt reprinted successfully');
      } else {
        console.error('Electron API not available for reprinting');
        setErrorMessage(t('common.electronNotAvailable') || 'Electron integration is not available');
      }
    } catch (error) {
      console.error('Failed to reprint receipt:', error);
      setErrorMessage(t('common.error') || 'Error reprinting receipt');
    }
  };

  // Enter Quick-Edit Mode
  const handleEnterEditMode = (tx: CartTransaction) => {
    try {
      const items: CartItem[] = JSON.parse(tx.items_data);
      setEditingTransaction(tx);
      setEditItems(items);
      setEditPaymentMethod(tx.payment_method === 'card' ? 'card' : 'cash');
    } catch (err) {
      console.error('Failed to parse transaction items for editing:', err);
      setErrorMessage(t('common.error') || 'Error entering edit mode');
    }
  };

  // Quick-Edit quantity adjustment
  const handleUpdateQuantity = (productId: string, delta: number) => {
    setEditItems((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return { ...item, quantity: newQty >= 0 ? newQty : 0 };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const handleDeleteItem = (productId: string) => {
    setEditItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Live Recalculated Total
  const calculatedTotal = editItems.reduce((sum, item) => sum + item.quantity * item.product.price, 0);

  // Save changes to transaction in IndexedDB
  const handleSaveEdit = async () => {
    if (!editingTransaction) return;

    try {
      const itemsCount = editItems.reduce((sum, item) => sum + item.quantity, 0);
      const updates = {
        items_data: JSON.stringify(editItems),
        total_amount: calculatedTotal,
        items_count: itemsCount,
        payment_method: editPaymentMethod,
        synced: false, // Reset synced flag so it can be re-synced!
      };

      // Update in IndexedDB
      await cartTransactionService.updateTransaction(editingTransaction.id, updates);

      // Auto-trigger a reprinted receipt if receipt printing is active
      const isReceiptPrintingEnabled = localStorage.getItem('printReceiptEnabled') !== 'false';
      if (isReceiptPrintingEnabled) {
        const cartData = {
          items: editItems.map((item) => ({
            name: item.product.name.normalize('NFC'),
            quantity: item.quantity,
            price: item.product.price,
          })),
          total: calculatedTotal,
        };
        if (window.electronAPI) {
          const selectedPrinter = localStorage.getItem('selectedPrinter') || '';
          window.electronAPI.printCart(cartData, { name: selectedPrinter });
        }
      }

      setSuccessMessage(t('app.cart.saveSuccess') || 'Transaction updated successfully');
      setEditingTransaction(null);
      
      // Refresh local list and notify components
      await loadData();
      window.dispatchEvent(new CustomEvent('transactionSaved'));
    } catch (err) {
      console.error('Failed to update transaction:', err);
      setErrorMessage(t('sales.errorSavingTransaction') || 'Error updating transaction');
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  // Helper to format item details string
  const formatItemsString = (itemsData: string) => {
    try {
      const items: CartItem[] = JSON.parse(itemsData);
      return items.map((item) => `${item.quantity}x ${item.product.name}`).join(', ');
    } catch (e) {
      return '';
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        bgcolor: 'background.paper',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: 16 }}>
          {editingTransaction
            ? t('app.cart.editOrder') || 'Edit Order'
            : t('app.cart.recentOrders') || 'Recent Orders'}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {!editingTransaction && (
            <Tooltip
              title={
                recentOrdersDockPosition === 'left'
                  ? t('app.cart.dockRight') || 'Dock Right'
                  : t('app.cart.dockLeft') || 'Dock Left'
              }
            >
              <IconButton
                size="small"
                onClick={() => setRecentOrdersDockPosition(recentOrdersDockPosition === 'left' ? 'right' : 'left')}
                color="primary"
              >
                {recentOrdersDockPosition === 'left' ? (
                  <ArrowForwardIcon fontSize="small" />
                ) : (
                  <ArrowBackIcon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
          )}
          <IconButton size="small" onClick={handleClose} color="inherit">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* Main Content Area */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 2,
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
        }}
      >
        {loading && transactions.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress size={32} />
          </Box>
        ) : editingTransaction ? (
          /* QUICK EDIT MODE */
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <IconButton
                size="small"
                onClick={() => setEditingTransaction(null)}
                sx={{ mr: 1, p: 0.5, border: '1px solid', borderColor: 'divider' }}
              >
                <ArrowBackIcon fontSize="small" />
              </IconButton>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {t('app.cart.orderNumber')?.replace('{id}', editingTransaction.id.toString()) || `Order #${editingTransaction.id}`}
              </Typography>
            </Box>

            {/* List of items being edited */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
              {editItems.map((item) => (
                <Card
                  key={item.product.id}
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    borderColor: 'divider',
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : '#ffffff',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, flex: 1, pr: 1 }}>
                      {item.product.name}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                      {(item.quantity * item.product.price).toFixed(2).replace('.', ',')}€
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      {item.product.price.toFixed(2).replace('.', ',')}€ / {t('app.statistics.quantity') || 'Qty'}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleUpdateQuantity(item.product.id, -1)}
                        sx={{ border: '1px solid', borderColor: 'divider', p: 0.25, borderRadius: '4px' }}
                      >
                        <RemoveIcon fontSize="inherit" />
                      </IconButton>
                      <Typography variant="body2" sx={{ fontWeight: 700, minWidth: 20, textAlign: 'center' }}>
                        {item.quantity}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => handleUpdateQuantity(item.product.id, 1)}
                        sx={{ border: '1px solid', borderColor: 'divider', p: 0.25, borderRadius: '4px' }}
                      >
                        <AddIcon fontSize="inherit" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteItem(item.product.id)}
                        sx={{ ml: 1, border: '1px solid', borderColor: 'divider', p: 0.25, borderRadius: '4px' }}
                      >
                        <DeleteIcon fontSize="inherit" />
                      </IconButton>
                    </Box>
                  </Box>
                </Card>
              ))}
              {editItems.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                  {t('sales.noItems') || 'No items in order'}
                </Typography>
              )}
            </Box>

            {/* Bottom Edit Settings */}
            <Divider sx={{ my: 2 }} />

            {/* Payment Method Selector */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: 11, textTransform: 'uppercase' }}>
                {t('app.cart.paymentMethod') || 'Payment'}
              </Typography>
              <ToggleButtonGroup
                value={editPaymentMethod}
                exclusive
                onChange={(_, val) => {
                  if (val) setEditPaymentMethod(val);
                }}
                size="small"
                sx={{
                  flex: 1,
                  borderRadius: '6px',
                  border: '1.5px solid',
                  borderColor: 'divider',
                  overflow: 'hidden',
                  '& .MuiToggleButton-root': {
                    flex: 1,
                    py: 0.4,
                    px: 1,
                    fontWeight: 600,
                    fontSize: 11,
                    textTransform: 'none',
                    gap: 0.5,
                    border: 'none',
                    borderRadius: '0 !important',
                    '&:not(:last-of-type)': {
                      borderRight: '1.5px solid',
                      borderColor: 'divider',
                    },
                    '&.Mui-selected': {
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      borderColor: 'primary.main',
                      '&:hover': { bgcolor: 'primary.dark' },
                    },
                    '&:not(.Mui-selected)': {
                      color: 'text.secondary',
                      '&:hover': { bgcolor: 'action.hover' },
                    },
                  },
                }}
              >
                <ToggleButton value="cash">
                  <PaymentsIcon sx={{ fontSize: 13 }} />
                  {t('app.cart.paymentCash') || 'Cash'}
                </ToggleButton>
                <ToggleButton value="card">
                  <CreditCardIcon sx={{ fontSize: 13 }} />
                  {t('app.cart.paymentCard') || 'Card'}
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {/* Recalculated total and actions */}
            <Box sx={{ mt: 'auto', p: 1, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, p: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {t('app.cart.total') || 'Total'}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main' }}>
                  {calculatedTotal.toFixed(2).replace('.', ',')}€
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  size="small"
                  onClick={() => setEditingTransaction(null)}
                  sx={{ borderRadius: 1.5, py: 1 }}
                >
                  {t('common.cancel') || 'Cancel'}
                </Button>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  size="small"
                  disabled={editItems.length === 0}
                  onClick={handleSaveEdit}
                  startIcon={<SaveIcon />}
                  sx={{ borderRadius: 1.5, py: 1, fontWeight: 700 }}
                >
                  {t('common.save') || 'Save'}
                </Button>
              </Box>
            </Box>
          </Box>
        ) : transactions.length === 0 ? (
          <Box sx={{ py: 6, px: 2, textAlign: 'center' }}>
            <Typography variant="subtitle1" color="text.secondary">
              {t('app.cart.noRecentOrders') || 'No recent orders found'}
            </Typography>
          </Box>
        ) : (
          /* TRANSACTIONS LIST VIEW */
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {transactions.map((tx) => (
              <Card
                key={tx.id}
                variant="outlined"
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  borderColor: 'divider',
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : '#ffffff',
                  boxShadow: 'none',
                  position: 'relative',
                  '&:hover': {
                    boxShadow: theme.palette.mode === 'dark'
                      ? '0 4px 12px rgba(0,0,0,0.3)'
                      : '0 4px 12px rgba(0,0,0,0.04)',
                    borderColor: theme.palette.primary.light,
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Time & Badge */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    {formatTime(tx.transaction_date)} • {t('app.cart.orderNumber')?.replace('{id}', tx.id.toString()) || `#${tx.id}`}
                  </Typography>
                  <Box
                    sx={{
                      fontSize: 10,
                      fontWeight: 700,
                      px: 1,
                      py: 0.2,
                      borderRadius: 1,
                      bgcolor: tx.payment_method === 'card' ? 'info.light' : 'success.light',
                      color: tx.payment_method === 'card' ? 'info.dark' : 'success.dark',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      textTransform: 'uppercase',
                    }}
                  >
                    {tx.payment_method === 'card' ? (
                      <CreditCardIcon sx={{ fontSize: 11 }} />
                    ) : (
                      <PaymentsIcon sx={{ fontSize: 11 }} />
                    )}
                    {tx.payment_method === 'card' ? t('app.cart.paymentCard') : t('app.cart.paymentCash')}
                  </Box>
                </Box>

                {/* Truncated Items list */}
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mb: 1.5,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    fontWeight: 500,
                    lineHeight: 1.3,
                  }}
                >
                  {formatItemsString(tx.items_data)}
                </Typography>

                {/* Price and Action Buttons */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary' }}>
                    {tx.total_amount.toFixed(2).replace('.', ',')}€
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title={t('app.cart.reprintReceipt') || 'Reprint Receipt'}>
                      <IconButton
                        size="small"
                        onClick={() => handleReprintReceipt(tx)}
                        sx={{
                          border: '1px solid',
                          borderColor: 'divider',
                          bgcolor: 'background.paper',
                          '&:hover': { bgcolor: 'primary.light', color: 'primary.main', borderColor: 'primary.light' },
                        }}
                      >
                        <PrintIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t('common.edit') || 'Edit'}>
                      <IconButton
                        size="small"
                        onClick={() => handleEnterEditMode(tx)}
                        sx={{
                          border: '1px solid',
                          borderColor: 'divider',
                          bgcolor: 'background.paper',
                          '&:hover': { bgcolor: 'primary.light', color: 'primary.main', borderColor: 'primary.light' },
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </Card>
            ))}

            {/* Load More Button */}
            {hasMore && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, mb: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleLoadMore}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 3,
                    borderColor: 'divider',
                    color: 'text.secondary',
                    '&:hover': {
                      borderColor: 'primary.main',
                      color: 'primary.main',
                      bgcolor: 'transparent',
                    }
                  }}
                >
                  {t('app.cart.loadMore') || 'Load More'}
                </Button>
              </Box>
            )}
          </Box>
        )}
      </Box>

      {/* Toast notifications */}
      <Snackbar open={!!errorMessage} autoHideDuration={4000} onClose={() => setErrorMessage(null)}>
        <Alert onClose={() => setErrorMessage(null)} severity="error" sx={{ width: '100%' }}>
          {errorMessage}
        </Alert>
      </Snackbar>

      <Snackbar open={!!successMessage} autoHideDuration={4000} onClose={() => setSuccessMessage(null)}>
        <Alert onClose={() => setSuccessMessage(null)} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default RecentOrdersPanel;
