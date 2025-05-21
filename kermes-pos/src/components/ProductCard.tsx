import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Product } from '../types/index';
import { useDispatch } from 'react-redux';
import { addToCart } from '../store/slices/cartSlice';
import { useSettings } from '../context/SettingsContext';
import ModernSwitch from './ui/ModernSwitch';

interface ProductCardProps {
  product: Product;
  onStockChange?: (productId: string, inStock: boolean) => void;
  onEdit?: (product: Product) => void;
  onDelete?: (productId: string) => void;
  showDescription?: boolean;
  onClick?: () => void;
  categoryStyle?: {
    bgColor: string;
    borderColor: string;
    icon: string;
  };
  height?: number; // add height prop
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  product,
  onStockChange,
  onEdit,
  onDelete,
  showDescription = false,
  onClick,
  categoryStyle,
  height,
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
    event.stopPropagation();
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
        width: '100%', // fill grid cell
        height: height || 140, // use fixed height if provided
        display: 'flex',
        flexDirection: 'column',
        cursor: localStockStatus ? 'pointer' : 'not-allowed',
        border: '1px solid',
        borderColor: localStockStatus ? 'divider' : 'error.main',
        position: 'relative',
        bgcolor: categoryStyle?.bgColor,
        '&:hover': {
          borderColor: localStockStatus ? categoryStyle?.borderColor : 'error.main',
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
        overflow: 'hidden',
      }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      <IconButton
        size="small"
        onClick={handleMenuClick}
        sx={{ 
          position: 'absolute',
          top: 6,
          right: 6,
          zIndex: 2,
          p: 0.5,
          '&:hover': {
            backgroundColor: 'action.hover',
          },
        }}
      >
        <MoreVertIcon />
      </IconButton>
      <CardContent sx={{ 
        flex: 1,
        p: 1.5,
        display: 'flex',
        flexDirection: 'column',
        gap: 0.5,
        opacity: localStockStatus ? 1 : 0.7,
        pb: 3.5, // extra bottom padding for price
        pr: 4,   // extra right padding for menu button
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
            userSelect: 'none',
          }}
        >
          {product.name}
        </Typography>
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
            userSelect: 'none',
          }}
        >
          {product.description}
        </Typography>
      </CardContent>
      <Box
        sx={{
          position: 'absolute',
          left: 16,
          bottom: 12,
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Typography 
          variant="h6" 
          sx={{ 
            color: localStockStatus ? 'primary.main' : 'error.main',
            textDecoration: localStockStatus ? 'none' : 'line-through',
            userSelect: 'none',
            fontWeight: 700,
            fontSize: 18,
          }}
        >
          {product.price.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€
        </Typography>
      </Box>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        sx={{
          '& .MuiPaper-root': {
            minWidth: '180px',
          },
        }}
      >
        <MenuItem onClick={handleEdit}>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDelete}>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
        <MenuItem 
          onClick={(e) => e.stopPropagation()}
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <ListItemText>Stock Status</ListItemText>
          <ListItemIcon sx={{ minWidth: 0, ml: 2 }}>
            <ModernSwitch
              checked={localStockStatus}
              onChange={handleStockChange}
              sx={{
                '& .MuiSwitch-track': {
                  backgroundColor: localStockStatus ? 'primary.main' : 'error.main',
                },
              }}
            />
          </ListItemIcon>
        </MenuItem>
      </Menu>
    </Card>
  );
};

export default ProductCard;