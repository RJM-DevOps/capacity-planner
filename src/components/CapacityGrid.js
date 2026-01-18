import React, { useState, useEffect, useRef } from "react";
import { Box, Typography, TextField, IconButton, Collapse, Button, MenuItem, Select, Tooltip, Switch, FormControlLabel } from "@mui/material";
import { getPis, setPis } from "../utils/storageProvider";
import { format, eachDayOfInterval, parseISO, isWeekend } from "date-fns";
import { motion } from "framer-motion";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { calculateSprintCapacity } from "../utils/capacityCalculator";
import { getSprintTotalCapacity } from "../utils/capacityCalculator";
import GlobalMenu from "./GlobalMenu";
import "./CapacityGrid.css";

const today = new Date();
today.setHours(0, 0, 0, 0); // normalize to midnight

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

const generateSprintDateColumns = (start, end, includeWeekends = true) => {
    try {
        return eachDayOfInterval({ start: parseISO(start), end: parseISO(end) })
            .filter(date => includeWeekends || !isWeekend(date))
            .map((date) => ({
                key: format(date, "yyyy-MM-dd"),
                label: format(date, "EEE"),
                date: format(date, "M/d"),
            }));
    } catch {
        return [];
    }
};

const enrichPis = (pis, config) => {
    const ptoData = Array.isArray(config.PTO) ? config.PTO : [];
    const loaData = Array.isArray(config.LOA) ? config.LOA : [];
    const otherData = Array.isArray(config.Other) ? config.Other : [];
    const holidays = Array.isArray(config["Holidays"]) ? config["Holidays"] : [];
    const companyDays = Array.isArray(config["Company Days"]) ? config["Company Days"] : [];
    const adjustments = Array.isArray(config["Adjustments"]) ? config["Adjustments"] : [];

    const memberDirectory = JSON.parse(localStorage.getItem("memberDirectory") || "[]");

    return pis.map((pi) => ({
        ...pi,
        holidays: holidays.map(h => h.date),
        holidayDescriptions: holidays.reduce((acc, h) => ({ ...acc, [h.date]: h.description }), {}),
        companyDays: companyDays.map(d => d.date),
        companyDescriptions: companyDays.reduce((acc, d) => ({ ...acc, [d.date]: d.description }), {}),
        sprints: pi.sprints.map((sprint) => {
            const weekdays = generateSprintDateColumns(sprint.start, sprint.end).filter(d => !isWeekend(parseISO(d.key)));
            const teamDaysOut = weekdays.filter(d => (pi.holidays || []).includes(d.key) || (pi.companyDays || []).includes(d.key)).length;

            const team = (sprint.team || []).map((member) => {
                const memberId = member.memberId || "";
                const memberMeta = memberDirectory.find(m => m.id === memberId);

                const ptoDates = ptoData.filter(d => d.memberId === memberId).map(d => d.date);
                const loaDates = loaData.filter(d => d.memberId === memberId).map(d => d.date);

                const otherEntries = otherData.filter(d => d.memberId === memberId);
                const otherDates = otherEntries.map(d => d.date);
                const otherComments = otherEntries.reduce((acc, d) => {
                    acc[d.date] = d.comments || "";
                    return acc;
                }, {});

                const offset = parseFloat(adjustments.find(a => a.memberId === memberId)?.offset || 0);

                return {
                    ...member,
                    memberId,
                    includeInCalc: memberMeta?.includeInCalc ?? true,
                    ptoDates,
                    loaDates,
                    otherDates,
                    otherComments,
                    ...calculateSprintCapacity({ weekdays, ptoDates, loaDates, otherDates, teamDaysOut, offset })
                };
            });

            const totalSprintVelocity = team
                .filter(member => member.includeInCalc !== false)
                .reduce((sum, member) => sum + (parseFloat(member.p2h) || 0), 0)
                .toFixed(0);

            return { ...sprint, team, totalSprintVelocity };
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
    const [showWeekends, setShowWeekends] = useState(true);
    const hasInitializedShowWeekends = useRef(false);
    //const [selectedWatermark, setSelectedWatermark] = useState(localStorage.getItem("watermark") || "/logo-watermark.png");
    const [selectedWatermark, setSelectedWatermark] = useState(localStorage.getItem("watermark") || "/HylianShield.png");
    const [watermarkOpacity, setWatermarkOpacity] = useState(parseFloat(localStorage.getItem("watermarkOpacity") || "0.15"));
    const [watermarkWidth, setWatermarkWidth] = useState(localStorage.getItem("watermarkWidth") || "35vw");

    const toggleWeekendsForPi = (piId) => {
        setShowWeekends((prev) => ({
            ...prev,
            [piId]: !prev[piId]
        }));
    };

    useEffect(() => {
        const fetchData = async () => {
            const storedMembers = localStorage.getItem("memberDirectory");
            if (storedMembers) {
                setMembers(JSON.parse(storedMembers));
            }

            const config = JSON.parse(localStorage.getItem("configData") || "{}");
            setConfigData(config);

            const storedShowWeekends = JSON.parse(localStorage.getItem("showWeekends") || "{}");
            setShowWeekends(storedShowWeekends);
            hasInitializedShowWeekends.current = true;

            const pis = await getPis();
            const enriched = enrichPis(pis || [], config);
            setPiData(enriched);
        };

        fetchData();
    }, []);

    useEffect(() => {
        if (!hasInitializedShowWeekends.current) return;

        setShowWeekends(prev => {
            const updated = { ...prev };
            let changed = false;

            piData.forEach(pi => {
                if (!(pi.id in updated)) {
                    updated[pi.id] = true;
                    changed = true;
                }
            });

            return changed ? updated : prev;
        });
    }, [piData]);

    useEffect(() => {
        localStorage.setItem("showWeekends", JSON.stringify(showWeekends));
    }, [showWeekends]);

    useEffect(() => {
        localStorage.setItem("expandedPIs", JSON.stringify(expandedPIs));
    }, [expandedPIs]);

    useEffect(() => {
        localStorage.setItem("expandedSprints", JSON.stringify(expandedSprints));
    }, [expandedSprints]);

    const getImpactColor = (member, dateKey) => {
        if ((member.ptoDates || []).includes(dateKey)) return impactColors.PTO;
        if ((member.loaDates || []).includes(dateKey)) return impactColors.LOA;
        if ((member.otherDates || []).includes(dateKey)) return impactColors.Other;
        return "#084564";
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

    const toggleAllSprints = (piId) => {
        const pi = piData.find(p => p.id === piId);
        if (!pi) return;

        const anyOpen = pi.sprints.some(sprint => expandedSprints[sprint.id]);

        const updates = {};
        for (let sprint of pi.sprints) {
            updates[sprint.id] = !anyOpen;
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

    const handleWatermarkUpload = (file) => {
        if (file.size > 3 * 1024 * 1024) {
            alert("File exceeds 3MB. Please select a smaller image.");
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const base64Image = e.target.result;
            localStorage.setItem("watermark", base64Image);
            setSelectedWatermark(base64Image);
        };
        reader.readAsDataURL(file);
    };

    const handleWatermarkSettingsChange = ({ width, opacity }) => {
        if (width) {
            localStorage.setItem("watermarkWidth", width);
            setWatermarkWidth(width);
        }
        if (opacity !== undefined) {
            localStorage.setItem("watermarkOpacity", opacity);
            setWatermarkOpacity(opacity);
        }
    };

    return (
        <Box sx={{ position: "relative", p: 3, overflowX: "auto", minWidth: "max-content" }}>
            {/* 🔹 Top-level Global Menu */}
            <GlobalMenu
                onWatermarkChange={handleWatermarkUpload}
                onWatermarkSettingsChange={handleWatermarkSettingsChange}
            />

            {/* 🔹 Watermark Image */}
            <Box
                component="img"
                src={selectedWatermark}
                alt="Watermark"
                sx={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: watermarkWidth,
                    opacity: watermarkOpacity,
                    zIndex: 0,
                    pointerEvents: "none",
                    userSelect: "none"
                }}
            />
            <Box sx={{ position: "relative", zIndex: 1 }}>
            <Typography variant="h5" gutterBottom>Capacity Planning Grid</Typography>
            {piData.map((pi, piIndex) => (
                <Box key={pi.id} sx={{ mb: 3 }}>
                    <Box
                        sx={{
                            display: "grid",
                            alignItems: "center",
                            gridTemplateColumns: "200px 150px 150px 1fr",
                            border: "1px solid #888",
                            fontWeight: "bold",
                            background: "linear-gradient(to right, rgba(25, 118, 210, 0.5), rgba(25, 118, 210, 0.15))",
                            boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.4)", p: 1,
                            borderRadius: 1
                        }}
                    >
                        <Box onClick={() => setExpandedPIs(prev => ({ ...prev, [pi.id]: !prev[pi.id] }))} sx={{ cursor: "pointer" }}>
                            {expandedPIs[pi.id] ? "▼" : "▶"} {pi.pi}
                        </Box>
                        <Box>{format(parseISO(pi.start), "MM/dd/yy")}</Box>
                        <Box>{format(parseISO(pi.end), "MM/dd/yy")}</Box>
                        <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 2 }}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={!!showWeekends[pi.id]}
                                        onChange={() => toggleWeekendsForPi(pi.id)}
                                        color="primary"
                                    />
                                }
                                label="Show Weekends"
                                sx={{ color: "darkslategray", mr: 2 }}
                            />

                            <Button
                                size="small"
                                onClick={() => toggleAllSprints(pi.id)}
                                startIcon={
                                    <ExpandMoreIcon
                                        sx={{
                                            transition: "transform 0.3s ease-in-out",
                                            transform: pi.sprints.some(s => expandedSprints[s.id]) ? "rotate(180deg)" : "rotate(0deg)"
                                        }}
                                    />
                                }
                                sx={{
                                    color: "darkslategray",
                                    width: "180px",
                                    boxShadow: "2px 2px 4px rgba(0, 0, 0, 0.3)",
                                    background: pi.sprints.some(s => expandedSprints[s.id])
                                        ? "linear-gradient(90deg, rgba(204, 227, 250, 0.7) 0%, white 95%)"
                                        : "linear-gradient(90deg, white 5%, rgba(204, 227, 250, 0.7) 100%)",
                                    borderColor: "darkslategray",
                                    '&:hover': {
                                        background: pi.sprints.some(s => expandedSprints[s.id])
                                            ? "linear-gradient(90deg, white 5%, rgba(204, 227, 250, 0.7) 100%)"
                                            : "linear-gradient(90deg, rgba(204, 227, 250, 0.7) 0%, white 95%)",
                                        boxShadow: "4px 4px 8px rgba(0, 0, 0, 0.3)" // stronger on hover
                                    },
                                    transition: "background 0.3s ease-in-out",
                                }}
                                variant="outlined"
                            >
                                {pi.sprints.some(s => expandedSprints[s.id]) ? "Collapse Sprints" : "Expand Sprints"}
                            </Button>
                        </Box>
                    </Box>
                    {expandedPIs[pi.id] && pi.sprints.map((sprint, sprintIndex) => {
                        //const weekdays = generateSprintDateColumns(sprint.start, sprint.end).filter(d => !isWeekend(parseISO(d.key)));
                        const weekdays = generateSprintDateColumns(sprint.start, sprint.end, !!showWeekends[pi.id]);
                        const dateColumnCount = weekdays.length;
                        return (
                            <Box key={sprint.id} sx={{ mt: 2, ml: 2, border: "1px solid #888" }}>
                                <Box
                                    sx={{
                                        display: "grid",
                                        gridTemplateColumns: "185px 150px 150px 1fr",
                                        backgroundColor: "#E3E2E2",
                                        p: 1,
                                        fontWeight: "bold",
                                        borderTopLeftRadius: 4,
                                        borderTopRightRadius: 4,
                                        alignItems: "center"
                                    }}
                                >
                                    <Box
                                        sx={{ cursor: "pointer" }}
                                        onClick={() =>
                                            setExpandedSprints(prev => ({
                                                ...prev,
                                                [sprint.id]: !prev[sprint.id]
                                            }))
                                        }
                                    >
                                        {expandedSprints[sprint.id] ? "▼" : "▶"} {sprint.sprint}
                                    </Box>

                                    <Box>{format(parseISO(sprint.start), "MM/dd/yy")}</Box>
                                    <Box>{format(parseISO(sprint.end), "MM/dd/yy")}</Box>

                                    {/* Add Sprint Total Capacity Here */}
                                    <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12 }}>
                                        <Box sx={{ fontWeight: "normal" }}>
                                            Total Capacity:{" "}
                                            <strong
                                                style={{
                                                    color: "#0c628f"
                                                    //textShadow: "1px 1px 2px rgba(0, 0, 0, 0.4)"
                                                }}
                                            >
                                                {getSprintTotalCapacity(sprint.team)}
                                            </strong>
                                        </Box>


                                        <Button
                                            variant="outlined"
                                            size="small"
                                            startIcon={<AddIcon />}
                                            disabled={!expandedSprints[sprint.id]}
                                            sx={{
                                                width: "160px",
                                                backgroundColor: "white",
                                                boxShadow: "2px 2px 4px rgba(0, 0, 0, 0.3)", // 👈 subtle shadow
                                                '&:hover': {
                                                    backgroundColor: "whitesmoke",
                                                    boxShadow: "4px 4px 8px rgba(0, 0, 0, 0.3)" // stronger on hover
                                                }
                                            }}
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
                                            {expandedSprints[sprint.id] ? "Add Member" : "Expand to Add"}
                                        </Button>
                                    </Box>
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
                                                                borderLeft: i !== 0 ? "2px solid gray" : "none"
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
                                                <TextField variant="standard" value={memberSettings.find(m => m.id === member.memberId)?.includeInCalc === false ? 0 : member.capacity} inputProps={{ style: { textAlign: "center" }, readOnly: true }}/>
                                                <TextField variant="standard" value={memberSettings.find(m => m.id === member.memberId)?.includeInCalc === false ? 0 : member.p2h} inputProps={{ style: { textAlign: "center" }, readOnly: true }}/>
                                                <TextField variant="standard" value={member.plannedVelocity || ""} onChange={(e) => updateMember(piIndex, sprintIndex, i, "plannedVelocity", e.target.value)} inputProps={{ style: { textAlign: 'center' } }} />
                                                <TextField variant="standard" value={member.actualVelocity || ""} onChange={(e) => updateMember(piIndex, sprintIndex, i, "actualVelocity", e.target.value)} inputProps={{ style: { textAlign: 'center' } }} />
                                                <Box />
                                                {weekdays.map(({ key }, idx) => {
                                                    const isHoliday = pi.holidays.includes(key);
                                                    const isCompanyDay = pi.companyDays.includes(key);

                                                    const bgColor = getImpactColor(member, key);
                                                    const impactType = getImpactType(member, key);
                                                    const isWeekendDay = isWeekend(parseISO(key));
                                                    const isNeutral = !impactType;

                                                    // Tooltip logic
                                                    const tooltip =
                                                        isHoliday
                                                            ? `Holiday: ${pi.holidayDescriptions?.[key] || ""}`
                                                            : isCompanyDay
                                                            ? `Company: ${pi.companyDescriptions?.[key] || ""}`
                                                            : impactType === "Other"
                                                                ? member.otherComments?.[key] || "Other"
                                                                : impactType || "";

                                                    return (
                                                        <Tooltip
                                                            key={idx}
                                                            title={tooltip}
                                                            disableHoverListener={!tooltip}
                                                            componentsProps={{ tooltip: { sx: { fontSize: 16 } } }}
                                                        >
                                                            <Box
                                                                sx={{
                                                                    backgroundColor: isHoliday
                                                                        ? "#cfe8cf"                 // muted holiday green
                                                                        : isCompanyDay
                                                                            ? "#d9e9f7"             // muted company blue
                                                                            : isNeutral
                                                                                ? (isWeekendDay ? "#d3d3d3" : "transparent")
                                                                                : bgColor,
                                                                    color: isHoliday
                                                                        ? "#2e5f2e"
                                                                        : isCompanyDay
                                                                            ? "#1f4e79"
                                                                            : "inherit",
                                                                    fontWeight: (isHoliday || isCompanyDay) ? "bold" : "normal",
                                                                    fontStyle: (isHoliday || isCompanyDay) ? "italic" : "normal",
                                                                    textTransform: (isHoliday || isCompanyDay) ? "uppercase" : "none",
                                                                    opacity: (isHoliday || isCompanyDay) ? 0.65 : 1,
                                                                    borderRadius: 1,
                                                                    textAlign: "center",
                                                                    py: 0.5,
                                                                    border: "1px solid gray",
                                                                    borderLeft: idx !== 0 ? "4px solid white" : "none"
                                                                }}
                                                            >
                                                                {isHoliday ? "H" : isCompanyDay ? "C" : "\u00A0"}
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
                                                    <DeleteIcon fontSize="small" sx={{ color: "#de3939" }} />
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
                                    </Box>
                                </Collapse>
                            </Box>
                        );
                    })}
                </Box>
            ))}
        </Box>
        </Box>
    );
};

export default CapacityGrid;
