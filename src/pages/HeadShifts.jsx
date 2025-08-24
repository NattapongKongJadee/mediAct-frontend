// src/pages/head/HeadShifts.jsx
import { useEffect, useState } from "react";
import api from "../api";
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";

dayjs.extend(isSameOrBefore);

// ช่วยแปลง date + time ของ input ให้เป็น ISO string (UTC หรือ local ตามที่ backend คาดหวัง)
// ที่นี่จะรวม date + time เป็น local time แล้ว new Date(localString).toISOString()
const toISOFromDateTimeInputs = (dateStr, timeStr) => {
  if (!dateStr || !timeStr) return null;
  // สร้างสตริงแบบ "YYYY-MM-DDTHH:mm:00"
  const local = `${dateStr}T${timeStr}:00`;
  const d = new Date(local);
  return isNaN(d.getTime()) ? null : d.toISOString();
};

const dmy = (iso) => {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};
const hhmm = (iso) => {
  const d = new Date(iso);
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
};

export default function HeadShifts() {
  // form state
  const [date, setDate] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // list state
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get("/shifts"); // ปรับตามจริงถ้าคุณใช้ endpoint อื่น
      // คาดหวังแต่ละรายการ: { id, date, startTime, endTime, assignmentsCount }
      setRows(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!date || !start || !end) {
      setError("กรุณากรอกวันและเวลาให้ครบ");
      return;
    }

    // สร้าง start/end จากวันเดียวกันก่อน
    const startISO = toISOFromDateTimeInputs(date, start);
    const endISO0 = toISOFromDateTimeInputs(date, end);

    if (!startISO || !endISO0) {
      setError("รูปแบบวัน/เวลาไม่ถูกต้อง");
      return;
    }

    let startDt = dayjs(startISO);
    let endDt = dayjs(endISO0);

    // เวรข้ามเที่ยงคืน: ถ้า end <= start ให้เลื่อนไปวันถัดไป
    if (endDt.isSameOrBefore(startDt)) {
      endDt = endDt.add(1, "day");
    }

    const dateISO = dayjs(date).startOf("day").toISOString();

    try {
      await api.post(
        "/shifts",
        new URLSearchParams({
          date: dateISO,
          startTime: startDt.toISOString(),
          endTime: endDt.toISOString(),
        }),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );
      await load();

      // ✅ reset ฟอร์ม
      setDate("");
      setStart("");
      setEnd("");
    } catch (err) {
      setError(err.toString());
    }
  };
  //   const parseCustom = (s) => {
  //     const [date, time] = s.split(" : ");
  //     const [dd, mm, yyyy] = date.split("-").map(Number);
  //     const [HH, MM, SS] = time.split(":").map(Number);
  //     return new Date(yyyy, mm - 1, dd, HH, MM, SS);
  //   };

  return (
    <div className="space-y-4">
      {/* ฟอร์มสร้างเวร */}
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <div className="flex items-center justify-between">
            <div className="card-title text-2xl">สร้างเวร</div>
            <form
              className="grid grid-cols-1 md:grid-cols-4 gap-2 mt-2 w-1/2"
              onSubmit={submit}
            >
              <div className="form-control">
                <div className="flex space-x-2">
                  <label className="label">
                    <span className="label-text">วันที่</span>
                  </label>
                  <input
                    type="date"
                    className="input input-bordered"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-control">
                <div className="flex space-x-2">
                  <label className="label">
                    <span className="label-text">เริ่ม</span>
                  </label>
                  <input
                    type="time"
                    className="input input-bordered"
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-control">
                <div className="flex space-x-2">
                  <label className="label">
                    <span className="label-text">เลิก</span>
                  </label>
                  <input
                    type="time"
                    className="input input-bordered"
                    value={end}
                    onChange={(e) => setEnd(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-control md:items-end ml-auto">
                <button
                  className={`btn btn-primary btn-md ${
                    submitting ? "loading" : ""
                  }`}
                  type="submit"
                  disabled={submitting}
                >
                  สร้างเวร
                </button>
              </div>
            </form>
          </div>

          {error && <div className="alert alert-error mt-3">{error}</div>}
        </div>
      </div>

      {/* ตารางเวร + สถานะมีพยาบาลรองรับแล้วหรือยัง */}
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h3 className="card-title">เวรที่สร้างไว้</h3>
          <div className="overflow-x-auto mt-2">
            <table className="table">
              <thead>
                <tr>
                  <th>วันที่</th>
                  <th>เวลา</th>
                  <th>สถานะพยาบาล</th>
                </tr>
              </thead>
              <tbody>
                {rows
                  .slice() // clone กัน side effect
                  .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
                  .map((r) => {
                    const hasNurse = Number(r.assignmentsCount ?? 0) > 0;
                    return (
                      <tr key={r.id}>
                        <td>{dmy(r.date)}</td>
                        <td>
                          {hhmm(r.startTime)} - {hhmm(r.endTime)}
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
                      </tr>
                    );
                  })}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={3} className="text-center p-6 opacity-60">
                      ยังไม่มีเวร
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
