import React from 'react';
import {
  Box,
  Popover,
  Typography,
  Chip,
  Paper,
  LinearProgress,
  Stack,
  Divider,
  useTheme,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { PricePoint } from '../services/cartTransactionService';

interface PriceHistoryPopoverProps {
  priceHistory?: PricePoint[];
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
}

const PriceHistoryPopover: React.FC<PriceHistoryPopoverProps> = ({
  priceHistory,
  anchorEl,
  open,
  onClose,
}) => {
  const theme = useTheme();

  if (!priceHistory || priceHistory.length === 0) return null;

  const sortedPrices = [...priceHistory].sort((a, b) => a.price - b.price);
  const minPrice = sortedPrices[0].price;
  const maxPrice = sortedPrices[sortedPrices.length - 1].price;
  const totalQuantity = priceHistory.reduce((sum, p) => sum + p.quantity, 0);
  const hasPriceVariation = priceHistory.length > 1;

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'left',
      }}
    >
      <Paper
        sx={{
          p: 2.5,
          width: 320,
          backgroundColor: theme.palette.background.paper,
          boxShadow: theme.shadows[8],
          borderRadius: 2,
        }}
      >
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <TrendingUpIcon sx={{ color: 'primary.main', fontSize: 24 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main' }}>
            {hasPriceVariation ? 'Price History' : 'Single Price'}
          </Typography>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Price Range Summary */}
        <Box sx={{ mb: 2.5, p: 1.5, bgcolor: 'action.hover', borderRadius: 1.5 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
            Price Range
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mt: 0.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.main' }}>
              €{minPrice.toFixed(2)}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>to</Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'error.main' }}>
              €{maxPrice.toFixed(2)}
            </Typography>
          </Box>
          {hasPriceVariation && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" sx={{ color: 'warning.main', fontWeight: 600 }}>
                ⚡ {priceHistory.length} different price{priceHistory.length > 1 ? 's' : ''}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Price Breakdown */}
        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', mb: 1.5 }}>
          Quantity Distribution
        </Typography>

        <Stack spacing={1.5}>
          {sortedPrices.map((pricePoint, index) => {
            const percentage = (pricePoint.quantity / totalQuantity) * 100;
            const isLowest = pricePoint.price === minPrice;
            const isHighest = pricePoint.price === maxPrice;

            return (
              <Box key={index}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: isLowest ? 'success.main' : isHighest ? 'error.main' : 'primary.main',
                    }}
                  >
                    €{pricePoint.price.toFixed(2)}
                  </Typography>
                  <Chip
                    label={`${pricePoint.quantity} unit${pricePoint.quantity > 1 ? 's' : ''}`}
                    size="small"
                    variant="outlined"
                    sx={{
                      fontSize: '0.7rem',
                      height: 22,
                    }}
                  />
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={percentage}
                  sx={{
                    height: 6,
                    borderRadius: 1,
                    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 1,
                      background: isLowest
                        ? theme.palette.success.main
                        : isHighest
                        ? theme.palette.error.main
                        : theme.palette.info.main,
                    },
                  }}
                />
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem', mt: 0.25 }}>
                  {percentage.toFixed(0)}% of sales
                </Typography>
              </Box>
            );
          })}
        </Stack>

        {/* Footer Note */}
        {hasPriceVariation && (
          <>
            <Divider sx={{ my: 1.5 }} />
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                color: 'text.secondary',
                fontStyle: 'italic',
                fontSize: '0.75rem',
              }}
            >
              💡 Product price changed during this period
            </Typography>
          </>
        )}
      </Paper>
    </Popover>
  );
};

export default PriceHistoryPopover;
