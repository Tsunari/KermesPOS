import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Container, CssBaseline, ThemeProvider, createTheme, AppBar, Toolbar, Typography, IconButton, Box, Paper, Badge } from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import BarChartIcon from '@mui/icons-material/BarChart';
import ProductCard from './components/ProductCard';
import Cart from './components/Cart';
import { Product } from './types';
import { useSelector } from 'react-redux';
import { RootState } from './store';

// Sample products data (you can replace this with your own data source)
const sampleProducts: Product[] = [
  {
    id: '1',
    name: 'Hamburger',
    price: 8.99,
    category: 'food',
    description: 'Classic beef hamburger with lettuce and tomato',
  },
  {
    id: '2',
    name: 'Pizza',
    price: 12.99,
    category: 'food',
    description: 'Margherita pizza with fresh basil',
  },
  {
    id: '3',
    name: 'Cola',
    price: 2.99,
    category: 'drink',
    description: 'Ice-cold cola',
  },
  {
    id: '4',
    name: 'Water',
    price: 1.99,
    category: 'drink',
    description: 'Mineral water',
  },
  {
    id: '5',
    name: 'Cheeseburger',
    price: 9.99,
    category: 'food',
    description: 'Beef hamburger with cheese, lettuce and tomato',
  },
  {
    id: '6',
    name: 'Chicken Wings',
    price: 11.99,
    category: 'food',
    description: 'Spicy chicken wings with blue cheese dip',
  },
  {
    id: '7',
    name: 'French Fries',
    price: 4.99,
    category: 'food',
    description: 'Crispy golden french fries',
  },
  {
    id: '8',
    name: 'Caesar Salad',
    price: 7.99,
    category: 'food',
    description: 'Fresh romaine lettuce with caesar dressing',
  },
  {
    id: '10',
    name: 'Lemonade',
    price: 3.99,
    category: 'drink',
    description: 'Fresh squeezed lemonade',
  },
  {
    id: '11',
    name: 'Ice Tea',
    price: 2.99,
    category: 'drink',
    description: 'Fresh brewed iced tea',
  },
  {
    id: '12',
    name: 'Hot Dog',
    price: 6.99,
    category: 'food',
    description: 'Classic hot dog with mustard and ketchup',
  },
  {
    id: '13',
    name: 'Nachos',
    price: 8.99,
    category: 'food',
    description: 'Tortilla chips with cheese, salsa and guacamole',
  },
  {
    id: '14',
    name: 'Milkshake',
    price: 4.99,
    category: 'drink',
    description: 'Creamy vanilla milkshake',
  },
  {
    id: '15',
    name: 'Coffee',
    price: 3.49,
    category: 'drink',
    description: 'Fresh brewed coffee',
  }
];

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
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const totalQuantity = cartItems.reduce((total, item) => total + item.quantity, 0);
  const location = useLocation();
  const isProductsPage = location.pathname === '/';
  
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
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          <Routes>
            <Route
              path="/"
              element={
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: 2
                }}>
                  {sampleProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
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
          </Routes>
        </Box>
      </Box>
    </Box>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AppContent />
      </Router>
    </ThemeProvider>
  );
}

export default App;
