import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
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
} from '@mui/material';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import BarChartIcon from '@mui/icons-material/BarChart';
import AddIcon from '@mui/icons-material/Add';
import SettingsIcon from '@mui/icons-material/Settings';
import ImportExportIcon from '@mui/icons-material/ImportExport';
import MenuIcon from '@mui/icons-material/Menu';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import PrintIcon from '@mui/icons-material/Print';
import Cart from './components/Cart';
import ProductDialog from './components/ProductDialog';
import ProductGrid from './components/ProductGrid';
import NumericKeypad from './components/NumericKeypad';
import { Product } from './types/index';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from './store';
import { addToCart } from './store/slices/cartSlice';
import { productService } from './services/productService';
import SettingsPage from './components/SettingsPage';
import ImportExport from './components/ImportExport';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { ThemeToggle } from './components/ThemeToggle';
import { ThemeProvider } from './contexts/ThemeContext';
import AppearanceSettings from './components/AppearanceSettings';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import StatisticsPage from './components/StatisticsPage';

function AppContent() {
  const { t } = useLanguage();
  const dispatch = useDispatch();
  const [products, setProducts] = useState<Product[]>([]);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
  const [devMode, setDevMode] = useState(false);
  const [selectedQuantity, setSelectedQuantity] = useState(0);
  const [isAppBarVisible, setIsAppBarVisible] = useState(true);
  const location = useLocation();
  const isProductsPage = location.pathname === '/';
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const totalQuantity = cartItems.reduce((total, item) => total + item.quantity, 0);

  useEffect(() => {
    loadProducts();
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
    loadProducts();
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

  const handleProductClick = (product: Product) => {
    if (selectedQuantity > 0) {
      for (let i = 0; i < selectedQuantity; i++) {
        dispatch(addToCart(product));
      }
      setSelectedQuantity(0);
    } else {
      dispatch(addToCart(product));
    }
  };

  const actions = [
    { icon: <AddIcon />, name: t("products.add"), onClick: handleAddProduct },
    { 
      icon: isAppBarVisible ? <VisibilityOffIcon /> : <VisibilityIcon />, 
      name: isAppBarVisible ? t("common.hide") : t("common.show"), 
      onClick: () => setIsAppBarVisible(!isAppBarVisible) 
    },
    {
      icon: <PrintIcon />,
      name: t("common.testPrint"),
      onClick: async () => {
        try {
          const response = await fetch("http://localhost:3001/api/print", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              text: t("common.testPrint") + "\n" +
                    "-------------------\n" +
                    t("common.testPrintMessage") + "\n" +
                    t("common.fromMainApp") + "\n" +
                    "-------------------\n"
            }),
          });

          if (!response.ok) {
            throw new Error(t("common.httpError") + response.status);
          }

          const result = await response.text();
          console.log(t("common.printServerResponse"), result);
          alert(result);
        } catch (error) {
          console.error(t("common.printError"), error);
          alert(t("common.printRequestFailed"));
        }
      }
    },
    {
      icon: <PrintIcon />,
      name: t("common.electronPrint"),
      onClick: async () => {
        try {
          console.log(t("common.electronPrintClicked"));
          
          if (!window.electron) {
            console.error(t("common.electronNotDefined"));
            alert(t("common.electronNotAvailable"));
            return;
          }

          console.log(t("common.electronExists"), window.electron);
          
          const receiptContent = `
            <html>
              <head>
                <style>
                  body {
                    font-family: Arial, sans-serif;
                    width: 80mm;
                    margin: 0;
                    padding: 10px;
                  }
                  .header {
                    text-align: center;
                    margin-bottom: 10px;
                  }
                  .divider {
                    border-top: 1px dashed #000;
                    margin: 10px 0;
                  }
                  .footer {
                    text-align: center;
                    margin-top: 10px;
                  }
                </style>
              </head>
              <body>
                <div class="header">
                  <h2>${t("common.kermesPos")}</h2>
                  <p>${t("common.testReceipt")}</p>
                </div>
                <div class="divider"></div>
                <p>${t("common.date")}: ${new Date().toLocaleString()}</p>
                <p>${t("common.items")}: ${cartItems.length}</p>
                <p>${t("common.total")}: $${cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0).toFixed(2)}</p>
                <div class="divider"></div>
                <div class="footer">
                  <p>${t("common.thankYou")}</p>
                </div>
              </body>
            </html>
          `;

          console.log(t("common.callingNativePrint"), receiptContent);
          
          const result = await window.electron.nativePrint(receiptContent);
          console.log(t("common.nativePrintResult"), result);
          alert(result);
        } catch (error: any) {
          console.error(t("common.nativePrintError"), error);
          alert(`${t("common.failedToPrint")}: ${error.message}`);
        }
      }
    },
  ];

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {isAppBarVisible && (
        <AppBar position="fixed" sx={{ width: '64px', height: '100vh', left: 0, top: 0 }}>
          <Toolbar sx={{ flexDirection: 'column', height: '100%', justifyContent: 'flex-start', pt: 2 }}>
            <Typography variant="h6" component="div" sx={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', mb: 4 }}>
              Kermes POS
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>
                <IconButton color="inherit" size="large">
                  <Badge badgeContent={totalQuantity} color="error">
                    <RestaurantMenuIcon />
                  </Badge>
                </IconButton>
              </Link>
              <Link to="/statistics" style={{ color: 'inherit', textDecoration: 'none' }}>
                <IconButton color="inherit" size="large">
                  <BarChartIcon />
                </IconButton>
              </Link>
              <Link to="/import-export" style={{ color: 'inherit', textDecoration: 'none' }}>
                <IconButton color="inherit" size="large">
                  <ImportExportIcon />
                </IconButton>
              </Link>
              <Link to="/settings" style={{ color: 'inherit', textDecoration: 'none' }}>
                <IconButton color="inherit" size="large">
                  <SettingsIcon />
                </IconButton>
              </Link>
              <ThemeToggle />
            </Box>
          </Toolbar>
        </AppBar>
      )}
      <Box component="main" sx={{ 
        flexGrow: 1, 
        ml: isAppBarVisible ? '64px' : 0,
        display: 'flex', 
        height: '100vh',
        transition: 'margin-left 0.3s ease-in-out'
      }}>
        {isProductsPage && (
          <Paper 
            elevation={3} 
            sx={{ 
              width: '300px',
              height: '100%',
              borderRadius: 0,
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <NumericKeypad
                onNumberClick={handleNumberClick}
                onClear={handleClearQuantity}
                selectedQuantity={selectedQuantity}
              />
            </Box>
            <Box sx={{ p: 2, flex: 1, overflow: 'auto' }}>
              <Cart />
            </Box>
          </Paper>
        )}
        <Box sx={{ flex: 1, overflow: 'auto', p: 2, position: 'relative' }}>
          <Routes>
            <Route
              path="/"
              element={
                <Box sx={{ p: 2 }}>
                  <ProductGrid
                    products={products}
                    onStockChange={handleStockChange}
                    onEdit={handleEditProduct}
                    onDelete={handleDeleteProduct}
                    onProductClick={handleProductClick}
                  />
                  <SpeedDial
                    ariaLabel="SpeedDial"
                    sx={{ position: 'fixed', bottom: 16, right: 16 }}
                    icon={<SpeedDialIcon openIcon={<MenuIcon />} />}
                  >
                    {actions.map((action) => (
                      <SpeedDialAction
                        key={action.name}
                        icon={action.icon}
                        title={action.name}
                        onClick={action.onClick}
                      />
                    ))}
                  </SpeedDial>
                </Box>
              }
            />
            <Route 
              path="/statistics" 
              element={<StatisticsPage products={products} />} 
            />
            <Route 
              path="/import-export" 
              element={<ImportExport refreshProducts={loadProducts} devMode={devMode} />} 
            />
            <Route 
              path="/settings" 
              element={<SettingsPage devMode={devMode} setDevMode={setDevMode} />} 
            />
            <Route 
              path="/settings/appearance" 
              element={<AppearanceSettings />} 
            />
          </Routes>
        </Box>
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

const AppWrapper: React.FC = () => {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <Router>
          <AppContent />
        </Router>
      </ThemeProvider>
    </LanguageProvider>
  );
};

const App: React.FC = () => {
  return (
    <SettingsProvider>
      <AppWrapper />
    </SettingsProvider>
  );
};

export default App;
