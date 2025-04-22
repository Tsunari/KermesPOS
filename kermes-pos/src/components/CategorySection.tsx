import React from 'react';
import {
  Box,
  Typography,
  Paper,
  useTheme,
} from '@mui/material';
import { Product } from '../types/index';
import ProductCard from './ProductCard';
import { getCategoryStyle } from '../utils/categoryUtils';

interface CategorySectionProps {
  category: string;
  products: Product[];
  onStockChange: (productId: string, inStock: boolean) => void;
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
}

const CategorySection: React.FC<CategorySectionProps> = ({
  category,
  products,
  onStockChange,
  onEdit,
  onDelete,
}) => {
  const theme = useTheme();

  const categoryStyle = getCategoryStyle(category, theme);

  return (
    <Paper
      elevation={2}
      sx={{
        mb: 2,
        borderRadius: 2,
        overflow: 'hidden',
        border: `1px solid ${categoryStyle.borderColor}`,
        transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: theme.shadows[8],
        },
      }}
    >
      <Box
        sx={{
          p: 1.5,
          bgcolor: categoryStyle.bgColor,
          borderBottom: `1px solid ${categoryStyle.borderColor}`,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Typography
          variant="h6"
          component="h2"
          sx={{
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <span role="img" aria-label={category}>
            {categoryStyle.icon}
          </span>
          {category.charAt(0).toUpperCase() + category.slice(1)}
          <Typography
            component="span"
            variant="body2"
            sx={{ ml: 1, color: 'text.secondary' }}
          >
            ({products.length})
          </Typography>
        </Typography>
      </Box>
      <Box sx={{ p: 1.5 }}>
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 1.5
        }}>
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onStockChange={onStockChange}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </Box>
      </Box>
    </Paper>
  );
};

export default CategorySection;