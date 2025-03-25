import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import CapacityGrid from "./components/CapacityGrid";
import AdminPanel from "./components/AdminPanel";
import AdminDashboard from "./components/AdminDashboard";
import AdminConfigPanel from "./components/AdminConfigPanel";
import Login from "./components/Login";
import { Box } from "@mui/material";
import { getPis, setPis } from "./utils/StorageProvider";

const PrivateRoute = ({ element, allowedRoles }) => {
    const role = localStorage.getItem("role");
    return allowedRoles.includes(role) ? element : <Navigate to="/" />;
};

const App = () => {
    const [pis, setPisState] = useState([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load pis from storageProvider on mount
    useEffect(() => {
        const loadPis = async () => {
            const data = await getPis();
            if (data?.length > 0) {
                setPisState(data);
            }
            setIsLoaded(true);
        };
        loadPis();
    }, []);

    // Only save when loaded AND pis is non-empty
    useEffect(() => {
        if (isLoaded && pis.length > 0) {
            setPis(pis);
        }
    }, [pis, isLoaded]);

    const addPi = (newPi) => {
        const updated = [...pis, newPi];
        setPisState(updated);
    };

    return (
        <Router>
            <Box sx={{ height: "100vh", width: "100vw", p: 2 }}>
                <Routes>
                    <Route path="/" element={<Login />} />
                    <Route
                        path="/admin/*"
                        element={<PrivateRoute element={<AdminDashboard pis={pis} addPi={addPi} />} allowedRoles={["admin"]} />}
                    />
                    <Route
                        path="/admin/config"
                        element={<PrivateRoute element={<AdminConfigPanel />} allowedRoles={["admin"]} />}
                    />
                    <Route
                        path="/capacity"
                        element={<PrivateRoute element={<CapacityGrid pis={pis} />} allowedRoles={["user", "admin"]} />}
                    />
                </Routes>
            </Box>
        </Router>
    );
};

export default App;
