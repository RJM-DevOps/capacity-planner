// CapacityGrid.js — Restored full sprint view with expand/collapse and dynamic weekday headers
import React, { useState } from "react";
import { Box, Typography } from "@mui/material";
import { format, eachDayOfInterval, parseISO } from "date-fns";
import "./CapacityGrid.css";

const impactColors = {
    PTO: "#FFCDD2",
    LOA: "#BBDEFB",
    Holiday: "#C8E6C9",
    Company: "#FFECB3",
    Other: "#E1BEE7"
};

const generateSprintDateColumns = (start, end) => {
    try {
        return eachDayOfInterval({ start: parseISO(start), end: parseISO(end) }).map((date) => ({
            key: format(date, "yyyy-MM-dd"),
            label: format(date, "EEE")
        }));
    } catch {
        return [];
    }
};

const CapacityGrid = ({ pis = [] }) => {
    const [expanded, setExpanded] = useState({});

    const toggleExpand = (piId) => {
        setExpanded((prev) => ({ ...prev, [piId]: !prev[piId] }));
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>Capacity Planning Grid</Typography>
            {pis.map((pi) => (
                <Box key={pi.id} sx={{ mb: 2 }}>
                    <Box
                        onClick={() => toggleExpand(pi.id)}
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            fontWeight: 'bold',
                            backgroundColor: '#f0f0f0',
                            p: 1,
                            mb: 1,
                            borderRadius: 1,
                            cursor: 'pointer'
                        }}
                    >
                        <Box>{expanded[pi.id] ? '▼' : '▶'} {pi.pi}</Box>
                        <Box>{pi.start}</Box>
                        <Box>{pi.end}</Box>
                    </Box>

                    {expanded[pi.id] && pi.sprints?.length > 0 && (
                        <Box sx={{ mt: 1, p: 2, border: '1px solid #ccc', borderRadius: 2 }}>
                            {/* Header Row */}
                            <Box
                                sx={{
                                    display: 'grid',
                                    gridTemplateColumns: `repeat(${11 + generateSprintDateColumns(pi.sprints[0].start, pi.sprints[0].end).length}, minmax(120px, 1fr))`,
                                    gap: 1,
                                    fontWeight: 'bold',
                                    backgroundColor: '#e0e0e0',
                                    p: 1,
                                    mb: 1
                                }}
                            >
                                <Box>Sprint</Box>
                                <Box>Start</Box>
                                <Box>Finish</Box>
                                <Box>Who</Box>
                                <Box>Team Days Out</Box>
                                <Box>Individual Days Out</Box>
                                <Box>Individual Days Avail</Box>
                                <Box>Total Capacity</Box>
                                <Box>Estimate</Box>
                                <Box>Planned</Box>
                                <Box>Actual</Box>
                                {generateSprintDateColumns(pi.sprints[0].start, pi.sprints[0].end).map(({ label }, i) => (
                                    <Box key={i}>{label}</Box>
                                ))}
                            </Box>

                            {pi.sprints.map((sprint) => {
                                const weekdayHeaders = generateSprintDateColumns(sprint.start, sprint.end);
                                return (
                                    <Box
                                        key={sprint.id}
                                        sx={{
                                            display: 'grid',
                                            gridTemplateColumns: `repeat(${11 + weekdayHeaders.length}, minmax(120px, 1fr))`,
                                            gap: 1,
                                            p: 1,
                                            backgroundColor: '#fafafa',
                                            borderBottom: '1px solid #ddd'
                                        }}
                                    >
                                        <Box>{sprint.sprint}</Box>
                                        <Box>{sprint.start}</Box>
                                        <Box>{sprint.end}</Box>
                                        <Box>{sprint.who}</Box>
                                        <Box>{sprint.teamDaysOut}</Box>
                                        <Box>{sprint.individualDaysOut}</Box>
                                        <Box>{sprint.individualDaysAvail}</Box>
                                        <Box>{sprint.capacity}</Box>
                                        <Box>{sprint.p2h}</Box>
                                        <Box>{sprint.plannedVelocity}</Box>
                                        <Box>{sprint.actualVelocity}</Box>
                                        {weekdayHeaders.map(({ key, label }, i) => (
                                            <Box
                                                key={i}
                                                sx={{
                                                    backgroundColor: impactColors[sprint[key]] || '#e0e0e0',
                                                    borderRadius: 1,
                                                    textAlign: 'center',
                                                    py: 0.5
                                                }}
                                            >
                                                {label}
                                            </Box>
                                        ))}
                                    </Box>
                                );
                            })}
                        </Box>
                    )}
                </Box>
            ))}
        </Box>
    );
};

export default CapacityGrid;
