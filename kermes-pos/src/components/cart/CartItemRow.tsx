import React from 'react';
import { 
  ListItem, 
  ListItemText, 
  IconButton,
  Typography,
  Box,
  Tooltip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import { CartItem } from '../../types/index';

import { useSettings } from '../../context/SettingsContext';

interface CartItemRowProps {
  item: CartItem;
  ticketCount?: number;
  onIncrement: (id: string, quantity: number) => void;
  onDecrement: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
}

const CartItemRow: React.FC<CartItemRowProps> = ({ 
  item, 
  ticketCount,
  onIncrement, 
  onDecrement, 
  onRemove,
}) => {
  const { formatPrice } = useSettings();

  return (
    <ListItem
      secondaryAction={
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
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
        </Box>
      }
    >
      <ListItemText
        primary={item.product.name}
        secondary={
          <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
            <Typography component="span" variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
              {formatPrice(item.product.price)} x {item.quantity}
            </Typography>
            {ticketCount && ticketCount > 1 && (
              <Tooltip title={`Will print as ${ticketCount} separate tickets`}>
                <Box
                  component="span"
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.25,
                    px: 0.6,
                    py: 0.1,
                    borderRadius: '4px',
                    bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                    color: 'text.secondary',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                  }}
                >
                  <ConfirmationNumberIcon sx={{ fontSize: 10, color: 'primary.main' }} />
                  {ticketCount}
                </Box>
              </Tooltip>
            )}
          </Box>
        }
      />
    </ListItem>
  );
};

export default CartItemRow; 