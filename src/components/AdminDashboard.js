import React, { useState, useEffect } from "react";
import { Box, Button, ButtonGroup } from "@mui/material";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import CapacityGrid from "./CapacityGrid";
import AdminPanel from "./AdminPanel";
import AdminConfigPanel from "./AdminConfigPanel";
import ExportDialog from "./ExportDialog";
import ImportDialog from "./ImportDialog";


const AdminDashboard = ({ pis, addPi }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [role, setRole] = useState(null);
    const [exportOpen, setExportOpen] = useState(false);
    const [importOpen, setImportOpen] = useState(false);

    useEffect(() => {
        setRole(localStorage.getItem("role"));
    }, []);

    return (
        <Box sx={{ height: "100vh", width: "100%", p: 2 }}>
            <Box
                sx={{
                    mb: 2,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                }}
            >
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

                <Box sx={{ display: "flex", gap: 1 }}>
                    <Button variant="outlined" onClick={() => setImportOpen(true)}>Import</Button>
                    <Button variant="contained" onClick={() => setExportOpen(true)}>Export</Button>
                </Box>
            </Box>


            <Routes>
                <Route path="/panel" element={<AdminPanel addPi={addPi} pis={pis} />} />
                <Route path="/capacity" element={<CapacityGrid pis={pis} />} />
                <Route path="/config" element={<AdminConfigPanel />} />
            </Routes>

            <ExportDialog open={exportOpen} onClose={() => setExportOpen(false)} />
            <ImportDialog open={importOpen} onClose={() => setImportOpen(false)} />

        </Box>
    );
};

export default AdminDashboard;
