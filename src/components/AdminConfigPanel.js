// AdminConfigPanel.js — supports memberId selection and directory tab for PTO/LOA/Other + full localStorage integration + dropdown for Who in Capacity Grid
import React, { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Tabs,
    Tab,
    TextField,
    IconButton,
    Button,
    ButtonGroup,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Paper,
    MenuItem,
    Select,
    InputLabel,
    FormControl
} from "@mui/material";
import { Delete, Add } from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

const CATEGORIES = ["Holidays", "Company Days", "PTO", "LOA", "Other", "Team Members"];
const STORAGE_KEY = "configData";
const MEMBER_KEY = "memberDirectory";

const defaultData = {
    "Holidays": [],
    "Company Days": [],
    "PTO": [],
    "LOA": [],
    "Other": [],
    "Team Members": []
};

const AdminConfigPanel = () => {
    const [tab, setTab] = useState(0);
    const [configData, setConfigData] = useState(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : defaultData;
    });
    const [members, setMembers] = useState(() => {
        const stored = localStorage.getItem(MEMBER_KEY);
        return stored ? JSON.parse(stored) : [];
    });

    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(configData));
    }, [configData]);

    useEffect(() => {
        localStorage.setItem(MEMBER_KEY, JSON.stringify(members));
    }, [members]);

    const handleAddRow = () => {
        const category = CATEGORIES[tab];
        let newRow;

        if (category === "Holidays" || category === "Company Days") {
            newRow = { date: "", description: "" };
        } else if (category === "Team Members") {
            newRow = { id: uuidv4(), name: "" };
            setMembers((prev) => [...prev, newRow]);
            return;
        } else {
            newRow = { memberId: "", date: "" };
        }

        setConfigData((prev) => ({
            ...prev,
            [category]: [...prev[category], newRow]
        }));
    };

    const handleDeleteRow = (index) => {
        const category = CATEGORIES[tab];
        if (category === "Team Members") {
            const updated = [...members];
            updated.splice(index, 1);
            setMembers(updated);
        } else {
            const updated = [...configData[category]];
            updated.splice(index, 1);
            setConfigData((prev) => ({
                ...prev,
                [category]: updated
            }));
        }
    };

    const handleChange = (index, field, value) => {
        const category = CATEGORIES[tab];
        if (category === "Team Members") {
            const updated = [...members];
            updated[index][field] = value;
            setMembers(updated);
        } else {
            const updated = [...configData[category]];
            updated[index][field] = value;
            setConfigData((prev) => ({
                ...prev,
                [category]: updated
            }));
        }
    };

    const renderTable = () => {
        const category = CATEGORIES[tab];
        const rows = category === "Team Members" ? members : configData[category];

        let headers;
        if (category === "Team Members") headers = ["Name", "ID"];
        else if (category === "Holidays" || category === "Company Days") headers = ["Date", "Description"];
        else headers = ["Member", "Date"];

        return (
            <Table component={Paper} sx={{ mt: 2 }}>
                <TableHead>
                    <TableRow>
                        {headers.map((head) => (
                            <TableCell key={head}>{head}</TableCell>
                        ))}
                        <TableCell>Action</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {rows.map((row, idx) => (
                        <TableRow key={idx}>
                            {headers.map((head, colIdx) => {
                                let field;
                                if (category === "Team Members") field = head === "Name" ? "name" : "id";
                                else field = head.toLowerCase().includes("member") ? "memberId" : head.toLowerCase();

                                const isDate = field === "date";
                                const isDisabled = category === "Team Members" && field === "id";

                                return (
                                    <TableCell key={colIdx}>
                                        {field === "memberId" ? (
                                            <FormControl fullWidth variant="standard">
                                                <InputLabel>Select Member</InputLabel>
                                                <Select
                                                    value={row[field] || ""}
                                                    onChange={(e) => handleChange(idx, field, e.target.value)}
                                                    label="Select Member"
                                                    MenuProps={{ PaperProps: { style: { maxHeight: 200 } } }}
                                                    native={false}
                                                >
                                                    {members.map((m) => (
                                                        <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        ) : (
                                            <TextField
                                                fullWidth
                                                type={isDate ? "date" : "text"}
                                                value={row[field] || ""}
                                                onChange={(e) => handleChange(idx, field, e.target.value)}
                                                variant="standard"
                                                disabled={isDisabled}
                                            />
                                        )}
                                    </TableCell>
                                );
                            })}
                            <TableCell>
                                <IconButton onClick={() => handleDeleteRow(idx)} size="small">
                                    <Delete />
                                </IconButton>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        );
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ mb: 2 }}>
                <ButtonGroup variant="outlined">
                    <Button onClick={() => navigate("/admin/capacity")} variant={location.pathname === "/admin/capacity" ? "contained" : "outlined"}>Capacity Grid</Button>
                    <Button onClick={() => navigate("/admin/panel")} variant={location.pathname === "/admin/panel" ? "contained" : "outlined"}>Admin Panel</Button>
                    <Button onClick={() => navigate("/admin/config")} variant={location.pathname === "/admin/config" ? "contained" : "outlined"}>Config Panel</Button>
                </ButtonGroup>
            </Box>

            <Typography variant="h5">Admin Config Panel</Typography>

            <Tabs value={tab} onChange={(_, val) => setTab(val)} sx={{ mb: 2 }}>
                {CATEGORIES.map((label) => (
                    <Tab key={label} label={label} />
                ))}
            </Tabs>

            {renderTable()}

            <Box sx={{ textAlign: "right", mt: 2 }}>
                <Button variant="outlined" startIcon={<Add />} onClick={handleAddRow}>
                    Add Row
                </Button>
            </Box>
        </Box>
    );
};

export default AdminConfigPanel;