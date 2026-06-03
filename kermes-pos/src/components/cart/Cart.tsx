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
  TextField,
  Popover,
  Drawer,
  InputAdornment,
  alpha
} from '@mui/material';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import PrintIcon from '@mui/icons-material/Print';
import CancelIcon from '@mui/icons-material/Cancel';
import HistoryIcon from '@mui/icons-material/History';
import { RootState } from '../../store';
import { removeFromCart, clearCart, addToCartWithQuantity, addToCart, decrementProduct } from '../../store/slices/cartSlice';
import CartItemRow from './CartItemRow';
import CartFooter from './CartFooter';
import PrinterSettings from '../PrinterSettings';
import { CartItem, Product } from '../../types/index';
import { useSettings } from '../../context/SettingsContext';
import { useLanguage } from '../../context/LanguageContext';
import { getCategoryStyle } from '../../utils/categoryUtils';
import { cartTransactionService } from '../../services/cartTransactionService';
import { sessionService } from '../../services/sessionService';
import StorefrontIcon from '@mui/icons-material/Storefront';
import SettingsIcon from '@mui/icons-material/Settings';
import ReceiptPreview from './receipt/ReceiptPreview';
import { useVariableContext } from '../../context/VariableContext';
// import SystemUpdateIcon from '@mui/icons-material/SystemUpdate';
import useHotkey from '../../hooks/useHotkey';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import WifiTetheringIcon from '@mui/icons-material/WifiTethering';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import EditIcon from '@mui/icons-material/Edit';
import { getDb } from '../../firebaseInit';

interface CartProps {
  devMode?: boolean;
  productTapSeparateEnabled?: boolean;
}

interface AggregatedCartItem {
  product: Product;
  quantity: number;
  ticketCount: number;
}

const aggregateCategoryItems = (items: CartItem[]): AggregatedCartItem[] => {
  const map = new Map<string, AggregatedCartItem>();
  items.forEach((item) => {
    const existing = map.get(item.product.id);
    if (existing) {
      existing.quantity += item.quantity;
      existing.ticketCount += 1;
    } else {
      map.set(item.product.id, {
        product: item.product,
        quantity: item.quantity,
        ticketCount: 1,
      });
    }
  });
  return Array.from(map.values());
};

