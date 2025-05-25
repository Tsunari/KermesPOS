import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, ToggleButton, ToggleButtonGroup, IconButton, Dialog, DialogTitle, DialogContent, Tooltip, Button, Stack, DialogActions, TextField, Accordion, AccordionSummary, AccordionDetails, List, ListItem, ListItemText, ListItemIcon, Divider } from '@mui/material';
import GridViewIcon from '@mui/icons-material/GridView';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import LocalBarIcon from '@mui/icons-material/LocalBar';
import { useLanguage } from '../context/LanguageContext';
import { Product } from '../types/index';
import { cartTransactionService } from '../services/cartTransactionService';
import { generateSummaryPDF } from '../services/summary';
import { exampleTransactions } from '../services/exampleTransactions';
import { useVariableContext } from '../context/VariableContext';
import { Block, Coffee, Cookie, Euro, FoodBank, MiscellaneousServices, Payments } from '@mui/icons-material';
import Collapse from '@mui/material/Collapse';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import EditIcon from '@mui/icons-material/Edit';
import MenuItem from '@mui/material/MenuItem';
import ListSubheader from '@mui/material/ListSubheader';

interface StatisticsPageProps {
  products: Product[];
  devMode: boolean;
}

interface DailyStats {
  date: string;
  transaction_count: number;
  total_revenue: number;
  total_items: number;
}

interface CategoryStats {
  categories: string;
  count: number;
  revenue: number;
}

interface ProductStats {
  product: Product;
  count: number;
  revenue: number;
}

interface CartTransaction {
  id: number;
  transaction_date: string;
  total_amount: number;
  items_count: number;
  items_data: string;
  payment_method: string;
}

