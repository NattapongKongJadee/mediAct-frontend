// src/pages/nurse/NurseScheduleTable.jsx
import { useEffect, useState } from "react";
import api from "../api";
import LeaveModal from "../components/LeaveModal";

export default function NurseScheduleTable() {
  const [rows, setRows] = useState([]);
  const [leaveFor, setLeaveFor] = useState(null); // เก็บ assignment ที่จะยื่นลา

  const load = async () => {
    const res = await api.get("/my-schedule");
    // ตัวอย่าง shape:
    // [
    //   { assignmentId, shiftId, date: "21-08-2025", startTime: "21-08-2025 : 08:00:00", endTime: "...", headNurse: { id, name } }
    // ]
    setRows(Array.isArray(res.data) ? res.data : []);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-4">
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">ตารางเวรของฉัน (แบบตาราง)</h2>
            <button className="btn btn-info btn-sm text-white" onClick={load}>
              รีเฟรช
            </button>
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                {/* <th>Assignment</th>
                <th>Shift</th> */}
                <th>วัน</th>
                <th>เวลา</th>
                <th>หัวหน้าพยาบาล</th>
                <th>สถานะ</th>
                <th>ขอลา</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const status = r.leaveStatus; // null | 'pending' | 'approved' | 'rejected'
                const disabled = status === "pending" || status === "approved";
                const label =
                  status === "pending"
                    ? "รออนุมัติ"
                    : status === "approved"
                    ? "อนุมัติแล้ว"
                    : "ลา";

                const badgeClass =
                  status === "pending"
                    ? "badge-warning"
                    : status === "approved"
                    ? "badge-success"
                    : status === "rejected"
                    ? "badge-error"
                    : "badge-ghost";

                return (
                  <tr key={r.assignmentId}>
                    <td>{r.date}</td>
                    <td>
                      {r.startTime.split(" : ")[1].slice(0, 5)} -{" "}
                      {r.endTime.split(" : ")[1].slice(0, 5)}
                    </td>
                    <td>{r.headNurse?.name ?? "-"}</td>
                    <td className="flex items-center gap-2">
                      {/* Badge สถานะ */}
                      <span className={`badge ${badgeClass}`}>
                        {status ?? "ยังไม่ยื่น"}
                      </span>
                      {/* ปุ่มยื่นลา */}
                    </td>
                    <td>
                      <button
                        className={`btn btn-xs ${
                          disabled ? "btn-disabled" : "btn-primary"
                        }`}
                        disabled={disabled}
                        onClick={() => setLeaveFor(r)}
                        title={disabled ? "มีคำขอลาอยู่แล้ว" : "ยื่นขอลา"}
                      >
                        {label}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {leaveFor && (
        <LeaveModal
          assignmentId={leaveFor.assignmentId}
          date={leaveFor.date}
          start={leaveFor.startTime.split(" : ")[1].slice(0, 5)}
          end={leaveFor.endTime.split(" : ")[1].slice(0, 5)}
          onClose={() => setLeaveFor(null)}
          onSuccess={() => {
            setLeaveFor(null);
            load();
          }}
        />
      )}
    </div>
  );
}
