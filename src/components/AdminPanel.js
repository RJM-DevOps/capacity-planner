import React, { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Button,
    TextField,
    TableContainer,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Paper,
    IconButton
} from "@mui/material";
import { Add, Delete } from "@mui/icons-material";
import { format, addDays, eachDayOfInterval, parseISO } from "date-fns";

const AdminPanel = ({ addPi, pis }) => {
    const [newPi, setNewPi] = useState({ name: "", start: "", end: "" });
    const [piList, setPiList] = useState([]);

    useEffect(() => {
        setPiList(pis);
    }, [pis]);

    const handleAddPi = () => {
        if (newPi.name && newPi.start && newPi.end) {
            const newEntry = {
                id: Date.now().toString(),
                pi: newPi.name,
                start: newPi.start,
                end: newPi.end,
                sprints: [
                    {
                        id: Date.now().toString() + "-s1",
                        sprint: "Sprint 1",
                        start: newPi.start,
                        end: newPi.end,
                        who: "",
                        teamDaysOut: 0,
                        individualDaysOut: 0,
                        individualDaysAvail: 0,
                        capacity: 0,
                        p2h: 0,
                        plannedVelocity: 0,
                        actualVelocity: 0
                    }
                ]
            };
            addPi(newEntry);
            setNewPi({ name: "", start: "", end: "" });
        }
    };

    const handlePiChange = (index, field, value) => {
        const updatedList = [...piList];
        updatedList[index][field] = value;
        setPiList(updatedList);
        localStorage.setItem("pis", JSON.stringify(updatedList));
    };

    const handleSprintChange = (piIndex, sprintIndex, field, value) => {
        const updatedList = [...piList];
        updatedList[piIndex].sprints[sprintIndex][field] = value;
        setPiList(updatedList);
        localStorage.setItem("pis", JSON.stringify(updatedList));
    };

    const handleAddSprint = (piIndex) => {
        const updatedList = [...piList];
        const newSprint = {
            id: Date.now().toString(),
            sprint: "New Sprint",
            start: "",
            end: "",
            who: "",
            teamDaysOut: 0,
            individualDaysOut: 0,
            individualDaysAvail: 0,
            capacity: 0,
            p2h: 0,
            plannedVelocity: 0,
            actualVelocity: 0
        };
        updatedList[piIndex].sprints.push(newSprint);
        setPiList(updatedList);
        localStorage.setItem("pis", JSON.stringify(updatedList));
    };

    const handleDeleteSprint = (piIndex, sprintIndex) => {
        const updatedList = [...piList];
        updatedList[piIndex].sprints.splice(sprintIndex, 1);
        setPiList(updatedList);
        localStorage.setItem("pis", JSON.stringify(updatedList));
    };

    const generateSprintDateColumns = (start, end) => {
        try {
            const startDate = parseISO(start);
            const endDate = parseISO(end);
            return eachDayOfInterval({ start: startDate, end: endDate }).map((date) => format(date, "EEE"));
        } catch (e) {
            return [];
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>Admin Panel</Typography>

            <Box sx={{ mt: 4 }}>
                <Typography variant="h6">Manage Program Increments (PIs)</Typography>
                <TextField
                    label="PI Name"
                    value={newPi.name}
                    onChange={(e) => setNewPi({ ...newPi, name: e.target.value })}
                    sx={{ mr: 2, mb: 2 }}
                />
                <TextField
                    label="Start Date"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    value={newPi.start}
                    onChange={(e) => setNewPi({ ...newPi, start: e.target.value })}
                    sx={{ mr: 2, mb: 2 }}
                />
                <TextField
                    label="End Date"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    value={newPi.end}
                    onChange={(e) => setNewPi({ ...newPi, end: e.target.value })}
                    sx={{ mr: 2, mb: 2 }}
                />
                <Button variant="contained" onClick={handleAddPi}>Add PI</Button>

                {piList.length > 0 && (
                    <TableContainer component={Paper} sx={{ mt: 3 }}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>PI Name</TableCell>
                                    <TableCell>Start Date</TableCell>
                                    <TableCell>End Date</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {piList.map((pi, piIndex) => (
                                    <React.Fragment key={pi.id}>
                                        <TableRow>
                                            <TableCell>
                                                <TextField
                                                    value={pi.pi}
                                                    onChange={(e) => handlePiChange(piIndex, "pi", e.target.value)}
                                                    variant="standard"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <TextField
                                                    type="date"
                                                    value={pi.start}
                                                    onChange={(e) => handlePiChange(piIndex, "start", e.target.value)}
                                                    variant="standard"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <TextField
                                                    type="date"
                                                    value={pi.end}
                                                    onChange={(e) => handlePiChange(piIndex, "end", e.target.value)}
                                                    variant="standard"
                                                />
                                            </TableCell>
                                        </TableRow>
                                        <TableRow sx={{ backgroundColor: "#eee" }}>
                                            <TableCell colSpan={12}>
                                                <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Sprints</Typography>
                                            </TableCell>
                                        </TableRow>
                                        <TableRow sx={{ backgroundColor: "#f0f0f0" }}>
                                            <TableCell>Sprint</TableCell>
                                            <TableCell>Start</TableCell>
                                            <TableCell>Finish</TableCell>
                                            <TableCell>Who</TableCell>
                                            <TableCell>Team Days Out</TableCell>
                                            <TableCell>Individual Days Out</TableCell>
                                            <TableCell>Individual Days Avail</TableCell>
                                            <TableCell>Total Capacity</TableCell>
                                            <TableCell>Estimate</TableCell>
                                            <TableCell>Planned</TableCell>
                                            <TableCell>Actual</TableCell>
                                            <TableCell>Days</TableCell>
                                        </TableRow>
                                        {pi.sprints.map((sprint, sprintIndex) => {
                                            const weekdayHeaders = generateSprintDateColumns(sprint.start, sprint.end);
                                            return (
                                                <TableRow key={sprint.id} sx={{ backgroundColor: "#f5f5f5" }}>
                                                    <TableCell>
                                                        <TextField
                                                            value={sprint.sprint}
                                                            onChange={(e) => handleSprintChange(piIndex, sprintIndex, "sprint", e.target.value)}
                                                            variant="standard"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <TextField
                                                            type="date"
                                                            value={sprint.start}
                                                            onChange={(e) => handleSprintChange(piIndex, sprintIndex, "start", e.target.value)}
                                                            variant="standard"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <TextField
                                                            type="date"
                                                            value={sprint.end}
                                                            onChange={(e) => handleSprintChange(piIndex, sprintIndex, "end", e.target.value)}
                                                            variant="standard"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <TextField
                                                            value={sprint.who}
                                                            onChange={(e) => handleSprintChange(piIndex, sprintIndex, "who", e.target.value)}
                                                            variant="standard"
                                                        />
                                                    </TableCell>
                                                    <TableCell><TextField value={sprint.teamDaysOut} onChange={(e) => handleSprintChange(piIndex, sprintIndex, "teamDaysOut", e.target.value)} variant="standard" /></TableCell>
                                                    <TableCell><TextField value={sprint.individualDaysOut} onChange={(e) => handleSprintChange(piIndex, sprintIndex, "individualDaysOut", e.target.value)} variant="standard" /></TableCell>
                                                    <TableCell><TextField value={sprint.individualDaysAvail} onChange={(e) => handleSprintChange(piIndex, sprintIndex, "individualDaysAvail", e.target.value)} variant="standard" /></TableCell>
                                                    <TableCell><TextField value={sprint.capacity} onChange={(e) => handleSprintChange(piIndex, sprintIndex, "capacity", e.target.value)} variant="standard" /></TableCell>
                                                    <TableCell><TextField value={sprint.p2h} onChange={(e) => handleSprintChange(piIndex, sprintIndex, "p2h", e.target.value)} variant="standard" /></TableCell>
                                                    <TableCell><TextField value={sprint.plannedVelocity} onChange={(e) => handleSprintChange(piIndex, sprintIndex, "plannedVelocity", e.target.value)} variant="standard" /></TableCell>
                                                    <TableCell><TextField value={sprint.actualVelocity} onChange={(e) => handleSprintChange(piIndex, sprintIndex, "actualVelocity", e.target.value)} variant="standard" /></TableCell>
                                                    <TableCell>
                                                        <Box sx={{ display: "flex", gap: 1 }}>
                                                            {weekdayHeaders.map((day, i) => (
                                                                <Box
                                                                    key={i}
                                                                    sx={{
                                                                        px: 1,
                                                                        py: 0.5,
                                                                        borderRadius: "4px",
                                                                        backgroundColor: "#e0e0e0",
                                                                        fontSize: "0.75rem"
                                                                    }}
                                                                >
                                                                    {day}
                                                                </Box>
                                                            ))}
                                                            <IconButton onClick={() => handleAddSprint(piIndex)} size="small" color="primary">
                                                                <Add fontSize="small" />
                                                            </IconButton>
                                                            <IconButton onClick={() => handleDeleteSprint(piIndex, sprintIndex)} size="small" color="error">
                                                                <Delete fontSize="small" />
                                                            </IconButton>
                                                        </Box>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </React.Fragment>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Box>
        </Box>
    );
};

export default AdminPanel;
