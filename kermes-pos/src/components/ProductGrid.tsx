import React, { useState, useEffect } from 'react';
import { Box, useTheme, Typography } from '@mui/material';
import { DndContext, closestCenter, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Product } from '../types/index';
import ProductCard from './ProductCard';
import { useSettings } from '../context/SettingsContext';
import { getCategoryStyle } from '../utils/categoryUtils';
import { useVariableContext } from '../context/VariableContext';
import { productService } from '../services/productService';
import { useLanguage } from '../context/LanguageContext';

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
    touchAction: 'pan-y' as const,
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
      <ProductCard product={product} {...props} height={135} />
    </Box>
  );
};

const ProductGrid: React.FC<ProductGridProps> = ({
  products: _productsProp, // ignore prop, use context
  onStockChange,
  onEdit,
  onDelete,
  onProductClick,
}) => {
  const { showDescription } = useSettings();
  const theme = useTheme();
  const { t } = useLanguage();
  const { fixedGridMode, cardsPerRow, products, recentOrdersOpen, editingTransaction } = useVariableContext(); // use context products
  const [orderedProducts, setOrderedProducts] = useState<Product[]>(products);

  // Sort products by category and order within category
  useEffect(() => {
    const sorted = [...products].sort((a, b) => {
      // First sort by category order
      const categoryOrder = { food: 0, drink: 1, dessert: 2 };
      const catA = categoryOrder[a.category] ?? 999;
      const catB = categoryOrder[b.category] ?? 999;
      if (catA !== catB) return catA - catB;
      // Then sort by order within category
      return (a.order ?? 0) - (b.order ?? 0);
    });
    setOrderedProducts(sorted);
  }, [products]);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setOrderedProducts((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);

        // Update order in productService for each product in the same category as the dragged product
        const draggedProduct = newItems[newIndex];
        const category = draggedProduct.category;
        const categoryProducts = newItems.filter(p => p.category === category);
        
        categoryProducts.forEach((product, index) => {
          productService.updateProductOrder(product.id, index);
        });

        return newItems;
      });
    }
  };

  // Group products by category, skip hidden products
  const groupedProducts = orderedProducts.reduce((groups, product) => {
    if (product.hidden === true) {
      return groups;
    }
    const category = product.category || 'Other';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(product);
    return groups;
  }, {} as Record<string, Product[]>);

  // Define the order of categories
  const categoryOrder = ['food', 'drink', 'dessert', 'Other'];

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
        overflowX: 'auto',
        width: '100%',
        '&::-webkit-scrollbar': {
          width: '8px',
          height: '8px',
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
        {editingTransaction && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(237, 108, 2, 0.15)' : '#fff8e1',
              color: theme.palette.mode === 'dark' ? '#ffb74d' : '#b78103',
              border: '1.5px solid',
              borderColor: theme.palette.mode === 'dark' ? '#f57c00' : '#ffe082',
              borderRadius: '12px',
              p: 1.5,
              mb: 2,
              boxShadow: theme.palette.mode === 'dark'
                ? '0 4px 12px 0 rgba(0, 0, 0, 0.3)'
                : '0 2px 8px 0 rgba(237, 108, 2, 0.04)',
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
              ⚠️ {t('app.cart.editingOrderModeActive')?.replace('{id}', editingTransaction.id.toString()) || `Editing Order #${editingTransaction.id} Active`}
            </Typography>
            <Typography variant="caption" sx={{ mt: 0.5, fontWeight: 600 }}>
              {t('app.cart.tappingAddsHint') || 'Tapping products in the grid adds them directly to this past order.'}
            </Typography>
          </Box>
        )}
        {categoryOrder
          .filter(category => groupedProducts[category] && groupedProducts[category].length > 0)
          .map(category => {
            const categoryStyle = getCategoryStyle(category, theme);
            return (
              <Box key={category} sx={{ mb: 2, width: '100%' }}>
                <SortableContext
                  items={groupedProducts[category].map(product => product.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: fixedGridMode
                        ? `repeat(${recentOrdersOpen ? Math.max(2, cardsPerRow - 3) : cardsPerRow}, 1fr)`
                        : 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: 0.5, // smaller gap
                      width: '100%',
                      alignItems: 'stretch',
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
                        categoryStyle={categoryStyle}
                        onClick={() => onProductClick(product)}
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