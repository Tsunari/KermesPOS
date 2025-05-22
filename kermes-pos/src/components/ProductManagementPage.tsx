import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Button, // restore Button import
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import AddIcon from '@mui/icons-material/Add';
import { useVariableContext } from '../context/VariableContext';
import { Product } from '../types/index';

const categoryLabels: Record<string, string> = {
  food: 'Food',
  drink: 'Drink',
  dessert: 'Dessert',
};

const emptyProduct = { id: '', name: '', price: '', category: 'food', description: '' };

type EditableProduct = typeof emptyProduct & { id?: string };

const ProductManagementPage: React.FC = () => {
  const { products, setProducts } = useVariableContext();
  const [addRows, setAddRows] = useState({
    food: { name: '', price: '', description: '' },
    drink: { name: '', price: '', description: '' },
    dessert: { name: '', price: '', description: '' },
  });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleAddProduct = (cat: 'food' | 'drink' | 'dessert') => {
    const { name, price, description } = addRows[cat];
    if (name && price) {
      setProducts(prev => [
        ...prev,
        {
          id: Math.random().toString(36).substr(2, 9),
          name,
          price: parseFloat(price),
          category: cat,
          description,
          inStock: true,
        },
      ]);
      setAddRows((prev) => ({ ...prev, [cat]: { name: '', price: '', description: '' } }));
    }
  };

  const handleDeleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const handleFieldChange = (id: string, field: keyof EditableProduct, value: string) => {
    setProducts((prev) =>
      prev.map((prod) =>
        prod.id === id ? { ...prod, [field]: field === 'price' ? parseFloat(value) : value } : prod
      )
    );
  };

  const handleSaveEdit = (id: string) => {
    // No-op, as state is already updated
  };

  // Group products by category
  const grouped = products.reduce<Record<string, Product[]>>((acc, prod) => {
    acc[prod.category] = acc[prod.category] || [];
    acc[prod.category].push(prod);
    return acc;
  }, {});

  // Track shift key globally for delete shortcut
  const [shiftDown, setShiftDown] = React.useState(false);
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setShiftDown(true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setShiftDown(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return (
    <Box sx={{ p: 1, maxWidth: '100vw', mx: 'auto' }}>
      <Typography variant="h6" gutterBottom sx={{ mb: 2, fontWeight: 700, fontSize: 24 }}>Product Management</Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="flex-start" sx={{ width: '100%' }}>
        {(['food', 'drink', 'dessert'] as const).map((cat) => (
          <Paper key={cat} sx={{
            p: 0.5,
            borderRadius: 2, // more pronounced, matches MUI default
            boxShadow: 1,
            flex: 1,
            minWidth: 0,
            bgcolor: 'background.paper',
            display: 'flex',
            flexDirection: 'column',
            gap: 0.5,
            height: '100%'
          }}>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 0.5,
              px: 1,
              pt: 1,
            }}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 700,
                  fontSize: 16,
                  letterSpacing: 0.2,
                  color: (theme) => theme.palette.mode === 'dark' ? theme.palette.grey[200] : theme.palette.text.primary,
                  transition: 'color 0.2s',
                }}
              >
                {categoryLabels[cat]}
              </Typography>
            </Box>
            {/* Add row at the top */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: 'background.default', borderRadius: 1, boxShadow: 0, p: 0.5, width: '100%', mb: 0.5 }}>
              <TextField
                value={addRows[cat].name}
                onChange={e => setAddRows(prev => ({ ...prev, [cat]: { ...prev[cat], name: e.target.value } }))}
                size="small"
                placeholder="Name"
                sx={{ minWidth: 60, flex: 2, '& .MuiInputBase-input': { fontSize: 13, py: 0.5 } }}
                InputProps={{ sx: { fontSize: 13, py: 0.5 } }}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddProduct(cat); } }}
              />
              <TextField
                value={addRows[cat].price}
                onChange={e => setAddRows(prev => ({ ...prev, [cat]: { ...prev[cat], price: e.target.value.replace(/[^\d.]/g, '') } }))}
                size="small"
                placeholder="€"
                type="number"
                inputMode="decimal"
                sx={{ minWidth: 40, flex: 1, '& .MuiInputBase-input': { fontSize: 13, py: 0.5, textAlign: 'left' }, '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': { WebkitAppearance: 'none', margin: 0 }, '& input[type=number]': { MozAppearance: 'textfield' } }}
                slotProps={{ input: { sx: { fontSize: 13, py: 0.5, textAlign: 'left' } } }}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddProduct(cat); } }}
              />
              <TextField
                value={addRows[cat].description}
                onChange={e => setAddRows(prev => ({ ...prev, [cat]: { ...prev[cat], description: e.target.value } }))}
                size="small"
                placeholder="Desc"
                sx={{ minWidth: 60, flex: 3, '& .MuiInputBase-input': { fontSize: 13, py: 0.5 } }}
                InputProps={{ sx: { fontSize: 13, py: 0.5 } }}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddProduct(cat); } }}
              />
              <IconButton color="primary" size="small" onClick={() => handleAddProduct(cat)} disabled={!addRows[cat].name || !addRows[cat].price}>
                <AddIcon fontSize="small" />
              </IconButton>
            </Box>
            {/* Table header row */}
            <Box sx={{ display: 'flex', alignItems: 'center', px: 0.5, py: 0.5, borderRadius: 1, mb: 0.5 }}>
              <Typography sx={{ flex: 2, fontWeight: 600, fontSize: 13, pl: 0.5 }}>Name</Typography>
              <Typography sx={{ flex: 1, fontWeight: 600, fontSize: 13, pl: 0.5 }}>Price (€)</Typography>
              <Typography sx={{ flex: 3, fontWeight: 600, fontSize: 13, pl: 0.5 }}>Description</Typography>
              <Box sx={{ width: 32 }} />
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, width: '100%' }}>
              {grouped[cat]?.length ? grouped[cat].map((prod) => {
                return (
                  <ProductRow
                    key={prod.id}
                    prod={prod}
                    shiftDown={shiftDown}
                    onDelete={handleDeleteProduct}
                    setDeleteId={setDeleteId}
                    handleFieldChange={handleFieldChange}
                    handleSaveEdit={handleSaveEdit}
                  />
                );
              }) : (
                <Typography color="text.secondary" sx={{ fontSize: 12, px: 1 }}>No products.</Typography>
              )}
            </Box>
          </Paper>
        ))}
      </Stack>
      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogTitle sx={{ fontSize: 16, pl: 2 }}>Delete Product</DialogTitle>
        <DialogContent sx={{ px: 2, py: 1 }}>
          <Typography sx={{ fontSize: 13 }}>Are you sure you want to delete this product?</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 2, py: 1 }}>
          <Button onClick={() => setDeleteId(null)} size="small">Cancel</Button>
          <Button color="error" variant="contained" size="small" onClick={() => { if (deleteId) { handleDeleteProduct(deleteId); setDeleteId(null); } }}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const ProductRow: React.FC<{
  prod: Product;
  shiftDown: boolean;
  onDelete: (id: string) => void;
  setDeleteId: (id: string) => void;
  handleFieldChange?: (id: string, field: keyof EditableProduct, value: string) => void;
  handleSaveEdit?: (id: string) => void;
}> = ({ prod, shiftDown, onDelete, setDeleteId, handleFieldChange, handleSaveEdit }) => {
  const [hovered, setHovered] = React.useState(false);
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: 'background.default', borderRadius: 1, boxShadow: 0, p: 0.5, width: '100%' }}>
      <TextField
        value={prod.name}
        onChange={e => handleFieldChange && handleFieldChange(prod.id, 'name', e.target.value)}
        size="small"
        placeholder="Name"
        sx={{ minWidth: 60, flex: 2, '& .MuiInputBase-input': { fontSize: 13, py: 0.5 } }}
        onBlur={() => handleSaveEdit && handleSaveEdit(prod.id)}
        InputProps={{ sx: { fontSize: 13, py: 0.5 } }}
      />
      <TextField
        value={prod.price}
        onChange={e => handleFieldChange && handleFieldChange(prod.id, 'price', e.target.value)}
        size="small"
        placeholder="€"
        type="number"
        inputMode="decimal"
        sx={{ minWidth: 40, flex: 1, '& .MuiInputBase-input': { fontSize: 13, py: 0.5, textAlign: 'left' }, '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': { WebkitAppearance: 'none', margin: 0 }, '& input[type=number]': { MozAppearance: 'textfield' } }}
        onBlur={() => handleSaveEdit && handleSaveEdit(prod.id)}
        InputProps={{ sx: { fontSize: 13, py: 0.5, textAlign: 'left' } }}
      />
      <TextField
        value={prod.description}
        onChange={e => handleFieldChange && handleFieldChange(prod.id, 'description', e.target.value)}
        size="small"
        placeholder="Desc"
        sx={{ minWidth: 60, flex: 3, '& .MuiInputBase-input': { fontSize: 13, py: 0.5 } }}
        onBlur={() => handleSaveEdit && handleSaveEdit(prod.id)}
        InputProps={{ sx: { fontSize: 13, py: 0.5 } }}
      />
      <IconButton
        color={shiftDown && hovered ? 'error' : 'error'}
        size="small"
        onClick={e => {
          if (shiftDown) {
            onDelete(prod.id);
          } else {
            setDeleteId(prod.id);
          }
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {shiftDown && hovered ? (
          <DeleteForeverIcon fontSize="small" />
        ) : (
          <DeleteIcon fontSize="small" />
        )}
      </IconButton>
    </Box>
  );
};

export default ProductManagementPage;
