import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    MenuItem,
    Box,
    Typography,
    IconButton,
    Divider,
    Autocomplete,
    Select,
    FormControl,
    InputLabel,
    Checkbox, FormControlLabel
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { debounce } from "lodash";
import { customerService } from "../../services/customerService";
import { orderService } from "../../services/orderService";
import { productService } from "../../services/productService";
import { parseISO } from "date-fns";
import CustomSnackbar from "../layout/CustomSnackbar";

function CreateOrderDialog({ open, onClose, onSave, order }) {
    const [formData, setFormData] = useState({
        orderReferenceId: "",
        customerId: "",
        orderDate: new Date(),
        orderType: "",
        deliveryType: "",
        pickupDate: null,
        deliveryDate: null,
        pickupItems: [],
        deliveryItems: [],
        items: [],
    });

    const [customerOptions, setCustomerOptions] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [errorMessage, setErrorMessage] = useState("");
    const [CustomSnackbarOpen, setCustomSnackbarOpen] = useState(false);
    const [copyDeliveryToPickup, setCopyDeliveryToPickup] = useState(false);
    const [products, setProducts] = useState([]);

    useEffect(() => {
        const fetchReservedProducts = async () => {
            if (formData.customerId && open) {
                try {
                    const reservedProducts = await productService.getReservedProductsByCustomerId(
                        formData.customerId
                    );
                    setProducts(reservedProducts);
                } catch (error) {
                    console.error("Failed to load reserved products:", error);
                }
            }
        };

        fetchReservedProducts();
    }, [formData.customerId, open]);

    useEffect(() => {
    // Only run if LEASING is selected and delivery type is DELIVERY or BOTH
    if (
        formData.customerId &&
        formData.orderType === "LEASING" &&
        ["DELIVERY", "BOTH"].includes(formData.deliveryType) &&
        products.length > 0 &&
        formData.deliveryItems.length === 0
    ) {
        const initialDeliveryItems = products.map((product) => ({
            productId: product.id,
            quantity: 0, // Default quantity set to zero
            remarks: "",
        }));

        setFormData((prev) => ({
            ...prev,
            deliveryItems: initialDeliveryItems,
        }));
    }
}, [formData.customerId, formData.deliveryType, formData.orderType, products]);



    useEffect(() => {
        if (order) {
            const commonData = {
                orderReferenceId: order.orderReferenceId || "",
                customerId: order.customerId || "",
                orderDate: order.orderDate
                    ? new Date(order.orderDate)
                    : new Date(),
                orderType: order.orderType || "",
            };

            setFormData((prev) => ({ ...prev, ...commonData }));

            if (order.orderType === "LEASING") {
                setFormData((prev) => ({
                    ...prev,
                    deliveryType:
                        order.leasingOrderDetails?.leasingOrderType || "",
                    pickupDate: order.leasingOrderDetails?.pickupDate
                        ? new Date(order.leasingOrderDetails.pickupDate)
                        : null,
                    deliveryDate: order.leasingOrderDetails?.deliveryDate
                        ? new Date(order.leasingOrderDetails.deliveryDate)
                        : null,
                    pickupItems: order.leasingOrderDetails?.pickupItems || [],
                    deliveryItems:
                        order.leasingOrderDetails?.deliveryItems || [],
                }));
            } else if (order.orderType === "RENTAL") {
                setFormData((prev) => ({
                    ...prev,
                    deliveryDate: order.rentalOrderDetails?.deliveryDate
                        ? new Date(order.rentalOrderDetails.deliveryDate)
                        : null,
                    items: order.rentalOrderDetails?.items || [],
                }));
            } else if (order.orderType === "WASHING") {
                setFormData((prev) => ({
                    ...prev,
                    pickupDate: order.washingOrderDetails?.pickupDate
                        ? new Date(order.washingOrderDetails.pickupDate)
                        : null,
                    deliveryDate: order.washingOrderDetails?.deliveryDate
                        ? new Date(order.washingOrderDetails.deliveryDate)
                        : null,
                    items: order.washingOrderDetails?.items || [],
                }));
            }
        }
    }, [order]);

    const debouncedFetchCustomerOptions = debounce(async (inputValue) => {
        if (inputValue) {
            const customers = await customerService.searchCustomersByName(
                inputValue
            );
            setCustomerOptions(customers);
            return customers; // Return the fetched customers
        } else {
            setCustomerOptions([]);
            return []; // Return an empty array
        }
    }, 300);

    useEffect(() => {
        if (order) {
            (async () => {
                const customers = await debouncedFetchCustomerOptions(order.customerName || '');
                if (Array.isArray(customers)) {
                    setSelectedCustomer(
                        customers.find((c) => c.id === order.customerId) || null
                    );
                }
            })();
        }
    }, [order]);

    const handleInputChange = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleAddItem = (field) => {
        // If editing pickupItems, uncheck the checkbox
        if (field === "pickupItems" && copyDeliveryToPickup) {
            setCopyDeliveryToPickup(false);
        }

        setFormData((prev) => ({
            ...prev,
            [field]: [
                ...prev[field],
                { productId: "", quantity: 1, remarks: "", rentalDuration: 0 },
            ],
        }));
    };

    const handleItemChange = (index, field, value, itemField) => {
        // Auto-uncheck if editing pickupItems
        if (itemField === "pickupItems" && copyDeliveryToPickup) {
            setCopyDeliveryToPickup(false);
        }

        const updatedItems = formData[itemField].map((item, i) =>
            i === index ? { ...item, [field]: value } : item
        );
        setFormData((prev) => ({
            ...prev,
            [itemField]: updatedItems,
        }));
    };

    const handleDeleteItem = (index, itemField) => {
        // Auto-uncheck if deleting from pickupItems
        if (itemField === "pickupItems" && copyDeliveryToPickup) {
            setCopyDeliveryToPickup(false);
        }

        const updatedItems = formData[itemField].filter((_, i) => i !== index);
        setFormData((prev) => ({
            ...prev,
            [itemField]: updatedItems,
        }));
    };

    const handleSubmit = async () => {
        try {
            const branchId = localStorage.getItem("branchId");
            const orderData = {
                orderReferenceId: formData.orderReferenceId,
                customerId: formData.customerId,
                orderType: formData.orderType.toUpperCase(),
                branchId,
                orderDate: formData.orderDate.toISOString(),
                notes: formData.notes || "",
            };

            if (formData.orderType === "LEASING") {
                orderData.leasingOrderDetails = {
                    leasingOrderType: formData.deliveryType.toUpperCase(),
                    pickupDate: formData.pickupDate
                        ? formData.pickupDate.toISOString()
                        : null,
                    deliveryDate: formData.deliveryDate
                        ? formData.deliveryDate.toISOString()
                        : null,
                    pickupItems: formData.pickupItems,
                    deliveryItems: formData.deliveryItems,
                };
            }

            if (formData.orderType === "WASHING") {
                orderData.washingOrderDetails = {
                    pickupDate: formData.pickupDate
                        ? formData.pickupDate.toISOString()
                        : null,
                    deliveryDate: formData.deliveryDate
                        ? formData.deliveryDate.toISOString()
                        : null,
                    items: formData.items,
                };
            }

            if (formData.orderType === "RENTAL") {
                orderData.rentalOrderDetails = {
                    deliveryDate: formData.deliveryDate
                        ? formData.deliveryDate.toISOString()
                        : null,
                    items: formData.items,
                };
            }

            if (order) {
                orderData.id = order.id;
                await orderService.updateOrder(orderData);
            } else {
                await orderService.createOrder(orderData);
                resetForm(); // Clear fields after successful creation
            }
            onSave(orderData);
            onClose();
        } catch (error) {
            const backendMessage =
                error.response?.data?.message ||
                "Failed to save order. Please try again.";
            setErrorMessage(backendMessage);
            setCustomSnackbarOpen(true);
        }
    };

    const handleCopyDeliveryToPickup = (checked) => {
        setCopyDeliveryToPickup(checked);

        if (checked) {
            const copiedItems = formData.deliveryItems.map((item) => ({
                ...item,
                remarks: "", // Optional: clear remarks
            }));

            setFormData((prev) => ({
                ...prev,
                pickupItems: copiedItems,
            }));
        }
    };

    const renderItemRow = (item, index, type, isDisabled = false) => (
        <Box item xs={12} key={index}>
            <Box
                sx={{
                    display: "flex",
                    gap: 2,
                    alignItems: "center",
                    mb: 1,
                    flexWrap: "nowrap",
                }}
            >
                <FormControl sx={{ minWidth: 160 }} size="small">
                    <InputLabel>Product</InputLabel>
                    <Select
                        value={item.productId}
                        label="Product"
                        onChange={(e) =>
                            handleItemChange(
                                index,
                                "productId",
                                e.target.value,
                                type
                            )
                        }
                        disabled={isDisabled}
                    >
                        {products.map((product) => (
                            <MenuItem key={product.id} value={product.id}>
                                {product.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <TextField
                    label="Quantity"
                    type="number"
                    value={item.quantity}
                    onChange={(e) =>
                        handleItemChange(
                            index,
                            "quantity",
                            e.target.value,
                            type
                        )
                    }
                    size="small"
                    sx={{ width: "100px" }}
                    disabled={isDisabled}
                />

                <TextField
                    label="Remarks"
                    value={item.remarks}
                    onChange={(e) =>
                        handleItemChange(index, "remarks", e.target.value, type)
                    }
                    size="small"
                    disabled={isDisabled}
                />

                <IconButton
                    onClick={() => handleDeleteItem(index, type)}
                    color="secondary"
                    disabled={isDisabled}
                >
                    <DeleteIcon />
                </IconButton>
            </Box>
        </Box>
    );

    const resetForm = () => {
        setFormData({
            orderReferenceId: "",
            customerId: "",
            orderDate: new Date(),
            orderType: "",
            deliveryType: "",
            pickupDate: null,
            deliveryDate: null,
            pickupItems: [],
            deliveryItems: [],
            items: [],
        });
        setSelectedCustomer(null);
        setCopyDeliveryToPickup(false);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle>{order ? "Edit Order" : "Create Order"}</DialogTitle>
            <DialogContent>
                <Box container spacing={3}>
                    {/* Order Reference ID and Customer */}
                    <Box display={"flex"} gap={2} alignItems="center" mb={1}>
                        <Box flex={1} item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Order Reference ID"
                                value={formData.orderReferenceId}
                                onChange={(e) =>
                                    handleInputChange(
                                        "orderReferenceId",
                                        e.target.value
                                    )
                                }
                                variant="outlined"
                                margin="dense"
                            />
                        </Box>
                        <Box flex={1} item xs={12} sm={6}>
                            <Autocomplete
                                options={customerOptions}
                                getOptionLabel={(option) => option.name}
                                value={selectedCustomer}
                                isOptionEqualToValue={(option, value) =>
                                    option.id === value.id
                                }
                                onInputChange={(event, newInputValue) =>
                                    debouncedFetchCustomerOptions(newInputValue)
                                }
                                onChange={(event, newValue) => {
                                    setSelectedCustomer(newValue);
                                    handleInputChange(
                                        "customerId",
                                        newValue ? newValue.id : ""
                                    );
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Customer"
                                        variant="outlined"
                                        margin="dense"
                                        fullWidth
                                    />
                                )}
                            />
                        </Box>
                    </Box>

                    {/* Order Date and Order Type */}
                    <Box display={"flex"} gap={2} alignItems="center" mb={1}>
                        <Box flex={1} item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Order Date"
                                type="date"
                                value={
                                    formData.orderDate
                                        ? formData.orderDate
                                            .toISOString()
                                            .split("T")[0]
                                        : ""
                                }
                                onChange={(e) =>
                                    handleInputChange(
                                        "orderDate",
                                        new Date(e.target.value)
                                    )
                                }
                                variant="outlined"
                                margin="dense"
                                slotProps={{
                                    inputLabel: { shrink: true },
                                }}
                            />
                        </Box>
                        <Box flex={1} item xs={12} sm={6}>
                            <FormControl fullWidth margin="dense">
                                <InputLabel>Order Type</InputLabel>
                                <Select
                                    value={formData.orderType}
                                    onChange={(e) =>
                                        handleInputChange(
                                            "orderType",
                                            e.target.value
                                        )
                                    }
                                >
                                    <MenuItem value="LEASING">Leasing</MenuItem>
                                    <MenuItem value="RENTAL">Rental</MenuItem>
                                    <MenuItem value="WASHING">Washing</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                    </Box>
                </Box>

                {formData.orderType === "LEASING" && (
                    <>
                        <Box
                            display={"flex"}
                            gap={2}
                            alignItems="center"
                            mb={3}
                        >
                            {/* Delivery Type */}
                            <Box flex={1} item xs={12} sm={6}>
                                <FormControl fullWidth margin="dense">
                                    <InputLabel>Delivery Type</InputLabel>
                                    <Select
                                        value={formData.deliveryType}
                                        onChange={(e) =>
                                            handleInputChange(
                                                "deliveryType",
                                                e.target.value
                                            )
                                        }
                                    >
                                        <MenuItem value="DELIVERY">
                                            Delivery
                                        </MenuItem>
                                        <MenuItem value="PICKUP">
                                            Pickup
                                        </MenuItem>
                                        <MenuItem value="BOTH">Both</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>

                            {/* Pickup and Delivery Dates */}
                            {["PICKUP", "BOTH"].includes(
                                formData.deliveryType
                            ) && (
                                    <Box flex={1} item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Pickup Date"
                                            type="date"
                                            value={
                                                formData.pickupDate
                                                    ? formData.pickupDate
                                                        .toISOString()
                                                        .split("T")[0]
                                                    : ""
                                            }
                                            onChange={(e) =>
                                                handleInputChange(
                                                    "pickupDate",
                                                    new Date(e.target.value)
                                                )
                                            }
                                            variant="outlined"
                                            margin="dense"
                                            slotProps={{
                                                inputLabel: { shrink: true },
                                            }}
                                        />
                                    </Box>
                                )}
                            {["DELIVERY", "BOTH"].includes(
                                formData.deliveryType
                            ) && (
                                    <Box flex={1} item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Delivery Date"
                                            type="date"
                                            value={
                                                formData.deliveryDate
                                                    ? formData.deliveryDate
                                                        .toISOString()
                                                        .split("T")[0]
                                                    : ""
                                            }
                                            onChange={(e) =>
                                                handleInputChange(
                                                    "deliveryDate",
                                                    new Date(e.target.value)
                                                )
                                            }
                                            variant="outlined"
                                            margin="dense"
                                            slotProps={{
                                                inputLabel: { shrink: true },
                                            }}
                                        />
                                    </Box>
                                )}
                        </Box>

                        {["DELIVERY", "BOTH"].includes(
                            formData.deliveryType
                        ) && (
                                <>
                                    <Box item xs={12} mb={2}>
                                        <Button
                                            onClick={() =>
                                                handleAddItem("deliveryItems")
                                            }
                                            variant="outlined"
                                        >
                                            Add Delivery Item
                                        </Button>
                                    </Box>
                                    {formData.deliveryItems.map((item, index) =>
                                        renderItemRow(item, index, "deliveryItems")
                                    )}
                                </>
                            )}

                        {/* Add Pickup and Delivery Items */}
                        {["PICKUP", "BOTH"].includes(formData.deliveryType) && (
                            <>
                                <Box item xs={12} mb={2}>
                                    <Button
                                        onClick={() =>
                                            handleAddItem("pickupItems")
                                        }
                                        variant="outlined"
                                        disabled={copyDeliveryToPickup}
                                    >
                                        Add Pickup Item
                                    </Button>
                                </Box>
                                {formData.pickupItems.map((item, index) =>
                                    renderItemRow(item, index, "pickupItems", copyDeliveryToPickup)
                                )}
                            </>
                        )}
                    </>
                )}

                {formData.orderType === "RENTAL" && (
                    <>
                        <Box display={"flex"} gap={2} alignItems="center">
                            <Box flex={1} item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Delivery Date"
                                    type="date"
                                    value={
                                        formData.deliveryDate
                                            ? formData.deliveryDate
                                                .toISOString()
                                                .split("T")[0]
                                            : ""
                                    }
                                    onChange={(e) =>
                                        handleInputChange(
                                            "deliveryDate",
                                            new Date(e.target.value)
                                        )
                                    }
                                    variant="outlined"
                                    margin="dense"
                                    slotProps={{
                                        inputLabel: { shrink: true },
                                    }}
                                />
                            </Box>
                        </Box>
                        <Box item xs={12} sx={{ mb: 2 }}>
                            <Button
                                onClick={() => handleAddItem("items")}
                                variant="outlined"
                                color="primary"
                            >
                                Add Rental Item
                            </Button>
                        </Box>
                        {formData.items.map((item, index) => (
                            <Box
                                display={"flex"}
                                gap={2}
                                alignItems="center"
                                key={index}
                            >
                                <Box flex={1} item xs={12} sm={3}>
                                    <FormControl fullWidth margin="dense">
                                        <InputLabel>Product</InputLabel>
                                        <Select
                                            value={item.productId}
                                            onChange={(e) =>
                                                handleItemChange(
                                                    index,
                                                    "productId",
                                                    e.target.value,
                                                    "items"
                                                )
                                            }
                                        >
                                            {products.map((product) => (
                                                <MenuItem
                                                    key={product.id}
                                                    value={product.id}
                                                >
                                                    {product.name}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Box>
                                <Box flex={1} item xs={12} sm={3}>
                                    <TextField
                                        fullWidth
                                        label="Quantity"
                                        type="number"
                                        value={item.quantity}
                                        onChange={(e) =>
                                            handleItemChange(
                                                index,
                                                "quantity",
                                                e.target.value,
                                                "items"
                                            )
                                        }
                                        variant="outlined"
                                        margin="dense"
                                    />
                                </Box>
                                <Box flex={1} item xs={12} sm={3}>
                                    <TextField
                                        fullWidth
                                        label="Rental Duration (days)"
                                        type="number"
                                        value={item.rentalDuration}
                                        onChange={(e) =>
                                            handleItemChange(
                                                index,
                                                "rentalDuration",
                                                e.target.value,
                                                "items"
                                            )
                                        }
                                        variant="outlined"
                                        margin="dense"
                                    />
                                </Box>
                                <Box flex={1} item xs={12} sm={3}>
                                    <IconButton
                                        onClick={() =>
                                            handleDeleteItem(index, "items")
                                        }
                                        color="secondary"
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </Box>
                            </Box>
                        ))}
                    </>
                )}

                {formData.orderType === "WASHING" && (
                    <>
                        <Box display={"flex"} gap={2} alignItems="center">
                            <Box flex={1} item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Pickup Date"
                                    type="date"
                                    value={
                                        formData.pickupDate
                                            ? formData.pickupDate
                                                .toISOString()
                                                .split("T")[0]
                                            : ""
                                    }
                                    onChange={(e) =>
                                        handleInputChange(
                                            "pickupDate",
                                            new Date(e.target.value)
                                        )
                                    }
                                    variant="outlined"
                                    margin="dense"
                                    slotProps={{
                                        inputLabel: { shrink: true },
                                    }}
                                />
                            </Box>
                            <Box flex={1} item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Delivery Date"
                                    type="date"
                                    value={
                                        formData.deliveryDate
                                            ? formData.deliveryDate
                                                .toISOString()
                                                .split("T")[0]
                                            : ""
                                    }
                                    onChange={(e) =>
                                        handleInputChange(
                                            "deliveryDate",
                                            new Date(e.target.value)
                                        )
                                    }
                                    variant="outlined"
                                    margin="dense"
                                    slotProps={{
                                        inputLabel: { shrink: true },
                                    }}
                                />
                            </Box>
                        </Box>
                        <Box item xs={12} sx={{ mb: 2 }}>
                            <Button
                                onClick={() => handleAddItem("items")}
                                variant="outlined"
                                color="primary"
                            >
                                Add Washing Item
                            </Button>
                        </Box>
                        {formData.items.map((item, index) => (
                            <Box
                                display={"flex"}
                                gap={2}
                                alignItems="center"
                                key={index}
                            >
                                <Box flex={1} item xs={12} sm={6}>
                                    <FormControl fullWidth margin="dense">
                                        <InputLabel>Product</InputLabel>
                                        <Select
                                            value={item.productId}
                                            onChange={(e) =>
                                                handleItemChange(
                                                    index,
                                                    "productId",
                                                    e.target.value,
                                                    "items"
                                                )
                                            }
                                        >
                                            {products.map((product) => (
                                                <MenuItem
                                                    key={product.id}
                                                    value={product.id}
                                                >
                                                    {product.name}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Box>
                                <Box flex={1} item xs={12} sm={4}>
                                    <TextField
                                        fullWidth
                                        label="Quantity"
                                        type="number"
                                        value={item.quantity}
                                        onChange={(e) =>
                                            handleItemChange(
                                                index,
                                                "quantity",
                                                e.target.value,
                                                "items"
                                            )
                                        }
                                        variant="outlined"
                                        margin="dense"
                                    />
                                </Box>
                                <Box flex={1} item xs={12} sm={4}>
                                    <IconButton
                                        onClick={() =>
                                            handleDeleteItem(index, "items")
                                        }
                                        color="secondary"
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </Box>
                            </Box>
                        ))}
                    </>
                )}

                {formData.deliveryType === "BOTH" && (
                    <FormControlLabel
                        sx={{ mb: 2 }}
                        control={
                            <Checkbox
                                checked={copyDeliveryToPickup}
                                onChange={(e) => handleCopyDeliveryToPickup(e.target.checked)}
                            />
                        }
                        label="Use same items and quantities as Delivery"
                    />
                )}
            </DialogContent>

            <DialogActions>
                <Button onClick={handleClose} color="primary">
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    color="primary"
                    variant="contained"
                >
                    Save
                </Button>
            </DialogActions>

            <CustomSnackbar
                open={CustomSnackbarOpen}
                message={errorMessage}
                onClose={() => setCustomSnackbarOpen(false)}
            />
        </Dialog>
    );
}

export default CreateOrderDialog;
