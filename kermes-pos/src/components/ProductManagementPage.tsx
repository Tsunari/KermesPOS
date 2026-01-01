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
  Tooltip,
  Popover,
  Fade
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import AddIcon from '@mui/icons-material/Add';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import Keycap from './ui/Keycap';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
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
      sx={{ width: '100%' }}
    >
      <ProductRow prod={prod} {...props} />
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

  // Bulk visibility toggle state
  const [bulkActive, setBulkActive] = useState(false);
  const [bulkTargetHidden, setBulkTargetHidden] = useState<boolean | null>(null);
  const bulkVisitedRef = React.useRef<Set<string>>(new Set());
  const bulkTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const bulkPendingRef = React.useRef<{ id: string; targetHidden: boolean } | null>(null);
  const HOLD_MS = 180; // small hold threshold to avoid accidental bulk

  // Sensors for drag and drop
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
    // Toggle the first target immediately
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
    // clear any pending hold timer
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
    // begin a pending bulk; will activate after HOLD_MS
    bulkPendingRef.current = { id, targetHidden };
    if (bulkTimerRef.current) {
      clearTimeout(bulkTimerRef.current);
    }
    bulkTimerRef.current = setTimeout(() => {
      // if still pending, start real bulk and apply first toggle
      if (bulkPendingRef.current && bulkPendingRef.current.id === id) {
        startBulkToggle(id, targetHidden);
        bulkPendingRef.current = null;
        bulkTimerRef.current = null;
      }
    }, HOLD_MS);
  };

  const onBulkMouseUp = (id: string) => {
    // If bulk already active, end is handled globally on window mouseup; still clear timers
    if (bulkTimerRef.current) {
      clearTimeout(bulkTimerRef.current);
      bulkTimerRef.current = null;
    }
    if (!bulkActive && bulkPendingRef.current && bulkPendingRef.current.id === id) {
      // treat as normal single click toggle
      applyVisibility(id, bulkPendingRef.current.targetHidden);
    }
    bulkPendingRef.current = null;
  };

  const handleAddProduct = (cat: 'food' | 'drink' | 'dessert') => {
    const { name, price, description } = addRows[cat];
    if (name && price) {
      productService.addProduct({
        id: '', // ID will be generated by productService
        name,
        price: parseFloat(price.replace(',', '.')),
        category: cat,
        description,
        inStock: true,
        hidden: false,
      });
      // Reload products from service to update context and UI
      setProducts(productService.getAllProducts());
      setAddRows((prev) => ({ ...prev, [cat]: { name: '', price: '', description: '' } }));
    }
  };

  const handleDeleteProduct = (id: string) => {
    productService.deleteProduct(id);
    setProducts(productService.getAllProducts());
  };

  const handleDragEnd = (event: any, category: string) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const categoryProducts = products.filter(p => p.category === category);
    const oldIndex = categoryProducts.findIndex((item) => item.id === active.id);
    const newIndex = categoryProducts.findIndex((item) => item.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Update order for all affected products
    const reordered = arrayMove(categoryProducts, oldIndex, newIndex);
    reordered.forEach((product, index) => {
      productService.updateProductOrder(product.id, index);
    });

    // Reload products from service to update context and UI
    setProducts(productService.getAllProducts());
  };

  const handleFieldChange = (id: string, field: keyof EditableProduct, value: string) => {
    // Update product in service and context
    const prod = products.find(p => p.id === id);
    if (prod) {
      let updated: Product;
      if (field === 'price') {
        // Normalize comma, commit only validated value (called on blur/enter)
        const normalized = value.replace(',', '.');
        const parsed = normalized === '' ? 0 : parseFloat(normalized);
        updated = { ...prod, price: isNaN(parsed) ? 0 : parsed };
      } else {
        updated = { ...prod, [field]: value } as Product;
      }
      productService.updateProduct(updated);
      // Force context update with a new array reference
      setProducts([...productService.getAllProducts()]);
    }
  };

  const handleSaveEdit = (id: string) => {
    // No-op, as state is already updated
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
    <Box sx={{ p: 1, maxWidth: '100vw', mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ m: 0, fontWeight: 700, fontSize: 24 }}>Product Management</Typography>
        <Tooltip title={t('app.products.shortcutsTips') || 'Shortcuts & Tips'}>
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
                  Reorder: Drag products to reorder within each category.
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
                    // allow digits and comma/dot; show comma in UI
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
              <Box sx={{ display: 'flex', alignItems: 'center', px: 0.5, py: 0.5, borderRadius: 1, mb: 0.5 }}>
                <Typography sx={{ flex: 2, fontWeight: 600, fontSize: 13, pl: 0.5 }}>Name</Typography>
                <Typography sx={{ flex: 1, fontWeight: 600, fontSize: 13, pl: 0.5 }}>Price (€)</Typography>
                <Typography sx={{ flex: 3, fontWeight: 600, fontSize: 13, pl: 0.5 }}>Description</Typography>
                <Box sx={{ width: 32 }} />
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
}> = ({ prod, shiftDown, onDelete, setDeleteId, handleFieldChange, handleSaveEdit, bulkActive, onBulkMouseDown, onBulkMouseUp, onBulkEnter }) => {
  const { t } = useLanguage();
  const [hovered, setHovered] = React.useState(false);
  const [tooltipSuppressed, setTooltipSuppressed] = React.useState(false);
  // Local draft for price to allow free typing and validate on blur/commit
  const [isEditingPrice, setIsEditingPrice] = React.useState(false);
  const [priceDraft, setPriceDraft] = React.useState<string>(
    prod.price === undefined || prod.price === null ? '' : String(prod.price).replace(/\./g, ',')
  );
  const cancelEditRef = React.useRef(false);

  // Keep draft in sync when product price changes externally (but not while actively editing)
  React.useEffect(() => {
    if (!isEditingPrice) {
      setPriceDraft(prod.price === undefined || prod.price === null ? '' : String(prod.price).replace(/\./g, ','));
    }
  }, [prod.price, isEditingPrice]);

  const commitPrice = () => {
    if (!handleFieldChange) return;
    // Normalize comma to dot and trim
    const normalized = priceDraft.replace(',', '.').trim();
    // Empty or invalid -> commit 0
    const finalValue = normalized === '' || isNaN(Number(normalized)) ? '0' : normalized;
    handleFieldChange(prod.id, 'price', finalValue);
    setPriceDraft(finalValue.replace(/\./g, ','));
  };
  const { setProducts } = useVariableContext();

  const toggleVisibility = () => {
    const updated: Product = { ...prod, hidden: !prod.hidden };
    productService.updateProduct(updated);
    // Update context with fresh array to avoid stale refs
    setProducts([...productService.getAllProducts()]);
  };

  // Suppress tooltips during bulk and until mouse leaves after bulk ends
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
      bgcolor: 'background.default',
      borderRadius: 1,
      boxShadow: 0,
      p: 0.5,
      width: '100%',
      opacity: prod.hidden ? 0.5 : 1,
      filter: prod.hidden ? 'grayscale(80%)' : 'none',
      transition: 'opacity 0.2s, filter 0.2s'
    }}>
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
        value={priceDraft}
        onFocus={() => setIsEditingPrice(true)}
        onChange={e => {
          // Allow only digits and a single decimal separator; show comma in UI
          let v = e.target.value;
          v = v.replace(/[^\d.,]/g, '');
          // Convert any dots to commas for display
          v = v.replace(/\./g, ',');
          // Allow only one comma
          const idx = v.indexOf(',');
          if (idx !== -1) {
            v = v.slice(0, idx + 1) + v.slice(idx + 1).replace(/,/g, '');
          }
          setPriceDraft(v);
        }}
        onBlur={() => {
          setIsEditingPrice(false);
          if (cancelEditRef.current) {
            // Cancel changes: restore from prod and do not commit
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
            // Revert to the current product price and exit edit
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
      <TextField
        value={prod.description}
        onChange={e => handleFieldChange && handleFieldChange(prod.id, 'description', e.target.value)}
        size="small"
        placeholder="Desc"
        sx={{ minWidth: 60, flex: 3, '& .MuiInputBase-input': { fontSize: 13, py: 0.5 } }}
        onBlur={() => handleSaveEdit && handleSaveEdit(prod.id)}
        InputProps={{ sx: { fontSize: 13, py: 0.5 } }}
      />
      <Tooltip
        title={(bulkActive || tooltipSuppressed)
          ? ''
          : (shiftDown
            ? (t('app.products.tooltipDeleteInstant') || 'Instant delete')
            : (t('app.products.tooltipDelete') || 'Delete (hold Shift for instant)'))}
        disableHoverListener={!!bulkActive || tooltipSuppressed}
        disableFocusListener={!!bulkActive || tooltipSuppressed}
        disableTouchListener={!!bulkActive || tooltipSuppressed}
        enterDelay={0}
        leaveDelay={0}
        TransitionProps={(bulkActive || tooltipSuppressed) ? { timeout: 0 } : undefined}
      >
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
          onMouseLeave={() => { setHovered(false); if (!bulkActive) setTooltipSuppressed(false); }}
        >
          {shiftDown && hovered ? (
            <DeleteForeverIcon fontSize="small" />
          ) : (
            <DeleteIcon fontSize="small" />
          )}
        </IconButton>
      </Tooltip>
      <Tooltip
        title={(bulkActive || tooltipSuppressed)
          ? ''
          : `${prod.hidden
            ? (t('app.products.tooltipVisibilityShow') || 'Show in grid')
            : (t('app.products.tooltipVisibilityHide') || 'Hide from grid')}
          — ${t('app.products.tooltipVisibilityMulti') || 'Hold and drag to multi-toggle'}`}
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
          sx={{ ml: 0.5, outline: bulkActive ? '2px solid rgba(25,118,210,0.4)' : 'none', outlineOffset: 2 }}
        >
          {prod.hidden ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default ProductManagementPage;
