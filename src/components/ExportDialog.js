import React, { useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormGroup,
    FormControlLabel,
    Checkbox,
    Button
} from "@mui/material";
import { buildExportData } from "../utils/exportImportUtils";

const defaultOptions = {
    pis: true,
    members: true,
    PTO: true,
    LOA: true,
    Other: true,
    Adjustments: true,
    Holidays: true,
    "Company Days": true
};

const ExportDialog = ({ open, onClose }) => {
    const [options, setOptions] = useState(defaultOptions);

    const handleChange = (event) => {
        setOptions({ ...options, [event.target.name]: event.target.checked });
    };

    const handleExport = () => {
        const data = buildExportData(options);
        for (let [key, value] of Object.entries(data)) {
            const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `${key}.json`;
            link.click();
        }
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Export Configuration</DialogTitle>
            <DialogContent>
                <FormGroup>
                    {Object.keys(defaultOptions).map((key) => (
                        <FormControlLabel
                            key={key}
                            control={<Checkbox checked={options[key]} onChange={handleChange} name={key} />}
                            label={key}
                        />
                    ))}
                </FormGroup>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button variant="contained" onClick={handleExport}>Export</Button>
            </DialogActions>
        </Dialog>
    );
};

export default ExportDialog;
