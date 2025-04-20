import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { useLanguage } from '../contexts/LanguageContext';
import { Product } from '../types/index';

interface StatisticsPageProps {
  products: Product[];
}

const StatisticsPage: React.FC<StatisticsPageProps> = ({ products }) => {
  const { t } = useLanguage();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Statistics</Typography>
      <Typography variant="body1" paragraph>
        Track your sales performance and business metrics in real-time.
      </Typography>
      
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 3, mt: 3 }}>
        <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography variant="h6" color="text.secondary">Today's Sales</Typography>
          <Typography variant="h3" color="primary">1,234.56€</Typography>
          <Typography variant="body2" color="text.secondary">+12.5% from yesterday</Typography>
        </Paper>
        
        <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography variant="h6" color="text.secondary">Items Sold</Typography>
          <Typography variant="h3" color="primary">42</Typography>
          <Typography variant="body2" color="text.secondary">Average: 35 items/day</Typography>
        </Paper>
        
        <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography variant="h6" color="text.secondary">Average Order Value</Typography>
          <Typography variant="h3" color="primary">29.39€</Typography>
          <Typography variant="body2" color="text.secondary">+5.2% from last week</Typography>
        </Paper>
      </Box>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>Top Selling Items</Typography>
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 2 }}>
            {products.slice(0, 4).map((product) => (
              <Paper key={product.id} sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="subtitle1">{product.name}</Typography>
                <Typography variant="body2" color="text.secondary">Sold: 15 units</Typography>
                <Typography variant="body2" color="primary">Revenue: 150.00€</Typography>
              </Paper>
            ))}
          </Box>
        </Paper>
      </Box>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>Sales by Category</Typography>
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 2 }}>
            <Paper sx={{ p: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
              <Typography variant="subtitle1">Food</Typography>
              <Typography variant="h6">750.00€</Typography>
              <Typography variant="body2">45% of total</Typography>
            </Paper>
            <Paper sx={{ p: 2, bgcolor: 'info.light', color: 'info.contrastText' }}>
              <Typography variant="subtitle1">Drinks</Typography>
              <Typography variant="h6">350.00€</Typography>
              <Typography variant="body2">25% of total</Typography>
            </Paper>
            <Paper sx={{ p: 2, bgcolor: 'secondary.light', color: 'secondary.contrastText' }}>
              <Typography variant="subtitle1">Desserts</Typography>
              <Typography variant="h6">250.00€</Typography>
              <Typography variant="body2">20% of total</Typography>
            </Paper>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default StatisticsPage; 