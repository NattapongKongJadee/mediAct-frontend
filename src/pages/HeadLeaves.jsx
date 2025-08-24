import { useEffect, useMemo, useState } from "react";
import api from "../api";
import { formatInTimeZone } from "date-fns-tz";

const dmy = (iso) => formatInTimeZone(iso, "Asia/Bangkok", "dd-MM-yyyy");
const hhmm = (iso) => formatInTimeZone(iso, "Asia/Bangkok", "HH:mm");

export default function HeadLeaves() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [filter, setFilter] = useState("all"); // all | pending | approved | rejected
  const [deciding, setDeciding] = useState(null); // leaveId ที่กำลังอนุมัติ/ปฏิเสธ

  const load = async () => {
    setErr("");
    setLoading(true);
    try {
      //  GET /leave-requests (เฉพาะหัวหน้า)
      const res = await api.get("/leave-requests");
      setRows(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
      setErr("โหลดคำขอลาไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    let list = rows.slice().sort((a, b) => {
      // เรียงตามเวลาเขียนคำขอลาใหม่สุดก่อน
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    if (filter !== "all") {
      list = list.filter((r) => (r.status ?? "").toLowerCase() === filter);
    }
    return list;
  }, [rows, filter]);

  const decide = async (leaveId, status) => {
    setErr("");
    setDeciding(leaveId);
    try {
      // PATCH /leave-requests/:id/approve  body: { status: 'approved' | 'rejected' }
      await api.patch(
        `/leave-requests/${leaveId}/approve`,
        new URLSearchParams({ status }),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );
      await load();
    } catch (e) {
      console.error(e);
      setErr(e?.response?.data?.message ?? "ดำเนินการไม่สำเร็จ");
    } finally {
      setDeciding(null);
    }
  };

  const badge = (status) => {
    const s = String(status ?? "").toLowerCase();
    if (s === "approved")
      return <span className="badge badge-success">อนุมัติแล้ว</span>;
    if (s === "rejected")
      return <span className="badge badge-error">ปฏิเสธ</span>;
    return <span className="badge badge-warning">รออนุมัติ</span>;
  };

  return (
    <div className="space-y-4">
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          {/* Header + Filter */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">คำขอลา</h2>
            <div className="flex items-center gap-2">
              <select
                className="select select-bordered select-sm"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">ทั้งหมด</option>
                <option value="pending">รออนุมัติ</option>
                <option value="approved">อนุมัติแล้ว</option>
                <option value="rejected">ปฏิเสธ</option>
              </select>
              <button
                className={`btn btn-outline btn-sm ${loading ? "loading" : ""}`}
                onClick={load}
              >
                รีเฟรช
              </button>
            </div>
          </div>
        </div>
      </div>

      {err && <div className="alert alert-error">{err}</div>}

      <div className="card bg-base-100 shadow">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>ผู้ยื่น</th>
                <th>วัน/เวลา</th>
                <th>เหตุผล</th>
                <th>สถานะ</th>
                <th className="w-48">การอนุมัติ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const nurse = r.nurse ?? r.user ?? {};
                return (
                  <tr key={r.id}>
                    <td>
                      <div className="font-medium">
                        {nurse.name ?? nurse.email ?? `#${nurse.id}`}
                      </div>
                    </td>
                    <td>
                      <div>
                        {dmy(r.startTime)} ({hhmm(r.startTime)} -{" "}
                        {hhmm(r.endTime)})
                      </div>
                      <div className="text-xs opacity-70 my-1">
                        ยื่นเมื่อ {dmy(r.createdAt)} {hhmm(r.createdAt)}
                      </div>
                    </td>
                    <td className="max-w-sm">
                      <div className="truncate">{r.reason || "-"}</div>
                    </td>
                    <td>{badge(r.status)}</td>
                    <td>
                      {String(r.status).toLowerCase() === "pending" ? (
                        <div className="flex gap-2">
                          <button
                            className={`btn btn-success btn-sm ${
                              deciding === r.id ? "loading" : ""
                            }`}
                            onClick={() => decide(r.id, "approved")}
                            disabled={deciding === r.id}
                          >
                            อนุมัติ
                          </button>
                          <button
                            className={`btn btn-error btn-sm ${
                              deciding === r.id ? "loading" : ""
                            }`}
                            onClick={() => decide(r.id, "rejected")}
                            disabled={deciding === r.id}
                          >
                            ปฏิเสธ
                          </button>
                        </div>
                      ) : (
                        <span className="text-sm opacity-70">
                          ดำเนินการแล้ว
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="text-center p-6 opacity-60">
                    ไม่พบคำขอ
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
