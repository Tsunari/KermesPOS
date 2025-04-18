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
  IconButton,
  Menu,
  MenuItem,
  styled,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Product } from '../types';
import { useDispatch } from 'react-redux';
import { addToCart } from '../store/slices/cartSlice';

interface ProductCardProps {
  product: Product;
  onStockChange?: (productId: string, inStock: boolean) => void;
  onEdit?: (product: Product) => void;
  onDelete?: (productId: string) => void;
}

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

const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  onStockChange,
  onEdit,
  onDelete,
}) => {
  const dispatch = useDispatch();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [localStockStatus, setLocalStockStatus] = React.useState(product.inStock);
  const open = Boolean(anchorEl);

  const handleAddToCart = () => {
    if (localStockStatus) {
      dispatch(addToCart(product));
    }
  };

  const handleStockChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newStatus = event.target.checked;
    setLocalStockStatus(newStatus);
    if (onStockChange) {
      onStockChange(product.id, newStatus);
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    handleMenuClose();
    if (onEdit) {
      onEdit(product);
    }
  };

  const handleDelete = () => {
    handleMenuClose();
    if (onDelete) {
      onDelete(product.id);
    }
  };

  return (
    <Card sx={{ 
      width: 220,
      height: 200,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between'
    }}>
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" component="div" sx={{ fontSize: '1.1rem' }}>
            {product.name}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <ModernSwitch
                  checked={localStockStatus}
                  onChange={handleStockChange}
                  size="small"
                />
              }
              label=""
              sx={{ m: 0, mr: 0 }}
            />
            <IconButton
              size="small"
              onClick={handleMenuClick}
              sx={{ ml: 0, p: 0.5 }}
            >
              <MoreVertIcon />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={open}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={handleEdit}>Edit</MenuItem>
              <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>Delete</MenuItem>
            </Menu>
          </Box>
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
          disabled={!localStockStatus}
        >
          {localStockStatus ? 'Add to Cart' : 'Out of Stock'}
        </Button>
      </CardActions>
    </Card>
  );
};

export default ProductCard; 