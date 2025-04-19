import React, { useState, useEffect } from 'react';
import { Box, Typography, useTheme, alpha } from '@mui/material';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Product } from '../types/index';
import ProductCard from './ProductCard';
import { useSettings } from '../context/SettingsContext';

interface ProductGridProps {
  products: Product[];
  onStockChange: (productId: string, inStock: boolean) => void;
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
  onProductClick: (product: Product) => void;
}

interface SortableProductCardProps {
  product: Product;
  onStockChange: (productId: string, inStock: boolean) => void;
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
  showDescription: boolean;
  onClick: () => void;
  categoryStyle: {
    bgColor: string;
    borderColor: string;
    icon: string;
  };
}

const SortableProductCard = ({ product, ...props }: SortableProductCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab',
    touchAction: 'none',
  };

  return (
    <Box 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      sx={{ 
        width: '100%',
        position: 'relative'
      }}
    >
      <ProductCard product={product} {...props} />
    </Box>
  );
};

const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  onStockChange,
  onEdit,
  onDelete,
  onProductClick,
}) => {
  const { showDescription } = useSettings();
  const theme = useTheme();
  const [orderedProducts, setOrderedProducts] = useState<Product[]>(products);

  useEffect(() => {
    const storedOrder = localStorage.getItem('product_order');
    if (storedOrder) {
      try {
        const orderMap = JSON.parse(storedOrder);
        const ordered = [...products].sort((a, b) => {
          const orderA = orderMap[a.id] || Number.MAX_SAFE_INTEGER;
          const orderB = orderMap[b.id] || Number.MAX_SAFE_INTEGER;
          return orderA - orderB;
        });
        setOrderedProducts(ordered);
      } catch (error) {
        setOrderedProducts(products);
      }
    } else {
      setOrderedProducts(products);
    }
  }, [products]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setOrderedProducts((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        
        // Save order to localStorage
        const orderMap: { [key: string]: number } = {};
        newItems.forEach((item, index) => {
          orderMap[item.id] = index;
        });
        localStorage.setItem('product_order', JSON.stringify(orderMap));
        
        return newItems;
      });
    }
  };

  // Group products by category
  const groupedProducts = orderedProducts.reduce((groups, product) => {
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
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
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
                <SortableContext
                  items={groupedProducts[category].map(product => product.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <Box
                    sx={{
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
                    }}
                  >
                    {groupedProducts[category].map((product) => (
                      <SortableProductCard
                        key={product.id}
                        product={product}
                        onStockChange={onStockChange}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        showDescription={showDescription}
                        onClick={() => onProductClick(product)}
                        categoryStyle={categoryStyle}
                      />
                    ))}
                  </Box>
                </SortableContext>
              </Box>
            );
          })}
      </Box>
    </DndContext>
  );
};

export default ProductGrid; 