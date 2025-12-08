import React, { useState, useEffect } from "react";
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
  Button,
} from "@mui/material";
import {
  Close as CloseIcon,
  LocalShipping as DeliveryIcon,
  ShoppingBasket as PickupIcon,
} from "@mui/icons-material";
import { format } from "date-fns";
import ReserveItemsDialog from "./ReserveItemsDialog";
import RejectItemsDialog from "./RejectItemsDialog";
import { orderService } from "../../services/orderService";
import VisitImagesDialog from "../trips/VisitImagesDialog";

function OrderDetails({ order: initialOrder, onClose }) {
  const [order, setOrder] = useState(initialOrder);
  const [reserveDialogOpen, setReserveDialogOpen] = React.useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = React.useState(false);
  const [selectedRejection, setSelectedRejection] = useState(null);
  const [visitDialogOpen, setVisitDialogOpen] = useState(false);
  const [visitImages, setVisitImages] = useState([]);


  console.log(order);

  if (!order) return null;

  const customerId = order.customerId;
  const leasingDetails = order.leasingOrderDetails || {};

  const fetchOrder = async () => {
    try {
      const updated = await orderService.getLeasingOrderById(order.id);
      setOrder(updated);
    } catch (e) {
      console.error("Failed refresh", e);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? "" : format(d, "dd/MM/yyyy");
  };

  const calculateItemsCost = (items) => {
    return (items || []).reduce(
      (sum, item) => sum + item.quantity * (item.unitPrice || 0),
      0
    );
  };

  const handleCompleteOrder = async () => {
    try {
      const now = new Date().toISOString();
      await orderService.recordCompleteOrder(order.referenceNumber, now);
      alert("Order marked as completed successfully!");
      if (onClose) onClose();
    } catch (error) {
      alert("Failed to complete the order.");
    }
  };

  const rentalDetails = order.rentalOrderDetails || {};
  const washingDetails = order.washingOrderDetails || {};

  const deliveryTotal = calculateItemsCost(leasingDetails.deliveryItems);
  const pickupTotal = calculateItemsCost(leasingDetails.pickupItems);
  const subtotal = deliveryTotal + pickupTotal;
  const gst = subtotal * 0.18;
  const total = subtotal + gst;

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#ffffff",
      }}
    >
      <Box
        sx={{
          p: 2,
          px: 3,
          borderBottom: 1,
          borderColor: "#e0e0e0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "#ffffff",
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontSize: "1.125rem",
            fontWeight: 600,
            color: "#1a1a1a",
          }}
        >
          Order Details
        </Typography>

        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            color: "#757575",
            "&:hover": {
              backgroundColor: "rgba(0, 0, 0, 0.04)",
            },
          }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      <Box
        sx={{
          flexGrow: 1,
          overflow: "auto",
          backgroundColor: "#ffffff",
          px: 3,
          py: 2,
        }}
      >
        <List disablePadding sx={{ backgroundColor: "#ffffff" }}>
          {/* BASIC ORDER */}
          <ListItem>
            <ListItemText
              primary={
                <Typography
                  variant="subtitle1"
                  sx={{ color: "#2e7d32", fontWeight: 500, mb: 1 }}
                >
                  Order Information
                </Typography>
              }
              secondary={
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    <strong>Reference Number:</strong> {order.referenceNumber}
                  </Typography>

                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    <strong>Customer Name:</strong> {order.customerName}
                  </Typography>

                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    <strong>Ordered Date:</strong> {formatDate(order.orderDate)}
                  </Typography>

                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    <strong>Type:</strong>{" "}
                    <Chip
                      size="small"
                      icon={
                        order.orderType === "DELIVERY" ? (
                          <DeliveryIcon />
                        ) : (
                          <PickupIcon />
                        )
                      }
                      label={order.orderType}
                      sx={{ ml: 1 }}
                    />
                  </Typography>

                  <Typography variant="body2">
                    <strong>Status:</strong>{" "}
                    <Chip
                      label={order.status}
                      size="small"
                      color={
                        order.status === "COMPLETED"
                          ? "success"
                          : order.status === "PENDING"
                          ? "warning"
                          : "error"
                      }
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                </Box>
              }
            />
          </ListItem>

          <Divider />

          {/* ====== LEASING DETAILS ====== */}
          {order.orderType === "LEASING" && (
            <>
              {(leasingDetails.deliveryItems || []).length > 0 && (
                <>
                  <ListItem>
                    <ListItemText
                      primary={
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            mb: 1,
                          }}
                        >
                          <DeliveryIcon sx={{ mr: 1, color: "#2e7d32" }} />
                          <Typography
                            variant="subtitle1"
                            sx={{ color: "#2e7d32", fontWeight: 500 }}
                          >
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
                                <TableCell sx={{ fontWeight: 500 }}>
                                  Product
                                </TableCell>
                                <TableCell
                                  align="right"
                                  sx={{ fontWeight: 500 }}
                                >
                                  Quantity
                                </TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {(leasingDetails.deliveryItems || []).map(
                                (item, index) => (
                                  <TableRow key={index}>
                                    <TableCell>{item.productName}</TableCell>
                                    <TableCell align="right">
                                      {item.quantity}
                                    </TableCell>
                                  </TableRow>
                                )
                              )}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      }
                    />
                  </ListItem>
                  <Divider />
                </>
              )}

              {/* PICKUP ITEMS */}
              {(leasingDetails.pickupItems || []).length > 0 && (
                <ListItem>
                  <ListItemText
                    primary={
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <PickupIcon sx={{ mr: 1, color: "#2e7d32" }} />
                        <Typography
                          variant="subtitle1"
                          sx={{
                            color: "#2e7d32",
                            fontWeight: 500,
                          }}
                        >
                          Pickup Items
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 500 }}>
                                Product
                              </TableCell>
                              <TableCell
                                align="right"
                                sx={{ fontWeight: 500 }}
                              >
                                Quantity
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {(leasingDetails.pickupItems || []).map(
                              (item, index) => (
                                <TableRow key={index}>
                                  <TableCell>{item.productName}</TableCell>
                                  <TableCell align="right">
                                    {item.quantity}
                                  </TableCell>
                                </TableRow>
                              )
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    }
                  />
                </ListItem>
              )}

              {/* FULFILLMENT */}
              <ListItem>
                <ListItemText
                  primary={
                    <Typography
                      variant="subtitle1"
                      sx={{
                        color: "#2e7d32",
                        fontWeight: 500,
                        mb: 1,
                      }}
                    >
                      Fulfillment Details
                    </Typography>
                  }
                  secondary={<Box>…</Box>}
                />
              </ListItem>
            </>
          )}

          {/* ===== REJECTIONS ===== */}
          {(order.leasingOrderDetails?.rejectionRequests || []).length > 0 && (
            <>
              <ListItem>
                <ListItemText
                  primary={
                    <Typography sx={{ fontWeight: 600, color: "#d32f2f" }}>
                      Rejection Requests
                    </Typography>
                  }
                  secondary={
                    <Box>
                      {(order.leasingOrderDetails?.rejectionRequests || []).map(
                        (rej) => {
                          const productName =
                            leasingDetails.deliveryItems?.find(
                              (i) => i.productId === rej.productId
                            )?.productName || "Unknown Product";

                          return (
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
                              <Box
  sx={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  }}
>
  <Typography sx={{ fontWeight: 600 }}>
    {productName}
  </Typography>

  {/* ✅ Only this – no extra count, no extra state */}
  <VisitImagesDialog
    imageUrls={rej.images || []}
    title="Rejection Images"
  />
</Box>
<Box
  sx={{
    display: "flex",
    justifyContent: "space-between",
  }}
>
    {/* LEFT SIDE CONTENT */}
    <Box>


      <Typography sx={{ mt: 1 }}>
        Qty: <strong>{rej.quantity}</strong>
      </Typography>

      <Typography sx={{ mt: 1, color: "#b71c1c" }}>
        {rej.issueType}
      </Typography>

      <Typography sx={{ mt: 1 }}>
        <strong>Status:</strong> {rej.status}
      </Typography>

      {/* Buttons under details */}
      <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
        {rej.status === "APPROVED" ? (
          <Button
            variant="outlined"
            sx={{
              color: "#555",
              borderColor: "#bbb",
              cursor: "not-allowed"
            }}
          >
            Approved
          </Button>
        ) : (
          <Button
            variant="outlined"
            onClick={async () => {
              const newStatus = "APPROVED";
              await orderService.updateRejectionRequestStatus(rej.id, newStatus);

              setOrder(prev => ({
                ...prev,
                leasingOrderDetails: {
                  ...prev.leasingOrderDetails,
                  rejectionRequests: prev.leasingOrderDetails.rejectionRequests.map(r =>
                    r.id === rej.id ? { ...r, status: newStatus } : r
                  ),
                },
              }));
            }}
          >
            Approve
          </Button>
        )}

        <Button variant="outlined" color="error" onClick={() => {
          setSelectedRejection(rej);
          setRejectDialogOpen(true);
        }}>
          Delete
        </Button>
      </Box>
    </Box>

    {/* RIGHT SIDE APPROVED STAMP */}
    {rej.status === "APPROVED" && (
      <img
        src="/approved.png"
        alt="approved"
        style={{
          width: 130,
          opacity: 0.85,
          marginLeft: 10,
        }}
      />
    )}

</Box>



                            
                            </Box>
                          );
                        }
                      )}
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
          >
            Complete Order
          </Button>

          <ReserveItemsDialog
            open={reserveDialogOpen}
            onClose={() => setReserveDialogOpen(false)}
            deliveryItems={order.leasingOrderDetails?.deliveryItems || []}
            customerId={customerId}
            orderId={order.id}
          />

          <RejectItemsDialog
            open={rejectDialogOpen}
            onClose={() => {
              setRejectDialogOpen(false);
              setSelectedRejection(null);
            }}
            deliveryItems={order.leasingOrderDetails?.deliveryItems || []}
            customerId={customerId}
            orderId={order.id}
            selectedRejection={selectedRejection}
            deleteMode={Boolean(selectedRejection)}
            onSuccess={(action) => {
              if (action?.type === "DELETE_REJECTION") {
                setOrder((prev) => ({
                  ...prev,
                  leasingOrderDetails: {
                    ...prev.leasingOrderDetails,
                    rejectionRequests:
                      prev.leasingOrderDetails.rejectionRequests.filter(
                        (r) => r.id !== action.id
                      ),
                  },
                }));
                return;
              }

              setOrder((prev) => ({
                ...prev,
                leasingOrderDetails: {
                  ...prev.leasingOrderDetails,
                  rejectionRequests: [
                    ...(prev.leasingOrderDetails?.rejectionRequests || []),
                    action,
                  ],
                },
              }));
            }}
          />

        </List>
      </Box>
    </Box>
    
  );
}
                              

export default OrderDetails;
