import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  Container, 
  CssBaseline, 
  ThemeProvider, 
  createTheme, 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton, 
  Box, 
  Paper, 
  Badge,
  Fab,
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import BarChartIcon from '@mui/icons-material/BarChart';
import AddIcon from '@mui/icons-material/Add';
import SettingsIcon from '@mui/icons-material/Settings';
import ImportExportIcon from '@mui/icons-material/ImportExport';
import ProductCard from './components/ProductCard';
import Cart from './components/Cart';
import ProductDialog from './components/ProductDialog';
import ProductGrid from './components/ProductGrid';
import { Product } from './types/index';
import { useSelector } from 'react-redux';
import { RootState } from './store';
import { productService } from './services/productService';
import Settings from './components/Settings';
import SettingsPage from './components/SettingsPage';
import ImportExport from './components/ImportExport';
import { SettingsProvider, useSettings } from './context/SettingsContext';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function AppContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
  const [devMode, setDevMode] = useState(false);
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
  
  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <AppBar position="fixed" sx={{ width: '64px', height: '100vh', left: 0, top: 0 }}>
        <Toolbar sx={{ flexDirection: 'column', height: '100%', justifyContent: 'flex-start', pt: 2 }}>
          <Typography variant="h6" component="div" sx={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', mb: 4 }}>
            Kermes POS
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>
              <IconButton color="inherit" size="large">
                <Badge badgeContent={totalQuantity} color="secondary">
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
          </Box>
        </Toolbar>
      </AppBar>
      <Box component="main" sx={{ flexGrow: 1, ml: '64px', display: 'flex', height: '100vh' }}>
        {isProductsPage && (
          <Paper 
            elevation={3} 
            sx={{ 
              width: '300px',
              height: '100%',
              borderRadius: 0,
              overflow: 'auto'
            }}
          >
            <Box sx={{ p: 2 }}>
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
                  />
                  <Fab
                    color="primary"
                    sx={{ position: 'fixed', bottom: 16, right: 16 }}
                    onClick={handleAddProduct}
                  >
                    <AddIcon />
                  </Fab>
                </Box>
              }
            />
            <Route 
              path="/statistics" 
              element={
                <Box sx={{ p: 3 }}>
                  <Typography variant="h4" gutterBottom>Statistics</Typography>
                  <Typography variant="body1" paragraph>
                    This is a placeholder for the statistics page. Here you would display sales data, 
                    popular items, and other business metrics.
                  </Typography>
                  <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" gutterBottom>Sample Statistics</Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 2, mt: 2 }}>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle1">Total Sales</Typography>
                        <Typography variant="h4">1,234.56€</Typography>
                      </Paper>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle1">Items Sold</Typography>
                        <Typography variant="h4">42</Typography>
                      </Paper>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle1">Average Order Value</Typography>
                        <Typography variant="h4">29.39€</Typography>
                      </Paper>
                    </Box>
                  </Box>
                </Box>
              } 
            />
            <Route 
              path="/import-export" 
              element={<ImportExport refreshProducts={loadProducts} devMode={devMode} />} 
            />
            <Route 
              path="/settings" 
              element={<SettingsPage devMode={devMode} setDevMode={setDevMode} />} 
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

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SettingsProvider>
        <Router>
          <AppContent />
        </Router>
      </SettingsProvider>
    </ThemeProvider>
  );
}

export default App;
