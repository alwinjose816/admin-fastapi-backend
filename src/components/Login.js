import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import { FaEye, FaEyeSlash } from "react-icons/fa";

function Login({ setUser }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    async function handleLogin() {
        setLoading(true);

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            alert(error.message);
        } else {
            setUser(data.user);
        }

        setLoading(false);
    }

    return (
        <div style={styles.container}>
            <div style={styles.card}>

                <h1 style={styles.title}>Admin Login</h1>

                <div style={styles.field}>
                    <label style={styles.label}>Email ID</label>

                    <input
                        type="email"
                        placeholder=""
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={styles.input}
                    />
                </div>

                <div style={styles.field}>
                    <label style={styles.label}>Password</label>

                    <div style={styles.passwordContainer}>
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={styles.passwordInput}
                        />

                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={styles.eyeButton}
                        >
                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                    </div>
                </div>

                <button onClick={handleLogin} style={styles.button}>
                    {loading ? "LOGGING..." : "LOGIN"}
                </button>

            </div>
        </div>
    );
}

const styles = {
    container: {
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f2f2f2",
        fontFamily: "Arial, sans-serif"
    },
    passwordContainer: {
        position: "relative",
        width: "100%"
    },

    passwordInput: {
        width: "100%",
        padding: "16px",
        paddingRight: "50px",
        border: "none",
        borderRadius: "10px",
        background: "#f1f3f6",
        fontSize: "15px",
        outline: "none",
        boxSizing: "border-box"
    },

    eyeButton: {
        position: "absolute",
        right: "15px",
        top: "50%",
        transform: "translateY(-50%)",
        border: "none",
        background: "transparent",
        cursor: "pointer",
        color: "#444",
        fontSize: "18px"
    },

    card: {
        width: "500px",
        background: "#ffffff",
        padding: "40px 35px",
        borderRadius: "50px",
        boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
        display: "flex",
        flexDirection: "column",
        gap: "15px"
    },

    title: {
        color: "#ff2b2b",
        fontSize: "42px",
        fontWeight: "700",
        margin: "0",
        textAlign: "left"
    },

    field: {
        display: "flex",
        flexDirection: "column",
        gap: "10px"
    },

    label: {
        color: "#ff2b2b",
        fontSize: "14px",
        fontStyle: "italic",
        fontWeight: "500"
    },

    input: {
        width: "100%",
        padding: "16px",
        border: "none",
        borderRadius: "10px",
        background: "#f1f3f6",
        fontSize: "15px",
        outline: "none",
        boxSizing: "border-box"
    },

    button: {
        width: "100%",
        padding: "16px",
        border: "none",
        borderRadius: "10px",
        background: "#0066c9",
        color: "#ffffff",
        fontSize: "18px",
        fontWeight: "600",
        cursor: "pointer",
        marginTop: "10px",
        letterSpacing: "1px"
    }
};

export default Login;