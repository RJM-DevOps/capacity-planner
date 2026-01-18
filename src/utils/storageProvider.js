const isLocal = process.env.REACT_APP_USE_LOCAL_STORAGE === "true";
console.log(`🔧 Using ${isLocal ? "localStorage" : "backend API"} for retrieving and setting PI data`);

// Fetch PI data
export const getPis = async () => {
    if (isLocal) {
        const localData = localStorage.getItem("pis");
        return localData ? JSON.parse(localData) : [];
    } else {
        try {
            const response = await fetch("/api/pis");
            if (!response.ok) throw new Error("Failed to fetch from API");
            return await response.json();
        } catch (error) {
            console.error("API getPis error:", error);
            return [];
        }
    }
};

// Save PI data
export const setPis = async (data) => {
    if (isLocal) {
        localStorage.setItem("pis", JSON.stringify(data));
    } else {
        try {
            const response = await fetch("/api/pis", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error("Failed to save to API");
        } catch (error) {
            console.error("API setPis error:", error);
        }
    }
};
