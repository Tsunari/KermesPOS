import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
  Chip,
} from '@mui/material';
import { CartItem } from '../../types';

interface PrintDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  items: CartItem[];
  total: number;
}

const PrintDialog: React.FC<PrintDialogProps> = ({
  open,
  onClose,
  onConfirm,
  items,
  total,
}) => {
  // Group items by category
  const groupedItems = items.reduce((acc, item) => {
    const category = item.product.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, CartItem[]>);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Print Receipt</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Receipt Preview
          </Typography>
          <Box sx={{ 
            p: 2, 
            bgcolor: 'background.paper',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'divider'
          }}>
            {Object.entries(groupedItems).map(([category, categoryItems]) => (
              <Box key={category} sx={{ mb: 2 }}>
                <Chip 
                  label={category.toUpperCase()} 
                  size="small"
                  sx={{ mb: 1 }}
                />
                {categoryItems.map((item) => (
                  <Box key={item.product.id} sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    mb: 0.5
                  }}>
                    <Typography variant="body2">
                      {item.quantity}x {item.product.name}
                    </Typography>
                    <Typography variant="body2">
                      €{(item.product.price * item.quantity).toFixed(2).replace('.', ',')}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ))}
            <Divider sx={{ my: 1 }} />
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              mt: 1
            }}>
              <Typography variant="subtitle1" fontWeight="bold">
                Total
              </Typography>
              <Typography variant="subtitle1" fontWeight="bold">
                €{total.toFixed(2).replace('.', ',')}
              </Typography>
            </Box>
          </Box>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Are you sure you want to print this receipt?
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onConfirm} variant="contained" color="primary">
          Print
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PrintDialog; 