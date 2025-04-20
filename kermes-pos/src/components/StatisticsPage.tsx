import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { useLanguage } from '../contexts/LanguageContext';
import { Product } from '../types/index';
import { cartTransactionService } from '../services/cartTransactionService';

interface StatisticsPageProps {
  products: Product[];
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

const StatisticsPage: React.FC<StatisticsPageProps> = ({ products }) => {
  const { t } = useLanguage();
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [topProducts, setTopProducts] = useState<ProductStats[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [dailyStatsData, categoryStatsData] = await Promise.all([
          cartTransactionService.getDailyStats(),
          cartTransactionService.getCategoryStats()
        ]);
        
        setDailyStats(dailyStatsData);
        
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
        
        // Get all transactions to analyze product-level sales
        const transactions = await cartTransactionService.getTransactions();
        
        // Process each transaction to get product-level stats
        transactions.forEach(transaction => {
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

        // Convert to array, sort by revenue, and take top 4
        const topProductsData = Array.from(productStats.values())
          .filter(stat => stat.product && stat.count > 0) // Only include products that exist and have sales
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 4);

        setTopProducts(topProductsData);
      } catch (error) {
        console.error('Error loading statistics:', error);
      }
    };

    loadData();
  }, [products]);

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

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>{t('app.statistics.title')}</Typography>
      <Typography variant="body1" paragraph>
        {t('app.statistics.description')}
      </Typography>
      
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 3, mt: 3 }}>
        <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography variant="h6" color="text.secondary">{t('app.statistics.todaySales')}</Typography>
          <Typography variant="h3" color="primary">{todayStats.total_revenue.toFixed(2)}€</Typography>
          <Typography variant="body2" color="text.secondary">+{revenueChange}% {t('app.statistics.fromYesterday')}</Typography>
        </Paper>
        
        <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography variant="h6" color="text.secondary">{t('app.statistics.itemsSold')}</Typography>
          <Typography variant="h3" color="primary">{todayStats.total_items}</Typography>
          <Typography variant="body2" color="text.secondary">{t('app.statistics.average')}: {Math.round(todayStats.total_items / (todayStats.transaction_count || 1))} {t('app.statistics.itemsPerDay')}</Typography>
        </Paper>
        
        <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography variant="h6" color="text.secondary">{t('app.statistics.averageOrder')}</Typography>
          <Typography variant="h3" color="primary">{averageOrderValue}€</Typography>
          <Typography variant="body2" color="text.secondary">+{itemsChange}% {t('app.statistics.fromYesterday')}</Typography>
        </Paper>
      </Box>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>{t('app.statistics.topSelling')}</Typography>
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
            {categoryStats.map((stat) => {
              const totalRevenue = categoryStats.reduce((sum, s) => sum + (s.revenue || 0), 0);
              const percentage = totalRevenue > 0 ? ((stat.revenue || 0) / totalRevenue * 100).toFixed(0) : '0';
              const categoryColor = stat.categories === 'food' ? 'primary' : 
                                  stat.categories === 'drink' ? 'info' : 'secondary';
              
              return (
                <Paper key={stat.categories} sx={{ p: 2, bgcolor: `${categoryColor}.light`, color: `${categoryColor}.contrastText`, minWidth: '200px' }}>
                  <Typography variant="subtitle1">{t(`app.product.categories.${stat.categories}`)}</Typography>
                  <Typography variant="h6">{(stat.revenue || 0).toFixed(2)}€</Typography>
                  <Typography variant="body2">{percentage}% {t('app.statistics.ofTotal')}</Typography>
                </Paper>
              );
            })}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default StatisticsPage; 