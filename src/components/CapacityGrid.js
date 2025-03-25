import React, { useState, useEffect } from "react";
import { Box, Typography, TextField, IconButton, Collapse, Button, MenuItem, Select } from "@mui/material";
import { getPis, setPis } from "../utils/StorageProvider";
import { format, eachDayOfInterval, parseISO } from "date-fns";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import "./CapacityGrid.css";

const impactColors = {
    PTO: "#f69c15",
    LOA: "#fb0d05",
    Holiday: "#03c309",
    Company: "#1f84fc",
    Other: "#fb05cc"
};

const generateSprintDateColumns = (start, end) => {
    try {
        return eachDayOfInterval({ start: parseISO(start), end: parseISO(end) }).map((date) => ({
            key: format(date, "yyyy-MM-dd"),
            label: format(date, "EEE"),
            date: format(date, "M/d"),
        }));
    } catch {
        return [];
    }
};

const enrichPis = (pis, config) => {
    const ptoData = config.PTO || [];
    const loaData = config.LOA || [];
    const otherData = config.Other || [];

    return pis.map((pi) => ({
        ...pi,
        holidays: pi.holidays || [],
        companyDays: pi.companyDays || [],
        sprints: pi.sprints.map((sprint) => ({
            ...sprint,
            team: (sprint.team || []).map((member) => {
                const memberId = member.memberId || "";
                return {
                    ...member,
                    ptoDates: ptoData.filter((d) => d.memberId === memberId).map((d) => d.date),
                    loaDates: loaData.filter((d) => d.memberId === memberId).map((d) => d.date),
                    otherDates: otherData.filter((d) => d.memberId === memberId).map((d) => d.date)
                };
            })
        }))
    }));
};

