import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Paper,
  Badge,
  SpeedDial,
  SpeedDialIcon,
  SpeedDialAction,
  Slider,
  Tooltip,
  Divider,
  Fade,
  Popover
} from '@mui/material';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import BarChartIcon from '@mui/icons-material/BarChart';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import SettingsIcon from '@mui/icons-material/Settings';
import ImportExportIcon from '@mui/icons-material/ImportExport';
import MenuIcon from '@mui/icons-material/Menu';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewComfyIcon from '@mui/icons-material/ViewComfy';
import EventIcon from '@mui/icons-material/Event';
import ModernSwitch from './components/ui/ModernSwitch';
import Cart from './components/cart/Cart';
import ProductDialog from './components/ProductDialog';
import ProductGrid from './components/ProductGrid';
import NumericKeypad from './components/cart/NumericKeypad';
import { Product } from './types/index';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from './store';
import { addToCart, addToCartWithQuantity } from './store/slices/cartSlice';
import { productService } from './services/productService';
import SettingsPage from './components/SettingsPage';
import ImportExport from './components/ImportExport';
import { SettingsProvider } from './context/SettingsContext';
import { ThemeToggle } from './components/ui/ThemeToggle';
import { ThemeProvider } from './context/ThemeContext';
import AppearanceSettings from './components/AppearanceSettings';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import StatisticsPage from './components/StatisticsPage';
import SessionsPage from './components/SessionsPage';
import SyncPage from './components/SyncPage';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { VariableContextProvider, useVariableContext } from './context/VariableContext';
import { useTheme } from '@mui/material/styles';
import { Inventory } from '@mui/icons-material';
import ProductManagementPage from './components/ProductManagementPage';
import MenuDataBridge from './components/MenuDataBridge';
import MenuSettings from './components/MenuSettings';
import { MenuConfigProvider } from './context/MenuConfigContext';
import UpdateNotifier from './components/UpdateNotifier';

/**
 * The `AppContent` component serves as the main application layout and logic handler for the Kermes POS system.
 * It manages the state, routing, and interactions for various features such as product management, cart operations,
 * and printing functionalities. The component is structured with a responsive layout, including an optional AppBar,
 * a product grid, and a cart section.
 *
 * Features:
 * - Product management: Add, edit, delete, and update stock status of products.
 * - Cart operations: Add products to the cart with quantity selection.
 * - Printing: Supports both Electron-based native printing and server-based printing.
 * - Navigation: Provides links to different pages such as statistics, import/export, and settings.
 * - Theme toggle and developer mode support.
 *
 * State Management:
 * - Uses `useState` for local state management (e.g., products, selected quantity, AppBar visibility).
 * - Uses `useSelector` and `useDispatch` from Redux for global state management (e.g., cart items).
 *
 * Routing:
 * - Utilizes `react-router-dom` for navigation between pages.
 * - Routes include `/` (products page), `/statistics`, `/import-export`, and `/settings`.
 *
 * UI Components:
 * - AppBar: A vertical navigation bar with links and a theme toggle.
 * - ProductGrid: Displays a grid of products with actions for stock changes, editing, and deletion.
 * - Cart: Displays the current cart items and allows quantity selection via a numeric keypad.
 * - SpeedDial: Provides quick access to actions like adding a product, toggling the AppBar, and printing.
 * - ProductDialog: A modal dialog for adding or editing products.
 *
 * Hooks:
 * - `useEffect`: Loads products on component mount.
 * - `useLocation`: Determines the current route for conditional rendering.
 *
 * Props:
 * - None
 *
 * Dependencies:
 * - Redux for state management.
 * - React Router for routing.
 * - Material-UI for UI components and styling.
 * - Custom services and utilities for product management and printing.
 *
 * @function AppContent
 * @returns The main application layout and logic handler for the Kermes POS system.
 */
