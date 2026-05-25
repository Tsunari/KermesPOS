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
  Button,
  Tooltip,
  Popover,
  Fade,
  Checkbox,
  Slide,
  Divider
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import AddIcon from '@mui/icons-material/Add';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import Keycap from './ui/Keycap';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { useVariableContext } from '../context/VariableContext';
import { useLanguage } from '../context/LanguageContext';
import { Product } from '../types/index';
import { productService } from '../services/productService';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const categoryLabels: Record<string, string> = {
  food: 'Food',
  drink: 'Drink',
  dessert: 'Dessert',
};

const emptyProduct = { id: '', name: '', price: '', category: 'food', description: '' };

type EditableProduct = typeof emptyProduct & { id?: string };

// Sortable product row component
const SortableProductRow = ({ prod, ...props }: any) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: prod.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      sx={{ width: '100%' }}
    >
      <ProductRow
        prod={prod}
        dragHandleProps={{ ...attributes, ...listeners }}
        isDragging={isDragging}
        {...props}
      />
    </Box>
  );
};

const ProductManagementPage: React.FC = () => {
  const { t } = useLanguage();
  const { products, setProducts } = useVariableContext();
  const [addRows, setAddRows] = useState({
    food: { name: '', price: '', description: '' },
    drink: { name: '', price: '', description: '' },
    dessert: { name: '', price: '', description: '' },
  });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Bulk visibility toggle state (swipe gesture)
  const [bulkActive, setBulkActive] = useState(false);
  const [bulkTargetHidden, setBulkTargetHidden] = useState<boolean | null>(null);
  const bulkVisitedRef = React.useRef<Set<string>>(new Set());
  const bulkTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const bulkPendingRef = React.useRef<{ id: string; targetHidden: boolean } | null>(null);
  const HOLD_MS = 180; // small hold threshold to avoid accidental bulk

  // Checkbox Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  // Sensors for drag and drop (pointer sensor restricted by distance constraint)
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

  const applyVisibility = (id: string, hidden: boolean) => {
    const prod = products.find(p => p.id === id);
    if (!prod) return;
    if (prod.hidden === hidden) return;
    productService.updateProduct({ ...prod, hidden });
    setProducts([...productService.getAllProducts()]);
  };

  const startBulkToggle = (id: string, targetHidden: boolean) => {
    setBulkActive(true);
    setBulkTargetHidden(targetHidden);
    bulkVisitedRef.current = new Set();
    applyVisibility(id, targetHidden);
    bulkVisitedRef.current.add(id);
  };

  const enterBulkToggle = (id: string) => {
    if (!bulkActive || bulkTargetHidden === null) return;
    if (bulkVisitedRef.current.has(id)) return;
    applyVisibility(id, bulkTargetHidden);
    bulkVisitedRef.current.add(id);
  };

  const endBulkToggle = () => {
    setBulkActive(false);
    setBulkTargetHidden(null);
    bulkVisitedRef.current.clear();
    if (bulkTimerRef.current) {
      clearTimeout(bulkTimerRef.current);
      bulkTimerRef.current = null;
    }
    bulkPendingRef.current = null;
  };

  React.useEffect(() => {
    if (!bulkActive) return;
    const onUp = () => endBulkToggle();
    window.addEventListener('mouseup', onUp);
    window.addEventListener('mouseleave', onUp);
    return () => {
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('mouseleave', onUp);
    };
  }, [bulkActive]);

  const onBulkMouseDown = (id: string, targetHidden: boolean) => {
    bulkPendingRef.current = { id, targetHidden };
    if (bulkTimerRef.current) {
      clearTimeout(bulkTimerRef.current);
    }
    bulkTimerRef.current = setTimeout(() => {
      if (bulkPendingRef.current && bulkPendingRef.current.id === id) {
        startBulkToggle(id, targetHidden);
        bulkPendingRef.current = null;
        bulkTimerRef.current = null;
      }
    }, HOLD_MS);
  };

  const onBulkMouseUp = (id: string) => {
    if (bulkTimerRef.current) {
      clearTimeout(bulkTimerRef.current);
      bulkTimerRef.current = null;
    }
    if (!bulkActive && bulkPendingRef.current && bulkPendingRef.current.id === id) {
      applyVisibility(id, bulkPendingRef.current.targetHidden);
    }
    bulkPendingRef.current = null;
  };

  const handleAddProduct = (cat: 'food' | 'drink' | 'dessert') => {
    const { name, price, description } = addRows[cat];
    if (name && price) {
      productService.addProduct({
        id: '', 
        name,
        price: parseFloat(price.replace(',', '.')),
        category: cat,
        description,
        inStock: true,
        hidden: false,
      });
      setProducts(productService.getAllProducts());
      setAddRows((prev) => ({ ...prev, [cat]: { name: '', price: '', description: '' } }));
    }
  };

  const handleDeleteProduct = (id: string) => {
    productService.deleteProduct(id);
    setProducts(productService.getAllProducts());
    setSelectedIds(prev => prev.filter(x => x !== id));
  };

  const handleDragEnd = (event: any, category: string) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const categoryProducts = products.filter(p => p.category === category);
    const oldIndex = categoryProducts.findIndex((item) => item.id === active.id);
    const newIndex = categoryProducts.findIndex((item) => item.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(categoryProducts, oldIndex, newIndex);
    reordered.forEach((product, index) => {
      productService.updateProductOrder(product.id, index);
    });

    setProducts(productService.getAllProducts());
  };

  const handleFieldChange = (id: string, field: keyof EditableProduct, value: string) => {
    const prod = products.find(p => p.id === id);
    if (prod) {
      let updated: Product;
      if (field === 'price') {
        const normalized = value.replace(',', '.');
        const parsed = normalized === '' ? 0 : parseFloat(normalized);
        updated = { ...prod, price: isNaN(parsed) ? 0 : parsed };
      } else {
        updated = { ...prod, [field]: value } as Product;
      }
      productService.updateProduct(updated);
      setProducts([...productService.getAllProducts()]);
    }
  };

  const handleSaveEdit = (id: string) => {
    // No-op, auto-saves on field change
  };

  // Group products by category, sorted by order
  const grouped = products.reduce<Record<string, Product[]>>((acc, prod) => {
    acc[prod.category] = acc[prod.category] || [];
    acc[prod.category].push(prod);
    return acc;
  }, {});

  // Sort each category by order field
  Object.keys(grouped).forEach((cat) => {
    grouped[cat].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  });

  // Toggle selection of a single product
  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Toggle select all inside a category
  const handleToggleCategorySelect = (cat: string) => {
    const catProductIds = (grouped[cat] || []).map(p => p.id);
    const allSelected = catProductIds.length > 0 && catProductIds.every(id => selectedIds.includes(id));

    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !catProductIds.includes(id)));
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...catProductIds])));
    }
  };

  // Apply bulk visibility changes
  const handleBulkVisibility = (hidden: boolean) => {
    selectedIds.forEach(id => {
      const prod = products.find(p => p.id === id);
      if (prod) {
        productService.updateProduct({ ...prod, hidden });
      }
    });
    setProducts([...productService.getAllProducts()]);
    setSelectedIds([]);
  };

  // Apply bulk delete
  const handleBulkDelete = () => {
    selectedIds.forEach(id => {
      productService.deleteProduct(id);
    });
    setProducts(productService.getAllProducts());
    setSelectedIds([]);
    setBulkDeleteOpen(false);
  };

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

  const addProductRefs = React.useRef<{ [cat: string]: HTMLInputElement | null }>({});
  const [shortcutsAnchorEl, setShortcutsAnchorEl] = useState<HTMLElement | null>(null);

  return (
    <Box sx={{ p: 1, maxWidth: '100vw', mx: 'auto', pb: 12 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ m: 0, fontWeight: 700, fontSize: 24 }}>Product Management</Typography>
        <Tooltip title={t('app.products.shortcutsTips') || 'Shortcuts & Tips'} arrow placement="left">
          <IconButton size="small" onClick={(e) => setShortcutsAnchorEl(e.currentTarget)} aria-label="Shortcuts & Tips">
            <HelpOutlineIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Popover
          open={Boolean(shortcutsAnchorEl)}
          anchorEl={shortcutsAnchorEl}
          onClose={() => setShortcutsAnchorEl(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          TransitionComponent={Fade}
          transitionDuration={{ enter: 220, exit: 180 }}
          PaperProps={{ sx: { borderRadius: 2, boxShadow: 6 } }}
        >
          <Box sx={{ p: 2.5, width: 460, maxWidth: '86vw' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Shortcuts & Tips</Typography>
            <Box component="ul" sx={{ pl: 2, m: 0, display: 'grid', gap: 0.9 }}>
              <li>
                <Typography variant="body2">
                  Reorder: Drag products by grabbing the handle <DragIndicatorIcon sx={{ fontSize: 16, verticalAlign: 'middle', opacity: 0.7 }} /> to reorder within each category.
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  Visibility: Click to toggle. Hold ~0.2s and drag across icons to multi-toggle.
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  Delete: Click trash to confirm. Hold <Keycap>Shift</Keycap> + click for instant delete.
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  Add row: <Keycap>Enter</Keycap> to add. <Keycap>Tab</Keycap> / <Keycap>Shift</Keycap> + <Keycap>Tab</Keycap> to move between fields.
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  Price edit: Type freely (comma supported). <Keycap>Enter</Keycap>/<Keycap>Blur</Keycap> to save, <Keycap>Esc</Keycap> to cancel.
                </Typography>
              </li>
            </Box>
          </Box>
        </Popover>
      </Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="flex-start" sx={{ width: '100%' }}>
        {(['food', 'drink', 'dessert'] as const).map((cat) => (
          <DndContext
            key={cat}
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={(event) => handleDragEnd(event, cat)}
          >
            <Paper sx={{
              p: 0.5,
              borderRadius: 2, 
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
              
              {/* Add row at the top (full-width) */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: 'background.default', borderRadius: 1, boxShadow: 0, p: 0.5, width: '100%', mb: 0.5 }}>
                <TextField
                  inputRef={el => { addProductRefs.current[cat] = el; }}
                  value={addRows[cat].name}
                  onChange={e => setAddRows(prev => ({ ...prev, [cat]: { ...prev[cat], name: e.target.value } }))}
                  size="small"
                  placeholder="Name"
                  sx={{ minWidth: 60, flex: 2, '& .MuiInputBase-input': { fontSize: 13, py: 0.5 } }}
                  InputProps={{ sx: { fontSize: 13, py: 0.5 } }}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddProduct(cat); setTimeout(() => addProductRefs.current[cat]?.focus(), 10); } }}
                />
                <TextField
                  value={addRows[cat].price}
                  onChange={e => {
                    let v = e.target.value;
                    v = v.replace(/[^\d.,]/g, '');
                    v = v.replace(/\./g, ',');
                    const idx = v.indexOf(',');
                    if (idx !== -1) {
                      v = v.slice(0, idx + 1) + v.slice(idx + 1).replace(/,/g, '');
                    }
                    setAddRows(prev => ({ ...prev, [cat]: { ...prev[cat], price: v } }));
                  }}
                  size="small"
                  placeholder="€"
                  type="text"
                  inputMode="decimal"
                  sx={{ minWidth: 40, flex: 1, '& .MuiInputBase-input': { fontSize: 13, py: 0.5, textAlign: 'left' } }}
                  slotProps={{ input: { sx: { fontSize: 13, py: 0.5, textAlign: 'left' } } }}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddProduct(cat); setTimeout(() => addProductRefs.current[cat]?.focus(), 10); } }}
                />
                <TextField
                  value={addRows[cat].description}
                  onChange={e => setAddRows(prev => ({ ...prev, [cat]: { ...prev[cat], description: e.target.value } }))}
                  size="small"
                  placeholder="Desc"
                  sx={{ minWidth: 60, flex: 3, '& .MuiInputBase-input': { fontSize: 13, py: 0.5 } }}
                  InputProps={{ sx: { fontSize: 13, py: 0.5 } }}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddProduct(cat); setTimeout(() => addProductRefs.current[cat]?.focus(), 10); } }}
                />
                <IconButton color="primary" size="small" onClick={() => { handleAddProduct(cat); setTimeout(() => addProductRefs.current[cat]?.focus(), 10); }} disabled={!addRows[cat].name || !addRows[cat].price}>
                  <AddIcon fontSize="small" />
                </IconButton>
              </Box>
              
              {/* Table header row */}
              <Box sx={{ display: 'flex', alignItems: 'center', px: 0.5, py: 0.5, borderRadius: 1, mb: 0.5, width: '100%' }}>
                {/* Category select all checkbox */}
                <Box sx={{ width: 68, display: 'flex', alignItems: 'center', pl: 0.5 }}>
                  <Tooltip title={
                    (grouped[cat]?.length && (grouped[cat] || []).every(p => selectedIds.includes(p.id)))
                      ? "Deselect All Category"
                      : "Select All Category"
                  } arrow placement="top">
                    <Checkbox
                      size="small"
                      checked={
                        grouped[cat]?.length > 0 &&
                        (grouped[cat] || []).every(p => selectedIds.includes(p.id))
                      }
                      indeterminate={
                        grouped[cat]?.some(p => selectedIds.includes(p.id)) &&
                        !(grouped[cat] || []).every(p => selectedIds.includes(p.id))
                      }
                      onChange={() => handleToggleCategorySelect(cat)}
                      disabled={!grouped[cat]?.length}
                      sx={{ p: 0.5 }}
                    />
                  </Tooltip>
                </Box>
                <Typography sx={{ flex: 2, fontWeight: 600, fontSize: 13, pl: 0.5 }}>Name</Typography>
                <Typography sx={{ flex: 1, fontWeight: 600, fontSize: 13, pl: 0.5 }}>Price (€)</Typography>
                <Typography sx={{ flex: 3, fontWeight: 600, fontSize: 13, pl: 0.5 }}>Description</Typography>
                <Box sx={{ width: 76 }} />
              </Box>

              {/* Sortable context for this category */}
              <SortableContext
                items={grouped[cat]?.map(p => p.id) || []}
                strategy={verticalListSortingStrategy}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, width: '100%' }}>
                  {grouped[cat]?.length ? grouped[cat].map((prod) => {
                    return (
                      <SortableProductRow
                        key={prod.id}
                        prod={prod}
                        shiftDown={shiftDown}
                        onDelete={handleDeleteProduct}
                        setDeleteId={setDeleteId}
                        handleFieldChange={handleFieldChange}
                        handleSaveEdit={handleSaveEdit}
                        bulkActive={bulkActive}
                        onBulkMouseDown={onBulkMouseDown}
                        onBulkMouseUp={onBulkMouseUp}
                        onBulkEnter={enterBulkToggle}
                        selected={selectedIds.includes(prod.id)}
                        onSelectToggle={() => handleToggleSelect(prod.id)}
                      />
                    );
                  }) : (
                    <Typography color="text.secondary" sx={{ fontSize: 12, px: 1 }}>No products.</Typography>
                  )}
                </Box>
              </SortableContext>
            </Paper>
          </DndContext>
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

      {/* Floating Glassmorphic Bulk Actions Bar */}
      <Slide direction="up" in={selectedIds.length > 0} mountOnEnter unmountOnExit>
        <Paper
          elevation={10}
          sx={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            px: 3,
            py: 1.5,
            borderRadius: 4,
            zIndex: 1100,
            backdropFilter: 'blur(12px)',
            background: (theme) =>
              theme.palette.mode === 'dark'
                ? 'rgba(30, 30, 30, 0.85)'
                : 'rgba(255, 255, 255, 0.85)',
            border: (theme) => `1px solid ${theme.palette.divider}`,
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.25)',
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 700, minWidth: 100 }}>
            {selectedIds.length} Selected
          </Typography>
          <Divider orientation="vertical" flexItem />
          <Stack direction="row" spacing={1}>
            <Tooltip title="Make Selected Products Visible" arrow placement="top">
              <Button
                variant="contained"
                color="primary"
                size="small"
                startIcon={<VisibilityIcon />}
                onClick={() => handleBulkVisibility(false)}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
              >
                Show
              </Button>
            </Tooltip>
            <Tooltip title="Hide Selected Products" arrow placement="top">
              <Button
                variant="outlined"
                color="primary"
                size="small"
                startIcon={<VisibilityOffIcon />}
                onClick={() => handleBulkVisibility(true)}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
              >
                Hide
              </Button>
            </Tooltip>
            <Tooltip title="Delete Selected Products" arrow placement="top">
              <Button
                variant="contained"
                color="error"
                size="small"
                startIcon={<DeleteIcon />}
                onClick={() => setBulkDeleteOpen(true)}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
              >
                Delete
              </Button>
            </Tooltip>
            <Button
              variant="text"
              size="small"
              onClick={() => setSelectedIds([])}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, color: 'text.secondary' }}
            >
              Clear
            </Button>
          </Stack>
        </Paper>
      </Slide>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={bulkDeleteOpen} onClose={() => setBulkDeleteOpen(false)}>
        <DialogTitle sx={{ fontSize: 16, pl: 2 }}>Delete Selected Products</DialogTitle>
        <DialogContent sx={{ px: 2, py: 1 }}>
          <Typography sx={{ fontSize: 13 }}>
            Are you sure you want to delete the {selectedIds.length} selected products? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 2, py: 1 }}>
          <Button onClick={() => setBulkDeleteOpen(false)} size="small">Cancel</Button>
          <Button color="error" variant="contained" size="small" onClick={handleBulkDelete}>Delete</Button>
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
  bulkActive?: boolean;
  onBulkMouseDown?: (id: string, targetHidden: boolean) => void;
  onBulkMouseUp?: (id: string) => void;
  onBulkEnter?: (id: string) => void;
  dragHandleProps?: any;
  isDragging?: boolean;
  selected?: boolean;
  onSelectToggle?: () => void;
}> = ({
  prod,
  shiftDown,
  onDelete,
  setDeleteId,
  handleFieldChange,
  handleSaveEdit,
  bulkActive,
  onBulkMouseDown,
  onBulkMouseUp,
  onBulkEnter,
  dragHandleProps,
  isDragging,
  selected,
  onSelectToggle
}) => {
  const { t } = useLanguage();
  const [hovered, setHovered] = React.useState(false);
  const [tooltipSuppressed, setTooltipSuppressed] = React.useState(false);
  const [isEditingPrice, setIsEditingPrice] = React.useState(false);
  const [priceDraft, setPriceDraft] = React.useState<string>(
    prod.price === undefined || prod.price === null ? '' : String(prod.price).replace(/\./g, ',')
  );
  const cancelEditRef = React.useRef(false);

  React.useEffect(() => {
    if (!isEditingPrice) {
      setPriceDraft(prod.price === undefined || prod.price === null ? '' : String(prod.price).replace(/\./g, ','));
    }
  }, [prod.price, isEditingPrice]);

  const commitPrice = () => {
    if (!handleFieldChange) return;
    const normalized = priceDraft.replace(',', '.').trim();
    const finalValue = normalized === '' || isNaN(Number(normalized)) ? '0' : normalized;
    handleFieldChange(prod.id, 'price', finalValue);
    setPriceDraft(finalValue.replace(/\./g, ','));
  };

  const { setProducts } = useVariableContext();

  const toggleVisibility = () => {
    const updated: Product = { ...prod, hidden: !prod.hidden };
    productService.updateProduct(updated);
    setProducts([...productService.getAllProducts()]);
  };

  React.useEffect(() => {
    if (bulkActive) {
      setTooltipSuppressed(true);
    }
  }, [bulkActive]);

  return (
    <Box sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 0.5,
      bgcolor: isDragging ? 'action.hover' : 'background.default',
      borderRadius: 1.5,
      p: 0.5,
      width: '100%',
      opacity: prod.hidden ? 0.55 : 1,
      filter: prod.hidden ? 'grayscale(60%)' : 'none',
      transition: 'opacity 0.2s, filter 0.2s, background-color 0.2s, border 0.2s',
      border: isDragging ? '1px dashed #1976d2' : '1px solid transparent',
      '&:hover': {
        bgcolor: 'action.hover',
      }
    }}>
      {/* 1. Selection Checkbox */}
      <Checkbox
        size="small"
        checked={!!selected}
        onChange={onSelectToggle}
        sx={{ p: 0.5, width: 36 }}
      />

      {/* 2. Drag Indicator Grab Handle */}
      <Tooltip title="Drag indicator to reorder product" arrow placement="top">
        <IconButton
          size="small"
          sx={{ cursor: 'grab', color: 'text.secondary', p: 0.5, width: 32 }}
          {...dragHandleProps}
          aria-label="Drag to reorder"
        >
          <DragIndicatorIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      {/* 3. Name Field */}
      <TextField
        value={prod.name}
        onChange={e => handleFieldChange && handleFieldChange(prod.id, 'name', e.target.value)}
        size="small"
        placeholder="Name"
        sx={{ minWidth: 60, flex: 2, '& .MuiInputBase-input': { fontSize: 13, py: 0.5 } }}
        onBlur={() => handleSaveEdit && handleSaveEdit(prod.id)}
        InputProps={{ sx: { fontSize: 13, py: 0.5 } }}
      />

      {/* 4. Price Field */}
      <TextField
        value={priceDraft}
        onFocus={() => setIsEditingPrice(true)}
        onChange={e => {
          let v = e.target.value;
          v = v.replace(/[^\d.,]/g, '');
          v = v.replace(/\./g, ',');
          const idx = v.indexOf(',');
          if (idx !== -1) {
            v = v.slice(0, idx + 1) + v.slice(idx + 1).replace(/,/g, '');
          }
          setPriceDraft(v);
        }}
        onBlur={() => {
          setIsEditingPrice(false);
          if (cancelEditRef.current) {
            cancelEditRef.current = false;
            setPriceDraft(
              prod.price === undefined || prod.price === null ? '' : String(prod.price).replace(/\./g, ',')
            );
          } else {
            commitPrice();
            handleSaveEdit && handleSaveEdit(prod.id);
          }
        }}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            (e.target as HTMLInputElement).blur();
          } else if (e.key === 'Escape') {
            cancelEditRef.current = true;
            setPriceDraft(
              prod.price === undefined || prod.price === null ? '' : String(prod.price).replace(/\./g, ',')
            );
            (e.target as HTMLInputElement).blur();
          }
        }}
        size="small"
        placeholder="€"
        type="text"
        inputMode="decimal"
        sx={{ minWidth: 40, flex: 1, '& .MuiInputBase-input': { fontSize: 13, py: 0.5, textAlign: 'left' } }}
        InputProps={{ sx: { fontSize: 13, py: 0.5, textAlign: 'left' } }}
      />

      {/* 5. Description Field */}
      <TextField
        value={prod.description}
        onChange={e => handleFieldChange && handleFieldChange(prod.id, 'description', e.target.value)}
        size="small"
        placeholder="Desc"
        sx={{ minWidth: 60, flex: 3, '& .MuiInputBase-input': { fontSize: 13, py: 0.5 } }}
        onBlur={() => handleSaveEdit && handleSaveEdit(prod.id)}
        InputProps={{ sx: { fontSize: 13, py: 0.5 } }}
      />

      {/* 6. Delete Button with Premium Keyboard Shortcut Badge inside Tooltip */}
      <Tooltip
        title={
          (bulkActive || tooltipSuppressed) ? '' : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 0.5, py: 0.2 }}>
              <Typography variant="body2" sx={{ fontSize: 11, fontWeight: 500 }}>
                {shiftDown
                  ? (t('app.products.tooltipDeleteInstant') || 'Instant Delete')
                  : (t('app.products.tooltipDelete') || 'Delete')}
              </Typography>
               {!shiftDown && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography variant="caption" sx={{ opacity: 0.7, fontSize: 10 }}>Hold</Typography>
                  <Box sx={{ display: 'inline-block', scale: '0.85', transformOrigin: 'center' }}>
                    <Keycap>Shift</Keycap>
                  </Box>
                </Box>
              )}
            </Box>
          )
        }
        arrow
        placement="top"
        disableHoverListener={!!bulkActive || tooltipSuppressed}
        disableFocusListener={!!bulkActive || tooltipSuppressed}
        disableTouchListener={!!bulkActive || tooltipSuppressed}
        enterDelay={0}
        leaveDelay={0}
        TransitionProps={(bulkActive || tooltipSuppressed) ? { timeout: 0 } : undefined}
      >
        <IconButton
          color="error"
          size="small"
          onClick={e => {
            if (shiftDown) {
              onDelete(prod.id);
            } else {
              setDeleteId(prod.id);
            }
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => { setHovered(false); if (!bulkActive) setTooltipSuppressed(false); }}
          sx={{ width: 36 }}
        >
          {shiftDown && hovered ? (
            <DeleteForeverIcon fontSize="small" />
          ) : (
            <DeleteIcon fontSize="small" />
          )}
        </IconButton>
      </Tooltip>

      {/* 7. Visibility Button with Premium Tooltip */}
      <Tooltip
        title={(bulkActive || tooltipSuppressed)
          ? ''
          : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.2, px: 0.5, py: 0.2 }}>
              <Typography variant="body2" sx={{ fontSize: 11, fontWeight: 500 }}>
                {prod.hidden
                  ? (t('app.products.tooltipVisibilityShow') || 'Show in grid')
                  : (t('app.products.tooltipVisibilityHide') || 'Hide from grid')}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.7, fontSize: 9 }}>
                {t('app.products.tooltipVisibilityMulti') || 'Hold & drag across to multi-toggle'}
              </Typography>
            </Box>
          )
        }
        arrow
        placement="top"
        disableHoverListener={!!bulkActive || tooltipSuppressed}
        disableFocusListener={!!bulkActive || tooltipSuppressed}
        disableTouchListener={!!bulkActive || tooltipSuppressed}
        enterDelay={0}
        leaveDelay={0}
        TransitionProps={(bulkActive || tooltipSuppressed) ? { timeout: 0 } : undefined}
      >
        <IconButton
          color={prod.hidden ? 'default' : 'primary'}
          size="small"
          onMouseDown={(e) => { e.preventDefault(); setTooltipSuppressed(true); if (onBulkMouseDown) { onBulkMouseDown(prod.id, !prod.hidden); } else { toggleVisibility(); } }}
          onMouseUp={() => { onBulkMouseUp && onBulkMouseUp(prod.id); }}
          onMouseEnter={() => { if (bulkActive && onBulkEnter) onBulkEnter(prod.id); }}
          onMouseLeave={() => { if (!bulkActive) setTooltipSuppressed(false); }}
          sx={{ ml: 0.5, outline: bulkActive ? '2px solid rgba(25,118,210,0.4)' : 'none', outlineOffset: 2, width: 36 }}
        >
          {prod.hidden ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default ProductManagementPage;
