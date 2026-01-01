import React from 'react';
import { Box, ToggleButton, ToggleButtonGroup, TextField, Typography } from '@mui/material';
import { useLanguage } from '../context/LanguageContext';

export type TimeRangePreset = 'today' | 'yesterday' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'custom';

export interface TimeRange {
  startDate: Date;
  endDate: Date;
  preset: TimeRangePreset;
}

interface TimeRangePickerProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}

const getDateRange = (preset: TimeRangePreset): { startDate: Date; endDate: Date } => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case 'today':
      return {
        startDate: today,
        endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
      };
    
    case 'yesterday': {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return {
        startDate: yesterday,
        endDate: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1)
      };
    }
    
    case 'thisWeek': {
      // Start from Monday
      const dayOfWeek = today.getDay();
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Sunday = 0, Monday = 1
      const monday = new Date(today);
      monday.setDate(monday.getDate() + diff);
      return {
        startDate: monday,
        endDate: new Date()
      };
    }
    
    case 'lastWeek': {
      const dayOfWeek = today.getDay();
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const thisMonday = new Date(today);
      thisMonday.setDate(thisMonday.getDate() + diff);
      const lastMonday = new Date(thisMonday);
      lastMonday.setDate(lastMonday.getDate() - 7);
      const lastSunday = new Date(thisMonday);
      lastSunday.setDate(lastSunday.getDate() - 1);
      lastSunday.setHours(23, 59, 59, 999);
      return {
        startDate: lastMonday,
        endDate: lastSunday
      };
    }
    
    case 'thisMonth': {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      return {
        startDate: firstDay,
        endDate: new Date()
      };
    }
    
    case 'lastMonth': {
      const firstDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastDayLastMonth = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);
      return {
        startDate: firstDayLastMonth,
        endDate: lastDayLastMonth
      };
    }
    
    default:
      return {
        startDate: today,
        endDate: new Date()
      };
  }
};

const TimeRangePicker: React.FC<TimeRangePickerProps> = ({ value, onChange }) => {
  const { t } = useLanguage();

  const handlePresetChange = (event: React.MouseEvent<HTMLElement>, newPreset: TimeRangePreset | null) => {
    if (newPreset === null) return;
    
    const range = getDateRange(newPreset);
    onChange({
      ...range,
      preset: newPreset
    });
  };

  const handleCustomDateChange = (type: 'start' | 'end', dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return;

    if (type === 'start') {
      date.setHours(0, 0, 0, 0);
      onChange({
        startDate: date,
        endDate: value.endDate,
        preset: 'custom'
      });
    } else {
      date.setHours(23, 59, 59, 999);
      onChange({
        startDate: value.startDate,
        endDate: date,
        preset: 'custom'
      });
    }
  };

  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
          {t('app.statistics.timePeriod') || 'Time Period'}
        </Typography>
        <ToggleButtonGroup
          value={value.preset}
          exclusive
          onChange={handlePresetChange}
          size="small"
          sx={{
            flexWrap: 'wrap',
            gap: 0.5,
            '& .MuiToggleButton-root': {
              textTransform: 'none',
              px: 2,
              py: 0.5,
              fontSize: '0.875rem'
            }
          }}
        >
          <ToggleButton value="today">
            {t('app.statistics.today') || 'Today'}
          </ToggleButton>
          <ToggleButton value="yesterday">
            {t('app.statistics.yesterday') || 'Yesterday'}
          </ToggleButton>
          <ToggleButton value="thisWeek">
            {t('app.statistics.thisWeek') || 'This Week'}
          </ToggleButton>
          <ToggleButton value="lastWeek">
            {t('app.statistics.lastWeek') || 'Last Week'}
          </ToggleButton>
          <ToggleButton value="thisMonth">
            {t('app.statistics.thisMonth') || 'This Month'}
          </ToggleButton>
          <ToggleButton value="lastMonth">
            {t('app.statistics.lastMonth') || 'Last Month'}
          </ToggleButton>
          <ToggleButton value="custom">
            {t('app.statistics.customRange') || 'Custom'}
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {value.preset === 'custom' && (
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            label={t('app.statistics.from') || 'From'}
            type="date"
            size="small"
            value={formatDateForInput(value.startDate)}
            onChange={(e) => handleCustomDateChange('start', e.target.value)}
            InputLabelProps={{
              shrink: true,
            }}
            sx={{ flex: 1, minWidth: 150 }}
          />
          <TextField
            label={t('app.statistics.to') || 'To'}
            type="date"
            size="small"
            value={formatDateForInput(value.endDate)}
            onChange={(e) => handleCustomDateChange('end', e.target.value)}
            InputLabelProps={{
              shrink: true,
            }}
            sx={{ flex: 1, minWidth: 150 }}
          />
        </Box>
      )}
    </Box>
  );
};

export default TimeRangePicker;
