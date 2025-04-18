import React from 'react';
import { 
  ListItem, 
  ListItemText, 
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Box
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { CartItem } from '../../types';

interface CartItemRowProps {
  item: CartItem;
  onIncrement: (id: string, quantity: number) => void;
  onDecrement: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
}

const CartItemRow: React.FC<CartItemRowProps> = ({ 
  item, 
  onIncrement, 
  onDecrement, 
  onRemove 
}) => {
  return (
    <ListItem>
      <ListItemText
        primary={item.product.name}
        secondary={`${item.product.price.toFixed(2)}€ x ${item.quantity}`}
      />
      <ListItemSecondaryAction sx={{ display: 'flex', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mr: 0.5 }}>
          <IconButton 
            size="small" 
            onClick={() => onDecrement(item.product.id, item.quantity)}
            sx={{ p: 0.25 }}
          >
            <RemoveIcon fontSize="small" />
          </IconButton>
          <Typography variant="body2" sx={{ minWidth: 16, textAlign: 'center', mx: 0.25 }}>
            {item.quantity}
          </Typography>
          <IconButton 
            size="small" 
            onClick={() => onIncrement(item.product.id, item.quantity)}
            sx={{ p: 0.25 }}
          >
            <AddIcon fontSize="small" />
          </IconButton>
        </Box>
        <IconButton 
          edge="end" 
          aria-label="delete"
          onClick={() => onRemove(item.product.id)}
          size="small"
          sx={{ ml: 0.25 }}
        >
          <DeleteIcon />
        </IconButton>
      </ListItemSecondaryAction>
    </ListItem>
  );
};

export default CartItemRow; 