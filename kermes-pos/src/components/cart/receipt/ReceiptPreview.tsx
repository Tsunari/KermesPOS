import React from 'react';
import { Box, Typography, Paper, Divider } from '@mui/material';
import { CartItem } from '../../../types/index';

interface ReceiptPreviewProps {
  items: CartItem[];
  total: number;
}

const ReceiptPreview: React.FC<ReceiptPreviewProps> = ({ items, total }) => {
  // Format price with currency symbol
  const formatPrice = (price: number): string => {
    return price.toFixed(2) + '€';
  };

  return (
    <Paper 
      elevation={0}
      sx={{ 
        p: 2,
        width: '80mm', // Standard thermal paper width
        minHeight: '200mm',
        backgroundColor: 'white',
        fontFamily: 'monospace',
        fontSize: '12px',
        lineHeight: 1.2,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        border: '1px solid',
        borderColor: 'divider',
        mx: 'auto'
      }}
    >
      {/* Items */}
      {items.map((item, index) => (
        <Box key={index} sx={{ mb: 2 }}>
          <Typography variant="body1" sx={{ fontWeight: 'bold', textAlign: 'center' }}>
            {item.product.name}
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
            <Typography variant="body2">Category: {item.product.category}</Typography>
            <Typography variant="body2">Quantity: {item.quantity}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2">Price: {formatPrice(item.product.price)} each</Typography>
            <Typography variant="body2">Total: {formatPrice(item.product.price * item.quantity)}</Typography>
          </Box>
          <Typography variant="body2">Date: {new Date().toLocaleString()}</Typography>
          <Divider sx={{ my: 1 }} />
        </Box>
      ))}
    </Paper>
  );
};

export default ReceiptPreview; 