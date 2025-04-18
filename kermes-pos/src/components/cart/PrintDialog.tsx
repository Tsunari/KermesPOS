import React from 'react';
import { 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button
} from '@mui/material';

interface PrintDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const PrintDialog: React.FC<PrintDialogProps> = ({ open, onClose, onConfirm }) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Print Receipt</DialogTitle>
      <DialogContent>
        <Typography>
          Are you sure you want to print the receipt?
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onConfirm} variant="contained" color="primary">
          Print
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PrintDialog; 