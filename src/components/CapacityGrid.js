
import React, { useState, useEffect } from "react";
import { Box, Typography, TextField, IconButton, Collapse, Button, MenuItem, Select, Tooltip } from "@mui/material";
import { getPis, setPis } from "../utils/storageProvider";
import { format, eachDayOfInterval, parseISO, isWeekend } from "date-fns";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { calculateSprintCapacity } from "../utils/capacityCalculator";
import "./CapacityGrid.css";

const impactColors = {
    PTO: "#f6be15",
    LOA: "#fb0d05",
    Holiday: "#03c309",
    Company: "#34baf8",
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
    const holidays = config["Holidays"] || [];
    const companyDays = config["Company Days"] || [];
    const adjustments = config["Adjustments"] || [];

    return pis.map((pi) => ({
        ...pi,
        holidays: holidays.map(h => h.date),
        holidayDescriptions: holidays.reduce((acc, h) => ({ ...acc, [h.date]: h.description }), {}),
        companyDays: companyDays.map(d => d.date),
        companyDescriptions: companyDays.reduce((acc, d) => ({ ...acc, [d.date]: d.description }), {}),
        sprints: pi.sprints.map((sprint) => {
            const weekdays = generateSprintDateColumns(sprint.start, sprint.end).filter(d => !isWeekend(parseISO(d.key)));
            const teamDaysOut = weekdays.filter(d => pi.holidays.includes(d.key) || pi.companyDays.includes(d.key)).length;
            const team = (sprint.team || []).map((member) => {
                const memberId = member.memberId || "";
                const ptoDates = ptoData.filter((d) => d.memberId === memberId).map((d) => d.date);
                const loaDates = loaData.filter((d) => d.memberId === memberId).map((d) => d.date);
                const otherDates = otherData.filter((d) => d.memberId === memberId).map((d) => d.date);
                const offset = parseFloat(adjustments.find(a => a.memberId === memberId)?.offset || 0);

                return {
                    ...member,
                    memberId,
                    ptoDates,
                    loaDates,
                    otherDates,
                    ...calculateSprintCapacity({ weekdays, ptoDates, loaDates, otherDates, teamDaysOut, offset })
                };
            });
            return { ...sprint, team };
        })
    }));
};
const CapacityGrid = () => {
    const [configData, setConfigData] = useState({ PTO: [], LOA: [], Other: [], Holidays: [], "Company Days": [], Adjustments: [] });
    const [expandedPIs, setExpandedPIs] = useState(() => JSON.parse(localStorage.getItem("expandedPIs") || "{}"));
    const [expandedSprints, setExpandedSprints] = useState(() => JSON.parse(localStorage.getItem("expandedSprints") || "{}"));
    const [piData, setPiData] = useState([]);
    const [members, setMembers] = useState([]);
    const memberSettings = JSON.parse(localStorage.getItem("memberDirectory") || "[]");

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

    useEffect(() => {
        localStorage.setItem("expandedPIs", JSON.stringify(expandedPIs));
    }, [expandedPIs]);

    useEffect(() => {
        localStorage.setItem("expandedSprints", JSON.stringify(expandedSprints));
    }, [expandedSprints]);

    // ... state and useEffect setup already present above ...

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

    const getDateTooltip = (pi, dateKey) => {
        if (pi.holidays.includes(dateKey)) return `Holiday: ${pi.holidayDescriptions[dateKey] || ""}`;
        if (pi.companyDays.includes(dateKey)) return `Company: ${pi.companyDescriptions[dateKey] || ""}`;
        return "";
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

    const updateMember = async (piIndex, sprintIndex, memberIndex, field, value) => {
        const updated = [...piData];
        updated[piIndex].sprints[sprintIndex].team[memberIndex][field] = value;
        const enriched = enrichPis(updated, configData);
        setPiData(enriched);
        await setPis(enriched);
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
                        //const weekdays = generateSprintDateColumns(sprint.start, sprint.end).filter(d => !isWeekend(parseISO(d.key)));
                        const weekdays = generateSprintDateColumns(sprint.start, sprint.end);
                        const dateColumnCount = weekdays.length;

                        return (
                            <Box key={sprint.id} sx={{ mt: 2, ml: 2 }}>
                                <Box
                                    onClick={() => setExpandedSprints(prev => ({ ...prev, [sprint.id]: !prev[sprint.id] }))}
                                    sx={{ display: "grid", gridTemplateColumns: "185px 150px 150px", backgroundColor: "#d6d5d5", p: 1, fontWeight: "bold", borderTopLeftRadius: 4, borderTopRightRadius: 4, cursor: "pointer" }}
                                >
                                    <Box>{expandedSprints[sprint.id] ? "▼" : "▶"} {sprint.sprint}</Box>
                                    <Box>{format(parseISO(sprint.start), "MM/dd/yy")}</Box>
                                    <Box>{format(parseISO(sprint.end), "MM/dd/yy")}</Box>
                                </Box>

                                <Collapse in={expandedSprints[sprint.id]} timeout="auto" unmountOnExit>
                                    <Box sx={{ mt: 2 }}>
                                        <Box sx={{
                                            margin: 0.5,
                                            display: "grid",
                                            gridTemplateColumns: `155px 125px 160px 180px 180px 80px 80px 80px 10px repeat(${dateColumnCount}, 41px) 40px`,
                                            fontWeight: "bold",
                                            fontSize: 14,
                                            backgroundColor: "#f0f0f0",
                                            p: 1
                                        }}>
                                            <Box>Member</Box>
                                            <Box sx={{ textAlign: "center" }}>Team Days <br />Out</Box>
                                            <Box sx={{ textAlign: "center" }}>Individual <br />Days Out</Box>
                                            <Box sx={{ textAlign: "center" }}>Individual <br />Days Avail</Box>
                                            <Box sx={{ textAlign: "center" }}>Total <br />Capacity</Box>
                                            <Box sx={{ textAlign: "center" }}>Estimated<br />Velocity</Box>
                                            <Box sx={{ textAlign: "center" }}>Planned</Box>
                                            <Box sx={{ textAlign: "center" }}>Actual</Box>
                                            <Box />
                                            {weekdays.map(({ label, date, key }, i) => {
                                                const bgColor = pi.holidays.includes(key)
                                                    ? impactColors.Holiday
                                                    : pi.companyDays.includes(key)
                                                        ? impactColors.Company
                                                        : "transparent";
                                                const tooltip = getDateTooltip(pi, key);
                                                return (
                                                    <Tooltip
                                                        key={i}
                                                        title={tooltip}
                                                        disableHoverListener={!tooltip}
                                                        componentsProps={{ tooltip: { sx: { fontSize: 16 } } }}
                                                    >
                                                        <Box
                                                            sx={{
                                                                textAlign: "center",
                                                                backgroundColor: bgColor,
                                                                borderLeft: i !== 0 ? "4px solid #ccc" : "none"
                                                            }}
                                                        >
                                                            <div>{label}</div>
                                                            <div style={{ fontSize: "0.75rem", color: "#666" }}>{date}</div>
                                                        </Box>
                                                    </Tooltip>
                                                );
                                            })}
                                            <Box />
                                        </Box>
                                        {/** Member Rows */}
                                        {sprint.team.map((member, i) => (
                                            <Box key={i} sx={{
                                                margin: 0.5,
                                                display: "grid",
                                                gridTemplateColumns: `155px 125px 160px 180px 180px 80px 80px 80px 10px repeat(${dateColumnCount}, 41px) 40px`,
                                                p: 1,
                                                borderBottom: "1px solid #ddd"
                                            }}>
                                                <Box sx={{ display: "flex", alignItems: "center" }}>
                                                    {!memberSettings.find((m) => m.id === member.memberId)?.includeInCalc && (
                                                        <Tooltip title="Excluded from Capacity"
                                                                 componentsProps={{ tooltip: { sx: { fontSize: 16 } } }}
                                                        >
                                                            <WarningAmberIcon fontSize="small" sx={{ color: "#f69c15", mr: 1 }} />
                                                        </Tooltip>
                                                    )}
                                                    <Select
                                                        value={member.memberId}
                                                        onChange={(e) => updateMember(piIndex, sprintIndex, i, "memberId", e.target.value)}
                                                        variant="standard"
                                                        displayEmpty
                                                        sx={{ flex: 1 }}
                                                    >
                                                        <MenuItem value=""><em>Select</em></MenuItem>
                                                        {members.map((m) => (
                                                            <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>
                                                        ))}
                                                    </Select>
                                                </Box>
                                                <TextField variant="standard" value={member.teamDaysOut} inputProps={{ style: { textAlign: 'center' }, readOnly: true }} />
                                                <TextField variant="standard" value={member.individualDaysOut} inputProps={{ style: { textAlign: 'center' }, readOnly: true }} />
                                                <TextField variant="standard" value={member.individualDaysAvail} inputProps={{ style: { textAlign: 'center' }, readOnly: true }} />
                                                <TextField variant="standard" value={member.capacity} inputProps={{ style: { textAlign: 'center' }, readOnly: true }} />
                                                <TextField variant="standard" value={member.p2h} inputProps={{ style: { textAlign: 'center' }, readOnly: true }} />
                                                <TextField variant="standard" value={member.plannedVelocity || ""} onChange={(e) => updateMember(piIndex, sprintIndex, i, "plannedVelocity", e.target.value)} inputProps={{ style: { textAlign: 'center' } }} />
                                                <TextField variant="standard" value={member.actualVelocity || ""} onChange={(e) => updateMember(piIndex, sprintIndex, i, "actualVelocity", e.target.value)} inputProps={{ style: { textAlign: 'center' } }} />
                                                <Box />
                                                {weekdays.map(({ key }, idx) => {
                                                    const bgColor = getImpactColor(member, key);
                                                    const impactType = getImpactType(member, key);
                                                    const isWeekendDay = isWeekend(parseISO(key));
                                                    const background = bgColor !== "#e0e0e0" ? bgColor : isWeekendDay ? "#d3d3d3" : "transparent"; // light gray for weekends
                                                    const isNeutral = !impactType;
                                                    return (
                                                        <Tooltip
                                                            key={idx}
                                                            title={impactType || ""}
                                                            disableHoverListener={!impactType}
                                                            componentsProps={{ tooltip: { sx: { fontSize: 16 } } }}
                                                        >
                                                            <Box sx={{
                                                                backgroundColor: isNeutral ? (isWeekend(parseISO(key)) ? "#d3d3d3" : "transparent") : bgColor, //if not pto, loa, other set transparent or if weekend then gray
                                                                borderRadius: 1,
                                                                textAlign: "center",
                                                                py: 0.5,
                                                                //border: isNeutral ? "1px solid gray" : "none",
                                                                border: "1px solid gray",
                                                                borderLeft: idx !== 0 ? "4px solid white" : "none"
                                                            }}>
                                                                &nbsp;
                                                            </Box>
                                                        </Tooltip>
                                                    );
                                                })}
                                                <IconButton onClick={async () => {
                                                    const updated = [...piData];
                                                    updated[piIndex].sprints[sprintIndex].team.splice(i, 1);
                                                    const enriched = enrichPis(updated, configData);
                                                    setPiData(enriched);
                                                    await setPis(enriched);
                                                }} size="small">
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        ))}

                                        {/** Sprint Total Velocity Row */}
                                        {(() => {
                                            const totalVelocity = sprint.team.reduce((sum, member) => {
                                                const isIncluded = memberSettings.find((m) => m.id === member.memberId)?.includeInCalc !== false;
                                                return isIncluded ? sum + (parseFloat(member.estimatedVelocity || 0) || 0) : sum;
                                            }, 0);


                                            return (
                                                <Box sx={{
                                                    margin: 0.5,
                                                    display: "grid",
                                                    gridTemplateColumns: `155px 125px 160px 180px 180px 80px 80px 80px 10px repeat(${dateColumnCount}, 41px) 40px`,
                                                    fontWeight: "bold",
                                                    backgroundColor: "#F0F0F0",
                                                    p: 1,
                                                    borderTop: "2px solid #aaa"
                                                }}>
                                                    <Box>Total</Box>
                                                    <Box />
                                                    <Box />
                                                    <Box />
                                                    <Box />
                                                    <Box sx={{ textAlign: "center" }}>{totalVelocity}</Box>
                                                    <Box />
                                                    <Box />
                                                    <Box />
                                                    {weekdays.map((_, idx) => (
                                                        <Box key={idx} />
                                                    ))}
                                                    <Box />
                                                </Box>
                                            );
                                        })()}
                                        <Box sx={{ textAlign: "right", mt: 1 }}>
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                startIcon={<AddIcon />}
                                                onClick={async () => {
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
                                                    const enriched = enrichPis(updated, configData);
                                                    setPiData(enriched);
                                                    await setPis(enriched);
                                                }}
                                            >
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