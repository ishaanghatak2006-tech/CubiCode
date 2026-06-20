/* eslint-disable react-refresh/only-export-components */
import { createContext, useEffect, useState } from "react";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("cubicode_user");
    const storedToken = localStorage.getItem("cubicode_token");

    if (storedUser) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("cubicode_user");
      }
    }

    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem("cubicode_user", JSON.stringify(userData));
    localStorage.setItem("cubicode_token", authToken);
  };

  const register = (userData) => {
    setUser(userData);
    localStorage.setItem("cubicode_user", JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setToken("");
    localStorage.removeItem("cubicode_user");
    localStorage.removeItem("cubicode_token");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}