const Cart: React.FC<CartProps> = ({ devMode, productTapSeparateEnabled = true }) => {
  const { t } = useLanguage();
  const dispatch = useDispatch();
  const theme = useTheme();
  const { showScrollbars, formatPrice, currency } = useSettings();
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const total = useSelector((state: RootState) => state.cart.total);
  const [printerSettingsOpen, setPrinterSettingsOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [previewAnchorEl, setPreviewAnchorEl] = useState<HTMLElement | null>(null);
  const [selectedPrinter, setSelectedPrinter] = useState<string>('');
  const [isPrinting, setIsPrinting] = useState(false);
  const {
    kursName,
    setKursName,
    recentOrdersOpen,
    setRecentOrdersOpen,
    onlineOrders,
    importedOrderId,
    setImportedOrderId,
    products,
    editingOnlineOrderId,
    setEditingOnlineOrderId,
  } = useVariableContext();
  const [paymentMethod, setPaymentMethod] = React.useState<'cash' | 'card'>('cash');
  const [receiptKursName, setReceiptKursName] = useState('Münih Fatih Kermes');
  const [kursNameDraft, setKursNameDraft] = useState(kursName);
  const [receiptKursNameDraft, setReceiptKursNameDraft] = useState(receiptKursName);
  const [kursNameDialogOpen, setKursNameDialogOpen] = useState(false);
  const [onlineOrdersDrawerOpen, setOnlineOrdersDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [importingOrderId, setImportingOrderId] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [onlineEditOrder, setOnlineEditOrder] = useState<any | null>(null);
  const [onlineEditItems, setOnlineEditItems] = useState<any[]>([]);
  const [isReceiptPrintingEnabled, setIsReceiptPrintingEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return true;
    }
    const savedPreference = localStorage.getItem('printReceiptEnabled');
    return savedPreference === null ? true : savedPreference === 'true';
  });

  useEffect(() => {
    const savedPrinter = localStorage.getItem('selectedPrinter');
    setSelectedPrinter(savedPrinter || "");
  }, []);

  useEffect(() => {
    const savedKursName = localStorage.getItem('kursName');
    const savedReceiptKursName = localStorage.getItem('receiptKursName');
    if (savedKursName) {
      setKursName(savedKursName);
      setKursNameDraft(savedKursName);
    }
    if (savedReceiptKursName) {
      setReceiptKursName(savedReceiptKursName);
      setReceiptKursNameDraft(savedReceiptKursName);
    }
  }, [setKursName]);

  useEffect(() => {
    setKursNameDraft(kursName);
    setReceiptKursNameDraft(receiptKursName);
  }, [kursName, receiptKursName]);

  useEffect(() => {
    localStorage.setItem('printReceiptEnabled', String(isReceiptPrintingEnabled));
  }, [isReceiptPrintingEnabled]);

  const handleRemoveItem = (id: string) => {
    dispatch(removeFromCart(id));
  };

  const handleClearCart = () => {
    dispatch(clearCart());
    setImportedOrderId(null);
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
      currency,
    };

    try {
      // Get active session if one exists
      const activeSession = await sessionService.getActiveSession();
      
      // Save transaction to IndexedDB, linked to active session
      await cartTransactionService.saveTransaction(
        cartItems, 
        total, 
        paymentMethod,
        activeSession?.id
      );

      // If this was an imported online pre-order, mark it completed in Firestore
      if (importedOrderId) {
        const { doc: fsDoc, updateDoc, serverTimestamp } = await import('firebase/firestore');
        const orderRef = fsDoc(getDb(), 'online_orders', importedOrderId);
        await updateDoc(orderRef, {
          status: 'completed',
          updatedAt: serverTimestamp()
        });
        setImportedOrderId(null); // Clear imported tracking
      }

      window.dispatchEvent(new CustomEvent('transactionSaved'));
      setSuccessMessage(
        isReceiptPrintingEnabled
          ? t('sales.receiptPrinted')
          : t('sales.transactionSavedNoReceipt')
      );
    } catch (error) {
      setErrorMessage(t('sales.errorSavingTransaction'));
      console.error('Failed to save transaction:', error);
    }

    if (isReceiptPrintingEnabled) {
      if (window.electronAPI) {
        console.log('Sending cart data to Electron API:', cartData);
        window.electronAPI.printCart(cartData, { name: selectedPrinter || "" });
      } else {
        console.error('Electron API not available');
      }
    }

    // Clear the cart after printing and saving
    dispatch(clearCart());
    setIsPrinting(false);
  };

  // Hotkey: trigger print/record with configured key (default: Space)
  const [configuredHotkey, setConfiguredHotkey] = React.useState<string | null>(() => {
    if (typeof window === 'undefined') return 'Space';
    return localStorage.getItem('pos.printHotkey') || 'Space';
  });

  React.useEffect(() => {
    const onChange = (e: any) => {
      const v = e?.detail ?? localStorage.getItem('pos.printHotkey');
      setConfiguredHotkey(v || 'Space');
    };
    window.addEventListener('hotkeyChanged', onChange as EventListener);
    return () => window.removeEventListener('hotkeyChanged', onChange as EventListener);
  }, []);

  useHotkey(configuredHotkey, () => {
    if (cartItems.length === 0) return;
    if (isPrinting) return;
    handlePrintCart();
  });

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

  useEffect(() => {
    if (!editingOnlineOrderId) {
      setOnlineEditOrder(null);
      setOnlineEditItems([]);
      return;
    }

    const order = onlineOrders.find((o: any) => o.id === editingOnlineOrderId);
    if (!order) {
      // Order likely moved out of pending state (imported/completed/cancelled)
      setEditingOnlineOrderId(null);
      return;
    }

    setOnlineEditOrder(order);
    setOnlineEditItems(order.items.map((item: any) => ({ ...item })));
  }, [editingOnlineOrderId, onlineOrders, setEditingOnlineOrderId]);

  useEffect(() => {
    if (!editingOnlineOrderId) return;

    const handleAddProductToOnlineEdit = (event: Event) => {
      const product = (event as CustomEvent).detail as any;
      setOnlineEditItems((prevItems) => {
        const existing = prevItems.find((item) => item.productId === product.id);
        if (existing) {
          return prevItems.map((item) =>
            item.productId === product.id
              ? { ...item, quantity: (Number(item.quantity) || 0) + 1 }
              : item
          );
        }

        return [
          ...prevItems,
          {
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            category: product.category || 'food',
          },
        ];
      });
      setSuccessMessage(`${product.name} ${t('common.add') || 'added'}`);
    };

    window.addEventListener('addProductToEditOrder', handleAddProductToOnlineEdit);
    return () => window.removeEventListener('addProductToEditOrder', handleAddProductToOnlineEdit);
  }, [editingOnlineOrderId, t]);

  const handleImportOnlineOrder = async (order: any) => {
    setImportingOrderId(order.id);
    try {
      const { doc: fsDoc, runTransaction, serverTimestamp } = await import('firebase/firestore');
      const orderRef = fsDoc(getDb(), 'online_orders', order.id);

      await runTransaction(getDb(), async (tx) => {
        const orderSnap = await tx.get(orderRef);
        if (!orderSnap.exists()) {
          throw new Error('order_not_found');
        }

        const status = orderSnap.data()?.status;
        if (status !== 'pending') {
          throw new Error('order_not_pending');
        }

        tx.update(orderRef, {
          status: 'imported',
          updatedAt: serverTimestamp()
        });
      });

      // Clear POS cart
      dispatch(clearCart());

      // Map items to POS products
      order.items.forEach((item: any) => {
        const localProduct = products.find((p: any) => p.id === item.productId) || {
          id: item.productId,
          name: item.name,
          price: item.price,
          category: 'food',
          inStock: true
        };
        dispatch(addToCartWithQuantity({ product: localProduct, quantity: item.quantity }));
      });

      setImportedOrderId(order.id);
      if (editingOnlineOrderId === order.id) {
        setEditingOnlineOrderId(null);
      }
      setOnlineOrdersDrawerOpen(false);
      setSuccessMessage(t('app.cart.online_orders_imported_msg') || 'Online pre-order successfully imported to cart!');
    } catch (error: any) {
      if (error?.message === 'order_not_pending') {
        setErrorMessage(t('app.cart.online_orders_already_taken') || 'This order is already being processed by another cashier.');
      } else {
        setErrorMessage(t('app.cart.online_orders_import_failed') || 'Failed to import online order. Please try again.');
      }
    } finally {
      setImportingOrderId(null);
    }
  };

  const handleCancelOnlineOrder = async (orderId: string) => {
    setUpdatingOrderId(orderId);
    try {
      const { doc: fsDoc, runTransaction, serverTimestamp } = await import('firebase/firestore');
      const orderRef = fsDoc(getDb(), 'online_orders', orderId);

      await runTransaction(getDb(), async (tx) => {
        const orderSnap = await tx.get(orderRef);
        if (!orderSnap.exists()) {
          throw new Error('order_not_found');
        }

        const status = orderSnap.data()?.status;
        if (status !== 'pending') {
          throw new Error('order_not_pending');
        }

        tx.update(orderRef, {
          status: 'cancelled',
          updatedAt: serverTimestamp()
        });
      });

      setSuccessMessage(t('app.cart.online_orders_cancelled_msg') || 'Online pre-order cancelled.');
      if (editingOnlineOrderId === orderId) {
        setEditingOnlineOrderId(null);
      }
    } catch (error: any) {
      if (error?.message === 'order_not_pending') {
        setErrorMessage(t('app.cart.online_orders_not_pending') || 'This order can no longer be modified.');
      } else {
        setErrorMessage(t('app.cart.online_orders_cancel_failed') || 'Failed to cancel online order. Please try again.');
      }
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleOpenEditOnlineOrder = (order: any) => {
    setEditingOnlineOrderId(order.id);
    setOnlineEditOrder(order);
    setOnlineEditItems(order.items.map((item: any) => ({ ...item })));
    setOnlineOrdersDrawerOpen(false);
    setSuccessMessage(t('app.cart.online_orders_edit_mode_started') || 'Online pre-order edit mode activated.');
  };

  const handleEditItemQuantity = (productId: string, delta: number) => {
    setOnlineEditItems((prev) => {
      const next = [...prev];
      const index = next.findIndex((item) => item.productId === productId);
      if (index < 0) return prev;
      const current = Number(next[index]?.quantity) || 0;
      const updatedQty = Math.max(0, current + delta);
      if (updatedQty <= 0) {
        next.splice(index, 1);
      } else {
        next[index] = { ...next[index], quantity: updatedQty };
      }
      return next;
    });
  };

  const handleSaveEditedOnlineOrder = async () => {
    if (!onlineEditOrder || !editingOnlineOrderId) return;
    setUpdatingOrderId(onlineEditOrder.id);
    try {
      const { doc: fsDoc, runTransaction, serverTimestamp } = await import('firebase/firestore');
      const orderRef = fsDoc(getDb(), 'online_orders', onlineEditOrder.id);

      const computedTotal = onlineEditItems.reduce((sum, item) => {
        const qty = Number(item.quantity) || 0;
        const price = Number(item.price) || 0;
        return sum + qty * price;
      }, 0);

      await runTransaction(getDb(), async (tx) => {
        const orderSnap = await tx.get(orderRef);
        if (!orderSnap.exists()) {
          throw new Error('order_not_found');
        }

        const status = orderSnap.data()?.status;
        if (status !== 'pending') {
          throw new Error('order_not_pending');
        }

        tx.update(orderRef, {
          items: onlineEditItems,
          total: computedTotal,
          updatedAt: serverTimestamp()
        });
      });

      setEditingOnlineOrderId(null);
      setSuccessMessage(t('app.cart.online_orders_saved_msg') || 'Online pre-order updated successfully.');
    } catch (error: any) {
      if (error?.message === 'order_not_pending') {
        setErrorMessage(t('app.cart.online_orders_not_pending') || 'This order can no longer be modified.');
      } else {
        setErrorMessage(t('app.cart.online_orders_save_failed') || 'Failed to save online pre-order changes.');
      }
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleCancelOnlineEditMode = () => {
    setEditingOnlineOrderId(null);
  };

  const onlineEditTotal = onlineEditItems.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.price) || 0;
    return sum + qty * price;
  }, 0);

  const previewOpen = Boolean(previewAnchorEl);

  const handleKursNameDialogOpen = () => {
    setKursNameDraft(kursName);
    setReceiptKursNameDraft(receiptKursName);
    setKursNameDialogOpen(true);
  };

  const handleKursNameDialogClose = () => {
    setKursNameDialogOpen(false);
  };

  const handleKursNameDialogSave = () => {
    setKursName(kursNameDraft);
    setReceiptKursName(receiptKursNameDraft);
    if (window.electronAPI) {
      window.electronAPI.changeKursName(receiptKursNameDraft);
    } else {
      console.error('Electron API not available');
    }
    localStorage.setItem('receiptKursName', receiptKursNameDraft);
    setKursNameDialogOpen(false);
  };

  const handleKursNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setKursNameDraft(event.target.value);
  };

  const handleReceiptKursNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setReceiptKursNameDraft(event.target.value);
  };

  const handleKursNameReset = () => {
    setKursNameDraft('Münih Fatih');
    setReceiptKursNameDraft('Münih Fatih Kermes');
  };

  // Group items by category
  const groupedItems = cartItems.reduce((groups, item) => {
    const category = item.product.category || 'Other';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(item);
    return groups;
  }, {} as Record<string, CartItem[]>);

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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="h6">
            {t('sales.cart')}
          </Typography>
          {onlineOrders.length > 0 && (
            <Box
              onClick={() => setOnlineOrdersDrawerOpen(true)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.8,
                px: 1.5,
                py: 0.5,
                borderRadius: '20px',
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.15)' : 'rgba(76, 175, 80, 0.1)',
                border: '1px solid',
                borderColor: theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.4)' : 'rgba(76, 175, 80, 0.25)',
                color: 'success.main',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: 12,
                boxShadow: theme.palette.mode === 'dark' 
                  ? '0 0 10px rgba(76, 175, 80, 0.2)' 
                  : '0 0 8px rgba(76, 175, 80, 0.1)',
                animation: 'pillPulse 2s infinite ease-in-out',
                '&:hover': {
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.25)' : 'rgba(76, 175, 80, 0.18)',
                },
                transition: 'all 0.25s',
              }}
            >
              <Box component="span" sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: 'success.main',
                display: 'inline-block',
                boxShadow: '0 0 6px #4caf50',
                animation: 'dotGlow 1.5s infinite alternate'
              }} />
              {t('app.cart.online_orders_pill')?.replace('{count}', String(onlineOrders.length)) || `${onlineOrders.length} Online`}
            </Box>
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {/* Update button moved to SettingsPage */}
          <Tooltip title={t('app.cart.previewReceipt')}>
            <IconButton
              onClick={previewOpen ? handlePrintPreviewClose : handlePrintPreviewOpen}
              disabled={cartItems.length === 0}
              color="primary"
              sx={{ padding: '5px' }}
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
            <Box sx={{ p: 2 }} onClick={handlePrintPreviewClose} style={{}}>
              <ReceiptPreview items={cartItems} total={total} />
            </Box>
          </Popover>
          <Tooltip title={t('app.cart.recentOrders') || 'Recent Orders'}>
            <IconButton
              onClick={() => setRecentOrdersOpen(!recentOrdersOpen)}
              color={recentOrdersOpen ? 'secondary' : 'primary'}
              sx={{ padding: '5px' }}
            >
              <HistoryIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('app.cart.setKursName')}>
            <IconButton
              onClick={handleKursNameDialogOpen}
              color="primary"
              sx={{ padding: '5px' }}
            >
              <StorefrontIcon />
            </IconButton>
          </Tooltip>
          {devMode && (
            <Tooltip title={t('app.cart.printerSettings')}>
              <IconButton
                color="primary"
                size="small"
                onClick={handlePrinterSettingsOpen}
                aria-label={t('app.cart.printerSettings')}
                sx={{ padding: '5px' }}
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
              sx={{ padding: '5px' }}
            >
              <DeleteSweepIcon />
            </IconButton>
          </Tooltip>
          {devMode && (
            <Tooltip title={`${t('app.cart.cancelPrint') || 'Cancel Printing'} (EXPERIMENTAL)`}>
              <IconButton color="error" onClick={handleCancelPrint} sx={{ padding: '5px' }}>
                <CancelIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      <Box sx={{
        height: 'calc(100% - 120px)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto',
        mb: 2,
        pt: 0,
        pb: 0,
        ...(!showScrollbars && {
          '&::-webkit-scrollbar': {
            display: 'none',
          },
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }),
      }}>
        {importedOrderId && (
          <Alert 
            severity="info" 
            icon={<WifiTetheringIcon fontSize="small" />}
            onClose={() => setImportedOrderId(null)}
            sx={{ m: 1, borderRadius: 2, fontWeight: 600, fontSize: '11px', py: 0.5 }}
          >
            {t('app.cart.imported_order_active') || "Pre-order imported. Completed upon checkout."}
          </Alert>
        )}
        {editingOnlineOrderId && onlineEditOrder && (
          <Box sx={{ m: 1, p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'warning.light', bgcolor: theme.palette.mode === 'dark' ? 'rgba(237,108,2,0.12)' : '#fff8e1' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.75 }}>
              {t('app.cart.online_orders_edit_mode_active') || 'Editing Online Pre-order'} {onlineEditOrder.queueNumber ? `(${onlineEditOrder.queueNumber})` : ''}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.25 }}>
              {t('app.cart.online_orders_tap_adds_hint') || 'Tap products in the grid to add them to this online pre-order.'}
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 1.25 }}>
              {onlineEditItems.map((item) => (
                <Box key={item.productId} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 0.9, border: '1px solid', borderColor: 'divider', borderRadius: 1.5, bgcolor: 'background.paper' }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{item.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{formatPrice(Number(item.price))}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                    <Button size="small" variant="outlined" onClick={() => handleEditItemQuantity(item.productId, -1)}>-</Button>
                    <Typography variant="body2" sx={{ minWidth: 18, textAlign: 'center', fontWeight: 700 }}>{item.quantity}</Typography>
                    <Button size="small" variant="outlined" onClick={() => handleEditItemQuantity(item.productId, 1)}>+</Button>
                  </Box>
                </Box>
              ))}
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.25 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>{t('sales.total')}</Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'primary.main' }}>{formatPrice(onlineEditTotal)}</Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button fullWidth variant="outlined" onClick={handleCancelOnlineEditMode}>
                {t('app.cart.online_orders_exit_edit_mode') || 'Exit Edit Mode'}
              </Button>
              <Button
                fullWidth
                variant="contained"
                onClick={handleSaveEditedOnlineOrder}
                disabled={onlineEditItems.length === 0 || Boolean(updatingOrderId)}
              >
                {updatingOrderId === onlineEditOrder.id
                  ? (t('app.cart.online_orders_saving') || 'Saving...')
                  : (t('common.save') || 'Save')}
              </Button>
            </Box>
          </Box>
        )}
        {cartItems.length === 0 ? (
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flexGrow: 1,
            py: 4,
            px: 2,
            textAlign: 'center'
          }}>
            <Box sx={{
              p: 2,
              borderRadius: '50%',
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(143,155,255,0.06)' : 'rgba(143,155,255,0.03)',
              color: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2,
              animation: 'bounceSlow 3s infinite ease-in-out',
              '@keyframes bounceSlow': {
                '0%, 100%': { transform: 'translateY(0)' },
                '50%': { transform: 'translateY(-6px)' }
              }
            }}>
              <ShoppingBagIcon sx={{ fontSize: 54, opacity: 0.6 }} />
            </Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 0.5 }}>
              {t('app.cart.emptyCart') || 'Cart is empty'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 220, lineHeight: 1.5 }}>
              {t('app.cart.emptyCartSubtitle') || 'Scan a barcode or tap products from the catalog to add items'}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 0.5, mx: -0.5 }}>
            {categoryOrder
              .filter(category => groupedItems[category] && groupedItems[category].length > 0)
              .map(category => {
                const categoryStyle = getCategoryStyle(category, theme);
                const aggregatedItems = aggregateCategoryItems(groupedItems[category]);
                return (
                  <Box
                    key={category}
                    sx={{
                      borderRadius: 2.5,
                      border: '1.5px solid',
                      borderColor: alpha(categoryStyle.borderColor, 0.18),
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.005)',
                      overflow: 'hidden',
                      boxShadow: theme.palette.mode === 'dark' 
                        ? '0 2px 8px rgba(0,0,0,0.2)' 
                        : '0 1px 4px rgba(0,0,0,0.02)',
                    }}
                  >
                    {/* Compact Card Header */}
                    <Box
                      sx={{
                        px: 1.5,
                        py: 0.8,
                        bgcolor: alpha(categoryStyle.borderColor, 0.06),
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        borderBottom: '1px solid',
                        borderColor: alpha(categoryStyle.borderColor, 0.12),
                      }}
                    >
                      {React.createElement(categoryStyle.icon, {
                        sx: { color: categoryStyle.borderColor, fontSize: '1.1rem' }
                      })}
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 800,
                          color: categoryStyle.borderColor,
                          textTransform: 'uppercase',
                          fontSize: '0.72rem',
                          letterSpacing: '0.05em',
                        }}
                      >
                        {categoryStyle.name}
                      </Typography>
                    </Box>

                    {/* Items List */}
                    <List disablePadding>
                      {aggregatedItems.map((item, index) => (
                        <React.Fragment key={item.product.id}>
                          <CartItemRow
                            item={item as CartItem}
                            ticketCount={item.ticketCount}
                            onRemove={handleRemoveItem}
                            onIncrement={(id, quantity) => {
                              if (productTapSeparateEnabled) {
                                dispatch(addToCart(item.product));
                              } else {
                                dispatch(addToCartWithQuantity({ product: item.product, quantity: 1 }));
                              }
                            }}
                            onDecrement={(id) => dispatch(decrementProduct(id))}
                          />
                          {index < aggregatedItems.length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                  </Box>
                );
              })}
          </Box>
        )}
      </Box>

      <CartFooter
        total={total}
        onPrint={handlePrintCart}
        hasItems={cartItems.length > 0}
        isReceiptPrintingEnabled={isReceiptPrintingEnabled}
        onToggleReceiptPrinting={setIsReceiptPrintingEnabled}
        hotkey={configuredHotkey || 'Space'}
        paymentMethod={paymentMethod}
        onPaymentMethodChange={setPaymentMethod}
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

      <Dialog
        open={kursNameDialogOpen}
        onClose={handleKursNameDialogClose}
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <form
          onSubmit={e => {
            e.preventDefault();
            handleKursNameDialogSave();
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1 }}>
            <DialogTitle sx={{ flex: 1 }}>{t('app.cart.setKursName')}</DialogTitle>
            <Button
              onClick={handleKursNameReset}
              color="secondary"
              size="small"
              sx={{ minWidth: 'unset', ml: 1, mr: 1 }}
            >
              {t('common.reset') || 'Reset'}
            </Button>
          </Box>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label={t('app.cart.kursName') + " " + t('app.cart.forSummary')}
              type="text"
              fullWidth
              value={kursNameDraft}
              onChange={handleKursNameChange}
              placeholder="Münih Fatih"
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label={t('app.cart.kursName') + " " + t('app.cart.onReceipt')}
              type="text"
              fullWidth
              value={receiptKursNameDraft}
              onChange={handleReceiptKursNameChange}
              placeholder="Münih Fatih Kermes"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleKursNameDialogClose}>{t('common.cancel')}</Button>
            <Button variant="contained" type="submit">{t('common.save')}</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Styled JSX for pulsing badge */}
      <style>{`
        @keyframes pillPulse {
          0% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.3); }
          70% { box-shadow: 0 0 0 6px rgba(76, 175, 80, 0); }
          100% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0); }
        }
        @keyframes dotGlow {
          from { opacity: 0.5; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1.1); }
        }
      `}</style>

      {/* Premium Slide-out Online Orders Drawer */}
      <Drawer
        anchor="right"
        open={onlineOrdersDrawerOpen}
        onClose={() => setOnlineOrdersDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: '380px' },
            bgcolor: 'background.paper',
            borderLeft: `1.5px solid ${theme.palette.divider}`,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            p: 2.5,
            boxShadow: '-8px 0 32px rgba(0,0,0,0.12)'
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
            <WifiTetheringIcon color="primary" />
            {t('app.cart.online_orders_title') || "Online Orders Queue"}
          </Typography>
          <IconButton onClick={() => setOnlineOrdersDrawerOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        <TextField
          fullWidth
          size="small"
          placeholder={t('app.cart.online_orders_search') || "Search queue number..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ mb: 3 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" color="action" />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchQuery('')}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            )
          }}
        />

        <Box sx={{ 
          flexGrow: 1, 
          overflow: 'auto', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 2,
          pr: 0.5,
          '&::-webkit-scrollbar': { width: '6px' },
          '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(0,0,0,0.08)', borderRadius: '3px' }
        }}>
          {onlineOrders.length === 0 ? (
            <Box sx={{ py: 6, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, color: 'text.secondary' }}>
              <ShoppingBagIcon sx={{ fontSize: 44, opacity: 0.3 }} />
              <Typography variant="body2" sx={{ textAlign: 'center' }}>
                {t('app.cart.online_orders_empty') || "No pending online orders in the queue."}
              </Typography>
            </Box>
          ) : (() => {
            const filtered = onlineOrders.filter(order => 
              order.queueNumber.toLowerCase().includes(searchQuery.toLowerCase())
            );
            if (filtered.length === 0) {
              return (
                <Typography variant="body2" sx={{ textAlign: 'center', color: 'text.secondary', py: 4 }}>
                  {t('common.no_results') || "No matching orders found."}
                </Typography>
              );
            }
            return filtered.map((order) => (
              <Box
                key={order.id}
                sx={{
                  p: 2,
                  borderRadius: 3,
                  border: '1.5px solid',
                  borderColor: theme.palette.divider,
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: 'primary.main',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  }
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'success.main', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box component="span" sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'success.main' }} />
                    {order.queueNumber}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {order.createdAt?.seconds 
                      ? new Date(order.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                      : ''
                    }
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  {order.items.map((item: any, i: number) => (
                    <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.4 }}>
                      <Typography variant="body2" color="text.primary" sx={{ fontSize: 13, fontWeight: 500 }}>
                        {item.quantity}x {item.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13 }}>
                        {formatPrice(item.price * item.quantity)}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                <Divider sx={{ my: 1, borderStyle: 'dashed' }} />

                <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700 }}>
                      {t('sales.total')}
                    </Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'primary.main' }}>
                      {formatPrice(order.total)}
                    </Typography>
                  </Box>

                  <Button
                    fullWidth
                    variant="contained"
                    size="small"
                    onClick={() => handleImportOnlineOrder(order)}
                    disabled={Boolean(importingOrderId) || Boolean(updatingOrderId)}
                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 800, py: 0.8 }}
                  >
                    {importingOrderId === order.id
                      ? (t('app.cart.online_orders_importing') || 'Importing...')
                      : (t('app.cart.online_orders_import') || 'Import to Cart')}
                  </Button>

                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<EditIcon fontSize="small" />}
                      onClick={() => handleOpenEditOnlineOrder(order)}
                      disabled={Boolean(importingOrderId) || Boolean(updatingOrderId)}
                      sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 700, px: 1.5 }}
                    >
                      {editingOnlineOrderId === order.id
                        ? (t('app.cart.online_orders_editing') || 'Editing...')
                        : (t('app.cart.online_orders_edit') || 'Edit')}
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={() => handleCancelOnlineOrder(order.id)}
                      disabled={Boolean(importingOrderId) || Boolean(updatingOrderId)}
                      sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 700, px: 1.5 }}
                    >
                      {updatingOrderId === order.id
                        ? (t('app.cart.online_orders_cancelling') || 'Cancelling...')
                        : (t('app.cart.online_orders_cancel') || 'Cancel')}
                    </Button>
                  </Box>
                </Box>
              </Box>
            ));
          })()}
        </Box>
      </Drawer>
    </Box>
  );
};

export default Cart;