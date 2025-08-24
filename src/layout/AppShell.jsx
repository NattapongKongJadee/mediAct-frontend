// src/layout/AppShell.jsx
import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { NavLink } from "react-router-dom";

export default function AppShell() {
  const { user, logout } = useAuth();

  return (
    <div className="drawer lg:drawer-open">
      {/* Toggle สำหรับ mobile */}
      <input id="app-drawer" type="checkbox" className="drawer-toggle" />
      <div className="relative ite drawer-content">
        {/* Header */}
        <div className="navbar bg-info px-4 rounded-b-[2rem] shadow-xl relative z-10">
          <div className="flex-1 text-2xl text-white font-bold">
            NURSE SHIFT SYSTEM
          </div>
          <div className="flex-none gap-2 space-x-2">
            <span className="badge badge-outline badge-info">
              {user?.email}
            </span>
            <button className="btn btn-sm btn-error" onClick={logout}>
              Logout
            </button>
          </div>
        </div>

        {/* เนื้อหาเพจ */}
        <div className="-mt-4 bg-gray-200 relative z-0 p-8 max-w-full mx-auto">
          <Outlet />
        </div>
      </div>

      {/* Drawer side */}
      <div className="drawer-side">
        <div className="p-4 w-64 bg-base-200 min-h-full flex flex-col">
          {/* ส่วนบน */}
          <div>
            <div className="text-2xl mb-2">เมนู</div>

            <div className="space-y-2">
              <NavLink
                to="/main"
                end
                className={({ isActive }) =>
                  `btn btn-md w-full justify-center ${
                    isActive ? "btn-info" : "btn-ghost"
                  }`
                }
              >
                ตารางเวร
              </NavLink>

              {user?.role === "nurse" && (
                <NavLink
                  to="/nurse/schedule-table"
                  className={({ isActive }) =>
                    `btn btn-md w-full justify-center  ${
                      isActive ? "btn-info" : "btn-ghost"
                    }`
                  }
                >
                  ขออนุมัติ "ลา"
                </NavLink>
              )}
            </div>

            {user?.role === "head_nurse" && (
              <div className="space-y-2 mt-4">
                <NavLink
                  to="/head/shifts"
                  className={({ isActive }) =>
                    `btn btn-md w-full justify-center  ${
                      isActive ? "btn-info " : "btn-ghost "
                    }`
                  }
                >
                  สร้าง/ดูเวร
                </NavLink>
                <NavLink
                  to="/head/assigns"
                  className={({ isActive }) =>
                    `btn btn-md w-full justify-center ${
                      isActive ? "btn-info " : "btn-ghost"
                    }`
                  }
                >
                  จัดเวรให้พยาบาล
                </NavLink>
                <NavLink
                  to="/head/leave-requests"
                  className={({ isActive }) =>
                    `btn btn-md w-full justify-center ${
                      isActive ? "btn-info" : "btn-ghost"
                    }`
                  }
                >
                  คำขอลา
                </NavLink>
              </div>
            )}
          </div>

          {/* ส่วนล่าง */}
          <div className="mt-auto">
            <button
              onClick={logout}
              className="btn btn-md btn-error w-full justify-center"
            >
              ออกจากระบบ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
