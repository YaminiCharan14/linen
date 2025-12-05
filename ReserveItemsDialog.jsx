import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper
} from '@mui/material';
import { inventoryService } from '../../services/inventoryService';
import CustomSnackbar from '../layout/CustomSnackbar';

const ReserveItemsDialog = ({ open, onClose, deliveryItems, customerId, orderId }) => {
  const [populatedQuantities, setPopulatedQuantities] = useState({});
  const [inventoryIdsMap, setInventoryIdsMap] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' });

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  useEffect(() => {
    if (open) {
      setPopulatedQuantities({});
      setInventoryIdsMap({});
    }
  }, [open]);

  const handlePopulateClick = async (productId, quantity) => {
    if (!customerId) {
      setSnackbar({ open: true, message: 'Customer ID is missing.', severity: 'error' });
      return;
    }

    try {
      const payload = {
        filters: [{
          productId,
          status: 'RESERVED',
          quantity
        }]
      };

      const response = await inventoryService.getCustomerInventoryItems(customerId, payload);
      const inventoryItems = response[0]?.inventoryItems || [];

      const itemIds = inventoryItems.slice(0, quantity).map(item => item.id);

      setInventoryIdsMap(prev => ({
        ...prev,
        [productId]: itemIds
      }));

      setPopulatedQuantities(prev => ({
        ...prev,
        [productId]: itemIds.length
      }));

      setSnackbar({ open: true, message: 'Quantity populated successfully.', severity: 'success' });

    } catch (error) {
      console.error('Error fetching populated quantity for product:', productId, error);
      setSnackbar({ open: true, message: 'Failed to populate quantity.', severity: 'error' });
    }
  };

  const handleReserveClick = async () => {
    if (!orderId || !deliveryItems) {
      setSnackbar({ open: true, message: 'Missing orderId or deliveryItems.', severity: 'error' });
      return;
    }

    const requestData = {
      orderId,
      items: deliveryItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        inventoryItemIds: inventoryIdsMap[item.productId] || []
      }))
    };

    try {
      const response = await inventoryService.saveOrderInventoryReservation(requestData);
      console.log('Reservation successful:', response);
      setSnackbar({ open: true, message: 'Reservation successful.', severity: 'success' });
      onClose();
    } catch (error) {
      console.error('Error saving reservation:', error);
      setSnackbar({ open: true, message: 'Failed to save reservation.', severity: 'error' });
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>Reserve Items</DialogTitle>
        <DialogContent>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell align="right">Quantity</TableCell>
                  <TableCell align="right">Populated Quantity</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(deliveryItems || []).map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.productName}</TableCell>
                    <TableCell align="right">{item.quantity}</TableCell>
                    <TableCell align="right">
                      {populatedQuantities[item.productId] !== undefined
                        ? populatedQuantities[item.productId]
                        : 'Click Populate'}
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        onClick={() =>
                          handlePopulateClick(item.productId, item.quantity)
                        }
                      >
                        Populate
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={handleReserveClick} variant="contained" color="primary">
            Reserve
          </Button>
        </DialogActions>
      </Dialog>

      <CustomSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={handleSnackbarClose}
      />
    </>
  );
};

export default ReserveItemsDialog;
