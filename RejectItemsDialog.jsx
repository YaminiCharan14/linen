import React, { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  FormControlLabel,
  Radio,
  RadioGroup,
  Box,
  Paper,
  Typography,
  Snackbar,
} from "@mui/material";
import { orderService } from "../../services/orderService";
import { issueService } from "../../services/issueService";
import LoaderScreen from "../../components/dashboard/LoaderScreen"; 
import RejectImagePreviewDialog from "./RejectionPreviewDialog";


const RejectItemsDialog = ({  open, onClose, deliveryItems, showSnack,customerId, orderId, onSuccess,selectedRejection,deleteMode,   }) => {
  const [selectedItem, setSelectedItem] = useState("");
  const [quantity, setQuantity] = useState("");
  const [date, setDate] = useState("");
  const [issue, setIssue] = useState("");
  const [customIssue, setCustomIssue] = useState("");
  const [remarks, setRemarks] = useState("");
  const [showSummary, setShowSummary] = useState(false);
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [ImageSnackOpen, setImageSnackOpen] = useState(false);
const [ImageSnackMessage, setImageSnackMessage] = useState("");



const handleImageChange = async (e) => {
  const files = Array.from(e.target.files);

  setUploading(true);

  const uploadedUrls = [];

  for (let file of files) {
    const res = await issueService.uploadImage(file);
    uploadedUrls.push(res);
  }

  setImages((prev) => [...prev, ...uploadedUrls]);

  setUploading(false);
  setImageSnackMessage("Images uploaded successfully");
setImageSnackOpen(true);


 
};



const handleRemoveImage = (index) => {
  setImages((prev) => prev.filter((_, i) => i !== index));
};

  const customIssueRef = useRef(null);

  
  useEffect(() => {
    if (issue === "others" && customIssueRef.current) {
      customIssueRef.current.focus();
    }
  }, [issue]);
  useEffect(() => {
  if (open && deleteMode) {
    setShowSummary(true);
  } else {
    setShowSummary(false);
  }
}, [open, deleteMode]);


  // Show Summary Screen
  const handleSave = () => {
    if (!selectedItem || !quantity || !date || !issue) return;
    setShowSummary(true);
  };
useEffect(() => {
  if (!open) {
    setFinalizing(false);
  }
}, [open]);

  // Final API submit
  const handleFinalConfirm = async () => {
    setFinalizing(true); // show loading UI

    // If delete mode, delete rejection
if (deleteMode && selectedRejection) {
  try {
    await orderService.deleteRejectionRequest(selectedRejection.id);//api of delete
onSuccess({ type:"DELETE_REJECTION", id:selectedRejection.id })
showSnack("Rejected request deleted successfully");


} catch (e) {
  console.error("Delete failed", e);
}

setShowSummary(false);
setFinalizing(false);
onClose();
return;
}

  if (!selectedItem || !quantity || !date || !issue) return;//not selected

  try {
    const issueType = issue === "others" ? "OTHERS" : issue;
    const requestedDate = `${date}T00:00:00`;

    const payload = {
      productId: Number(selectedItem),
      quantity: Number(quantity),
      images,
      issueType,
      requestedDate,
      requestedBy: 1,
      remarks: issue === "others" ? customIssue : remarks,
    };

    // 3️⃣ Send API request
   const saved = await orderService.createRejectionRequest(orderId, payload);//create request api
onSuccess(saved);


    showSnack("Rejected request created successfully");
    onClose();
    setShowSummary(false);//make form null
    setSelectedItem("");
    setQuantity("");
    setDate("");
    setIssue("");
    setCustomIssue("");
    setRemarks("");
    setImages([]);

  } catch (error) {
    console.error("Failed to save rejection request:", error);
    setFinalizing(false);
    alert("Failed to submit rejection request");
  }
};

  return (
    <>
    {/*snack bar*/}
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Rejection Request</DialogTitle>

     <DialogContent sx={{ position: "relative" }}>
  {showSummary ? (
    <Paper elevation={2} sx={{ p: 2, mt: 1, background: "#fafafa" }}>
      <Typography variant="h6">
        {deleteMode ? "Confirm Delete" : "Summary"}
      </Typography>
      {deleteMode?(
    <>
          <Typography><strong>Item:</strong> {selectedRejection?.productName}</Typography>
          <Typography><strong>Qty:</strong> {selectedRejection?.quantity}</Typography>
          <Typography><strong>Issue:</strong> {selectedRejection?.issueType}</Typography>
          <Typography><strong>Date:</strong> {selectedRejection?.requestedDate}</Typography>
                </>
    ) : (

        <>
          <Typography><strong>Item:</strong>{" "}
            {deliveryItems.find(i => i.productId === Number(selectedItem))?.productName}
          </Typography>
          <Typography><strong>Qty:</strong> {quantity}</Typography>
          <Typography><strong>Date:</strong> {date}</Typography>
          <Typography><strong>Issue:</strong> {issue === "others" ? customIssue : issue}</Typography>
          <Typography><strong>Remarks:</strong> {issue === "others" ? customIssue : remarks}</Typography>
        </>
      )}
    </Paper>

  ) : (
    <>
            <Box display="flex" gap={2} mt={1}>
              <TextField
                fullWidth
                select
                label="Item"
                value={selectedItem}
                onChange={(e) => setSelectedItem(e.target.value)}
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
  onChange={(e) => {
    const val = parseInt(e.target.value, 10);
    setQuantity(Math.max(1, val));   // prevents negative
  }}
  inputProps={{ min: 1 }}
/>

            </Box>

            <TextField
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ mt: 2, width: "68%" }}
            />
   
            <Box mt={3}>
              <div>Select Issue</div>
              <RadioGroup
                value={issue}
                onChange={(e) => setIssue(e.target.value)}
              >
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
            {/* IMAGE UPLOAD SECTION */}
<Box mt={2}>
  <Button variant="contained" component="label">
    Upload Images
     <input
    type="file"
    hidden
    multiple
    onChange={handleImageChange}
  />
    </Button>
 {uploading && <Typography>Uploading…</Typography>}



  <Box mt={2} sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
    {images.map((img, index) => (
      <Paper
        key={index}
        elevation={3}
        sx={{
          width: 80,
          height: 80,
          overflow: "hidden",
          position: "relative",
          borderRadius: 1,
        }}
      >
        <img
  src={img}
  alt=""
  style={{ width: "100%", height: "100%", objectFit: "cover", cursor:"pointer" }}
  onClick={() => {
    setPreviewIndex(index);
    setPreviewOpen(true);
  }}
/>


        <Button
          size="small"
          sx={{
            position: "absolute",
            top: 0,
            right: 0,
            minWidth: 20,
            padding: 0,
            color: "red",
            background: "#fff",
          }}
          onClick={() => handleRemoveImage(index)}
        >
          X
        </Button>
      </Paper>
    ))}
  </Box>
</Box>


            <TextField
              fullWidth
              multiline
              minRows={1}
              label="Remarks"
              variant="outlined"
              sx={{ mt: 2 }}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </>
        )}
        {finalizing && (
  <Box
    sx={{
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background: "rgba(255,255,255,0.7)",
      zIndex: 5,
    }}
  >
    <LoaderScreen />
  </Box>
)}
        
  </DialogContent>

<DialogActions>
  <Button
    onClick={() => {
    if (showSummary && deleteMode) {
  onClose();
  return;
}

if (showSummary) {
  setShowSummary(false);
  return;
}

      onClose();
    }}
  >
    Cancel
  </Button>

  {showSummary ? (
   <Button
  variant="contained"
  color="error"
  disabled={finalizing}       
  onClick={handleFinalConfirm}
>
  {deleteMode ? "Confirm Delete" : "Confirm Save"}
</Button>

  ) : (
    <Button variant="contained" color="error" onClick={handleSave}>
      Save
    </Button>
  )}
</DialogActions>
<Snackbar
  open={ImageSnackOpen}
  autoHideDuration={2000}
  onClose={() => setImageSnackOpen(false)}
  message={ImageSnackMessage}
  anchorOrigin={{ vertical: "top", horizontal: "center" }}
/>

</Dialog>
      {previewOpen && (
      <RejectImagePreviewDialog
  open={previewOpen}
  onClose={() => setPreviewOpen(false)}
  images={images}
  index={previewIndex}
/>
    )}
  </>
);
};



export default RejectItemsDialog;
