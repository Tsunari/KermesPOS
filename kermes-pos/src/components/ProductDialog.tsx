import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  SelectChangeEvent,
} from '@mui/material';
import { Product } from '../types/index';

interface ProductDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
  product?: Product;
}

const initialProduct: Product = {
  id: '',
  name: '',
  price: 0,
  category: 'food',
  description: '',
  inStock: true,
};

const ProductDialog: React.FC<ProductDialogProps> = ({
  open,
  onClose,
  onSave,
  product,
}) => {
  const [formData, setFormData] = useState<Product>(initialProduct);

  useEffect(() => {
    if (product) {
      setFormData(product);
    } else {
      setFormData(initialProduct);
    }
  }, [product]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'price' ? parseFloat(value) : value,
    }));
  };

  const handleSelectChange = (e: SelectChangeEvent<'food' | 'drink' | 'dessert'>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      id: product?.id || Date.now().toString(),
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{product ? 'Edit Product' : 'Add New Product'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              name="name"
              label="Product Name"
              value={formData.name}
              onChange={handleTextChange}
              required
              fullWidth
            />
            <TextField
              name="price"
              label="Price"
              type="number"
              value={formData.price}
              onChange={handleTextChange}
              required
              fullWidth
              inputProps={{ step: 0.50, min: 0 }}
            />
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                name="category"
                value={formData.category}
                onChange={handleSelectChange}
                label="Category"
                required
              >
                <MenuItem value="food">Food</MenuItem>
                <MenuItem value="drink">Drink</MenuItem>
                <MenuItem value="dessert">Dessert</MenuItem>
              </Select>
            </FormControl>
            <TextField
              name="description"
              label="Description (Optional)"
              value={formData.description}
              onChange={handleTextChange}
              fullWidth
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" color="primary">
            {product ? 'Save Changes' : 'Add Product'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ProductDialog; 