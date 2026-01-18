import { parseISO, differenceInDays, isValid, isBefore, isAfter } from "date-fns";

export const isValidDateRange = (start, end, maxDays = 365) => {
    try {
        const startDate = parseISO(start);
        const endDate = parseISO(end);

        if (!isValid(startDate) || !isValid(endDate)) return false;
        if (startDate > endDate) return false;

        const days = differenceInDays(endDate, startDate);
        return days >= 0 && days <= maxDays;
    } catch {
        return false;
    }
};

export const isValidSprintDates = (sprintStart, sprintEnd, piStart, piEnd, maxSprintDays = 90) => {
    try {
        const sprintStartDate = parseISO(sprintStart);
        const sprintEndDate = parseISO(sprintEnd);
        const piStartDate = parseISO(piStart);
        const piEndDate = parseISO(piEnd);

        if (!sprintStart || !sprintEnd || isBefore(sprintEndDate, sprintStartDate)) {
            return false;
        }

        const days = differenceInDays(sprintEndDate, sprintStartDate);
        if (days < 0 || days > maxSprintDays) {
            return false;
        }

        return !isBefore(sprintStartDate, piStartDate) && !isAfter(sprintEndDate, piEndDate);
    } catch {
        return false;
    }
};
