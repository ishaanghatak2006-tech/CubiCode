import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/authContext.jsx";

import Auth from "./Pages/Auth";
import Dashboard from "./Pages/Dashboard";
import Workspace from "./Pages/Workspace";
import Problems from "./Pages/Problems";

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>

                    {/* Authentication */}
                    <Route path="/" element={<Auth />} />
                    <Route path="/register" element={<Auth />} />

                    {/* Main Pages */}
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/workspace/:questionId" element={<Workspace />} />
                    <Route path="/problems" element={<Problems />} />

                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;