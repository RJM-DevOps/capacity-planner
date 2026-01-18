import React, { useState, useEffect } from "react";
import {
    Box,
    Button,
    Menu,
    MenuItem,
    Divider,
    Typography,
    IconButton,
    ListItemIcon
} from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";
import LoginIcon from "@mui/icons-material/Login";
import ImageIcon from "@mui/icons-material/Image";

const watermarkOptions = [
    { label: "Team Logo", value: "/logo-watermark.png" },
    { label: "Alternate Logo", value: "/alt-logo.png" },
    { label: "None", value: "" }
];

const WatermarkMenu = ({ onWatermarkChange }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem("role"));
    const [selectedWatermark, setSelectedWatermark] = useState(localStorage.getItem("watermark") || "/logo-watermark.png");

    const handleOpen = (event) => setAnchorEl(event.currentTarget);
    const handleClose = () => setAnchorEl(null);

    const handleLoginToggle = () => {
        if (loggedIn) {
            localStorage.removeItem("role");
            setLoggedIn(false);
        } else {
            localStorage.setItem("role", "user"); // default mock login
            setLoggedIn(true);
        }
        handleClose();
    };

    const handleWatermarkSelect = (value) => {
        setSelectedWatermark(value);
        localStorage.setItem("watermark", value);
        onWatermarkChange?.(value);
        handleClose();
    };

    useEffect(() => {
        onWatermarkChange?.(selectedWatermark);
    }, [selectedWatermark, onWatermarkChange]);

    return (
        <Box sx={{ position: "absolute", top: 16, right: 16 }}>
            <IconButton onClick={handleOpen}>
                <AccountCircleIcon fontSize="large" />
            </IconButton>
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
                <MenuItem onClick={handleLoginToggle}>
                    <ListItemIcon>
                        {loggedIn ? <LogoutIcon fontSize="small" /> : <LoginIcon fontSize="small" />}
                    </ListItemIcon>
                    {loggedIn ? "Sign Out" : "Sign In"}
                </MenuItem>
                <Divider />
                <Typography variant="body2" sx={{ pl: 2, pt: 1 }}>Watermark</Typography>
                {watermarkOptions.map(opt => (
                    <MenuItem key={opt.value} onClick={() => handleWatermarkSelect(opt.value)}>
                        <ListItemIcon><ImageIcon fontSize="small" /></ListItemIcon>
                        {opt.label}
                    </MenuItem>
                ))}
            </Menu>
        </Box>
    );
};

export default WatermarkMenu;
