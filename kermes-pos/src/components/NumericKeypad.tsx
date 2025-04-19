import React from 'react';
import { Box, Button, Typography, useTheme } from '@mui/material';

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
          {selectedQuantity > 0 ? `Quantity: ${selectedQuantity}` : 'Select Quantity'}
        </Typography>
      </Box>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 1,
        }}
      >
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => (
          <Button
            key={number}
            variant="contained"
            onClick={() => onNumberClick(number)}
            sx={{
              minWidth: 0,
              height: 50,
              fontSize: '1.2rem',
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
            height: 50,
            fontSize: '1.2rem',
            fontWeight: 'bold',
            gridColumn: '1 / -1',
          }}
        >
          Clear
        </Button>
      </Box>
    </Box>
  );
};

export default NumericKeypad; 