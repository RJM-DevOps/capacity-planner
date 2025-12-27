import React, { useState } from "react";
import { Box, Button, TextField, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

const users = [
    { username: "admin", password: "admin123", role: "admin" },
    { username: "user", password: "user123", role: "user" }
];

const Login = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleLogin = () => {
        const user = users.find((u) => u.username === username && u.password === password);
        if (user) {
            localStorage.setItem("role", user.role);
            navigate(user.role === "admin" ? "/admin" : "/capacity");
        } else {
            setError("Invalid username or password");
        }
    };

    return (
        <Box sx={{ p: 3, maxWidth: 400, mx: "auto", textAlign: "center" }}>
            <Typography variant="h5" gutterBottom>Login</Typography>
            {error && <Typography color="error">{error}</Typography>}

            <form onSubmit={(e) => {
                e.preventDefault(); // prevent page reload
                handleLogin(); // run the login logic
            }}>
                <TextField
                    label="Username"
                    fullWidth
                    margin="normal"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                <TextField
                    label="Password"
                    type="password"
                    fullWidth
                    margin="normal"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    fullWidth
                    sx={{ mt: 2 }}
                >
                    Login
                </Button>
            </form>
        </Box>
    );
};

export default Login;
