import { alpha } from '@mui/material/styles';

export const getCategoryStyle = (category: string, theme: any) => {
  switch (category.toLowerCase()) {
    case 'food':
      return {
        bgColor: alpha(theme.palette.primary.main, 0.05),
        borderColor: theme.palette.primary.main,
        name: 'Food',
        icon: '🍽️',
      };
    case 'drink':
      return {
        bgColor: alpha(theme.palette.info.main, 0.05),
        borderColor: theme.palette.info.main,
        name: 'Drinks',
        icon: '🥤',
      };
    case 'dessert':
      return {
        bgColor: alpha(theme.palette.secondary.main, 0.05),
        borderColor: theme.palette.secondary.main,
        name: 'Desserts',
        icon: '🍰',
      };
    default:
      return {
        bgColor: alpha(theme.palette.grey[500], 0.05),
        borderColor: theme.palette.grey[500],
        name: 'Other',
        icon: '📦',
      };
  }
};