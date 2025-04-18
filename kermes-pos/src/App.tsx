import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Container, CssBaseline, ThemeProvider, createTheme, AppBar, Toolbar, Typography, IconButton, Box, Paper, Badge } from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
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
    id: '9',
    name: 'Beer',
    price: 5.99,
    category: 'drink',
    description: 'Ice-cold draft beer',
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
  const isCartView = location.pathname === '/cart';
  
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
                <RestaurantMenuIcon />
              </IconButton>
            </Link>
            <Link to="/cart" style={{ color: 'inherit', textDecoration: 'none' }}>
              <IconButton color="inherit" size="large">
                <Badge badgeContent={totalQuantity} color="secondary">
                  <ShoppingCartIcon />
                </Badge>
              </IconButton>
            </Link>
          </Box>
        </Toolbar>
      </AppBar>
      <Box component="main" sx={{ flexGrow: 1, ml: '64px', display: 'flex', height: '100vh' }}>
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
            <Route path="/cart" element={<Cart />} />
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
