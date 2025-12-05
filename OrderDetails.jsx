import React from 'react';
import {
    Box,
    Typography,
    IconButton,
    List,
    ListItem,
    ListItemText,
    Divider,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    Button
} from '@mui/material';
import {
    Close as CloseIcon,
    LocalShipping as DeliveryIcon,
    ShoppingBasket as PickupIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import ReserveItemsDialog from './ReserveItemsDialog';
import RejectItemsDialog from "./RejectItemsDialog";
import { orderService } from "../../services/orderService";


function OrderDetails({ order, onClose }) {
    const [reserveDialogOpen, setReserveDialogOpen] = React.useState(false);
    const [rejectDialogOpen,setRejectDialogOpen]=React.useState(false);
    console.log(order)
    if (!order) return null;

    const customerId = order.customerId; // Extract customerId from order

    // Helper function to safely parse dates
    const parseDate = (dateString) => {
        if (!dateString) return null;
        try {
            const date = new Date(dateString);
            return isNaN(date.getTime()) ? null : date;
        } catch (error) {
            return null;
        }
    };

    // Helper function to safely format dates for display
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = parseDate(dateString);
        if (!date) return dateString;
        return format(date, 'dd/MM/yyyy');
    };

    // Calculate costs
    const calculateItemsCost = (items) => {
        return (items || []).reduce((sum, item) => sum + (item.quantity * (item.unitPrice || 0)), 0);
    };

    const handleCompleteOrder = async () => {
        try {
            const now = new Date().toISOString();
            await orderService.recordCompleteOrder(order.referenceNumber, now);
            alert("Order marked as completed successfully!");

            // Optional: update local state or call a prop like onUpdateOrder()
            if (onClose) onClose(); // Close the drawer if needed
        } catch (error) {
            alert("Failed to complete the order.");
        }
    };

    const leasingDetails = order.leasingOrderDetails || {};
    const rentalDetails = order.rentalOrderDetails || {};
    const washingDetails = order.washingOrderDetails || {};
    const deliveryTotal = calculateItemsCost(leasingDetails.deliveryItems);
    const pickupTotal = calculateItemsCost(leasingDetails.pickupItems);
    const subtotal = deliveryTotal + pickupTotal;
    const gst = subtotal * 0.18; // Assuming 18% GST
    const total = subtotal + gst;

    return (
        <Box sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#ffffff',
        }}>
            <Box sx={{
                p: 2,
                px: 3,
                borderBottom: 1,
                borderColor: '#e0e0e0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#ffffff',
            }}>
                <Typography
                    variant="h6"
                    sx={{
                        fontSize: '1.125rem',
                        fontWeight: 600,
                        color: '#1a1a1a'
                    }}
                >
                    Order Details
                </Typography>
                <IconButton
                    onClick={onClose}
                    size="small"
                    sx={{
                        color: '#757575',
                        '&:hover': {
                            backgroundColor: 'rgba(0, 0, 0, 0.04)',
                        },
                    }}
                >
                    <CloseIcon />
                </IconButton>

            </Box>

            <Box sx={{
                flexGrow: 1,
                overflow: 'auto',
                backgroundColor: '#ffffff',
                px: 3,
                py: 2,
            }}>
                <List disablePadding sx={{ backgroundColor: '#ffffff' }}>
                    {/* Basic Order Information */}
                    <ListItem>
                        <ListItemText
                            primary={
                                <Typography variant="subtitle1" sx={{ color: '#2e7d32', fontWeight: 500, mb: 1 }}>
                                    Order Information
                                </Typography>
                            }
                            secondary={
                                <Box sx={{ mt: 1 }}>
                                    <Typography variant="body2" color="text.primary" sx={{ mb: 0.5 }}>
                                        <strong>Reference Number:</strong> {order.referenceNumber}
                                    </Typography>
                                    <Typography variant="body2" color="text.primary" sx={{ mb: 0.5 }}>
                                        <strong>Customer Name:</strong> {order.customerName}
                                    </Typography>
                                    <Typography variant="body2" color="text.primary" sx={{ mb: 0.5 }}>
                                        <strong>Ordered Date:</strong> {formatDate(order.orderDate)}
                                    </Typography>
                                    <Typography variant="body2" color="text.primary" sx={{ mb: 0.5 }}>
                                        <strong>Type:</strong>{' '}
                                        <Chip
                                            size="small"
                                            icon={order.orderType === 'DELIVERY' ? <DeliveryIcon /> : <PickupIcon />}
                                            label={order.orderType}
                                            sx={{ ml: 1 }}
                                        />
                                    </Typography>
                                    <Typography variant="body2" color="text.primary">
                                        <strong>Status:</strong>{' '}
                                        <Chip
                                            label={order.status}
                                            size="small"
                                            color={
                                                order.status === 'COMPLETED' ? 'success' :
                                                    order.status === 'PENDING' ? 'warning' : 'error'
                                            }
                                            sx={{ ml: 1 }}
                                        />
                                    </Typography>
                                    {order.orderType === 'LEASING' && (
                                        <>
                                            {leasingDetails.pickupDate && (
                                                <Typography variant="body2" color="text.primary" sx={{ mb: 0.5 }}>
                                                    <strong>Pickup Date:</strong> {formatDate(leasingDetails.pickupDate)}
                                                </Typography>
                                            )}
                                            {leasingDetails.deliveryDate && (
                                                <Typography variant="body2" color="text.primary" sx={{ mb: 0.5 }}>
                                                    <strong>Delivery Date:</strong> {formatDate(leasingDetails.deliveryDate)}
                                                </Typography>
                                            )}
                                        </>
                                    )}

                                    {order.orderType === 'RENTAL' && (
                                        <>
                                            {rentalDetails.deliveryDate && (
                                                <Typography variant="body2" color="text.primary" sx={{ mb: 0.5 }}>
                                                    <strong>Delivery Date:</strong> {formatDate(rentalDetails.deliveryDate)}
                                                </Typography>
                                            )}
                                        </>
                                    )}

                                    {order.orderType === 'WASHING' && (
                                        <>
                                            {washingDetails.pickupDate && (
                                                <Typography variant="body2" color="text.primary" sx={{ mb: 0.5 }}>
                                                    <strong>Pickup Date:</strong> {formatDate(washingDetails.pickupDate)}
                                                </Typography>
                                            )}
                                            {washingDetails.deliveryDate && (
                                                <Typography variant="body2" color="text.primary" sx={{ mb: 0.5 }}>
                                                    <strong>Delivery Date:</strong> {formatDate(washingDetails.deliveryDate)}
                                                </Typography>
                                            )}
                                        </>
                                    )}



                                </Box>
                            }
                        />
                    </ListItem>

                    <Divider />

                    {/* Leasing Order Details */}
                    {order.orderType === 'LEASING' && (
                        <>

                            {/* Delivery Items */}
                            {(leasingDetails.deliveryItems || []).length > 0 && (
                                <>
                                    <ListItem>
                                        <ListItemText
                                            primary={
                                               <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
    <DeliveryIcon sx={{ mr: 1, color: '#2e7d32' }} />
    <Typography variant="subtitle1" sx={{ color: '#2e7d32', fontWeight: 500 }}>
        Delivery Items
    </Typography>

    <Box sx={{ flexGrow: 1 }} />

    <Button
        variant="contained"
        onClick={() => setReserveDialogOpen(true)}
        sx={{
            background: 'linear-gradient(45deg, #2e7d32 30%, #43a047 90%)',
            boxShadow: '0 2px 4px rgba(46, 125, 50, 0.25)',
            textTransform: 'none',
            mr: 1
        }}
    >
        Reserve Items
    </Button>

    <Button
        variant="contained"
        sx={{
            background: 'linear-gradient(45deg, #d32f2f 30%, #f44336 90%)',
            boxShadow: '0 2px 4px rgba(211, 47, 47, 0.25)',
            textTransform: 'none',
            '&:hover': {
                background: 'linear-gradient(45deg, #b71c1c 30%, #e53935 90%)'
            }
        }}
        onClick={() => setRejectDialogOpen(true)} 
    >
        Reject
    </Button>
</Box>

                                                
                                            }
                                            secondary={
                                                <TableContainer component={Paper} variant="outlined">
                                                    <Table size="small">
                                                        <TableHead>
                                                            <TableRow>
                                                                <TableCell sx={{ fontWeight: 500 }}>Product</TableCell>
                                                                <TableCell align="right" sx={{ fontWeight: 500 }}>Quantity</TableCell>
                                                            </TableRow>
                                                        </TableHead>
                                                        <TableBody>
                                                            {(leasingDetails.deliveryItems || []).map((item, index) => (
                                                                <TableRow key={index}>
                                                                    <TableCell>{item.productName}</TableCell>
                                                                    <TableCell align="right">{item.quantity}</TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </TableContainer>
                                            }
                                        />
                                    </ListItem>
                                    <Divider />
                                </>
                            )}

                            {/* Pickup Items */}
                            {(leasingDetails.pickupItems || []).length > 0 && (
                                <ListItem>
                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                <PickupIcon sx={{ mr: 1, color: '#2e7d32' }} />
                                                <Typography variant="subtitle1" sx={{ color: '#2e7d32', fontWeight: 500 }}>
                                                    Pickup Items
                                                </Typography>
                                            </Box>
                                        }
                                        secondary={
                                            <TableContainer component={Paper} variant="outlined">
                                                <Table size="small">
                                                    <TableHead>
                                                        <TableRow>
                                                            <TableCell sx={{ fontWeight: 500 }}>Product</TableCell>
                                                            <TableCell align="right" sx={{ fontWeight: 500 }}>Quantity</TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {(leasingDetails.pickupItems || []).map((item, index) => (
                                                            <TableRow key={index}>
                                                                <TableCell>{item.productName}</TableCell>
                                                                <TableCell align="right">{item.quantity}</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        }
                                    />
                                </ListItem>
                            )}

                            {/* Fulfillment Details */}
                            <ListItem>
                                <ListItemText
                                    primary={
                                        <Typography variant="subtitle1" sx={{ color: '#2e7d32', fontWeight: 500, mb: 1 }}>
                                            Fulfillment Details
                                        </Typography>
                                    }
                                    secondary={
                                        <Box>
                                            {leasingDetails.orderFulfillment && (
                                                <Box sx={{ mb: 2 }}>
                                                    <Typography variant="body2">
                                                        <strong>Order Fulfillment ID:</strong> {leasingDetails.orderFulfillment.id}
                                                    </Typography>
                                                    <Typography variant="body2">
                                                        <strong>Status:</strong> {leasingDetails.orderFulfillment.status}
                                                    </Typography>
                                                    <Typography variant="body2">
                                                        <strong>Start Date:</strong> {formatDate(leasingDetails.orderFulfillment.fulfillmentStartDate)}
                                                    </Typography>
                                                    <Typography variant="body2">
                                                        <strong>Completion Date:</strong>{' '}
                                                        {formatDate(leasingDetails.orderFulfillment.fulfillmentCompletionDate) || 'N/A'}
                                                    </Typography>
                                                </Box>
                                            )}
                                            {leasingDetails.pickupFulfillment && (
                                                <Box>
                                                    <Typography variant="body2">
                                                        <strong>Pickup Fulfillment ID:</strong> {leasingDetails.pickupFulfillment.id}
                                                    </Typography>
                                                    <Typography variant="body2">
                                                        <strong>Status:</strong> {leasingDetails.pickupFulfillment.status}
                                                    </Typography>
                                                    <Typography variant="body2">
                                                        <strong>Pickup Date:</strong> {formatDate(leasingDetails.pickupFulfillment.pickupDate)}
                                                    </Typography>
                                                </Box>
                                            )}
                                        </Box>
                                    }
                                />
                            </ListItem>
                        </>
                    )}

                    {order.orderType === 'RENTAL' && (
                        <>



                            {/* Rental Items */}
                            {(rentalDetails.items || []).length > 0 && (
                                <>
                                    <ListItem>
                                        <ListItemText
                                            primary={
                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                    <DeliveryIcon sx={{ mr: 1, color: '#2e7d32' }} />
                                                    <Typography variant="subtitle1" sx={{ color: '#2e7d32', fontWeight: 500 }}>
                                                        Rental Items
                                                    </Typography>
                                                </Box>
                                            }
                                            secondary={
                                                <TableContainer component={Paper} variant="outlined">
                                                    <Table size="small">
                                                        <TableHead>
                                                            <TableRow>
                                                                <TableCell sx={{ fontWeight: 500 }}>Product</TableCell>
                                                                <TableCell align="right" sx={{ fontWeight: 500 }}>Quantity</TableCell>
                                                                <TableCell align="right" sx={{ fontWeight: 500 }}>Rental Duration</TableCell>
                                                            </TableRow>
                                                        </TableHead>
                                                        <TableBody>
                                                            {(rentalDetails.items || []).map((item, index) => (
                                                                <TableRow key={index}>
                                                                    <TableCell>{item.productName}</TableCell>
                                                                    <TableCell align="right">{item.quantity}</TableCell>
                                                                    <TableCell align="right">{item.rentalDuration}</TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </TableContainer>
                                            }
                                        />
                                    </ListItem>
                                    <Divider />
                                </>
                            )}

                            <ListItem>
                                <ListItemText
                                    primary={
                                        <Typography variant="subtitle1" sx={{ color: '#2e7d32', fontWeight: 500, mb: 1 }}>
                                            Cost Details
                                        </Typography>
                                    }
                                    secondary={
                                        <TableContainer component={Paper} variant="outlined">
                                            <Table size="small">
                                                <TableBody>
                                                    {(leasingDetails.deliveryItems || []).length > 0 && (
                                                        <TableRow>
                                                            <TableCell sx={{ borderBottom: 'none' }}>Delivery Items Total</TableCell>
                                                            <TableCell align="right" sx={{ borderBottom: 'none' }}>
                                                                ₹{deliveryTotal.toFixed(2)}
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                    {(leasingDetails.pickupItems || []).length > 0 && (
                                                        <TableRow>
                                                            <TableCell sx={{ borderBottom: 'none' }}>Pickup Items Total</TableCell>
                                                            <TableCell align="right" sx={{ borderBottom: 'none' }}>
                                                                ₹{pickupTotal.toFixed(2)}
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                    <TableRow>
                                                        <TableCell>Subtotal</TableCell>
                                                        <TableCell align="right">₹{subtotal.toFixed(2)}</TableCell>
                                                    </TableRow>
                                                    <TableRow>
                                                        <TableCell>GST (18%)</TableCell>
                                                        <TableCell align="right">₹{gst.toFixed(2)}</TableCell>
                                                    </TableRow>
                                                    <TableRow>
                                                        <TableCell sx={{
                                                            fontWeight: 600,
                                                            color: '#2e7d32',
                                                            borderBottom: 'none'
                                                        }}>
                                                            Total Amount
                                                        </TableCell>
                                                        <TableCell
                                                            align="right"
                                                            sx={{
                                                                fontWeight: 600,
                                                                color: '#2e7d32',
                                                                borderBottom: 'none'
                                                            }}
                                                        >
                                                            ₹{total.toFixed(2)}
                                                        </TableCell>
                                                    </TableRow>
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    }
                                />
                            </ListItem>
                        </>
                    )}


                    {order.orderType === 'WASHING' && (
                        <>

                            {/* Washing Items */}
                            {(washingDetails.items || []).length > 0 && (
                                <>
                                    <ListItem>
                                        <ListItemText
                                            primary={
                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                    <DeliveryIcon sx={{ mr: 1, color: '#2e7d32' }} />
                                                    <Typography variant="subtitle1" sx={{ color: '#2e7d32', fontWeight: 500 }}>
                                                        Washing Items
                                                    </Typography>
                                                </Box>
                                            }
                                            secondary={
                                                <TableContainer component={Paper} variant="outlined">
                                                    <Table size="small">
                                                        <TableHead>
                                                            <TableRow>
                                                                <TableCell sx={{ fontWeight: 500 }}>Product</TableCell>
                                                                <TableCell align="right" sx={{ fontWeight: 500 }}>Quantity</TableCell>
                                                            </TableRow>
                                                        </TableHead>
                                                        <TableBody>
                                                            {(washingDetails.items || []).map((item, index) => (
                                                                <TableRow key={index}>
                                                                    <TableCell>{item.productName}</TableCell>
                                                                    <TableCell align="right">{item.quantity}</TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </TableContainer>
                                            }
                                        />
                                    </ListItem>
                                </>
                            )}
                        </>
                    )}
                  {leasingDetails.rejectionRequests.length > 0 && (
  <>
    <ListItem>
      <ListItemText
        primary={
          <Typography
            variant="subtitle1"
            sx={{ color: "#d32f2f", fontWeight: 600, mb: 1 }}
          >
            Rejection Requests
          </Typography>
        }
        secondary={
          <Box>
            {leasingDetails.rejectionRequests.map((rej) => (
              <Box
                key={rej.id}
                sx={{
                  border: "1px solid #ddd",
                  borderRadius: "12px",
                  p: 2,
                  mb: 2,
                  background: "#fafafa",
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {rej.productName}
                  </Typography>

                  <Button
                    variant="outlined"
                    size="small"
                    sx={{ borderRadius: "20px" }}
                  >
                    {rej.images.length} images
                  </Button>
                </Box>

                <Typography variant="body2" sx={{ mt: 1 }}>
                  Qty: <strong>{rej.quantity}</strong>
                </Typography>

                <Typography variant="body2" sx={{ mt: 1, color: "#b71c1c" }}>
                  {rej.issueType}
                </Typography>

                <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                  {/* Change Status Button */}
                  <Button
                    variant="outlined"
                    sx={{
                      width: "150px",
                      borderRadius: "8px",
                      textTransform: "none",
                    }}
                    onClick={async () => {
                      try {
                    
                        const newStatus = rej.status === "PENDING" ? "RESOLVED" : "PENDING";
                        await rejectionApis.updateRejectionRequestStatus(rej.id, newStatus);
                        
                        setLeasingDetails((prev) => ({
                          ...prev,
                          rejectionRequests: prev.rejectionRequests.map((r) =>
                            r.id === rej.id ? { ...r, status: newStatus } : r
                          ),
                        }));
                      } catch (err) {
                        console.error("Failed to update status", err);
                      }
                    }}
                  >
                    Change Status
                  </Button>

                  
                  <Button
                    variant="outlined"
                    color="error"
                    sx={{ width: "100px", borderRadius: "8px", textTransform: "none" }}
                    onClick={async () => {
                      try {
                        await rejectionApis.deleteRejectionRequest(rej.id);

                
                        setLeasingDetails((prev) => ({
                          ...prev,
                          rejectionRequests: prev.rejectionRequests.filter((r) => r.id !== rej.id),
                        }));
                      } catch (err) {
                        console.error("Failed to delete request", err);
                      }
                    }}
                  >
                    Delete
                  </Button>
                </Box>
              </Box>
            ))}
          </Box>
        }
      />
    </ListItem>

    <Divider />
  </>
)}


                    <Button
                        variant="contained"
                        color="success"
                        disabled={order.status === "COMPLETED"}
                        onClick={handleCompleteOrder}
                        sx={{
                            background: 'linear-gradient(45deg, #2e7d32 30%, #43a047 90%)',
                            boxShadow: '0 2px 4px rgba(46, 125, 50, 0.25)',
                            textTransform: 'none',
                        }}
                    >
                        Complete Order
                    </Button>


                    {/* Cost Details Section */}
                    <ReserveItemsDialog
                        open={reserveDialogOpen}
                        onClose={() => setReserveDialogOpen(false)}
                        deliveryItems={order.leasingOrderDetails?.deliveryItems || []}
                        customerId={customerId}
                        orderId={order.id}
                    />
                     <RejectItemsDialog
                        open={rejectDialogOpen}
                        onClose={() => setRejectDialogOpen(false)}
                        deliveryItems={order.leasingOrderDetails?.deliveryItems || []}
                        customerId={customerId}
                        orderId={order.id}
                    />

                </List>
            </Box>
        </Box>
    );
}

export default OrderDetails;