function AppContent() {
  const { t } = useLanguage();
  const dispatch = useDispatch();
  const { products, setProducts, fixedGridMode, setFixedGridMode, cardsPerRow, setCardsPerRow } = useVariableContext();
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
  const [devMode, setDevMode] = useState(false);
  const [selectedQuantity, setSelectedQuantity] = useState(0);
  const [isAppBarVisible, setIsAppBarVisible] = useState(true);
  const [separateAdditionEnabled, setSeparateAdditionEnabled] = useState(false);
  const [productTapSeparateEnabled, setProductTapSeparateEnabled] = useState(true);
  const location = useLocation();
  const isProductsPage = location.pathname === '/';
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const totalQuantity = cartItems.reduce((total, item) => total + item.quantity, 0);
  const theme = useTheme();

  // Load products from service into context on mount
  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line
  }, []);

  const loadProducts = () => {
    const loadedProducts = productService.getAllProducts();
    setProducts(loadedProducts);
  };

  const handleAddProduct = () => {
    setEditingProduct(undefined);
    setIsAddProductOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsAddProductOpen(true);
  };

  const handleDeleteProduct = (productId: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      productService.deleteProduct(productId);
      loadProducts();
    }
  };

  const handleSaveProduct = (product: Product) => {
    if (editingProduct) {
      productService.updateProduct(product);
    } else {
      productService.addProduct(product);
    }
    // Force context update with a new array reference
    setProducts([...productService.getAllProducts()]);
  };

  const handleStockChange = (productId: string, inStock: boolean) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      productService.updateProduct({ ...product, inStock });
      loadProducts();
    }
  };

  const handleNumberClick = (number: number) => {
    setSelectedQuantity(number);
  };

  const handleClearQuantity = () => {
    setSelectedQuantity(0);
  };

  // TODO Make this more efficient
  const handleProductClick = (product: Product) => {
    if (selectedQuantity > 0) {
      if (separateAdditionEnabled) {
        // Create separate cart items even with quantity selection
        for (let i = 0; i < selectedQuantity; i++) {
          dispatch(addToCart(product));
        }
      } else {
        // Merge into one cart item with the selected quantity
        dispatch(addToCartWithQuantity({ product, quantity: selectedQuantity }));
      }
      setSelectedQuantity(0);
    } else {
      if (productTapSeparateEnabled) {
        // Create separate cart items for direct product taps
        dispatch(addToCart(product));
      } else {
        // Try to merge with existing cart items of the same product
        const existingItem = cartItems.find(item => item.product.id === product.id);
        if (existingItem) {
          dispatch(addToCartWithQuantity({ product, quantity: 1 }));
        } else {
          dispatch(addToCart(product));
        }
      }
    }
  };

  // Premium Slide-Out Floating Action Dock State
  const [dockOpen, setDockOpen] = useState(false);

  const handleToggleGridMode = () => {
    setFixedGridMode(!fixedGridMode);
  };

  return (
    <Box sx={{
      display: 'flex',
      height: '100vh',
      position: 'relative',
      // Dark: explicit deep shade so cards float above it
      // Light: use the curated theme background (cool lavender-grey #f0f2f8)
      // with a very subtle radial gradient for a premium feel
      bgcolor: 'background.default',
      ...(theme.palette.mode === 'light' && {
        backgroundImage: 'radial-gradient(ellipse at 20% 10%, #eef2f6 0%, transparent 60%), radial-gradient(ellipse at 80% 90%, #f8fafc 0%, transparent 60%)',
      }),
    }}>
      <UpdateNotifier />
      {/* Animated AppBar */}
      <AppBar
        position="fixed"
        elevation={4}
        sx={{
          width: isAppBarVisible ? '80px' : '0px',
          minWidth: isAppBarVisible ? '80px' : '0px',
          height: '100vh',
          left: 0,
          top: 0,
          bgcolor: theme.palette.background.paper,
          borderRight: isAppBarVisible ? `1.5px solid ${theme.palette.divider}` : 'none',
          backdropFilter: 'blur(12px)',
          boxShadow: isAppBarVisible ? '0 8px 32px 0 rgba(31,38,135,0.12)' : 'none',
          zIndex: 1201,
          transition: 'width 0.6s cubic-bezier(0.77,0,0.175,1), min-width 0.6s cubic-bezier(0.77,0,0.175,1), border-right 0.45s, box-shadow 0.45s',
          overflow: 'hidden',
          pointerEvents: isAppBarVisible ? 'auto' : 'none',
        }}
      >
        <Toolbar
          disableGutters
          sx={{
            flexDirection: 'column',
            height: '100%',
            justifyContent: 'flex-start',
            alignItems: 'center',
            pt: 2,
            px: 0,
            minWidth: 0,
            transition: 'opacity 0.35s cubic-bezier(0.77,0,0.175,1)',
            opacity: isAppBarVisible ? 1 : 0,
            pointerEvents: isAppBarVisible ? 'auto' : 'none',
          }}
        >
          <Box sx={{ mb: 3, mt: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <a href="https://kermespos.web.app/" target="_blank" rel="noopener noreferrer">
              <img
                src={process.env.PUBLIC_URL + (theme.palette.mode === 'dark' ? '/Mintika_round-cropped.svg' : '/Mintika_round_b-cropped.svg')}
                alt="Kermes POS Logo"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 8,
                  marginBottom: 8,
                  transition: 'box-shadow 0.2s',
                  cursor: 'pointer',
                  background: theme.palette.mode === 'dark' ? '#fff' : '#000',
                }}
              />
            </a>
            <Typography
              variant="caption"
              component="div"
              sx={{
                fontWeight: 700,
                letterSpacing: 1.5,
                color: theme.palette.text.secondary,
                textAlign: 'center',
                textTransform: 'uppercase',
                fontSize: 12,
                mt: 0.5,
                mb: 0.5,
              }}
            >
              Kermes POS
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center', width: '100%' }}>
            <Tooltip title={t('app.appbar.pos') || 'POS Menu'} arrow placement="right">
              <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>
                <IconButton color="primary" size="large" sx={{ mb: 1, borderRadius: 1, bgcolor: 'background.default', '&:hover': { bgcolor: 'primary.light', color: 'primary.main' } }}>
                  <Badge
                    badgeContent={totalQuantity}
                    color="error"
                    sx={{
                      '& .MuiBadge-badge': {
                        minWidth: 22,
                        height: 22,
                        px: 1.2,
                        fontWeight: 700,
                        fontSize: 13,
                        borderRadius: 8,
                        background: theme => theme.palette.mode === 'dark'
                          ? 'rgba(255,255,255,0.18)'
                          : 'rgba(0,0,0,0.10)',
                        color: theme => theme.palette.mode === 'dark'
                          ? theme.palette.primary.light
                          : theme.palette.primary.dark,
                        boxShadow: '0 2px 8px 0 rgba(31,38,135,0.10)',
                        border: theme => `1.5px solid ${theme.palette.divider}`,
                        backdropFilter: 'blur(6px)',
                        transition: 'background 0.2s, color 0.2s',
                        transform: 'translate(25px, -20px)',
                      },
                    }}
                    overlap="circular"
                  >
                    <RestaurantMenuIcon />
                  </Badge>
                </IconButton>
              </Link>
            </Tooltip>
            <Tooltip title={t('app.appbar.statistics') || 'Statistics'} arrow placement="right">
              <Link to="/statistics" style={{ color: 'inherit', textDecoration: 'none' }}>
                <IconButton color="primary" size="large" sx={{ mb: 1, borderRadius: 1, bgcolor: 'background.default', '&:hover': { bgcolor: 'primary.light', color: 'primary.main' } }}>
                  <BarChartIcon />
                </IconButton>
              </Link>
            </Tooltip>
            <Tooltip title={t('app.appbar.sessions') || 'Sessions'} arrow placement="right">
              <Link to="/sessions" style={{ color: 'inherit', textDecoration: 'none' }}>
                <IconButton color="primary" size="large" sx={{ mb: 1, borderRadius: 1, bgcolor: 'background.default', '&:hover': { bgcolor: 'primary.light', color: 'primary.main' } }}>
                  <EventIcon />
                </IconButton>
              </Link>
            </Tooltip>
            <Tooltip title={t('app.appbar.sync') || 'Cloud Sync'} arrow placement="right">
              <Link to="/sync" style={{ color: 'inherit', textDecoration: 'none' }}>
                <IconButton color="primary" size="large" sx={{ mb: 1, borderRadius: 1, bgcolor: 'background.default', '&:hover': { bgcolor: 'primary.light', color: 'primary.main' } }}>
                  <CloudUploadIcon />
                </IconButton>
              </Link>
            </Tooltip>
            <Tooltip title={t('app.appbar.products') || 'Product Management'} arrow placement="right">
              <Link to="/products" style={{ color: 'inherit', textDecoration: 'none' }}>
                <IconButton color="primary" size="large" sx={{ mb: 1, borderRadius: 1, bgcolor: 'background.default', '&:hover': { bgcolor: 'primary.light', color: 'primary.main' } }}>
                  <Inventory />
                </IconButton>
              </Link>
            </Tooltip>
            <Tooltip title={t('app.appbar.settings') || 'Settings'} arrow placement="right">
              <Link to="/settings" style={{ color: 'inherit', textDecoration: 'none' }}>
                <IconButton color="primary" size="large" sx={{ mb: 1, borderRadius: 1, bgcolor: 'background.default', '&:hover': { bgcolor: 'primary.light', color: 'primary.main' } }}>
                  <SettingsIcon />
                </IconButton>
              </Link>
            </Tooltip>
            <Tooltip title={t('app.appbar.importExport') || 'Import/Export'} arrow placement="right">
              <Link to="/import-export" style={{ color: 'inherit', textDecoration: 'none' }}>
                <IconButton color="primary" size="large" sx={{ mb: 1, borderRadius: 1, bgcolor: 'background.default', '&:hover': { bgcolor: 'primary.light', color: 'primary.main' } }}>
                  <ImportExportIcon />
                </IconButton>
              </Link>
            </Tooltip>
            <ThemeToggle />
          </Box>
        </Toolbar>
      </AppBar>
      {/* Main content with animated margin-left */}
      <Box component="main" sx={{
        flexGrow: 1,
        ml: isAppBarVisible ? { xs: '80px', sm: '80px' } : { xs: 0, sm: 0 },
        display: 'flex',
        height: '100vh',
        transition: 'margin-left 0.6s cubic-bezier(0.77,0,0.175,1)',
        position: 'relative',
        background: 'transparent',
        overflow: 'hidden', // Disable horizontal/vertical overflow scroll conflicts
      }}>
        {isProductsPage ? (
          // POS Screen: Side-by-side floating cards (Cart + ProductGrid)
          <Box sx={{ display: 'flex', width: '100%', height: '100%', overflow: 'hidden' }}>
            <Paper
              elevation={0}
              sx={{
                width: '320px',
                height: 'calc(100vh - 24px)',
                borderRadius: 3,
                m: 1.5,
                mr: 0.75,
                border: `1.5px solid ${theme.palette.divider}`,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'background.paper',
                boxShadow: theme.palette.mode === 'dark'
                  ? '0 8px 32px 0 rgba(0,0,0,0.55)'
                  : '0 4px 24px 0 rgba(0,0,0,0.11)',
              }}
            >
              <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <NumericKeypad
                  onNumberClick={handleNumberClick}
                  onClear={handleClearQuantity}
                  selectedQuantity={selectedQuantity}
                  separateAdditionEnabled={separateAdditionEnabled}
                  onSeparateAdditionToggle={setSeparateAdditionEnabled}
                  productTapSeparateEnabled={productTapSeparateEnabled}
                  onProductTapSeparateToggle={setProductTapSeparateEnabled}
                />
              </Box>
              <Box sx={{ p: 2, flex: 1, overflow: 'auto' }}>
                <Cart devMode={devMode} />
              </Box>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                flex: 1,
                height: 'calc(100vh - 24px)',
                borderRadius: 3,
                m: 1.5,
                ml: 0.75,
                border: `1.5px solid ${theme.palette.divider}`,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'background.paper',
                boxShadow: theme.palette.mode === 'dark'
                  ? '0 8px 32px 0 rgba(0,0,0,0.55)'
                  : '0 4px 24px 0 rgba(0,0,0,0.11)',
                p: 1.5,
                position: 'relative',
              }}
            >
              <Routes>
                <Route
                  path="/"
                  element={
                    <Box sx={{ height: '100%', overflow: 'hidden' }}>
                      <ProductGrid
                        products={products}
                        onStockChange={handleStockChange}
                        onEdit={handleEditProduct}
                        onDelete={handleDeleteProduct}
                        onProductClick={handleProductClick}
                      />
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: 24,
                          right: 24,
                          zIndex: 1200,
                          display: 'flex',
                          alignItems: 'center',
                          gap: dockOpen ? 1.5 : 0,
                          height: 48, // Lock height perfectly in both states
                          px: dockOpen ? 1.8 : 0.8,
                          borderRadius: '14px',
                          bgcolor: theme.palette.mode === 'dark' ? 'rgba(30,30,30,0.85)' : 'rgba(255,255,255,0.85)',
                          backdropFilter: 'blur(16px)',
                          border: `1.5px solid ${theme.palette.divider}`,
                          boxShadow: theme.palette.mode === 'dark'
                            ? '0 8px 32px 0 rgba(0,0,0,0.4)'
                            : '0 8px 24px 0 rgba(0,0,0,0.08)',
                          transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.1)',
                          width: 'auto',
                          overflow: 'hidden',
                        }}
                      >
                        {/* Smooth Transition Wrapper for inner controls */}
                        <Box sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          width: dockOpen ? 'auto' : 0,
                          opacity: dockOpen ? 1 : 0,
                          overflow: 'hidden',
                          transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                          pointerEvents: dockOpen ? 'auto' : 'none',
                        }}>
                          {/* Action: Add Product */}
                          <Tooltip title={t("products.add") || "Add Product"}>
                            <IconButton
                              onClick={handleAddProduct}
                              color="primary"
                              size="small"
                              sx={{
                                borderRadius: '8px',
                                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                                p: 1,
                                '&:hover': {
                                  bgcolor: 'primary.main',
                                  color: 'primary.contrastText',
                                }
                              }}
                            >
                              <AddIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          {/* Action: Toggle Left Sidebar */}
                          <Tooltip title={isAppBarVisible ? t("common.hideAppBar") : t("common.showAppBar")}>
                            <IconButton
                              onClick={() => setIsAppBarVisible(!isAppBarVisible)}
                              color="primary"
                              size="small"
                              sx={{
                                borderRadius: '8px',
                                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                                p: 1,
                                '&:hover': {
                                  bgcolor: 'primary.main',
                                  color: 'primary.contrastText',
                                }
                              }}
                            >
                              {isAppBarVisible ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                            </IconButton>
                          </Tooltip>

                          <Divider orientation="vertical" flexItem />

                          {/* Grid Mode Selection */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Tooltip title={fixedGridMode ? t('products.grid_fixed') : t('products.grid_responsive')}>
                              <IconButton
                                onClick={handleToggleGridMode}
                                color={fixedGridMode ? 'primary' : 'default'}
                                size="small"
                                sx={{
                                  borderRadius: '8px',
                                  bgcolor: fixedGridMode 
                                    ? 'primary.light' 
                                    : (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'),
                                  p: 1,
                                  color: fixedGridMode ? 'primary.main' : 'text.secondary',
                                  '&:hover': {
                                    bgcolor: fixedGridMode ? 'primary.main' : 'action.hover',
                                    color: fixedGridMode ? 'white' : 'text.primary',
                                  }
                                }}
                              >
                                <ViewModuleIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            
                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: 12 }}>
                              {t('products.grid_fixed_toggle') || 'Fixed'}
                            </Typography>
                            
                            <ModernSwitch
                              checked={fixedGridMode}
                              onChange={handleToggleGridMode}
                              size="small"
                            />
                          </Box>

                          {/* Cards per row adjustments */}
                          {fixedGridMode && (
                            <>
                              <Divider orientation="vertical" flexItem />
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <IconButton
                                  size="small"
                                  disabled={cardsPerRow <= 2}
                                  onClick={() => setCardsPerRow(Math.max(2, cardsPerRow - 1))}
                                  sx={{
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    borderRadius: '6px',
                                    p: 0.5,
                                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                                    '&:hover': { bgcolor: 'action.hover' }
                                  }}
                                >
                                  <RemoveIcon fontSize="small" />
                                </IconButton>
                                <Typography variant="body2" sx={{ fontWeight: 700, minWidth: 28, textAlign: 'center', color: 'primary.main', fontSize: 13 }}>
                                  {cardsPerRow}x
                                </Typography>
                                <IconButton
                                  size="small"
                                  disabled={cardsPerRow >= 12}
                                  onClick={() => setCardsPerRow(Math.min(12, cardsPerRow + 1))}
                                  sx={{
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    borderRadius: '6px',
                                    p: 0.5,
                                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                                    '&:hover': { bgcolor: 'action.hover' }
                                  }}
                                >
                                  <AddIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            </>
                          )}
                          
                          <Divider orientation="vertical" flexItem />
                        </Box>

                        {/* Open/Close Settings Trigger */}
                        <Tooltip title={dockOpen ? "Close Dock" : "Open Dock Settings"}>
                          <IconButton
                            onClick={() => setDockOpen(!dockOpen)}
                            color={dockOpen ? 'primary' : 'default'}
                            size="small"
                            sx={{
                              borderRadius: '8px',
                              bgcolor: dockOpen ? 'primary.light' : 'transparent',
                              p: 1,
                              transition: 'transform 0.4s ease',
                              transform: dockOpen ? 'rotate(90deg)' : 'none',
                              '&:hover': {
                                bgcolor: dockOpen ? 'primary.main' : 'action.hover',
                                color: dockOpen ? 'white' : 'primary.main',
                              }
                            }}
                          >
                            <SettingsIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  }
                />
              </Routes>
            </Paper>
          </Box>
        ) : (
          // Other Screens (Statistics, Settings, Sessions, etc.): Single large floating card
          <Paper
            elevation={0}
            sx={{
              flex: 1,
              height: 'calc(100vh - 24px)',
              borderRadius: 3,
              m: 1.5,
              border: `1.5px solid ${theme.palette.divider}`,
              overflow: 'auto',
              bgcolor: 'background.paper',
              boxShadow: theme.palette.mode === 'dark' ? '0 4px 24px 0 rgba(0,0,0,0.4)' : '0 4px 20px 0 rgba(0,0,0,0.06)',
              p: 3,
              position: 'relative',
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                borderRadius: '4px',
              },
            }}
          >
            <Routes>
              <Route
                path="/statistics"
                element={<StatisticsPage products={products} devMode={devMode} />}
              />
              <Route
                path="/sessions"
                element={<SessionsPage />}
              />
              <Route
                path="/sync"
                element={<SyncPage />}
              />
              <Route
                path="/import-export"
                element={<ImportExport devMode={devMode} />}
              />
              <Route
                path="/settings"
                element={<SettingsPage devMode={devMode} setDevMode={setDevMode} />}
              />
              <Route
                path="/settings/menu"
                element={<MenuSettings />}
              />
              <Route
                path="/settings/appearance"
                element={<AppearanceSettings />}
              />
              <Route
                path="/products"
                element={<ProductManagementPage />}
              />
            </Routes>
          </Paper>
        )}
      </Box>
      <ProductDialog
        open={isAddProductOpen}
        onClose={() => setIsAddProductOpen(false)}
        onSave={handleSaveProduct}
        product={editingProduct}
      />
    </Box>
  );
}

/**
 * Main application component that wraps the app with needed providers
 * 
 * @returns {JSX.Element} The main application component
 */

const App: React.FC = () => {
  return (
    <SettingsProvider>
      <ThemeProvider>
        <LanguageProvider>
          <VariableContextProvider>
            <MenuConfigProvider>
              <MenuDataBridge />
              <AppContent />
            </MenuConfigProvider>
          </VariableContextProvider>
        </LanguageProvider>
      </ThemeProvider>
    </SettingsProvider>
  );
};

export default App;