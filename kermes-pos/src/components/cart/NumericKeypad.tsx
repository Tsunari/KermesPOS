import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useLanguage } from '../../context/LanguageContext';
import ModernSwitch from '../ui/ModernSwitch';
import SettingsIcon from '@mui/icons-material/Settings';
import ReactDOM from 'react-dom';

interface NumericKeypadProps {
  onNumberClick: (number: number) => void;
  onClear: () => void;
  selectedQuantity: number;
  separateAdditionEnabled: boolean;
  onSeparateAdditionToggle: (enabled: boolean) => void;
  productTapSeparateEnabled: boolean;
  onProductTapSeparateToggle: (enabled: boolean) => void;
}

const NumericKeypad: React.FC<NumericKeypadProps> = ({
  onNumberClick,
  onClear,
  selectedQuantity,
  separateAdditionEnabled,
  onSeparateAdditionToggle,
  productTapSeparateEnabled,
  onProductTapSeparateToggle,
}) => {
  const { t } = useLanguage();
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const settingsButtonRef = React.useRef<HTMLButtonElement>(null);

  const handleNumberClick = (number: number) => {
    onNumberClick(number);
  };

  const handleSwitchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onSeparateAdditionToggle(event.target.checked);
  };

  const handleProductTapSwitchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onProductTapSeparateToggle(event.target.checked);
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
        boxShadow: 3,
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
          position: 'relative',
        }}
      >
        <Typography variant="h6">
          {selectedQuantity > 0 
            ? `${t('app.numpad.quantity')}: ${selectedQuantity}` 
            : t('app.numpad.selectQuantity')}
        </Typography>
        <Button
          ref={settingsButtonRef}
          variant="contained"
          color="primary"
          onClick={() => setSettingsOpen(o => !o)}
          sx={{
            position: 'absolute',
            right: 8,
            minWidth: 32,
            minHeight: 32,
            width: 32,
            height: 32,
            borderRadius: 2,
            p: 0,
            background: settingsOpen
              ? 'rgba(255, 255, 255, 0.2)'
              : 'rgba(255, 255, 255, 0.1)',
            color: 'primary.contrastText',
            boxShadow: 'none',
            border: 'none',
            outline: 'none',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            '&:hover': {
              background: 'rgba(255, 255, 255, 0.3)',
              boxShadow: 2,
            },
          }}
        >
          <SettingsIcon fontSize="small" />
        </Button>
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

      {/* Settings Side Panel */}
      {settingsOpen && typeof window !== 'undefined' && settingsButtonRef.current &&
        ReactDOM.createPortal(
          <Box
            sx={{
              position: 'fixed',
              top: settingsButtonRef.current ? Math.max(20, settingsButtonRef.current.getBoundingClientRect().top - 100) : 20,
              left: settingsButtonRef.current ? settingsButtonRef.current.getBoundingClientRect().right + 12 : 200,
              zIndex: 2000,
              width: 300,
              maxWidth: '90vw',
              boxShadow: 6,
              p: 2,
              bgcolor: 'background.paper',
              borderRadius: 3,
              minWidth: 250,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              border: '1px solid',
              borderColor: 'primary.light',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <SettingsIcon color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {t('app.numpad.settings') || 'Settings'}
              </Typography>
            </Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 2,
                bgcolor: 'background.default',
                borderRadius: 1,
              }}
            >
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                  {t('app.numpad.quantitySeparate') || 'Quantity Selection Separate'}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                  {t('app.numpad.quantitySeparateTooltip') || 'When enabled, quantity selection creates separate cart items. When disabled, quantities are merged with existing items.'}
                </Typography>
              </Box>
              <ModernSwitch
                checked={separateAdditionEnabled}
                onChange={handleSwitchChange}
              />
            </Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 2,
                bgcolor: 'background.default',
                borderRadius: 1,
              }}
            >
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                  {t('app.numpad.productTapSeparate') || 'Product Tap Separate'}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                  {t('app.numpad.productTapSeparateTooltip') || 'When enabled, tapping product cards creates separate cart items. When disabled, quantities are merged.'}
                </Typography>
              </Box>
              <ModernSwitch
                checked={productTapSeparateEnabled}
                onChange={handleProductTapSwitchChange}
              />
            </Box>
          </Box>,
          document.body
        )
      }
    </Box>
  );
};

export default NumericKeypad; 