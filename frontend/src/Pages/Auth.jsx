import { useContext, useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { AuthContext } from "../context/authContext.jsx";
import "../styles/Auth.css";

function Auth() {
    const { login, register } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();

    // Determine initial tab from query parameter or pathname
    const mode = searchParams.get("mode");
    const [isRegister, setIsRegister] = useState(mode === "register" || location.pathname === "/register");
    
    const [Username, setUsername] = useState("");
    const [Email, setEmail] = useState("");
    const [Password, setPassword] = useState("");

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch("http://localhost:5000/user-dashboard/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    Email,
                    Password,
                }),
            });
            const data = await response.json();
            if (response.ok) {
                login(data.user, data.token);
                alert("Login Successful!");
                navigate("/dashboard");
            } else {
                alert(data.message || data.error || "Login failed");
            }
        } catch (err) {
            alert("Server Error");
            console.log(err);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch("http://localhost:5000/user/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    Username,
                    Email,
                    Password,
                }),
            });
            const data = await response.json();
            if (response.ok) {
                register(data.user);
                alert("Registration Successful!");
                // Note: The backend register route might not return a token. If registration
                // automatically logs the user in, they can go to dashboard.
                navigate("/dashboard");
            } else {
                alert(data.message || data.error || "Registration failed");
            }
        } catch (err) {
            alert("Server Error");
            console.log(err);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-tabs">
                    <button
                        className={`tab-btn ${!isRegister ? "active" : ""}`}
                        onClick={() => setIsRegister(false)}
                    >
                        Login
                    </button>
                    <button
                        className={`tab-btn ${isRegister ? "active" : ""}`}
                        onClick={() => setIsRegister(true)}
                    >
                        Register
                    </button>
                </div>

                {!isRegister ? (
                    <form className="auth-form" onSubmit={handleLogin}>
                        <h1>Login</h1>
                        <input
                            type="email"
                            placeholder="Email"
                            value={Email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            value={Password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <button type="submit" className="submit-btn">
                            Login
                        </button>
                        <p className="toggle-prompt">
                            Don't have an account?
                            <button
                                type="button"
                                className="toggle-link"
                                onClick={() => setIsRegister(true)}
                            >
                                Register
                            </button>
                        </p>
                    </form>
                ) : (
                    <form className="auth-form" onSubmit={handleRegister}>
                        <h1>Register</h1>
                        <input
                            type="text"
                            placeholder="Username"
                            value={Username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                        <input
                            type="email"
                            placeholder="Email"
                            value={Email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            value={Password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <button type="submit" className="submit-btn">
                            Register
                        </button>
                        <p className="toggle-prompt">
                            Already have an account?
                            <button
                                type="button"
                                className="toggle-link"
                                onClick={() => setIsRegister(false)}
                            >
                                Login
                            </button>
                        </p>
                    </form>
                )}
            </div>
        </div>
    );
}

export default Auth;
