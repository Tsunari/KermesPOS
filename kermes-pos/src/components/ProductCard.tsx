import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Switch,
  styled,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Product } from '../types/index';
import { useDispatch } from 'react-redux';
import { addToCart } from '../store/slices/cartSlice';
import { useSettings } from '../context/SettingsContext';

interface ProductCardProps {
  product: Product;
  onStockChange?: (productId: string, inStock: boolean) => void;
  onEdit?: (product: Product) => void;
  onDelete?: (productId: string) => void;
  showDescription?: boolean;
  onClick?: () => void;
}

const CompactSwitch = styled(Switch)(({ theme }) => ({
  width: 32,
  height: 16,
  padding: 0,
  '& .MuiSwitch-switchBase': {
    padding: 0,
    margin: 0,
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
    borderRadius: 16 / 2,
    backgroundColor: theme.palette.mode === 'dark' ? '#E9E9EA' : '#E9E9EA',
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
  showDescription = false,
  onClick,
}) => {
  const dispatch = useDispatch();
  const { useDoubleClick } = useSettings();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [localStockStatus, setLocalStockStatus] = React.useState(product.inStock);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    // Don't add to cart if clicking on the switch or menu button
    if (
      (event.target as HTMLElement).closest('.MuiSwitch-root') || 
      (event.target as HTMLElement).closest('.MuiIconButton-root')
    ) {
      return;
    }
    
    if (!useDoubleClick && localStockStatus) {
      if (onClick) {
        onClick();
      } else {
        dispatch(addToCart(product));
      }
    }
  };

  const handleDoubleClick = () => {
    if (useDoubleClick && localStockStatus) {
      if (onClick) {
        onClick();
      } else {
        dispatch(addToCart(product));
      }
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
        width: 180,
        height: 140,
        display: 'flex',
        flexDirection: 'column',
        cursor: localStockStatus ? 'pointer' : 'not-allowed',
        border: '1px solid',
        borderColor: localStockStatus ? 'divider' : 'error.main',
        position: 'relative',
        '&:hover': {
          borderColor: localStockStatus ? 'primary.main' : 'error.main',
          boxShadow: 1,
        },
        '&::after': !localStockStatus ? {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.1)',
          pointerEvents: 'none',
        } : {},
      }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      <CardContent sx={{ 
        flex: 1,
        p: 1.5,
        display: 'flex',
        flexDirection: 'column',
        gap: 0.5,
        opacity: localStockStatus ? 1 : 0.7,
      }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          mb: 0.5,
        }}>
          <Typography 
            variant="subtitle1" 
            sx={{ 
              fontWeight: 'medium',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              lineHeight: 1.2,
              color: localStockStatus ? 'text.primary' : 'text.disabled',
            }}
          >
            {product.name}
          </Typography>
          <CompactSwitch
            checked={localStockStatus}
            onChange={handleStockChange}
            onClick={(e) => e.stopPropagation()}
            sx={{
              '& .MuiSwitch-track': {
                backgroundColor: localStockStatus ? 'primary.main' : 'error.main',
              },
            }}
          />
        </Box>

        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{ 
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            lineHeight: 1.2,
            minHeight: showDescription ? '2.4em' : 0,
            opacity: showDescription ? 1 : 0,
            transition: 'opacity 0.2s, min-height 0.2s',
            color: localStockStatus ? 'text.secondary' : 'text.disabled',
          }}
        >
          {product.description}
        </Typography>

        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mt: 'auto',
        }}>
          <Typography 
            variant="h6" 
            sx={{ 
              color: localStockStatus ? 'primary.main' : 'error.main',
              textDecoration: localStockStatus ? 'none' : 'line-through',
            }}
          >
            {product.price.toFixed(2)}€
          </Typography>
          <IconButton
            size="small"
            onClick={handleMenuClick}
            sx={{ 
              p: 0.5,
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            }}
          >
            <MoreVertIcon />
          </IconButton>
        </Box>
      </CardContent>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
      >
        <MenuItem onClick={handleEdit}>Edit</MenuItem>
        <MenuItem onClick={handleDelete}>Delete</MenuItem>
      </Menu>
    </Card>
  );
};

export default ProductCard; 