import React, { useState } from "react";
import {
    Menu,
    MenuItem,
    IconButton,
    ListSubheader,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Input,
    Slider,
    Box
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";

const GlobalMenu = ({ onWatermarkChange }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [opacity, setOpacity] = useState(parseFloat(localStorage.getItem("watermarkOpacity") || "0.15"));
    const [width, setWidth] = useState(parseInt(localStorage.getItem("watermarkWidth") || "35"));
    const [previewSrc, setPreviewSrc] = useState(localStorage.getItem("watermark") || "/HylianShield.png");

    const handleMenuClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleDialogOpen = () => {
        setPreviewSrc(localStorage.getItem("watermark") || "/HylianShield.png");
        setDialogOpen(true);
        handleMenuClose();
    };

    const handleDialogClose = () => {
        setDialogOpen(false);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 3 * 1024 * 1024) {
            alert("File exceeds 3MB. Please select a smaller image.");
            return;
        }
        setSelectedFile(file);

        const reader = new FileReader();
        reader.onload = (e) => {
            setPreviewSrc(e.target.result); // ✅ Live preview
        };
        reader.readAsDataURL(file);
    };

    const handleUpload = () => {
        if (selectedFile) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const base64Image = e.target.result;
                localStorage.setItem("watermark", base64Image);
                localStorage.setItem("watermarkFileName", selectedFile.name);
                onWatermarkChange(base64Image);
            };
            reader.readAsDataURL(selectedFile);
        }

        // Always save settings
        localStorage.setItem("watermarkOpacity", opacity);
        localStorage.setItem("watermarkWidth", `${width}vw`);

        handleDialogClose();
    };

    return (
        <>
            <IconButton onClick={handleMenuClick} sx={{ position: "absolute", top: 8, right: 8, zIndex: 2 }}>
                <MoreVertIcon />
            </IconButton>

            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                <ListSubheader sx={{ fontSize: "0.9rem", fontWeight: "bold", backgroundColor: "#f5f5f5" }}>Access</ListSubheader>
                <MenuItem sx={{ fontSize: "1.1rem" }} onClick={() => window.location.href = "/login"}>Sign In</MenuItem>
                <MenuItem sx={{ fontSize: "1.1rem" }} onClick={() => {
                    localStorage.clear();
                    window.location.href = "/login";
                }}>Sign Out</MenuItem>

                <ListSubheader sx={{ fontSize: "0.9rem", fontWeight: "bold", backgroundColor: "#f5f5f5" }}>Admin</ListSubheader>
                <MenuItem sx={{ fontSize: "1.1rem" }} onClick={handleDialogOpen}>Logo Config</MenuItem>
                <MenuItem sx={{ fontSize: "1.1rem" }} disabled>Settings</MenuItem>
            </Menu>

            <Dialog open={dialogOpen} onClose={handleDialogClose}>
                <DialogTitle>Upload Watermark</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="textSecondary">
                        Accepted formats: .jpg, .jpeg, .png, .gif. Max size: 3MB
                    </Typography>
                    <Input
                        type="file"
                        inputProps={{ accept: ".jpg,.jpeg,.png,.gif" }}
                        onChange={handleFileChange}
                        fullWidth
                        sx={{ mt: 2 }}
                    />
                    <Typography sx={{ mt: 3 }}>Opacity</Typography>
                    <Slider
                        value={opacity}
                        onChange={(e, val) => setOpacity(val)}
                        step={0.01}
                        min={0.01}
                        max={1.0}
                    />
                    <Typography sx={{ mt: 2 }}>Width (vw)</Typography>
                    <Slider
                        value={width}
                        onChange={(e, val) => setWidth(val)}
                        step={1}
                        min={10}
                        max={100}
                    />
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle1">Current Settings</Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                            <strong>Image:</strong> {selectedFile?.name || localStorage.getItem("watermarkFileName") || "Default (from repo)"}
                        </Typography>
                        <Typography variant="body2">
                            <strong>Width:</strong> {width}vw
                        </Typography>
                        <Typography variant="body2">
                            <strong>Opacity:</strong> {opacity}
                        </Typography>
                    </Box>
                    <Box sx={{ mt: 3 }}>
                        <Typography variant="subtitle1">Preview</Typography>
                        <Box
                            component="img"
                            src={previewSrc}
                            alt="Preview"
                            sx={{
                                mt: 1,
                                border: "1px solid #ccc",
                                borderRadius: 2,
                                width: `${width}vw`,
                                maxWidth: "100%",
                                opacity,
                            }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDialogClose}>Cancel</Button>
                    <Button onClick={handleUpload} variant="contained">Save</Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default GlobalMenu;
