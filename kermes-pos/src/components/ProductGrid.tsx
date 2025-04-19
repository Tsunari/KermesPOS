import React from 'react';
import { Box, Typography, useTheme, alpha } from '@mui/material';
import { Product } from '../types/index';
import ProductCard from './ProductCard';
import { useSettings } from '../context/SettingsContext';

interface ProductGridProps {
  products: Product[];
  onStockChange: (productId: string, inStock: boolean) => void;
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
}

const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  onStockChange,
  onEdit,
  onDelete,
}) => {
  const { showDescription } = useSettings();
  const theme = useTheme();

  // Group products by category
  const groupedProducts = products.reduce((groups, product) => {
    const category = product.category || 'Other';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(product);
    return groups;
  }, {} as Record<string, Product[]>);

  // Define the order of categories
  const categoryOrder = ['food', 'drink', 'dessert', 'Other'];

  // Get category-specific styling
  const getCategoryStyle = (category: string) => {
    switch (category.toLowerCase()) {
      case 'food':
        return {
          bgColor: alpha(theme.palette.primary.main, 0.05),
          borderColor: theme.palette.primary.main,
          icon: '🍽️',
        };
      case 'drink':
        return {
          bgColor: alpha(theme.palette.info.main, 0.05),
          borderColor: theme.palette.info.main,
          icon: '🥤',
        };
      case 'dessert':
        return {
          bgColor: alpha(theme.palette.secondary.main, 0.05),
          borderColor: theme.palette.secondary.main,
          icon: '🍰',
        };
      default:
        return {
          bgColor: alpha(theme.palette.grey[500], 0.05),
          borderColor: theme.palette.grey[500],
          icon: '📦',
        };
    }
  };

  return (
    <Box sx={{ 
      p: 1,
      pr: 2,
      height: '100%',
      overflowY: 'auto',
      overflowX: 'hidden',
      width: '100%',
      '&::-webkit-scrollbar': {
        width: '8px',
      },
      '&::-webkit-scrollbar-track': {
        background: theme.palette.grey[100],
        borderRadius: '4px',
      },
      '&::-webkit-scrollbar-thumb': {
        background: theme.palette.grey[400],
        borderRadius: '4px',
        '&:hover': {
          background: theme.palette.grey[500],
        },
      },
    }}>
      {categoryOrder
        .filter(category => groupedProducts[category] && groupedProducts[category].length > 0)
        .map(category => {
          const categoryStyle = getCategoryStyle(category);
          return (
            <Box key={category} sx={{ mb: 2, width: '100%' }}>
              <Box
                sx={{
                  p: 1,
                  bgcolor: categoryStyle.bgColor,
                  borderLeft: 2,
                  borderColor: categoryStyle.borderColor,
                  mb: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  position: 'sticky',
                  top: 0,
                  zIndex: 1,
                  width: '100%',
                }}
              >
                <span role="img" aria-label={category}>
                  {categoryStyle.icon}
                </span>
                <Typography
                  variant="subtitle1"
                  sx={{
                    color: categoryStyle.borderColor,
                    fontWeight: 'bold',
                  }}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                  <Typography
                    component="span"
                    variant="body2"
                    sx={{ ml: 1, color: 'text.secondary' }}
                  >
                    ({groupedProducts[category].length})
                  </Typography>
                </Typography>
              </Box>
              <Box sx={{ 
                display: 'grid',
                gridTemplateColumns: {
                  xs: 'repeat(3, 1fr)',
                  sm: 'repeat(4, 1fr)',
                  md: 'repeat(6, 1fr)',
                  lg: 'repeat(8, 1fr)',
                },
                gap: 1,
                minHeight: 'fit-content',
                width: '100%',
                boxSizing: 'border-box',
              }}>
                {groupedProducts[category].map((product) => (
                  <Box key={product.id} sx={{ width: '100%' }}>
                    <ProductCard
                      product={product}
                      onStockChange={onStockChange}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      showDescription={showDescription}
                    />
                  </Box>
                ))}
              </Box>
            </Box>
          );
        })}
    </Box>
  );
};

export default ProductGrid; 