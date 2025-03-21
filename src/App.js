// App.js — updated routing to support nested admin views
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import CapacityGrid from "./components/CapacityGrid";
import AdminPanel from "./components/AdminPanel";
import Login from "./components/Login";
import { Box } from "@mui/material";
import AdminDashboard from "./components/AdminDashboard";

const PrivateRoute = ({ element, allowedRoles }) => {
    const role = localStorage.getItem("role");
    return allowedRoles.includes(role) ? element : <Navigate to="/" />;
};

const App = () => {
    const [pis, setPis] = useState(() => {
        const storedPis = localStorage.getItem("pis");
        return storedPis ? JSON.parse(storedPis) : [];
    });

    useEffect(() => {
        localStorage.setItem("pis", JSON.stringify(pis));
    }, [pis]);

    const addPi = (newPi) => {
        setPis((prevPis) => {
            const updatedPis = [...prevPis, newPi];
            localStorage.setItem("pis", JSON.stringify(updatedPis));
            return updatedPis;
        });
    };

    return (
        <Router>
            <Box sx={{ height: "100vh", width: "100vw", p: 2 }}>
                <Routes>
                    <Route path="/" element={<Login />} />
                    <Route
                        path="/admin/*"
                        element={<PrivateRoute element={<AdminDashboard />} allowedRoles={["admin"]} />}
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