const StatisticsPage: React.FC<StatisticsPageProps> = ({ products, devMode }) => {
  const { t } = useLanguage();
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [topProducts, setTopProducts] = useState<ProductStats[]>([]);
  const [sortBy, setSortBy] = useState<'revenue' | 'units'>('revenue');
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [allProductStats, setAllProductStats] = useState<ProductStats[]>([]);
  const [transactions, setTransactions] = useState<CartTransaction[]>([]);
  const [signersDialogOpen, setSignersDialogOpen] = useState(false);
  const [salesDialogOpen, setSalesDialogOpen] = useState(false);
  const [signers, setSigners] = useState([
    { name: 'Test Isim', surname: 'Test Soyisim' },
    { name: 'Test Isim', surname: 'Test Soyisim' },
    { name: 'Test Isim', surname: 'Test Soyisim' },
  ]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<CartTransaction | null>(null);
  const [expandedTxId, setExpandedTxId] = useState<number | null>(null);
  const { kursName } = useVariableContext();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<CartTransaction | null>(null);
  const [editItems, setEditItems] = useState<any[]>([]);
  const [editAddProductId, setEditAddProductId] = useState<number | null>(null);
  const [editAddProductQty, setEditAddProductQty] = useState<number>(1);

  // Move loadData outside useEffect so it can be called after deletion
  const loadData = React.useCallback(async () => {
    try {
      const [dailyStatsData, categoryStatsData, transactionsData] = await Promise.all([
        cartTransactionService.getDailyStats(),
        cartTransactionService.getCategoryStats(),
        cartTransactionService.getTransactions()
      ]);
      setDailyStats(dailyStatsData);
      if (devMode) {
        setTransactions(exampleTransactions);
        // log exampleTransactions for debugging
        console.log('Example transactions:', exampleTransactions);
        
      } else {
        setTransactions(transactionsData);
      }
      
      // Use the correct transactions array for statistics calculations
      const usedTransactions = devMode ? exampleTransactions : transactionsData;

      // Calculate revenue for each category
      const categoryStatsWithRevenue = categoryStatsData.map(stat => {
        const product = products.find(p => p.category === stat.categories);
        return {
          ...stat,
          revenue: (product?.price || 0) * stat.count
        };
      });
      
      setCategoryStats(categoryStatsWithRevenue);

      // Calculate product-level statistics
      const productStats = new Map<string, ProductStats>();
      usedTransactions.forEach(transaction => {
        try {
          const items = JSON.parse(transaction.items_data);
          items.forEach((item: any) => {
            if (item?.product?.id) {
              const product = products.find(p => p.id === item.product.id);
              if (product) {
                const existing = productStats.get(product.id);
                if (existing) {
                  existing.count += item.quantity || 0;
                  existing.revenue += (item.quantity || 0) * product.price;
                } else {
                  productStats.set(product.id, {
                    product,
                    count: item.quantity || 0,
                    revenue: (item.quantity || 0) * product.price
                  });
                }
              }
            }
          });
        } catch (error) {
          console.error('Error parsing transaction items:', error);
        }
      });

      // Convert to array and filter valid products
      const allProductsData = Array.from(productStats.values())
        .filter(stat => stat.product && stat.count > 0)
        .sort((a, b) => sortBy === 'revenue' ? b.revenue - a.revenue : b.count - a.count);

      setAllProductStats(allProductsData);
      setTopProducts(allProductsData.slice(0, 4));
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  }, [products, devMode, sortBy]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const todayStats = dailyStats[0] || { total_revenue: 0, total_items: 0, transaction_count: 0 };
  const yesterdayStats = dailyStats[1] || { total_revenue: 0, total_items: 0 };
  
  const revenueChange = yesterdayStats.total_revenue 
    ? ((todayStats.total_revenue - yesterdayStats.total_revenue) / yesterdayStats.total_revenue * 100).toFixed(1)
    : '0.0';

  const itemsChange = yesterdayStats.total_items
    ? ((todayStats.total_items - yesterdayStats.total_items) / yesterdayStats.total_items * 100).toFixed(1)
    : '0.0';

  const averageOrderValue = todayStats.transaction_count
    ? (todayStats.total_revenue / todayStats.transaction_count).toFixed(2)
    : '0.00';

  // Calculate all-time stats (sum over all used transactions)
  // const usedTransactions = devMode ? exampleTransactions : transactions;
  // const allStats = usedTransactions.reduce((acc, tx) => {
  //   acc.total_revenue += tx.total_amount;
  //   acc.total_items += tx.items_count;
  //   acc.transaction_count += 1;
  //   return acc;
  // }, { total_revenue: 0, total_items: 0, transaction_count: 0 });
  // const allAverageOrderValue = allStats.transaction_count
  //   ? (allStats.total_revenue / allStats.transaction_count).toFixed(2)
  //   : '0.00';

  return (
    <Box sx={{ p: 3 }}>
      {devMode && (
        <Typography variant="body2" color="warning.main" sx={{ mb: 2, fontWeight: 'bold' }}>
          ⚠️ Example statistics are being used (DEV MODE)
        </Typography>
      )}
      <Typography variant="h4" gutterBottom>{t('app.statistics.title')}</Typography>
      <Typography variant="body1" paragraph>
        {t('app.statistics.description')}
      </Typography>
      
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 3, mt: 3 }}>
        <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 1, position: 'relative' }}>
          <IconButton
            size="small"
            sx={{ 
                  position: 'absolute', top: 8, right: 8,
                  color: 'primary.main',
                  '&:hover': {
                    bgcolor: 'primary.light',
                    color: 'primary.dark'
                  }
                }}
            onClick={() => setSalesDialogOpen(true)}
            aria-label="Show all sales"
          >
            <GridViewIcon fontSize="small" />
          </IconButton>
          <Typography variant="h6" color="text.secondary">{t('app.statistics.todaySales')}</Typography>
          <Typography variant="h3" color="primary">{todayStats.total_revenue.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€</Typography>
        </Paper>
        
        <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography variant="h6" color="text.secondary">{t('app.statistics.itemsSold')}</Typography>
          <Typography variant="h3" color="primary">{todayStats.total_items.toLocaleString('de-DE')}</Typography>
        </Paper>

        <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography variant="h6" color="text.secondary">{t('app.statistics.averageOrder')}</Typography>
          <Typography variant="h3" color="primary">{Number(averageOrderValue).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€</Typography>
        </Paper>
      </Box>

      <Box sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h5">{t('app.statistics.topSelling')}</Typography>
            <Tooltip title={t('app.statistics.viewAll')}>
              <IconButton 
                onClick={() => setShowAllProducts(true)
                }
                sx={{ 
                  color: 'primary.main',
                  '&:hover': {
                    bgcolor: 'primary.light',
                    color: 'primary.dark'
                  }
                }}
              >
                <GridViewIcon />
              </IconButton>
            </Tooltip>
          </Box>
          <ToggleButtonGroup
            value={sortBy}
            exclusive
            onChange={(_, newValue) => newValue && setSortBy(newValue)}
            size="small"
            sx={{ 
              '& .MuiToggleButton-root': {
                textTransform: 'none',
                px: 2,
                py: 1,
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  }
                }
              }
            }}
          >
            <ToggleButton value="revenue">
              {t('app.statistics.byRevenue')}
            </ToggleButton>
            <ToggleButton value="units">
              {t('app.statistics.byUnits')}
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
        <Paper sx={{ p: 2, width: 'fit-content' }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {topProducts.length > 0 ? (
              topProducts.map((productStat) => (
                <Paper key={productStat.product.id} sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1, minWidth: '200px' }}>
                  <Typography variant="subtitle1">{productStat.product.name}</Typography>
                  <Typography variant="body2" color="text.secondary">{t('app.statistics.sold')}: {productStat.count} {t('app.statistics.units')}</Typography>
                  <Typography variant="body2" color="primary">{t('app.statistics.revenue')}: {productStat.revenue.toFixed(2)}€</Typography>
                </Paper>
              ))
            ) : (
              <Typography variant="body1" color="text.secondary" sx={{ p: 2 }}>
                {t('app.statistics.noData')}
              </Typography>
            )}
          </Box>
        </Paper>
      </Box>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>{t('app.statistics.salesByCategory')}</Typography>
        <Paper sx={{ p: 2, width: 'fit-content' }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {(() => {
              // Calculate revenue for each category from transactions
              const categoryRevenues = new Map<string, number>();
              
              // Process all transactions to get actual revenue per category
              transactions.forEach(transaction => {
                try {
                  const items = JSON.parse(transaction.items_data);
                  items.forEach((item: any) => {
                    if (item?.product?.id) {
                      const product = products.find(p => p.id === item.product.id);
                      if (product && product.category) {
                        const revenue = (item.quantity || 0) * product.price;
                        const currentRevenue = categoryRevenues.get(product.category) || 0;
                        categoryRevenues.set(product.category, currentRevenue + revenue);
                      }
                    }
                  });
                } catch (error) {
                  console.error('Error parsing transaction items:', error);
                }
              });

              // Calculate total revenue
              const totalRevenue = Array.from(categoryRevenues.values()).reduce((sum, revenue) => sum + revenue, 0);

              // Create array of category stats with correct revenue
              const categoryStatsArray = Array.from(categoryRevenues.entries());
              if (categoryStatsArray.length === 0) {
                return (
                  <Typography variant="body1" color="text.secondary" sx={{ p: 2 }}>
                    {t('app.statistics.noData')}
                  </Typography>
                );
              }
              return categoryStatsArray.map(([category, revenue]) => {
                const percentage = totalRevenue > 0 ? ((revenue / totalRevenue) * 100).toFixed(0) : '0';
                const categoryColor = category === 'food' ? 'primary' : 
                                    category === 'drink' ? 'info' : 'secondary';
                
                return (
                  <Paper key={category} sx={{ p: 2, bgcolor: `${categoryColor}.light`, color: `${categoryColor}.contrastText`, minWidth: '200px' }}>
                    <Typography variant="subtitle1">{t(`app.product.categories.${category}`)}</Typography>
                    <Typography variant="h6">{revenue.toFixed(2)}€</Typography>
                    <Typography variant="body2">{percentage}% {t('app.statistics.ofTotal')}</Typography>
                  </Paper>
                );
              });
            })()}
          </Box>
        </Paper>
      </Box>

      <Dialog 
        open={showAllProducts} 
        onClose={() => setShowAllProducts(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">{t('app.statistics.allSoldItems')}</Typography>
            <ToggleButtonGroup
              value={sortBy}
              exclusive
              onChange={(_, newValue) => newValue && setSortBy(newValue)}
              size="small"
              sx={{ 
                '& .MuiToggleButton-root': {
                  textTransform: 'none',
                  px: 2,
                  py: 1,
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    '&:hover': {
                      bgcolor: 'primary.dark',
                    }
                  }
                }
              }}
            >
              <ToggleButton value="revenue">
                {t('app.statistics.byRevenue')}
              </ToggleButton>
              <ToggleButton value="units">
                {t('app.statistics.byUnits')}
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
            gap: 2,
            p: 2
          }}>
            {allProductStats.map((productStat) => (
              <Paper 
                key={productStat.product.id} 
                sx={{ 
                  p: 2, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  boxShadow: 3,
                  gap: 1,
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'scale(1.02)',
                    boxShadow: 4
                  }
                }}
              >
                <Typography variant="subtitle1">{productStat.product.name}</Typography>
                <Typography variant="body2" color="text.secondary">{t('app.statistics.sold')}: {productStat.count} {t('app.statistics.units')}</Typography>
                <Typography variant="body2" color="primary">{t('app.statistics.revenue')}: {productStat.revenue.toFixed(2)}€</Typography>
              </Paper>
            ))}
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog open={signersDialogOpen} onClose={() => setSignersDialogOpen(false)}>
        <DialogTitle>{t('app.signers.setSigners')}</DialogTitle>
        <DialogContent>
          {signers.map((signer, idx) => (
            <Box key={idx} sx={{ display: 'flex', gap: 2, mb: 2, mt: 2, alignItems: 'center' }}>
              <TextField
                label={t('app.signers.name')}
                value={signer.name}
                onChange={e => {
                  const newSigners = [...signers];
                  newSigners[idx].name = e.target.value;
                  setSigners(newSigners);
                }}
                fullWidth
              />
              <TextField
                label={t('app.signers.surname')}
                value={signer.surname}
                onChange={e => {
                  const newSigners = [...signers];
                  newSigners[idx].surname = e.target.value;
                  setSigners(newSigners);
                }}
                fullWidth
              />
              <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                {idx === 0 ? t('app.signers.receiver') : t('app.signers.deliverer')}
              </Typography>
            </Box>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSignersDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button
            variant="contained"
            onClick={async () => {
              const transactions = await cartTransactionService.getTransactions();
              generateSummaryPDF({
                transactions,
                signers,
                kursName: kursName,
                date: new Date().toLocaleDateString('de-DE'),
              });
              setSignersDialogOpen(false);
            }}
          >
            {t('app.signers.generate')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={salesDialogOpen} onClose={() => setSalesDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>{t('app.statistics.totalSales')}</DialogTitle>
        <DialogContent>
          {transactions && transactions.length > 0 ? (
            <Box>
              {/* Group transactions by date */}
              {Object.entries(
                transactions.reduce((acc, tx) => {
                  const date = new Date(tx.transaction_date).toLocaleDateString('de-DE');
                  if (!acc[date]) acc[date] = [];
                  acc[date].push(tx);
                  return acc;
                }, {} as Record<string, CartTransaction[]>)
              )
                // Sort by date descending (most recent first)
                .sort((a, b) => {
                  // Parse date strings as dd.mm.yyyy or dd/mm/yyyy or dd-mm-yyyy
                  const parse = (s: string) => {
                    const [day, month, year] = s.split(/[./-]/).map(Number);
                    return new Date(year, month - 1, day).getTime();
                  };
                  return parse(b[0]) - parse(a[0]);
                })
                .map(([date, txs]) => {
                  const totalRevenue = txs.reduce((sum, tx) => sum + tx.total_amount, 0);
                  return (
                    <Accordion key={date} defaultExpanded={txs.length > 0 && date === new Date().toLocaleDateString('de-DE')} sx={{ boxShadow: 4, mb: 0, borderRadius: 2 }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', justifyContent: 'space-between' }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mr: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                            {date}
                            <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                              {t('sales.title')}: {txs.length} 
                            </Typography>
                          </Typography>
                          <Typography variant="body2" color="" sx={{ fontWeight: 500, mr: 1 }}>{totalRevenue.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€</Typography>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails sx={{ p: 0 }}>
                        <List dense>
                          {txs
                            .slice()
                            .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())
                            .map((tx, idx) => (
                              <React.Fragment key={tx.id || idx}>
                                <ListItem alignItems="flex-start" sx={{ py: 1, px: 2 }}>
                                  {/* Expand/collapse button for transaction details */}
                                  <IconButton
                                    edge="start"
                                    size="small"
                                    aria-label={t('app.statistics.showProducts') || 'Show products'}
                                    onClick={() => setExpandedTxId(expandedTxId === tx.id ? null : tx.id)}
                                    sx={{ mr: 1 }}
                                  >
                                    <ChevronRightIcon
                                      sx={{
                                        transform: expandedTxId === tx.id ? 'rotate(90deg)' : 'rotate(0deg)',
                                        transition: 'transform 0.2s',
                                      }}
                                    />
                                  </IconButton>
                                  <ListItemIcon>
                                    {tx.payment_method && tx.payment_method.toLowerCase().includes('card') ? (
                                      <CreditCardIcon color="primary" fontSize="small" />
                                    ) : (
                                      <Euro color="primary" fontSize="small" />
                                    )}
                                  </ListItemIcon>
                                  <ListItemText
                                    primary={
                                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                                        <Typography variant="body2" sx={{ fontWeight: 500 }} color="">
                                          {t('app.statistics.revenue')}: {tx.total_amount.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                          {t('app.statistics.itemsSold')}: {tx.items_count}
                                        </Typography>
                                        <Typography variant="caption" color="text.disabled">
                                          {new Date(tx.transaction_date).toLocaleTimeString('de-DE')}
                                        </Typography>
                                      </Box>
                                    }
                                  />
                                  {/* Edit and delete buttons at the end of the list item */}
                                  <IconButton
                                    edge="end"
                                    color="primary"
                                    aria-label={t('app.statistics.editTransaction') || 'Edit Transaction'}
                                    onClick={() => {
                                      setTransactionToEdit(tx);
                                      try { setEditItems(JSON.parse(tx.items_data)); } catch { setEditItems([]); }
                                      setEditDialogOpen(true);
                                    }}
                                    sx={{  }}
                                  >
                                    <EditIcon />
                                  </IconButton>
                                  <IconButton
                                    edge="end"
                                    color="error"
                                    aria-label={t('app.statistics.deleteTransaction')}
                                    onClick={() => {
                                      setTransactionToDelete(tx);
                                      setDeleteDialogOpen(true);
                                    }}
                                    sx={{ ml: 2 }}
                                  >
                                    <DeleteForeverIcon />
                                  </IconButton>
                                </ListItem>
                                {/* Collapsible product details for this transaction */}
                                <Collapse in={expandedTxId === tx.id} timeout="auto" unmountOnExit>
                                  <Box sx={{ pl: 7, pr: 2, pb: 1 }}>
                                    <List dense disablePadding>
                                      {(() => {
                                        let items: any[] = [];
                                        try {
                                          items = JSON.parse(tx.items_data);
                                        } catch (e) {}
                                        if (!items.length) {
                                          return (
                                            <ListItem disableGutters>
                                              <Typography variant="body2" color="text.secondary">{t('app.statistics.noProducts') || 'No products'}</Typography>
                                            </ListItem>
                                          );
                                        }
                                        return items.map((item, i) => {
                                          const product = products.find(p => p.id === item.product?.id);
                                          // Choose icon based on category
                                          let icon = null;
                                          if (product && product.category) {
                                            if (product.category === 'food') {
                                              icon = <FoodBank color="info" fontSize="small" sx={{ mr: 1 }} />;
                                            } else if (product.category === 'drink') {
                                              icon = <Coffee color="info" fontSize="small" sx={{ mr: 1 }} />;
                                            } else if (product.category === 'dessert') {
                                              icon = <Cookie color="info" fontSize="small" sx={{ mr: 1 }} />;
                                            } else if (product.category === 'other') {
                                              icon = <MiscellaneousServices color="warning" fontSize="small" sx={{ mr: 1 }} />;
                                            } else {
                                              icon = <Block color="disabled" fontSize="small" sx={{ mr: 1 }} />;
                                            }
                                          } else {
                                            icon = <Block color="disabled" fontSize="small" sx={{ mr: 1 }} />;
                                          }
                                          return (
                                            <ListItem key={i} disableGutters sx={{ py: 0.5 }}>
                                              {icon}
                                              <Typography variant="body2" sx={{ minWidth: 120, fontWeight: 500 }}>
                                                {product ? product.name : (item.product?.name || t('app.statistics.unknownProduct'))}
                                              </Typography>
                                              <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                                                {t('app.statistics.quantity') || 'Qty'}: {item.quantity}
                                              </Typography>
                                              <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                                                {t('app.statistics.price') || 'Price'}: {product ? product.price.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}€
                                              </Typography>
                                              {/* <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                                                {t('app.statistics.total') || 'Total'}: {(product ? product.price * item.quantity : 0).toFixed(2)}€ 
                                              </Typography> */}
                                            </ListItem>
                                          );
                                        });
                                      })()}
                                    </List>
                                  </Box>
                                </Collapse>
                              </React.Fragment>
                            ))}
                        </List>
                      </AccordionDetails>
                    </Accordion>
                  );
                })}
            </Box>
          ) : (
            <Typography>{t('app.statistics.noData')}</Typography>
          )}
        </DialogContent>
        {/* Sum of all daily total revenues */}
        {transactions && transactions.length > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', p: 2, pt: 0, mr: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
              {t('app.statistics.totalRevenue') || 'Total Revenue'}: {transactions.reduce((sum, tx) => sum + tx.total_amount, 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€
            </Typography>
          </Box>
        )}
      </Dialog>

      {/* Delete transaction confirmation dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>{t('app.statistics.confirmDeleteTitle') || 'Delete Transaction?'}</DialogTitle>
        <DialogContent>
          <Typography>{t('app.statistics.confirmDeleteText') || 'Are you sure you want to delete this transaction?'}</Typography>
          {transactionToDelete && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2">{t('app.statistics.revenue')}: {transactionToDelete.total_amount.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€</Typography>
              <Typography variant="body2">{t('app.statistics.itemsSold')}: {transactionToDelete.items_count}</Typography>
              <Typography variant="caption" color="text.disabled">{new Date(transactionToDelete.transaction_date).toLocaleString('de-DE')}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>{t('common.cancel') || 'Cancel'}</Button>
          <Button color="error" variant="contained" onClick={async () => {
            if (transactionToDelete) {
              await cartTransactionService.deleteTransaction(transactionToDelete.id);
              await loadData();
            }
            setDeleteDialogOpen(false);
            setTransactionToDelete(null);
          }}>{t('common.delete') || 'Delete'}</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Sale Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('app.statistics.editSale') || 'Edit Sale'}</DialogTitle>
        <DialogContent>
          {/* List current products in sale */}
          <List>
            {editItems.map((item, idx) => {
              const product = products.find(p => p.id === item.product?.id);
              return (
                <ListItem key={idx} secondaryAction={
                  <>
                    <TextField
                      type="number"
                      size="small"
                      value={item.quantity}
                      inputProps={{ min: 1, style: { width: 60 } }}
                      onChange={e => {
                        const newItems = [...editItems];
                        newItems[idx].quantity = Math.max(1, Number(e.target.value));
                        setEditItems(newItems);
                      }}
                      sx={{ mr: 1 }}
                    />
                    <IconButton color="error" onClick={() => {
                      setEditItems(editItems.filter((_, i) => i !== idx));
                    }}>
                      <DeleteForeverIcon />
                    </IconButton>
                  </>
                }>
                  <Typography sx={{ minWidth: 120 }}>{product ? product.name : (item.product?.name || t('app.statistics.unknownProduct'))}</Typography>
                  <Typography sx={{ ml: 2 }}>{t('app.statistics.price')}: {product ? product.price.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}€</Typography>
                </ListItem>
              );
            })}
          </List>
          {/* Add new product */}
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, gap: 2 }}>
            <TextField
              select
              label={t('app.statistics.addProduct') || 'Add Product'}
              value={editAddProductId !== null ? String(editAddProductId) : ''}
              onChange={e => setEditAddProductId(e.target.value ? Number(e.target.value) : null)}
              sx={{ minWidth: 300 }}
            >
              <MenuItem value="">{t('app.statistics.selectProduct') || 'Select product'}</MenuItem>
              {/* Group products by category */}
              {Object.entries(
                products
                  .filter(p => !editItems.some(it => String(it.product?.id) === String(p.id)))
                  .reduce((acc, p) => {
                    acc[p.category] = acc[p.category] || [];
                    acc[p.category].push(p);
                    return acc;
                  }, {} as Record<string, Product[]>)
              ).map(([category, prods]) => [
                <ListSubheader key={category}>{t(`app.product.categories.${category}`) || category}</ListSubheader>,
                prods.map(prod => (
                  <MenuItem key={prod.id} value={prod.id}>{prod.name}</MenuItem>
                ))
              ])}
            </TextField>
            <TextField
              type="number"
              label={t('app.statistics.quantity') || 'Qty'}
              value={editAddProductQty}
              onChange={e => setEditAddProductQty(Math.max(1, Number(e.target.value)))}
              inputProps={{ min: 1, style: { width: 60 } }}
            />
            <Button
              variant="contained"
              disabled={!editAddProductId}
              onClick={() => {
                const prod = products.find(p => String(p.id) === String(editAddProductId));
                if (prod) {
                  // Check if product already exists in editItems
                  const existingIdx = editItems.findIndex(it => String(it.product?.id) === String(prod.id));
                  if (existingIdx !== -1) {
                    // If exists, increment quantity
                    const newItems = [...editItems];
                    newItems[existingIdx] = {
                      ...newItems[existingIdx],
                      quantity: newItems[existingIdx].quantity + editAddProductQty,
                      product: { id: prod.id, name: prod.name, price: prod.price, category: prod.category }
                    };
                    setEditItems(newItems);
                  } else {
                    // If not, add with full product info
                    setEditItems([
                      ...editItems,
                      { product: { id: prod.id, name: prod.name, price: prod.price, category: prod.category }, quantity: editAddProductQty }
                    ]);
                  }
                  setEditAddProductId(null);
                  setEditAddProductQty(1);
                }
              }}
            >
              {t('common.add') || 'Add'}
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button
            variant="contained"
            onClick={async () => {
              if (transactionToEdit) {
                try {
                  // Always use the latest product info for each item
                  const fixedEditItems = editItems.map(item => {
                    // Always get the full product object from products list
                    const prod = products.find(p => p.id === item.product?.id);
                    if (prod) {
                      return {
                        ...item,
                        product: {
                          id: prod.id,
                          name: prod.name,
                          price: prod.price,
                          category: prod.category,
                          description: prod.description,
                          inStock: prod.inStock
                        }
                      };
                    } else {
                      // fallback: keep whatever is there
                      return item;
                    }
                  });
                  const itemsData = JSON.stringify(fixedEditItems);
                  const itemsCount = fixedEditItems.reduce((count, item) => count + item.quantity, 0);
                  const totalAmount = fixedEditItems.reduce((sum, item) => {
                    return sum + (item.product && typeof item.product.price === 'number' ? item.product.price * item.quantity : 0);
                  }, 0);
                  // Save with the same structure as saveTransaction
                  await cartTransactionService.updateTransaction(transactionToEdit.id, {
                    items_data: itemsData,
                    items_count: itemsCount,
                    total_amount: totalAmount,
                    // Optionally update transaction_date to now, or keep original
                    // transaction_date: new Date().toISOString(),
                  });
                  await loadData();
                } catch (error) {
                  console.error('Error updating transaction:', error);
                }
              }
              setEditDialogOpen(false);
              setTransactionToEdit(null);
              setEditItems([]);
              setEditAddProductId(null);
              setEditAddProductQty(1);
            }}
          >
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Sticky action buttons at the bottom */}
      <Box sx={{
        position: 'fixed',
        right: 0,
        left: 'auto',
        bottom: 0,
        width: 'auto',
        maxWidth: { xs: '100vw', sm: 'calc(100vw - 240px)' }, // 240px for typical MUI drawer/appbar
        bgcolor: 'background.paper',
        zIndex: 1201,
        boxShadow: 8,
        py: 2,
        px: { xs: 1, sm: 4 },
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 0,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        m: 0,
      }}>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<DownloadIcon />}
            onClick={() => cartTransactionService.exportTransactionsAsCSV()}
            sx={{ fontWeight: 'bold', borderRadius: 2, boxShadow: 2 }}
          >
            {t('app.statistics.exportTransactions')}
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteForeverIcon />}
            onClick={() => cartTransactionService.clearAllTransactions()}
            sx={{ fontWeight: 'bold', borderRadius: 2, boxShadow: 2 }}
          >
            {t('app.statistics.clearDatabase')}
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            sx={{ fontWeight: 'bold', borderRadius: 2, boxShadow: 2 }}
            onClick={() => setSignersDialogOpen(true)}
          >
            {t('app.statistics.downloadSummary')}
          </Button>
        </Stack>
      </Box>
    </Box>
  );
};

export default StatisticsPage;