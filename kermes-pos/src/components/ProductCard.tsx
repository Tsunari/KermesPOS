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
import { useSettings } from '../context/SettingsContext';

interface ProductCardProps {
  product: Product;
  onStockChange?: (productId: string, inStock: boolean) => void;
  onEdit?: (product: Product) => void;
  onDelete?: (productId: string) => void;
}

const ModernSwitch = styled(Switch)(({ theme }) => ({
  width: 36,
  height: 20,
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
    width: 16,
    height: 16,
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
  const { useDoubleClick } = useSettings();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [localStockStatus, setLocalStockStatus] = React.useState(product.inStock);
  const open = Boolean(anchorEl);

  const handleAddToCart = () => {
    if (localStockStatus) {
      dispatch(addToCart(product));
    }
  };

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    // Don't add to cart if clicking on the switch or menu button
    if (
      (event.target as HTMLElement).closest('.MuiSwitch-root') || 
      (event.target as HTMLElement).closest('.MuiIconButton-root')
    ) {
      return;
    }
    
    if (!useDoubleClick && localStockStatus) {
      dispatch(addToCart(product));
    }
  };

  const handleDoubleClick = () => {
    if (useDoubleClick && localStockStatus) {
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
    <Card 
      sx={{ 
        width: 220,
        height: 200,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        cursor: localStockStatus ? 'pointer' : 'default',
        userSelect: 'none'
      }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" component="div" sx={{ fontSize: '1.1rem' }}>
            {product.name}
          </Typography>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'flex-end',
            mt: 0.5,
            gap: 0.25
          }}>
            <ModernSwitch
              checked={localStockStatus}
              onChange={handleStockChange}
              size="small"
            />
            <IconButton
              size="small"
              onClick={handleMenuClick}
              sx={{ p: 0.25 }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleEdit}>Edit</MenuItem>
          <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>Delete</MenuItem>
        </Menu>
        <Typography variant="body2" color="text.secondary" sx={{ 
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          mb: 2
        }}>
          {product.description}
        </Typography>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mt: 'auto',
          pt: 1
        }}>
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