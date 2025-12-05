import React, { useState, useRef, useEffect } from "react";
import {
  Dialog, 
  DialogTitle,
DialogContent, DialogActions,
  Button, TextField, MenuItem, FormControlLabel,
  Radio, RadioGroup, Box, Paper, Typography
} from "@mui/material";
import orderService from "../../services/orderService";

const RejectItemsDialog = ({ open, onClose, deliveryItems, orderId }) => {
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [date, setDate] = useState("");
  const [issue, setIssue] = useState("");
  const [customIssue, setCustomIssue] = useState("");
  const [images, setImages] = useState([]);
  const [remarks, setRemarks] = useState("");
  const [showSummary, setShowSummary] = useState(false);

  const customIssueRef = useRef(null);

  useEffect(() => {
    if (issue === "others" && customIssueRef.current) {
      customIssueRef.current.focus();
    }
  }, [issue]);


  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const urls = files.map((file) => URL.createObjectURL(file)); 
    setImages((prev) => [...prev, ...urls]);
  };

  const handleSave = () => {
    if (!productId || !quantity || !date || !issue) return;
    setShowSummary(true);
  };

  const handleFinalConfirm = async () => {
    const issueType =
      issue === "others"
        ? customIssue.toUpperCase().replace(/\s+/g, "_")
        : issue.toUpperCase().replace(/\s+/g, "_");

    const payload = {
      productId,
      quantity: Number(quantity),
      images,
      issueType,
      requestedDate: `${date}T00:00:00`, 
      requestedBy: Number(localStorage.getItem("userId") || 1),
      remarks,
    };

    console.log("Final API Payload:", payload);

    try {
      await orderService.createRejectionRequest(orderId, payload);
      onClose();
      setShowSummary(false);
    } catch (error) {
      console.error("Error submitting rejection request:", error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Rejection Request</DialogTitle>

      <DialogContent>

        {/* for summary*/}
        {showSummary ? (
          <Paper elevation={2} sx={{ p: 2, mt: 1, background: "#fafafa" }}>
            <Typography variant="h6" sx={{ mb: 2, fontSize: "16px" }}>
              Summary
            </Typography>

            <Typography><strong>Product ID:</strong> {productId}</Typography>
            <Typography><strong>Quantity:</strong> {quantity}</Typography>
            <Typography><strong>Date:</strong> {date}</Typography>
            <Typography>
              <strong>Issue:</strong>{" "}
              {issue === "others" ? customIssue : issue}
            </Typography>

            <Typography sx={{ mt: 1 }}>
              <strong>Images:</strong> {images.length}
            </Typography>

            <Typography sx={{ mt: 1 }}>
              <strong>Remarks:</strong> {remarks}
            </Typography>
          </Paper>
        ) : (
          <>
            {/* to slecet items*/}
            <Box display="flex" gap={2} mt={1}>
              <TextField
                fullWidth
                select
                label="Item"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
              >
                {deliveryItems.map((item) => (
                  <MenuItem key={item.productId} value={item.productId}>
                    {item.productName}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Qty"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                sx={{ width: "120px" }}
              />
            </Box>

            {/* date field */}
            <TextField
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ mt: 2, width: "50%" }}
            />

            {/* ISSUE TYPE */}
            <Box mt={3}>
              <div style={{ marginBottom: 5 }}>Select Issue</div>

              <RadioGroup value={issue} onChange={(e) => setIssue(e.target.value)}>
                <FormControlLabel value="DAMAGED" control={<Radio />} label="Damaged" />
                <FormControlLabel value="STAINED" control={<Radio />} label="Stained" />
                <FormControlLabel value="WRONG_ITEM" control={<Radio />} label="Wrong Item" />
                <FormControlLabel value="others" control={<Radio />} label="Others" />
              </RadioGroup>

              {issue === "others" && (
                <TextField
                  fullWidth
                  label="Please specify"
                  value={customIssue}
                  onChange={(e) => setCustomIssue(e.target.value)}
                  inputRef={customIssueRef}
                  sx={{ mt: 1 }}
                />
              )}
            </Box>

            {/* image upload */}
            <Box display="flex" gap={2} mt={2}>
              <Button variant="outlined" component="label">
                Upload Image
                <input type="file" hidden multiple onChange={handleImageUpload} />
              </Button>

              <Typography sx={{ mt: 1 }}>
                {images.length} selected
              </Typography>
            </Box>

            {/* REMARKS */}
            <TextField
              fullWidth
              multiline
              minRows={2}
              label="Remarks"
              variant="outlined"
              sx={{ mt: 2 }}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </>
        )}
      </DialogContent>

      {/* BUTTONS */}
      <DialogActions>
        <Button
          onClick={() => {
            if (showSummary) setShowSummary(false);
            else onClose();
          }}
        >
          Cancel
        </Button>

        {!showSummary ? (
          <Button variant="contained" color="error" onClick={handleSave}>
            Save
          </Button>
        ) : (
          <Button variant="contained" color="error" onClick={handleFinalConfirm}>
            Confirm
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default RejectItemsDialog;
