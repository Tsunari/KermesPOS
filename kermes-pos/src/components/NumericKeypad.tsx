import React from 'react';
import { Box, Button, Typography, useTheme } from '@mui/material';
import { useLanguage } from '../context/LanguageContext';

interface NumericKeypadProps {
  onNumberClick: (number: number) => void;
  onClear: () => void;
  selectedQuantity: number;
}

const NumericKeypad: React.FC<NumericKeypadProps> = ({
  onNumberClick,
  onClear,
  selectedQuantity,
}) => {
  const theme = useTheme();
  const { t } = useLanguage();

  const handleNumberClick = (number: number) => {
    onNumberClick(number);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        p: 1,
        bgcolor: 'background.paper',
        borderRadius: 2,
        boxShadow: 1,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: 40,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          borderRadius: 1,
          mb: 1,
        }}
      >
        <Typography variant="h6">
          {selectedQuantity > 0 
            ? `${t('app.numpad.quantity')}: ${selectedQuantity}` 
            : t('app.numpad.selectQuantity')}
        </Typography>
      </Box>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 1,
        }}
      >
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((number) => (
          <Button
            key={number}
            variant="contained"
            onClick={() => handleNumberClick(number)}
            sx={{
              minWidth: 0,
              height: 40,
              fontSize: '1rem',
              fontWeight: 'bold',
              bgcolor: 'primary.main',
              '&:hover': {
                bgcolor: 'primary.dark',
              },
            }}
          >
            {number}
          </Button>
        ))}
        <Button
          variant="contained"
          color="error"
          onClick={onClear}
          sx={{
            minWidth: 0,
            height: 40,
            fontSize: '1rem',
            fontWeight: 'bold',
            gridColumn: '1 / -1',
          }}
        >
          {t('app.numpad.clear')}
        </Button>
      </Box>
    </Box>
  );
};

export default NumericKeypad; 