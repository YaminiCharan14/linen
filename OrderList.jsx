import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Box,
  TextField,
  InputAdornment,
  Chip,
  Drawer,
  Divider,
  Autocomplete,
  Grid,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocalShipping as DeliveryIcon,
  ShoppingBasket as PickupIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format, subDays } from 'date-fns';
import CreateOrderDialog from './CreateOrderDialog';
import OrderDetails from './OrderDetails';
import { orderService } from '../../services/orderService';
import { productService } from '../../services/productService';
import { customerService } from '../../services/customerService';
import CustomSnackbar from '../layout/CustomSnackbar';

function OrderList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [endDate, setEndDate] = useState(new Date());
  const [startDate, setStartDate] = useState(subDays(new Date(), 7));
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [openCreateOrder, setOpenCreateOrder] = useState(false);
  const [products, setProducts] = useState([]);
  const [customerOptions, setCustomerOptions] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [CustomSnackbarOpen, setCustomSnackbarOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchCustomerOptions = async (query) => {
    try {
      const data = await customerService.searchCustomersByName(query);
      setCustomerOptions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const filter = {
        startDate: startDate ? startDate.toISOString() : null,
        endDate: endDate ? endDate.toISOString() : null,
        status: null, // Add status if needed
        orderType: null, // Add orderType if needed
        customerId: selectedCustomer ? selectedCustomer.id : null, // Include customerId if a customer is selected
        branchId: null, // Add branchId if needed
      };

      const ordersData = await orderService.searchOrders(filter);
      console.log('Fetched Orders:', ordersData); // Debugging: Check the fetched data
      setOrders(ordersData);
    } catch (error) {
      setError('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(); // Initial fetch on component mount
  }, []); // Empty dependency array to run only once

  useEffect(() => {
    const fetchProducts = async () => {
      const fetchedProducts = await productService.getAllProducts();
      setProducts(fetchedProducts);
    };

    fetchProducts();
  }, []);

  const handleEditClick = (order) => {
    setSelectedOrder(null); // Close the details pane
    setDialogOpen(true);
    setSelectedOrder(order); // Set the order to be edited
  };

  const handleDelete = (id) => {
    setOrders(orders.filter(order => order.id !== id));
  };

  const handleRowClick = (order) => {
    setSelectedOrder(order);
  };

  const handleOrderUpdate = (updatedOrder) => {
    setOrders(orders.map(o =>
      o.id === updatedOrder.id ? updatedOrder : o
    ));
    setSelectedOrder(updatedOrder);
  };

  const handleCreateOrder = () => {
    setSelectedOrder(null);
    setDialogOpen(true);
  };

  const handleSaveOrder = async (orderData) => {
    try {
        if (selectedOrder) {
            // Call the updateOrder API to save changes
            const updatedOrder = await orderService.updateOrder(orderData);
            // Update the orders state with the updated order
            setOrders(orders.map(o => o.id === updatedOrder.id ? updatedOrder : o));
        } else {
            // Handle creating a new order if needed
            const newOrder = await orderService.createOrder(orderData);
            setOrders([...orders, newOrder]);
        }
        setDialogOpen(false);
        setSelectedOrder(null); // Ensure details pane remains closed
    } catch (error) {
        setErrorMessage('Failed to save order');
        setCustomSnackbarOpen(true);
    }
  };

  const handleDialogClose = () => {
    setSelectedOrder(null);
    setDialogOpen(false);
  };

  const handleDeleteOrder = async (orderId) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      try {
        await orderService.deleteOrderById(orderId);
        setOrders(orders.filter(order => order.id !== orderId));
      } catch (error) {
        setErrorMessage('Failed to delete order');
        setCustomSnackbarOpen(true);
      }
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Container>
    );
  }
  if (error) return <div>{error}</div>;

  return (
    <Container maxWidth="lg" sx={{ mb: 2 }}>
      <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
          Order Management
        </Typography>
        <Grid container spacing={2} alignItems="center" justifyContent="space-between">
          {/* Left-aligned elements */}
          <Grid item xs={12} sm={10} md={10} container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3} minWidth={200}>
              <Autocomplete
                options={customerOptions}
                getOptionLabel={(option) => option.name}
                value={selectedCustomer}
                onInputChange={(event, newInputValue) => fetchCustomerOptions(newInputValue)}
                onChange={(event, newValue) => setSelectedCustomer(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Customer Name"
                    size="small"
                    fullWidth
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={2.5}>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'small',
                    sx: {
                      backgroundColor: 'background.paper',
                      borderRadius: 1,
                    },
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={2.5}>
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'small',
                    sx: {
                      backgroundColor: 'background.paper',
                      borderRadius: 1,
                    },
                  },
                }}
              />
            </Grid>
            

               
            <Grid item xs={12} sm={6} md={2}>
              <Button
                fullWidth
                variant="contained"
                onClick={fetchOrders}
                sx={{
                  height: '40px',
                  background: 'linear-gradient(45deg, #2e7d32 30%, #43a047 90%)',
                  boxShadow: '0 2px 4px rgba(46, 125, 50, 0.25)',
                  textTransform: 'none',
                }}
              >
                Apply
              </Button>
            </Grid>
          </Grid>

          {/* Right-aligned element */}
          <Grid item xs={12} sm={2} md={2} container justifyContent="flex-end">
            <Button
              fullWidth
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateOrder}
              sx={{
                height: '40px',
                background: 'linear-gradient(45deg, #2e7d32 30%, #43a047 90%)',
                boxShadow: '0 2px 4px rgba(46, 125, 50, 0.25)',
                textTransform: 'none',
              }}
            >
              Add Order
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper} elevation={3}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ py: 1.5, backgroundColor: 'primary.lighter', fontWeight: 500 }}>Order ID</TableCell>
              <TableCell sx={{ py: 1.5, backgroundColor: 'primary.lighter', fontWeight: 500 }}>Order Reference ID</TableCell>
              <TableCell sx={{ py: 1.5, backgroundColor: 'primary.lighter', fontWeight: 500 }}>Customer Name</TableCell>
              <TableCell sx={{ py: 1.5, backgroundColor: 'primary.lighter', fontWeight: 500 }}>Ordered Date</TableCell>
              <TableCell sx={{ py: 1.5, backgroundColor: 'primary.lighter', fontWeight: 500 }}>Order Type</TableCell>
              <TableCell sx={{ py: 1.5, backgroundColor: 'primary.lighter', fontWeight: 500 }}>Status</TableCell>
              <TableCell sx={{ py: 1.5, backgroundColor: 'primary.lighter', fontWeight: 500 }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((order) => (
              <TableRow
                key={order.id}
                hover
                onClick={() => handleRowClick(order)}
                sx={{
                  cursor: 'pointer',
                  '&:nth-of-type(odd)': {
                    backgroundColor: 'background.default',
                  },
                  '& td': { py: 1 }
                }}
              >
                <TableCell>{order.id}</TableCell>
                <TableCell>{order.referenceNumber}</TableCell>
                <TableCell>{order.customerName || 'N/A'}</TableCell>
                <TableCell>{format(new Date(order.orderDate), 'dd/MM/yyyy')}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    icon={order.type === 'DELIVERY' ? <DeliveryIcon /> : <PickupIcon />}
                    label={order.orderType}
                    sx={{
                      backgroundColor:
                        order.orderType === 'DELIVERY' ? 'rgba(46, 125, 50, 0.1)' :
                          order.orderType === 'PICKUP' ? 'rgba(25, 118, 210, 0.1)' :
                            'rgba(156, 39, 176, 0.1)',
                      color:
                        order.orderType === 'DELIVERY' ? '#2e7d32' :
                          order.orderType === 'PICKUP' ? '#1976d2' :
                            '#9c27b0',
                      '& .MuiChip-icon': {
                        color: 'inherit'
                      }
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={order.status}
                    size="small"
                    color={
                      order.status === 'COMPLETED' ? 'success' :
                        order.status === 'PENDING' ? 'warning' : 'error'
                    }
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditClick(order);
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteOrder(order.id);
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {orders.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                  No orders found matching your search
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Drawer
        anchor="right"
        open={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        PaperProps={{
          elevation: 1,
          sx: {
            width: 450,
            backgroundColor: '#ffffff !important',
            boxShadow: '-4px 0 8px rgba(0, 0, 0, 0.1)',
          }
        }}
      >
        <OrderDetails
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdateOrder={handleOrderUpdate}
        />
      </Drawer>

      <CreateOrderDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        onSave={handleSaveOrder}
        order={selectedOrder}
      />
    </Container>
  );
}

export default OrderList;