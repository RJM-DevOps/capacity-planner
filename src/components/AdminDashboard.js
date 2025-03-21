// AdminDashboard.js — uses nested routing for Panel and Grid views
import React, { useState, useEffect } from "react";
import { Box, Button, ButtonGroup, Typography } from "@mui/material";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import CapacityGrid from "./CapacityGrid";
import AdminPanel from "./AdminPanel";

const AdminDashboard = () => {
    const [pis, setPis] = useState(() => {
        const stored = localStorage.getItem("pis");
        return stored ? JSON.parse(stored) : [];
    });

    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        localStorage.setItem("pis", JSON.stringify(pis));
    }, [pis]);

    const addPi = (newPi) => {
        const updatedPis = [...pis, newPi];
        setPis(updatedPis);
        localStorage.setItem("pis", JSON.stringify(updatedPis));
    };

    return (
        <Box sx={{ height: "100vh", width: "100%", p: 2 }}>
            <Box sx={{ mb: 2 }}>
                <ButtonGroup variant="outlined">
                    <Button
                        onClick={() => navigate("/admin/capacity")}
                        variant={location.pathname === "/admin/capacity" ? "contained" : "outlined"}
                    >
                        Capacity Grid
                    </Button>
                    <Button
                        onClick={() => navigate("/admin/panel")}
                        variant={location.pathname === "/admin/panel" ? "contained" : "outlined"}
                    >
                        Admin Panel
                    </Button>
                </ButtonGroup>
            </Box>

            <Routes>
                <Route path="/panel" element={<AdminPanel addPi={addPi} pis={pis} />} />
                <Route path="/capacity" element={<CapacityGrid pis={pis} />} />
            </Routes>
        </Box>
    );
};

export default AdminDashboard;