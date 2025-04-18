import React from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  CardActions,
  Box,
  Switch,
  FormControlLabel,
  styled,
} from '@mui/material';
import { Product } from '../types';
import { useDispatch } from 'react-redux';
import { addToCart } from '../store/slices/cartSlice';

// Custom styled switch component
const ModernSwitch = styled(Switch)(({ theme }) => ({
  width: 42,
  height: 26,
  padding: 0,
  '& .MuiSwitch-switchBase': {
    padding: 0,
    margin: 2,
    transitionDuration: '300ms',
    '&.Mui-checked': {
      transform: 'translateX(16px)',
      color: '#fff',
      '& + .MuiSwitch-track': {
        backgroundColor: theme.palette.primary.main,
        opacity: 1,
        border: 0,
      },
    },
  },
  '& .MuiSwitch-thumb': {
    boxSizing: 'border-box',
    width: 22,
    height: 22,
  },
  '& .MuiSwitch-track': {
    borderRadius: 26 / 2,
    backgroundColor: theme.palette.grey[400],
    opacity: 1,
    transition: theme.transitions.create(['background-color'], {
      duration: 500,
    }),
  },
}));

interface ProductCardProps {
  product: Product;
  onStockChange?: (productId: string, inStock: boolean) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onStockChange }) => {
  const dispatch = useDispatch();

  const handleAddToCart = () => {
    if (product.inStock) {
      dispatch(addToCart(product));
    }
  };

  const handleStockChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (onStockChange) {
      onStockChange(product.id, event.target.checked);
    }
  };

  return (
    <Card sx={{ 
      width: 200,
      height: 180,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between'
    }}>
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" component="div" sx={{ fontSize: '1.1rem' }}>
            {product.name}
          </Typography>
          <FormControlLabel
            control={
              <ModernSwitch
                checked={product.inStock}
                onChange={handleStockChange}
                size="small"
              />
            }
            label=""
            sx={{ m: 0 }}
          />
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ 
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          mb: 1
        }}>
          {product.description}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            {product.category}
          </Typography>
          <Typography variant="h6" component="div">
            {product.price.toFixed(2)}€
          </Typography>
        </Box>
      </CardContent>
      <CardActions sx={{ p: 1, pt: 0 }}>
        <Button 
          size="small" 
          variant="contained" 
          fullWidth 
          onClick={handleAddToCart}
          disabled={!product.inStock}
        >
          {product.inStock ? 'Add to Cart' : 'Out of Stock'}
        </Button>
      </CardActions>
    </Card>
  );
};

export default ProductCard; 