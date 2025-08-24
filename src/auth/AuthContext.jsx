import { createContext, useContext, useEffect, useState } from "react";
import api from "../api";

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const payload = localStorage.getItem("user_payload");
    if (token && payload) setUser(JSON.parse(payload));
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post("/auth/login", { email, password });
      const token = res.data?.access_token;
      if (!token) return false;
      localStorage.setItem("access_token", token);

      // ดึงข้อมูล profile จาก token (ถ้า backend ใส่ role/email ใน payload)
      // หรือเรียก /me ก็ได้
      const payload = parseJwt(token);
      const u = { email: payload?.email, role: payload?.role };
      localStorage.setItem("user_payload", JSON.stringify(u));
      setUser(u);
      console.log(user);

      return true;
    } catch {
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_payload");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

// helper
function parseJwt(tkn) {
  try {
    const base64Url = tkn.split(".")[1];
    const json = atob(base64Url.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return null;
  }
}