const CapacityGrid = () => {
    const [configData, setConfigData] = useState({ PTO: [], LOA: [], Other: [] });
    const [expandedPIs, setExpandedPIs] = useState({});
    const [expandedSprints, setExpandedSprints] = useState({});
    const [piData, setPiData] = useState([]);
    const [members, setMembers] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            const storedMembers = localStorage.getItem("memberDirectory");
            if (storedMembers) {
                setMembers(JSON.parse(storedMembers));
            }

            const config = JSON.parse(localStorage.getItem("configData") || "{}");
            setConfigData(config);

            const pis = await getPis();
            const enriched = enrichPis(pis || [], config);
            setPiData(enriched);
        };

        fetchData();
    }, []);

    const updateMember = async (piIndex, sprintIndex, memberIndex, field, value) => {
        const updated = [...piData];
        updated[piIndex].sprints[sprintIndex].team[memberIndex][field] = value;
        setPiData(updated);

        const enriched = enrichPis(updated, configData);
        await setPis(enriched);
    };

    const getImpactColor = (member, dateKey) => {
        if ((member.ptoDates || []).includes(dateKey)) return impactColors.PTO;
        if ((member.loaDates || []).includes(dateKey)) return impactColors.LOA;
        if ((member.otherDates || []).includes(dateKey)) return impactColors.Other;
        return "#e0e0e0";
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>Capacity Planning Grid</Typography>
            {piData.map((pi, piIndex) => (
                <Box key={pi.id} sx={{ mb: 3 }}>
                    <Box
                        onClick={() => setExpandedPIs((prev) => ({ ...prev, [pi.id]: !prev[pi.id] }))}
                        sx={{ display: "grid", gridTemplateColumns: "200px 150px 150px", fontWeight: "bold", backgroundColor: "#a8a9ab", p: 1, borderRadius: 1, cursor: "pointer" }}
                    >
                        <Box>{expandedPIs[pi.id] ? "▼" : "▶"} {pi.pi}</Box>
                        <Box>{format(parseISO(pi.start), "MM/dd/yy")}</Box>
                        <Box>{format(parseISO(pi.end), "MM/dd/yy")}</Box>
                    </Box>

                    {expandedPIs[pi.id] && pi.sprints?.map((sprint, sprintIndex) => {
                        const weekdays = generateSprintDateColumns(sprint.start, sprint.end);
                        const dateColumnCount = weekdays.length;

                        return (
                            <Box key={sprint.id} sx={{ mt: 2, ml: 2 }}>
                                <Box
                                    onClick={() => setExpandedSprints((prev) => ({ ...prev, [sprint.id]: !prev[sprint.id] }))}
                                    sx={{ display: "grid", gridTemplateColumns: "185px 150px 150px", backgroundColor: "#e0e0e0", p: 1, fontWeight: "bold", borderTopLeftRadius: 4, borderTopRightRadius: 4, cursor: "pointer" }}
                                >
                                    <Box>{expandedSprints[sprint.id] ? "▼" : "▶"} {sprint.sprint}</Box>
                                    <Box>{format(parseISO(sprint.start), "MM/dd/yy")}</Box>
                                    <Box>{format(parseISO(sprint.end), "MM/dd/yy")}</Box>
                                </Box>

                                <Collapse in={expandedSprints[sprint.id]} timeout="auto" unmountOnExit>
                                    <Box sx={{ mt: 1 }}>
                                        <Box sx={{ margin: 1, display: "grid", gridTemplateColumns: `175px 140px 180px 180px 180px 80px 80px 80px repeat(${dateColumnCount}, 40px) 40px`, fontWeight: "bold", backgroundColor: "#f0f0f0", p: 1 }}>
                                            <Box>Member</Box>
                                            <Box>Team Days Out</Box>
                                            <Box>Individual Days Out</Box>
                                            <Box>Individual Days Avail</Box>
                                            <Box>Total Capacity</Box>
                                            <Box>Estimate</Box>
                                            <Box>Planned</Box>
                                            <Box>Actual</Box>
                                            {weekdays.map(({ label, date, key }, i) => (
                                                <Box
                                                    key={i}
                                                    sx={{ textAlign: "center", backgroundColor: pi.holidays.includes(key) ? impactColors.Holiday : pi.companyDays.includes(key) ? impactColors.Company : "transparent" }}
                                                >
                                                    <div>{label}</div>
                                                    <div style={{ fontSize: "0.75rem", color: "#666" }}>{date}</div>
                                                </Box>
                                            ))}
                                            <Box />
                                        </Box>

                                        {sprint.team.map((member, i) => (
                                            <Box key={i} sx={{ margin: 1, display: "grid", gridTemplateColumns: `175px 140px 180px 180px 180px 80px 80px 80px repeat(${dateColumnCount}, 40px) 40px`, p: 1, borderBottom: "1px solid #ddd" }}>
                                                <Select
                                                    value={member.memberId}
                                                    onChange={(e) => updateMember(piIndex, sprintIndex, i, "memberId", e.target.value)}
                                                    variant="standard"
                                                    displayEmpty
                                                >
                                                    <MenuItem value=""><em>Select</em></MenuItem>
                                                    {members.map((m) => (
                                                        <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>
                                                    ))}
                                                </Select>
                                                <TextField variant="standard" value={member.teamDaysOut} onChange={(e) => updateMember(piIndex, sprintIndex, i, "teamDaysOut", e.target.value)} inputProps={{ style: { textAlign: 'right' } }} />
                                                <TextField variant="standard" value={member.individualDaysOut} onChange={(e) => updateMember(piIndex, sprintIndex, i, "individualDaysOut", e.target.value)} inputProps={{ style: { textAlign: 'right' } }} />
                                                <TextField variant="standard" value={member.individualDaysAvail} onChange={(e) => updateMember(piIndex, sprintIndex, i, "individualDaysAvail", e.target.value)} inputProps={{ style: { textAlign: 'right' } }} />
                                                <TextField variant="standard" value={member.capacity} onChange={(e) => updateMember(piIndex, sprintIndex, i, "capacity", e.target.value)} inputProps={{ style: { textAlign: 'right' } }} />
                                                <TextField variant="standard" value={member.p2h} onChange={(e) => updateMember(piIndex, sprintIndex, i, "p2h", e.target.value)} inputProps={{ style: { textAlign: 'right' } }} />
                                                <TextField variant="standard" value={member.plannedVelocity} onChange={(e) => updateMember(piIndex, sprintIndex, i, "plannedVelocity", e.target.value)} inputProps={{ style: { textAlign: 'right' } }} />
                                                <TextField variant="standard" value={member.actualVelocity} onChange={(e) => updateMember(piIndex, sprintIndex, i, "actualVelocity", e.target.value)} inputProps={{ style: { textAlign: 'right' } }} />
                                                {weekdays.map(({ key }, idx) => (
                                                    <Box key={idx} sx={{ backgroundColor: getImpactColor(member, key), borderRadius: 1, textAlign: "center", py: 0.5 }}>
                                                        &nbsp;
                                                    </Box>
                                                ))}
                                                <IconButton onClick={async () => {
                                                    const updated = [...piData];
                                                    updated[piIndex].sprints[sprintIndex].team.splice(i, 1);
                                                    setPiData(updated);

                                                    const enriched = enrichPis(updated, configData);
                                                    await setPis(enriched);
                                                }} size="small">
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        ))}

                                        <Box sx={{ textAlign: "right", mt: 1 }}>
                                            <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={async () => {
                                                const updated = [...piData];
                                                updated[piIndex].sprints[sprintIndex].team.push({
                                                    memberId: "",
                                                    teamDaysOut: 0,
                                                    individualDaysOut: 0,
                                                    individualDaysAvail: 0,
                                                    capacity: 0,
                                                    p2h: 0,
                                                    plannedVelocity: 0,
                                                    actualVelocity: 0
                                                });
                                                setPiData(updated);

                                                const enriched = enrichPis(updated, configData);
                                                await setPis(enriched);
                                            }}>
                                                Add Member
                                            </Button>
                                        </Box>
                                    </Box>
                                </Collapse>
                            </Box>
                        );
                    })}
                </Box>
            ))}
        </Box>
    );
};

export default CapacityGrid;
