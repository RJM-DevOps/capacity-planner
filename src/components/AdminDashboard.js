import React, { useState, useEffect } from "react";
import { Box, Button, ButtonGroup } from "@mui/material";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import CapacityGrid from "./CapacityGrid";
import AdminPanel from "./AdminPanel";
import AdminConfigPanel from "./AdminConfigPanel";

const AdminDashboard = ({ pis, addPi }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [role, setRole] = useState(null);

    useEffect(() => {
        setRole(localStorage.getItem("role"));
    }, []);

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
                    {role === "admin" && (
                        <Button
                            onClick={() => navigate("/admin/config")}
                            variant={location.pathname === "/admin/config" ? "contained" : "outlined"}
                        >
                            Admin Config
                        </Button>
                    )}
                </ButtonGroup>
            </Box>

            <Routes>
                <Route path="/panel" element={<AdminPanel addPi={addPi} pis={pis} />} />
                <Route path="/capacity" element={<CapacityGrid pis={pis} />} />
                <Route path="/config" element={<AdminConfigPanel />} />
            </Routes>
        </Box>
    );
};

export default AdminDashboard;
