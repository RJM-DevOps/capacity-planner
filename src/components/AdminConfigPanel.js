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
    FormControl,
    Tooltip
} from "@mui/material";
import { Delete, Add, ArrowUpward, ArrowDownward, InfoOutlined } from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { Switch } from "@mui/material";

const CATEGORIES = ["Holidays", "Company Days", "PTO", "LOA", "Other", "Adjustments", "Team Members"];
const STORAGE_KEY = "configData";
const MEMBER_KEY = "memberDirectory";
const SORT_KEY = "sortState";

const defaultData = {
    "Holidays": [],
    "Company Days": [],
    "PTO": [],
    "LOA": [],
    "Other": [],
    "Adjustments": [],
    "Team Members": []
};

const AdminConfigPanel = () => {
    const [tab, setTab] = useState(0);
    const [configData, setConfigData] = useState(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        const parsed = stored ? JSON.parse(stored) : {};
        return { ...defaultData, ...parsed };
    });

    const [members, setMembers] = useState(() => {
        const stored = localStorage.getItem(MEMBER_KEY);
        return stored ? JSON.parse(stored) : [];
    });
    const [sortState, setSortState] = useState(() => {
        const stored = localStorage.getItem(SORT_KEY);
        return stored ? JSON.parse(stored) : {};
    });

    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(configData));
    }, [configData]);

    useEffect(() => {
        localStorage.setItem(MEMBER_KEY, JSON.stringify(members));
    }, [members]);

    useEffect(() => {
        localStorage.setItem(SORT_KEY, JSON.stringify(sortState));
    }, [sortState]);

    const handleAddRow = () => {
        const category = CATEGORIES[tab];
        let newRow;

        if (category === "Holidays" || category === "Company Days") {
            newRow = { date: "", description: "" };
        } else if (category === "Team Members") {
        newRow = { id: uuidv4(), name: "", includeInCalc: true };
        setMembers((prev) => [...prev, newRow]);
            return;
        } else if (category === "Other") {
            newRow = { memberId: "", date: "", comments: "" };
        } else if (category === "Adjustments") {
            newRow = { memberId: "", date: "", reason: "", offset: "" };
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

    const handleSort = (field) => {
        const category = CATEGORIES[tab];
        const current = sortState[category]?.field === field ? sortState[category].direction : null;
        const direction = current === "asc" ? "desc" : "asc";

        const sorted = [...configData[category]].sort((a, b) => {
            let aVal = a[field];
            let bVal = b[field];

            if (field === "memberId") {
                const getName = (id) => members.find((m) => m.id === id)?.name || "";
                aVal = getName(aVal).toLowerCase();
                bVal = getName(bVal).toLowerCase();
            } else {
                aVal = (aVal || '').toLowerCase?.() || aVal;
                bVal = (bVal || '').toLowerCase?.() || bVal;
            }

            if (aVal < bVal) return direction === "asc" ? -1 : 1;
            if (aVal > bVal) return direction === "asc" ? 1 : -1;
            return 0;
        });

        setConfigData((prev) => ({ ...prev, [category]: sorted }));
        setSortState((prev) => ({
            ...prev,
            [category]: { field, direction }
        }));
    };

    const renderTable = () => {
        const category = CATEGORIES[tab];
        const rows = category === "Team Members" ? members : configData[category];

        let headers;
        if (category === "Team Members") headers = ["Name", "ID", "Include in Capacity"];
        else if (category === "Holidays" || category === "Company Days") headers = ["Date", "Description"];
        else if (category === "Other") headers = ["Member", "Date", "Comments"];
        else if (category === "Adjustments") headers = ["Member", "Date", "Reason", "Daily Capacity Hour Offset"];
        else headers = ["Member", "Date"];

        return (
            <Table component={Paper} sx={{ mt: 2 }}>
                <TableHead>
                    <TableRow>
                        {headers.map((head) => {
                            const field = head === "Comments" || head === "Reason" || head === "Daily Capacity Hour Offset"
                                ? head === "Daily Capacity Hour Offset" ? "offset" : head.toLowerCase()
                                : head.toLowerCase().includes("member") ? "memberId" : head.toLowerCase();

                            return (
                                <TableCell key={head} onClick={() => handleSort(field)} sx={{ cursor: "pointer" }}>
                                    {head}
                                    {head === "Daily Capacity Hour Offset" && (
                                        <Tooltip title="Daily adjusted max capacity per team member.">
                                            <InfoOutlined sx={{ fontSize: 16, ml: 0.5 }} />
                                        </Tooltip>
                                    )}
                                    {sortState[category]?.field === field && (
                                        sortState[category].direction === "asc" ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />
                                    )}
                                </TableCell>
                            );
                        })}
                        <TableCell>Action</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {rows.map((row, idx) => (
                        <TableRow key={idx}>
                            {headers.map((head, colIdx) => {
                                let field;
                                if (category === "Team Members") {
                                    if (head === "Name") field = "name";
                                    else if (head === "ID") field = "id";
                                    else if (head === "Include in Capacity") field = "includeInCalc";
                                } else if (
                                    (category === "Other" || category === "Adjustments") &&
                                    (head === "Comments" || head === "Reason" || head === "Daily Capacity Hour Offset")
                                ) {
                                    field = head === "Daily Capacity Hour Offset" ? "offset" : head.toLowerCase();
                                } else {
                                    field = head.toLowerCase().includes("member") ? "memberId" : head.toLowerCase();
                                }

                                const isDate = field === "date";
                                const isDisabled = category === "Team Members" && field === "id";
                                const isNumeric = field === "offset";

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
                                        ) : field === "includeInCalc" ? (
                                            <Switch
                                                checked={!!row[field]}
                                                onChange={(e) => handleChange(idx, field, e.target.checked)}
                                                color="primary"
                                            />
                                        ) : (
                                            <TextField
                                                fullWidth
                                                type={isDate ? "date" : isNumeric ? "number" : "text"}
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
