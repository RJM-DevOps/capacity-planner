import { parseISO, isWeekend } from "date-fns";

const safeParseISO = (dateStr) => {
    if (!dateStr || typeof dateStr !== "string") return null;
    try {
        return parseISO(dateStr);
    } catch {
        return null;
    }
};

export const calculateSprintCapacity = ({ weekdays, ptoDates = [], loaDates = [], otherDates = [], teamDaysOut = 0, globalOffset = 0 }) => {
    const weekdayKeys = weekdays
        .map((d) => safeParseISO(d.key))
        .filter((date) => date && !isWeekend(date));

    const weekdayStrings = weekdayKeys.map((d) => d.toISOString().split("T")[0]);

    const individualDaysOut = weekdayStrings.filter(date =>
        ptoDates.includes(date) || loaDates.includes(date) || otherDates.includes(date)
    ).length;

    const individualDaysAvail = weekdayStrings.length - teamDaysOut - individualDaysOut;
    const capacity = parseFloat((individualDaysAvail * 6.2).toFixed(0));
    const estimatedVelocity = parseFloat((capacity / 6.2).toFixed(0));
    const p2h = estimatedVelocity;

    return {
        teamDaysOut,
        individualDaysOut,
        individualDaysAvail,
        capacity,
        estimatedVelocity,
        p2h
    };
};
