import { useEffect, useMemo, useState } from "react";
import api from "../api";

// helpers
const dmy = (iso) => {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = d.getFullYear();
  return `${dd}-${mm}-${yy}`;
};
const hhmm = (iso) => {
  const d = new Date(iso);
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
};

export default function HeadAssign() {
  const [nurses, setNurses] = useState([]);
  const [rows, setRows] = useState([]); // shifts
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(null); // shiftId ที่กำลัง assign
  const [error, setError] = useState("");
  const [filterDate, setFilterDate] = useState("");

  // nurse ที่เลือกบนแต่ละแถว: { [shiftId]: userId }
  const [picked, setPicked] = useState({});

  const load = async () => {
    setError("");
    setLoading(true);
    try {
      // 1) รายชื่อพยาบาล
      const ures = await api.get("/users", { params: { role: "nurse" } });
      setNurses(Array.isArray(ures.data) ? ures.data : []);
      const sres = await api.get("/shifts");
      setRows(Array.isArray(sres.data) ? sres.data : []);
    } catch (e) {
      console.error(e);
      setError("โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredRows = useMemo(() => {
    const list = rows
      .slice()
      .sort(
        (a, b) =>
          new Date(a.startTime) - new Date(b.startTime) ||
          new Date(a.endTime) - new Date(b.endTime)
      );
    if (!filterDate) return list;
    // filterDate เป็น YYYY-MM-DD -> เทียบกับ startTime ที่เป็น ISO
    return list.filter((r) => {
      const d = new Date(r.startTime);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}` === filterDate;
    });
  }, [rows, filterDate]);

  const onPick = (shiftId, userId) => {
    setPicked((prev) => ({
      ...prev,
      [shiftId]: userId ? Number(userId) : undefined,
    }));
  };

  const assign = async (shiftId) => {
    const userId = picked[shiftId];
    if (!userId) {
      setError("กรุณาเลือกพยาบาลก่อนจัดเวร");
      return;
    }
    setError("");
    setAssigning(shiftId);
    try {
      // POST /shift-assignments  (x-www-form-urlencoded)
      await api.post(
        "/shift-assignments",
        new URLSearchParams({
          userId: String(userId),
          shiftId: String(shiftId),
        }),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );
      // success → reload
      await load();
    } catch (e) {
      console.error(e);
      // จับข้อความ error จาก backend (เช่นซ้ำคนเดิมในเวรเดียวกัน P2002)
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.meta?.target?.join?.(", ") ||
        "จัดเวรไม่สำเร็จ";
      setError(Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setAssigning(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          {/* หัว */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">จัดเวรให้พยาบาล</h2>
            <div className="flex items-center gap-2">
              <input
                type="date"
                className="input input-bordered input-sm"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
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

      {error && <div className="alert alert-error">{error}</div>}

      {/* ตาราง */}
      <div className="card bg-base-100 shadow">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>วันที่</th>
                <th>เวลา</th>
                <th>พยาบาล</th>
                <th>สถานะเวร</th>
                <th className="w-36">ดำเนินการ</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((r) => {
                const hasNurse = Number(r.assignmentsCount ?? 0) > 0;
                return (
                  <tr key={r.id}>
                    <td>{dmy(r.startTime)}</td>
                    <div className="flex badge badge-outline items-center mt-4 ">
                      <td>
                        {hhmm(r.startTime)} - {hhmm(r.endTime)}
                      </td>
                    </div>
                    <td>
                      {r.assignedNurse ? (
                        // ถ้ามีพยาบาลแล้ว → แสดงชื่อ + disable
                        <span className="badge badge-ghost">
                          {r.assignedNurse.name ?? r.assignedNurse.email}
                        </span>
                      ) : (
                        // ยังไม่มี → ให้เลือก
                        <select
                          className="select select-bordered select-sm w-full max-w-xs"
                          value={picked[r.id] ?? ""}
                          onChange={(e) => onPick(r.id, e.target.value)}
                        >
                          <option value="">— เลือกพยาบาล —</option>
                          {nurses.map((n) => (
                            <option key={n.id} value={n.id}>
                              {n.name ?? n.email}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td>
                      {hasNurse ? (
                        <span className="badge badge-success">
                          มีพยาบาลแล้ว
                        </span>
                      ) : (
                        <span className="badge badge-warning">
                          ยังไม่มีพยาบาล
                        </span>
                      )}
                    </td>
                    <td>
                      <button
                        className={`btn btn-primary btn-sm ${
                          assigning === r.id ? "loading" : ""
                        }`}
                        onClick={() => assign(r.id)}
                        disabled={r.assignedNurse}
                      >
                        จัดเวร
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredRows.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="text-center p-6 opacity-60">
                    ไม่พบเวร
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
