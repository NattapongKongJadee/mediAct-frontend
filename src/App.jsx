import { useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";
import NurseSchedule from "./pages/Main";
import NurseScheduleTable from "./pages/NurseScheduleTable";
import HeadShifts from "./pages/HeadShifts";
import HeadLeaves from "./pages/HeadLeaves";
import HeadAssign from "./pages/HeadAssign";
import AppShell from "./layout/AppShell";
import "./App.css";

export default function App() {
  const { user, login, logout } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("nurse.1@example.com");
  const [password, setPassword] = useState("secret123");
  const [error, setError] = useState(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const ok = await login(email, password);
    if (!ok) return setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
    nav("/main");
  };

  if (!user) {
    return (
      <div className="flex w-full h-screen items-center justify-center bg-info">
        <div className="flex flex-col space-y-2 w-1/3">
          <div>
            <input
              type="text"
              placeholder="Email"
              className="input input-bordered w-full"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              className="input input-bordered w-full"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <div className="text-error">{error}</div>}
          <button className="btn btn-primary" onClick={onSubmit}>
            เข้าสู่ระบบ
          </button>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route element={<AppShell />}>
        {/* หน้า default */}
        <Route path="/main" element={<NurseSchedule />} />
        {/* Nurse */}
        <Route path="/nurse/schedule-table" element={<NurseScheduleTable />} />
        {/* Head nurse */}
        <Route path="/head/shifts" element={<HeadShifts />} />
        <Route path="/head/assigns" element={<HeadAssign />} />
        <Route path="/head/leave-requests" element={<HeadLeaves />} />
      </Route>
    </Routes>
  );
}
