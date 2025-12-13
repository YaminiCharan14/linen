import React, { useState, useEffect, useCallback, useMemo } from "react";
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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Divider,
    FormHelperText,
    Chip,
    Autocomplete,
    Checkbox,
    Tooltip
} from "@mui/material";
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    DriveEta as DriveEtaIcon,
    LocationOn as LocationOnIcon,
    Close as CloseIcon,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { subDays } from "date-fns";
import { tripService } from "../../services/tripService";
import { userService } from "../../services/userService";
import { inventoryService } from "../../services/inventoryService";
import { useDcid } from "../../context/DcidContext";
import TripDetailsSidebar from "./TripDetailsSidebar";
import CreateTripFromRouteDialog from "./CreateTripFromRouteDialog";
import CustomSnackbar from "../layout/CustomSnackbar";
import TripTimelineDialog from "./TripTimelineDialog";
import { formatCustomDate } from "../../utils/dateUtils";

const DEFAULT_DATE_OFFSET_DAYS = 3;

function TripManagement() {
    const { dcid } = useDcid();
    const [trips, setTrips] = useState([]);
    const [openCreateTrip, setOpenCreateTrip] = useState(false);
    const [openCreateFromRoute, setOpenCreateFromRoute] = useState(false);
    const [openAddVisit, setOpenAddVisit] = useState(false);
    const [selectedTrip, setSelectedTrip] = useState(null);
    const [tripDetails, setTripDetails] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [startDate, setStartDate] = useState(subDays(new Date(), DEFAULT_DATE_OFFSET_DAYS));
    const [endDate, setEndDate] = useState(new Date());
    const [CustomSnackbarOpen, setCustomSnackbarOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] = useState("info");
    const [tripData, setTripData] = useState({
        tripName: "",
        tripNumber: "",
        notes: "",
        plannedDate: new Date(),
        // multiple assignees with roles for API: assignedPeople: [{ userId, role }]
        assignedPeople: [],
        vehicleId: "",
    });
    // UI state for multi-driver selection and per-user roles
    const [selectedDriverIds, setSelectedDriverIds] = useState([]);
    const [rolesByUserId, setRolesByUserId] = useState({}); // { [userId]: role }
    const [tripSubmitAttempted, setTripSubmitAttempted] = useState(false);
    const [visitData, setVisitData] = useState({
        visitName: "",
        tripId: null,
    });
    const [drivers, setDrivers] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    // Timeline dialog state
    const [timelineOpen, setTimelineOpen] = useState(false);
    const [timelineVisits, setTimelineVisits] = useState([]);
    const [timelineTitle, setTimelineTitle] = useState("");
    const WAREHOUSE_COACHMARK_KEY = "warehouse_mandatory_coachmark_shown";
const [showWarehouseCoachmark, setShowWarehouseCoachmark] = useState(false);
const handleCreateTripClick = (type) => {
  if (!dcid) {
    if (!localStorage.getItem(WAREHOUSE_COACHMARK_KEY)) {
      setShowWarehouseCoachmark(true);
      localStorage.setItem(WAREHOUSE_COACHMARK_KEY, "true");
    }
    return; // 🚫 block dialog opening
  }

  if (type === "NORMAL") {
    setOpenCreateTrip(true);
    setTripSubmitAttempted(false);
    fetchDrivers();
    fetchVehicles();
  } else {
    setOpenCreateFromRoute(true);
  }
};

    const fetchTrips = useCallback(async () => {
        try {
            const tripsData = await tripService.searchTrips(startDate, endDate);
            setTrips(tripsData);
        } catch (error) {
            console.error("Failed to fetch trips:", error);
        }
    }, [startDate, endDate]);

    useEffect(() => {
        fetchTrips();
    }, [fetchTrips]);

    // Load warehouses when a create dialog opens (and once initially for safety)
    useEffect(() => {
        const loadWarehouses = async () => {
            try {
                const list = await inventoryService.getWarehouses();
                setWarehouses(Array.isArray(list) ? list : []);
            } catch (e) {
                console.error("Failed to load warehouses", e);
            }
        };
        if (openCreateTrip || openAddVisit) {
            loadWarehouses();
        }
        // Also load once on mount in case dcid is needed earlier
        if (!warehouses.length) {
            loadWarehouses();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [openCreateTrip, openAddVisit]);

    const fetchTripDetails = async (tripId) => {
        try {
            const details = await tripService.getTripDetails(tripId);
            setTripDetails(details);
            setSidebarOpen(true);
        } catch (error) {
            const backendMessage =
                error.response?.data?.message ||
                "Failed to fetch trip details. Please try again.";
            setErrorMessage(backendMessage);
            setSnackbarSeverity("error");
            setCustomSnackbarOpen(true);
        }
    };

    const fetchDrivers = useCallback(async () => {
        try {
            const branchId = localStorage.getItem("branchId");
            const driversData = await userService.getActiveUsers(branchId);
            setDrivers(driversData);
        } catch (error) {
            console.error("Failed to fetch drivers:", error);
        }
    }, []);

    const fetchVehicles = useCallback(async () => {
        try {
            const branchId = localStorage.getItem("branchId");
            const vehiclesData = await tripService.getVehiclesByBranch(
                branchId
            );
            setVehicles(vehiclesData);
        } catch (error) {
            console.error("Failed to fetch vehicles:", error);
        }
    }, []);

    const handleCreateTrip = async () => {
        // Client-side validation for required fields
        const missingTripName = !tripData.tripName?.trim();
        const missingPlannedDate = !tripData.plannedDate;
        const missingDriver = !selectedDriverIds || selectedDriverIds.length === 0;
        const missingVehicle = !tripData.vehicleId;
        if (
            missingTripName ||
            missingPlannedDate ||
            missingDriver ||
            missingVehicle
        ) {
            setTripSubmitAttempted(true);
            return;
        }
        try {
            // Build assignedPeople payload from selectedDriverIds and roles
            const assignedPeople = selectedDriverIds.map((uid, idx) => ({
                userId: uid,
                role: rolesByUserId[uid] || (idx === 0 ? "DRIVER" : "HELPER"),
            }));

            const payload = {
                ...tripData,
                assignedPeople,
            };
            delete payload.assignedUserId; // clean obsolete if present

            await tripService.createTrip(payload);
            setOpenCreateTrip(false);
            setTripSubmitAttempted(false);
            setSelectedDriverIds([]);
            setRolesByUserId({});
            fetchTrips();
        } catch (error) {
            const backendMessage =
                error.response?.data?.message ||
                "Failed to create trip. Please try again.";
            setErrorMessage(backendMessage);
            setSnackbarSeverity("error");
            setCustomSnackbarOpen(true);
        }
    };

    const handleAddVisit = async () => {
        try {
            await tripService.addVisit(selectedTrip.id, visitData);
            setOpenAddVisit(false);
            fetchTrips();
        } catch (error) {
            const backendMessage =
                error.response?.data?.message ||
                "Failed to add visit. Please try again.";
            setErrorMessage(backendMessage);
            setSnackbarSeverity("error");
            setCustomSnackbarOpen(true);
        }
    };

    // Assigning driver is now handled inside TripDetailsSidebar

    // Deprecated external URL timeline handler removed in favor of inline dialog

    // Open inline timeline dialog for visits
    const handleOpenTimeline = async (e, trip) => {
        try {
            e?.stopPropagation?.();
            const details = await tripService.getTripDetails(trip.id);
            setTimelineVisits(details?.visits || []);
            setTimelineTitle(trip.tripName || `Trip ${trip.id}`);
            setTimelineOpen(true);
        } catch (error) {
            const backendMessage =
                error?.response?.data?.message ||
                "Failed to load timeline. Please try again.";
            setErrorMessage(backendMessage);
            setSnackbarSeverity("error");
            setCustomSnackbarOpen(true);
        }
    };

    const handleTripClick = (trip) => {
        fetchTripDetails(trip.id);
    };

    // Removed: Assign driver handled in sidebar; no separate opener needed

    const handleDeleteTrip = async (tripId) => {
        if (window.confirm("Are you sure you want to delete this trip?")) {
            try {
                await tripService.deleteTripById(tripId);
                fetchTrips(); // Refresh the list of trips after deletion
            } catch (error) {
                const backendMessage =
                    error.response?.data?.message ||
                    "Failed to delete trip. Please try again.";
                setErrorMessage(backendMessage);
                setSnackbarSeverity("error");
                setCustomSnackbarOpen(true);
            }
        }
    };

    // Show all trips without filtering out COMPLETED
    const filteredTrips = useMemo(() => trips, [trips]);

    return (
        <Container maxWidth="lg" sx={{ mb: 2 }}>
            <Paper
                elevation={3}
                sx={{
                    p: 2,
                    mb: 2,
                    position: "sticky",
                    top: 0,
                    zIndex: (theme) => theme.zIndex.appBar + 1,
                    backgroundColor: "background.paper",
                }}
                >
                 <Tooltip
  open={showWarehouseCoachmark}
  placement="bottom"
  arrow
  onClose={() => setShowWarehouseCoachmark(false)}
  title={
    <Box>
      <Typography fontWeight={700}>
        Warehouse is mandatory
      </Typography>
      <Typography variant="body2">
        Please select a warehouse before creating a trip.
      </Typography>
    </Box>
  }
>
  <FormControl sx={{ minWidth: 220 }}>
    <InputLabel>Warehouse</InputLabel>
    <Select value={dcid ?? ""} label="Warehouse" disabled>
      {warehouses.map((w) => (
        <MenuItem key={w.id} value={w.id}>
          {w.name}
        </MenuItem>
      ))}
    </Select>
  </FormControl>
</Tooltip>

                <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
                    Trip Management
                </Typography>

                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 2,
                        width: "100%",
                    }}
                >
                    {/* Left group: Start Date, End Date, Apply */}
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            flexWrap: { xs: "wrap", md: "nowrap" },
                            overflowX: { xs: "auto", md: "visible" },
                            pb: 0.5,
                        }}
                    >
                        <Box sx={{ width: 240, minWidth: 200 }}>
                            <DatePicker
                                label="Start Date"
                                value={startDate}
                                onChange={(date) => setStartDate(date)}
                                slotProps={{
                                    textField: {
                                        fullWidth: true,
                                        size: "small",
                                        sx: {
                                            backgroundColor: "background.paper",
                                            borderRadius: 1,
                                        },
                                    },
                                }}
                            />
                        </Box>

                        <Box sx={{ width: 240, minWidth: 200 }}>
                            <DatePicker
                                label="End Date"
                                value={endDate}
                                onChange={(date) => setEndDate(date)}
                                slotProps={{
                                    textField: {
                                        fullWidth: true,
                                        size: "small",
                                        sx: {
                                            backgroundColor: "background.paper",
                                            borderRadius: 1,
                                        },
                                    },
                                }}
                            />
                        </Box>

                        <Button
                            variant="contained"
                            onClick={fetchTrips}
                            sx={{
                                height: "40px",
                                minWidth: 96,
                                whiteSpace: "nowrap",
                                textTransform: "none",
                                background:
                                    "linear-gradient(45deg, #2e7d32 30%, #43a047 90%)",
                                boxShadow: "0 2px 4px rgba(46, 125, 50, 0.25)",
                            }}
                        >
                            Apply
                        </Button>
                    </Box>

                    {/* Right group: Create Trip, Create Trip (New) */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => {
                                handleCreateTripClick("NORMAL");
                            }}
                            sx={{
                                height: "40px",
                                whiteSpace: "nowrap",
                                textTransform: "none",
                                background:
                                    "linear-gradient(45deg, #2e7d32 30%, #43a047 90%)",
                                boxShadow: "0 2px 4px rgba(46, 125, 50, 0.25)",
                            }}
                        >
                            Create Trip
                        </Button>

                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() =>{
                                 handleCreateTripClick("ROUTE");
                                }}
                            sx={{ height: "40px", whiteSpace: "nowrap", textTransform: "none" }}
                        >
                            Create Trip (New)
                        </Button>
                    </Box>
                </Box>
            </Paper>

            <TableContainer component={Paper} elevation={3}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Trip ID</TableCell>
                            <TableCell>Trip Name</TableCell>
                            <TableCell>Planned Date</TableCell>
                            <TableCell>Status</TableCell>
                            {/* <TableCell>Reference Number</TableCell> */}
                            {/* <TableCell>Visits Count</TableCell> */}
                            {/* <TableCell>Visits Timeline</TableCell> */}
                            <TableCell align="center">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredTrips.map((trip) => (
                            <TableRow
                                key={trip.id}
                                onClick={() => handleTripClick(trip)}
                                sx={{
                                    cursor: "pointer",
                                    "& td": { py: 1 },
                                }}
                            >
                                <TableCell><strong>{trip.id}</strong></TableCell>
                                <TableCell><strong>{trip.tripName}</strong></TableCell>
                                <TableCell>
                                    {formatCustomDate(trip.plannedDate)}
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={trip.status}
                                        size="small"
                                        color={
                                            trip.status === "COMPLETED"
                                                ? "success"
                                                : trip.status === "IN_PROGRESS"
                                                ? "info"
                                                : trip.status === "PENDING"
                                                ? "warning"
                                                : trip.status === "CANCELLED"
                                                ? "error"
                                                : "default"
                                        }
                                    />
                                </TableCell>
                                {/* <TableCell>{trip.referenceNumber || "N/A"}</TableCell> */}
                                {/* <TableCell align="center">{trip.visitsCount || 0}</TableCell> */}
                                {/* <TableCell>
                                    <IconButton
                                        aria-label="Visits timeline"
                                        size="small"
                                        onClick={(e) => handleOpenTimeline(e, trip)}
                                        color={
                                            // highlight when a timeline/tracking URL is present
                                            trip?.liveTrackingUrl ||
                                            trip?.trackingUrl ||
                                            trip?.gpsUrl ||
                                            trip?.locationUrl
                                                ? "primary"
                                                : "default"
                                        }
                                    >
                                        <LocationOnIcon />
                                    </IconButton>
                                </TableCell> */}
                                <TableCell>
                                    <IconButton
                                        aria-label="Visits timeline"
                                        size="small"
                                        onClick={(e) => handleOpenTimeline(e, trip)}
                                        color={
                                            // highlight when a timeline/tracking URL is present
                                            trip?.liveTrackingUrl ||
                                            trip?.trackingUrl ||
                                            trip?.gpsUrl ||
                                            trip?.locationUrl
                                                ? "primary"
                                                : "default"
                                        }
                                    >
                                        <LocationOnIcon />
                                    </IconButton>
                                    <IconButton
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedTrip(trip);
                                            setOpenAddVisit(true);
                                        }}
                                        color="primary"
                                    >
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton
                                        color="secondary"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteTrip(trip.id);
                                        }}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <TripDetailsSidebar
                open={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                tripDetails={tripDetails}
                fetchTrips={fetchTrips}
            />

            <Dialog
                open={openCreateTrip}
                onClose={() => setOpenCreateTrip(false)}
            >
                <DialogTitle>Create Trip</DialogTitle>
                <DialogContent>
                    <FormControl fullWidth margin="dense" disabled>
                        <InputLabel>Warehouse</InputLabel>
                        <Select value={dcid ?? ""} label="Warehouse" disabled>
                            {warehouses.map((w) => (
                                <MenuItem key={w.id} value={w.id}>
                                    {w.name || `Warehouse ${w.id}`}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <DatePicker
                        sx={{ mt: 1, width: "100%" }}
                        label="Planned Date"
                        value={tripData.plannedDate}
                        onChange={(date) =>
                            setTripData({ ...tripData, plannedDate: date })
                        }
                        slotProps={{
                            textField: {
                                fullWidth: true,
                                margin: "dense",
                                sx: { width: "100%" },
                                required: true,
                                error:
                                    tripSubmitAttempted &&
                                    !tripData.plannedDate,
                                helperText:
                                    tripSubmitAttempted && !tripData.plannedDate
                                        ? "Planned Date is required"
                                        : undefined,
                            },
                        }}
                    />
                    <TextField
                        label="Trip Name"
                        value={tripData.tripName}
                        onChange={(e) =>
                            setTripData({
                                ...tripData,
                                tripName: e.target.value,
                            })
                        }
                        fullWidth
                        margin="dense"
                        required
                        error={
                            tripSubmitAttempted && !tripData.tripName?.trim()
                        }
                        helperText={
                            tripSubmitAttempted && !tripData.tripName?.trim()
                                ? "Trip Name is required"
                                : ""
                        }
                    />
                    <TextField
                        label="Trip Number"
                        value={tripData.tripNumber}
                        onChange={(e) =>
                            setTripData({
                                ...tripData,
                                tripNumber: e.target.value,
                            })
                        }
                        fullWidth
                        margin="dense"
                    />
                    <TextField
                        label="Notes"
                        value={tripData.notes}
                        onChange={(e) =>
                            setTripData({ ...tripData, notes: e.target.value })
                        }
                        fullWidth
                        margin="dense"
                    />

                    <Box sx={{ mt: 1 }}>
                        <Autocomplete
                            multiple
                            options={drivers}
                            getOptionLabel={(o) => o?.name || String(o?.id || '')}
                            value={(selectedDriverIds || []).map((id) => drivers.find((d) => d.id === id)).filter(Boolean)}
                            disableClearable
                            slotProps={{
                                listbox: {
                                    sx: {
                                        p: 0,
                                        '& .MuiAutocomplete-option': {
                                            minHeight: 'auto',
                                            py: 0.5, // reduce vertical padding
                                            px: 1,   // tighter horizontal padding
                                            fontSize: '0.9rem',
                                        },
                                    },
                                },
                                paper: { sx: { mt: 0.5 } },
                            }}
                            onChange={(_, val) => {
                                const ids = (val || []).map((v) => v.id);
                                setSelectedDriverIds(ids);
                                const nextRoles = { ...rolesByUserId };
                                ids.forEach((uid, idx) => {
                                    if (!nextRoles[uid]) nextRoles[uid] = idx === 0 ? 'DRIVER' : 'HELPER';
                                });
                                Object.keys(nextRoles).forEach((uid) => {
                                    if (!ids.includes(Number(uid)) && !ids.includes(uid)) {
                                        delete nextRoles[uid];
                                    }
                                });
                                setRolesByUserId(nextRoles);
                            }}
                            disableCloseOnSelect
                            renderOption={(props, option, { selected }) => (
                                <li {...props} key={option.id} style={{ paddingTop: 4, paddingBottom: 4, paddingLeft: 8, paddingRight: 8 }}>
                                    <Checkbox size="small" style={{ marginRight: 6 }} checked={selected} />
                                    {option.name}
                                </li>
                            )}
                            renderTags={(value) => {
                                const text = (value || []).map((u) => u?.name).filter(Boolean).join(', ');
                                return (
                                    <Box
                                        sx={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            flexWrap: 'nowrap',
                                            overflowX: 'auto',
                                            overflowY: 'hidden',
                                            maxWidth: '100%',
                                            whiteSpace: 'nowrap',
                                            scrollbarWidth: 'thin',
                                        }}
                                    >
                                        <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>{text}</Typography>
                                    </Box>
                                );
                            }}
                            renderInput={(params) => (
                                <TextField {...params} label="Delivery Team" margin="dense" required error={tripSubmitAttempted && (!selectedDriverIds || selectedDriverIds.length === 0)} helperText={tripSubmitAttempted && (!selectedDriverIds || selectedDriverIds.length === 0) ? 'At least one team member is required' : ''} />
                            )}
                            fullWidth
                            sx={{
                                '& .MuiInputBase-root': {
                                    position: 'relative',
                                    alignItems: 'center',
                                    minHeight: 48,
                                    pt: 0.5,
                                    pb: 0.5,
                                    pr: '56px', // keep chips clear of clear/chevron icons
                                },
                                // Keep Autocomplete input root on a single line
                                '& .MuiAutocomplete-inputRoot': {
                                    flexWrap: 'nowrap',
                                },
                                '& .MuiChip-root': { height: 26, m: 0.25 },
                                '& .MuiAutocomplete-input': {
                                    py: 0.5,
                                    minWidth: 8,
                                    flex: '0 0 auto',
                                },
                            }}
                        />
                    </Box>

                    {/* Role pickers per selected driver */}
                    {selectedDriverIds && selectedDriverIds.length > 0 && (
                        <Box sx={{ mt: 1 }}>
                            {selectedDriverIds.map((uid, idx) => {
                                const user = drivers.find((d) => d.id === uid);
                                const role = rolesByUserId[uid] || (idx === 0 ? "DRIVER" : "HELPER");
                                return (
                                    <Box key={uid} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                                        <Typography sx={{ minWidth: 140 }}>{user?.name || uid}</Typography>
                                        <FormControl size="small" sx={{ minWidth: 120 }}>
                                            <InputLabel>Role</InputLabel>
                                            <Select
                                                label="Role"
                                                value={role}
                                                onChange={(e) => setRolesByUserId((prev) => ({ ...prev, [uid]: e.target.value }))}
                                            >
                                                <MenuItem value="DRIVER">DRIVER</MenuItem>
                                                <MenuItem value="HELPER">HELPER</MenuItem>
                                            </Select>
                                        </FormControl>
                                        <IconButton
                                            aria-label="Remove team member"
                                            size="small"
                                            onClick={() => {
                                                setSelectedDriverIds((prev) => prev.filter((id) => id !== uid));
                                                setRolesByUserId((prev) => {
                                                    const next = { ...prev };
                                                    delete next[uid];
                                                    return next;
                                                });
                                            }}
                                        >
                                            <CloseIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                );
                            })}
                        </Box>
                    )}
                    <FormControl
                        fullWidth
                        margin="dense"
                        required
                        error={tripSubmitAttempted && !tripData.vehicleId}
                    >
                        <InputLabel required>Vehicle</InputLabel>
                        <Select
                            value={tripData.vehicleId}
                            onChange={(e) =>
                                setTripData({
                                    ...tripData,
                                    vehicleId: e.target.value,
                                })
                            }
                        >
                            {vehicles.map((vehicle) => (
                                <MenuItem key={vehicle.id} value={vehicle.id}>
                                    {vehicle.vehicleNumber} - {vehicle.type}
                                </MenuItem>
                            ))}
                        </Select>
                        {tripSubmitAttempted && !tripData.vehicleId && (
                            <FormHelperText>Vehicle is required</FormHelperText>
                        )}
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => setOpenCreateTrip(false)}
                        color="secondary"
                    >
                        Cancel
                    </Button>
                    <Button onClick={handleCreateTrip} color="primary">
                        Create
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={openAddVisit} onClose={() => setOpenAddVisit(false)}>
                <DialogTitle>Add Visit</DialogTitle>
                <DialogContent>
                    <FormControl fullWidth margin="dense" disabled>
                        <InputLabel>Warehouse</InputLabel>
                        <Select value={dcid ?? ""} label="Warehouse" disabled>
                            {warehouses.map((w) => (
                                <MenuItem key={w.id} value={w.id}>
                                    {w.name || `Warehouse ${w.id}`}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <TextField
                        label="Visit Name"
                        value={visitData.visitName}
                        onChange={(e) =>
                            setVisitData({
                                ...visitData,
                                visitName: e.target.value,
                            })
                        }
                        fullWidth
                        margin="dense"
                    />
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => setOpenAddVisit(false)}
                        color="secondary"
                    >
                        Cancel
                    </Button>
                    <Button onClick={handleAddVisit} color="primary">
                        Add
                    </Button>
                </DialogActions>
            </Dialog>


            <CustomSnackbar
                open={CustomSnackbarOpen}
                message={errorMessage}
                severity={snackbarSeverity}
                onClose={() => setCustomSnackbarOpen(false)}
            />

            <CreateTripFromRouteDialog
                open={openCreateFromRoute}
                onClose={() => setOpenCreateFromRoute(false)}
                onCreated={async () => {
                    try {
                        await fetchTrips();
                        setSnackbarSeverity("success");
                        setErrorMessage("Trip created successfully");
                        setCustomSnackbarOpen(true);
                    } catch {
                        // If fetching trips fails post-create, still show success since creation happened
                        setSnackbarSeverity("success");
                        setErrorMessage("Trip created successfully");
                        setCustomSnackbarOpen(true);
                    }
                }}
            />
           
            <TripTimelineDialog
                open={timelineOpen}
                onClose={() => setTimelineOpen(false)}
                title={timelineTitle}
                visits={timelineVisits}
            />
        </Container>
    );
}

export default TripManagement;
