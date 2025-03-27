import React from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography
} from "@mui/material";
import { processImportData } from "../utils/exportImportUtils";

const ImportDialog = ({ open, onClose }) => {
    const handleFileChange = async (e) => {
        const files = Array.from(e.target.files);
        await processImportData(files);
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Import Configuration</DialogTitle>
            <DialogContent>
                <Typography>Select one or more exported `.json` files:</Typography>
                <input type="file" multiple accept=".json" onChange={handleFileChange} style={{ marginTop: 16 }} />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
            </DialogActions>
        </Dialog>
    );
};

export default ImportDialog;
