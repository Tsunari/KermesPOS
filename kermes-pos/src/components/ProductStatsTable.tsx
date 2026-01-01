import React, { useState } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Paper,
  Typography,
  Chip,
  TextField,
  MenuItem,
  InputAdornment
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import RemoveIcon from '@mui/icons-material/Remove';
import { useLanguage } from '../context/LanguageContext';
import { ProductStats } from '../services/cartTransactionService';
import PriceHistoryPopover from './PriceHistoryPopover';

type SortField = 'name' | 'quantity' | 'revenue';
type SortOrder = 'asc' | 'desc';

interface ProductStatsTableProps {
  productStats: ProductStats[];
  previousPeriodStats?: ProductStats[];
  showComparison?: boolean;
}

const ProductStatsTable: React.FC<ProductStatsTableProps> = ({
  productStats,
  previousPeriodStats = [],
  showComparison = false
}) => {
  const { t } = useLanguage();
  const [sortField, setSortField] = useState<SortField>('revenue');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priceHistoryAnchor, setPriceHistoryAnchor] = useState<HTMLElement | null>(null);
  const [selectedProductPriceHistory, setSelectedProductPriceHistory] = useState<any>(null);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const getComparisonData = (productId: string) => {
    if (!showComparison || !previousPeriodStats.length) return null;
    
    const current = productStats.find(p => p.product.id === productId);
    const previous = previousPeriodStats.find(p => p.product.id === productId);
    
    if (!current || !previous) return null;
    
    const revenueChange = ((current.revenue - previous.revenue) / previous.revenue) * 100;
    const quantityChange = ((current.count - previous.count) / previous.count) * 100;
    
    return { revenueChange, quantityChange };
  };

  const renderTrend = (change: number) => {
    if (change === 0 || isNaN(change) || !isFinite(change)) {
      return <RemoveIcon fontSize="small" sx={{ color: 'text.disabled' }} />;
    }
    if (change > 0) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'success.main' }}>
          <TrendingUpIcon fontSize="small" />
          <Typography variant="caption" sx={{ fontWeight: 600 }}>
            +{change.toFixed(1)}%
          </Typography>
        </Box>
      );
    }
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'error.main' }}>
        <TrendingDownIcon fontSize="small" />
        <Typography variant="caption" sx={{ fontWeight: 600 }}>
          {change.toFixed(1)}%
        </Typography>
      </Box>
    );
  };

  // Filter and sort
  let filteredStats = productStats.filter(stat => {
    const matchesSearch = stat.product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || stat.product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  filteredStats = filteredStats.sort((a, b) => {
    let aValue: number | string;
    let bValue: number | string;

    switch (sortField) {
      case 'name':
        aValue = a.product.name.toLowerCase();
        bValue = b.product.name.toLowerCase();
        break;
      case 'quantity':
        aValue = a.count;
        bValue = b.count;
        break;
      case 'revenue':
      default:
        aValue = a.revenue;
        bValue = b.revenue;
        break;
    }

    if (sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  const totalRevenue = filteredStats.reduce((sum, stat) => sum + stat.revenue, 0);
  const totalQuantity = filteredStats.reduce((sum, stat) => sum + stat.count, 0);

  return (
    <Box>
      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder={t('app.statistics.searchProduct') || 'Search product...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ flex: 1, minWidth: 200 }}
        />
        <TextField
          select
          size="small"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="all">{t('app.statistics.allCategories') || 'All Categories'}</MenuItem>
          <MenuItem value="food">{t('app.categories.food') || 'Food'}</MenuItem>
          <MenuItem value="drink">{t('app.categories.drink') || 'Drink'}</MenuItem>
          <MenuItem value="dessert">{t('app.categories.dessert') || 'Dessert'}</MenuItem>
        </TextField>
      </Box>

      {/* Table */}
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'name'}
                  direction={sortField === 'name' ? sortOrder : 'asc'}
                  onClick={() => handleSort('name')}
                >
                  {t('app.statistics.product') || 'Product'}
                </TableSortLabel>
              </TableCell>
              <TableCell>
                {t('app.statistics.category') || 'Category'}
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={sortField === 'quantity'}
                  direction={sortField === 'quantity' ? sortOrder : 'asc'}
                  onClick={() => handleSort('quantity')}
                >
                  {t('app.statistics.qtySold') || 'Qty Sold'}
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={sortField === 'revenue'}
                  direction={sortField === 'revenue' ? sortOrder : 'asc'}
                  onClick={() => handleSort('revenue')}
                >
                  {t('app.statistics.revenue') || 'Revenue'}
                </TableSortLabel>
              </TableCell>
              {showComparison && (
                <TableCell align="center">
                  {t('app.statistics.trend') || 'Trend'}
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredStats.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showComparison ? 5 : 4} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                    {t('app.statistics.noData') || 'No data found'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredStats.map((stat) => {
                const comparison = getComparisonData(stat.product.id);
                return (
                  <TableRow key={stat.product.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {stat.product.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={stat.product.category}
                        size="small"
                        sx={{
                          textTransform: 'capitalize',
                          fontSize: '0.75rem',
                          height: 20
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {stat.count.toLocaleString('de-DE')}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          gap: 1,
                          cursor: stat.priceHistory && stat.priceHistory.length > 1 ? 'pointer' : 'default',
                        }}
                        onClick={(e) => {
                          if (stat.priceHistory && stat.priceHistory.length > 1) {
                            setPriceHistoryAnchor(e.currentTarget as HTMLElement);
                            setSelectedProductPriceHistory(stat.priceHistory);
                          }
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {stat.revenue.toLocaleString('de-DE', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}€
                        </Typography>
                        {stat.priceHistory && stat.priceHistory.length > 1 && (
                          <Chip
                            label={`${stat.priceHistory.length} prices`}
                            size="small"
                            variant="outlined"
                            sx={{
                              fontSize: '0.7rem',
                              height: 20,
                              borderColor: 'info.main',
                              color: 'info.main',
                              fontWeight: 600,
                              '&:hover': {
                                backgroundColor: 'info.light',
                                color: 'info.dark',
                                borderColor: 'info.dark',
                              },
                            }}
                          />
                        )}
                      </Box>
                    </TableCell>
                    {showComparison && (
                      <TableCell align="center">
                        {comparison ? renderTrend(comparison.revenueChange) : '-'}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Summary */}
      {filteredStats.length > 0 && (
        <Box
          sx={{
            mt: 2,
            p: 2,
            bgcolor: 'action.hover',
            borderRadius: 1,
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2
          }}
        >
          <Box>
            <Typography variant="caption" color="text.secondary">
              {t('app.statistics.totalProducts') || 'Total Products'}
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {filteredStats.length}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              {t('app.statistics.totalQuantity') || 'Total Quantity'}
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
              {totalQuantity.toLocaleString('de-DE')}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              {t('app.statistics.totalRevenue') || 'Total Revenue'}
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.main' }}>
              {totalRevenue.toLocaleString('de-DE', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}€
            </Typography>
          </Box>
        </Box>
      )}

      {/* Price History Popover */}
      <PriceHistoryPopover
        priceHistory={selectedProductPriceHistory}
        anchorEl={priceHistoryAnchor}
        open={!!priceHistoryAnchor}
        onClose={() => {
          setPriceHistoryAnchor(null);
          setSelectedProductPriceHistory(null);
        }}
      />
    </Box>
  );
};

export default ProductStatsTable;
