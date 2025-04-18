import React from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  CardActions,
  Box,
} from '@mui/material';
import { Product } from '../types';
import { useDispatch } from 'react-redux';
import { addToCart } from '../store/slices/cartSlice';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const dispatch = useDispatch();

  const handleAddToCart = () => {
    dispatch(addToCart(product));
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
        <Typography variant="h6" component="div" gutterBottom sx={{ fontSize: '1.1rem' }}>
          {product.name}
        </Typography>
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
          <Typography variant="h6" color="primary" sx={{ fontSize: '1.1rem' }}>
            ${product.price.toFixed(2)}
          </Typography>
        </Box>
      </CardContent>
      <CardActions sx={{ p: 1, pt: 0 }}>
        <Button 
          size="small" 
          variant="contained" 
          fullWidth 
          onClick={handleAddToCart}
        >
          Add to Cart
        </Button>
      </CardActions>
    </Card>
  );
};

export default ProductCard; 