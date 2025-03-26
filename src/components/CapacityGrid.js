import React, { useState, useEffect } from "react";
import { Box, Typography, TextField, IconButton, Collapse, Button, MenuItem, Select, Tooltip } from "@mui/material";
import { getPis, setPis } from "../utils/StorageProvider";
import { format, eachDayOfInterval, parseISO } from "date-fns";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import "./CapacityGrid.css";

const impactColors = {
    PTO: "#f69c15",
    LOA: "#fb0d05",
    Holiday: "#03c309",
    Company: "#1f84fc",
    Other: "#fb05cc"
};

const getColorType = (color) => {
    return Object.keys(impactColors).find(key => impactColors[key] === color);
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
    const holidays = config["Holidays"]?.map(h => h.date) || [];
    const companyDays = config["Company Days"]?.map(d => d.date) || [];

    return pis.map((pi) => ({
        ...pi,
        holidays,
        companyDays,
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
    const [configData, setConfigData] = useState({ PTO: [], LOA: [], Other: [], Holidays: [], "Company Days": [] });
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

    const getImpactType = (member, dateKey) => {
        if ((member.ptoDates || []).includes(dateKey)) return "PTO";
        if ((member.loaDates || []).includes(dateKey)) return "LOA";
        if ((member.otherDates || []).includes(dateKey)) return "Other";
        return null;
    };

    const toggleAllSprints = (piId, expand) => {
        const pi = piData.find(p => p.id === piId);
        if (!pi) return;
        const updates = {};
        for (let sprint of pi.sprints) {
            updates[sprint.id] = expand;
        }
        setExpandedSprints(prev => ({ ...prev, ...updates }));
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>Capacity Planning Grid</Typography>
            {piData.map((pi, piIndex) => (
                <Box key={pi.id} sx={{ mb: 3 }}>
                    <Box sx={{ display: "grid", gridTemplateColumns: "200px 150px 150px 1fr", fontWeight: "bold", backgroundColor: "#a8a9ab", p: 1, borderRadius: 1 }}>
                        <Box onClick={() => setExpandedPIs(prev => ({ ...prev, [pi.id]: !prev[pi.id] }))} sx={{ cursor: "pointer" }}>
                            {expandedPIs[pi.id] ? "▼" : "▶"} {pi.pi}
                        </Box>
                        <Box>{format(parseISO(pi.start), "MM/dd/yy")}</Box>
                        <Box>{format(parseISO(pi.end), "MM/dd/yy")}</Box>
                        <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
                            <Button
                                size="small"
                                onClick={() => toggleAllSprints(pi.id, !Object.values(expandedSprints).some(v => v))}
                                startIcon={Object.values(expandedSprints).some(v => v) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                sx={{ color: "white", borderColor: "white" }}
                                variant="outlined"
                            >
                                Toggle Sprints
                            </Button>
                        </Box>

                    </Box>

                    {expandedPIs[pi.id] && pi.sprints.map((sprint, sprintIndex) => {
                        const weekdays = generateSprintDateColumns(sprint.start, sprint.end);
                        const dateColumnCount = weekdays.length;

                        return (
                            <Box key={sprint.id} sx={{ mt: 2, ml: 2 }}>
                                <Box
                                    onClick={() => setExpandedSprints(prev => ({ ...prev, [sprint.id]: !prev[sprint.id] }))}
                                    sx={{ display: "grid", gridTemplateColumns: "185px 150px 150px", backgroundColor: "#e0e0e0", p: 1, fontWeight: "bold", borderTopLeftRadius: 4, borderTopRightRadius: 4, cursor: "pointer" }}
                                >
                                    <Box>{expandedSprints[sprint.id] ? "▼" : "▶"} {sprint.sprint}</Box>
                                    <Box>{format(parseISO(sprint.start), "MM/dd/yy")}</Box>
                                    <Box>{format(parseISO(sprint.end), "MM/dd/yy")}</Box>
                                </Box>

                                <Collapse in={expandedSprints[sprint.id]} timeout="auto" unmountOnExit>
                                    <Box sx={{ mt: 2 }}>
                                        <Box sx={{ margin: .5, display: "grid", gridTemplateColumns: `155px 125px 160px 180px 180px 80px 80px 80px 10px repeat(${dateColumnCount}, 41px) 40px`, fontWeight: "bold", fontSize: 14, backgroundColor: "#f0f0f0", p: 1 }}>
                                            <Box>Member</Box>
                                            <Box sx={{ textAlign: "center" }}>Team Days <br />Out</Box>
                                            <Box sx={{ textAlign: "center" }}>Individual <br />Days Out</Box>
                                            <Box sx={{ textAlign: "center" }}>Individual <br />Days Avail</Box>
                                            <Box sx={{ textAlign: "center" }}>Total Capacity</Box>
                                            <Box sx={{ textAlign: "center" }}>Estimate</Box>
                                            <Box sx={{ textAlign: "center" }}>Planned</Box>
                                            <Box sx={{ textAlign: "center" }}>Actual</Box>
                                            <Box />
                                            {weekdays.map(({ label, date, key }, i) => {
                                                const bgColor = pi.holidays.includes(key) ? impactColors.Holiday : pi.companyDays.includes(key) ? impactColors.Company : "transparent";
                                                let tooltip = "";
                                                if (pi.holidays.includes(key)) {
                                                    const match = configData["Holidays"]?.find(h => h.date === key);
                                                    tooltip = `Holiday: ${match?.description || ""}`;
                                                } else if (pi.companyDays.includes(key)) {
                                                    const match = configData["Company Days"]?.find(d => d.date === key);
                                                    tooltip = `Company: ${match?.description || ""}`;
                                                }
                                                return (
                                                    <Tooltip key={i} title={tooltip} disableHoverListener={!tooltip}>

                                                    <Box sx={{ textAlign: "center", backgroundColor: bgColor, borderLeft: i !== 0 ? "4px solid #ccc" : "none" }}>
                                                            <div>{label}</div>
                                                            <div style={{ fontSize: "0.75rem", color: "#666" }}>{date}</div>
                                                        </Box>
                                                    </Tooltip>
                                                );
                                            })}
                                            <Box />
                                        </Box>

                                        {sprint.team.map((member, i) => (
                                            <Box key={i} sx={{ margin: .5, display: "grid", gridTemplateColumns: `155px 125px 160px 180px 180px 80px 80px 80px 10px repeat(${dateColumnCount}, 41px) 40px`, p: 1, borderBottom: "1px solid #ddd" }}>
                                                <Select value={member.memberId} onChange={(e) => updateMember(piIndex, sprintIndex, i, "memberId", e.target.value)} variant="standard" displayEmpty>
                                                    <MenuItem value=""><em>Select</em></MenuItem>
                                                    {members.map((m) => (
                                                        <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>
                                                    ))}
                                                </Select>
                                                <TextField variant="standard" value={member.teamDaysOut} onChange={(e) => updateMember(piIndex, sprintIndex, i, "teamDaysOut", e.target.value)} inputProps={{ style: { textAlign: 'center' } }} />
                                                <TextField variant="standard" value={member.individualDaysOut} onChange={(e) => updateMember(piIndex, sprintIndex, i, "individualDaysOut", e.target.value)} inputProps={{ style: { textAlign: 'center' } }} />
                                                <TextField variant="standard" value={member.individualDaysAvail} onChange={(e) => updateMember(piIndex, sprintIndex, i, "individualDaysAvail", e.target.value)} inputProps={{ style: { textAlign: 'center' } }} />
                                                <TextField variant="standard" value={member.capacity} onChange={(e) => updateMember(piIndex, sprintIndex, i, "capacity", e.target.value)} inputProps={{ style: { textAlign: 'center' } }} />
                                                <TextField variant="standard" value={member.p2h} onChange={(e) => updateMember(piIndex, sprintIndex, i, "p2h", e.target.value)} inputProps={{ style: { textAlign: 'center' } }} />
                                                <TextField variant="standard" value={member.plannedVelocity} onChange={(e) => updateMember(piIndex, sprintIndex, i, "plannedVelocity", e.target.value)} inputProps={{ style: { textAlign: 'center' } }} />
                                                <TextField variant="standard" value={member.actualVelocity} onChange={(e) => updateMember(piIndex, sprintIndex, i, "actualVelocity", e.target.value)} inputProps={{ style: { textAlign: 'center' } }} />
                                                <Box />
                                                {weekdays.map(({ key }, idx) => {
                                                    const bgColor = getImpactColor(member, key);
                                                    const impactType = getImpactType(member, key);
                                                    return (
                                                        <Tooltip key={idx} title={impactType || ""} disableHoverListener={!impactType}>
                                                            <Box sx={{ backgroundColor: bgColor, borderRadius: 1, textAlign: "center", py: 0.5, borderLeft: idx !== 0 ? "4px solid white" : "none" }}>
                                                                &nbsp;
                                                            </Box>
                                                        </Tooltip>
                                                    );
                                                })}
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
