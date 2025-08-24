import { useEffect, useMemo, useState } from "react";
import api from "../api";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay, isValid } from "date-fns";
import { th } from "date-fns/locale";

import "react-big-calendar/lib/css/react-big-calendar.css";
import LeaveModal from "../components/LeaveModal";

const locales = {
  "th-TH": th,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// helper: แปลงสตริงเป็น Date (ลอง ISO ก่อน เผื่อ backend เปลี่ยน, ไม่งั้นใช้ pattern ไทย)
const parseDateTime = (value) => {
  if (!value) return null;
  const iso = new Date(value);
  if (!isNaN(iso.getTime())) return iso; // เป็น ISO ใช้ได้เลย

  // รูปแบบ "21-08-2025 : 08:00:00"
  const dt = parse(value, "dd-MM-yyyy : HH:mm:ss", new Date());
  return isValid(dt) ? dt : null;
};

export default function NurseSchedule() {
  const [rows, setRows] = useState([]);
  const [leaveFor, setLeaveFor] = useState(null);
  const [pendingMsg, setPendingMsg] = useState("");
  const [date, setDate] = useState(new Date()); // วันที่ปัจจุบัน
  const [view, setView] = useState("month");

  const load = async () => {
    const res = await api.get("/my-schedule");
    setRows(Array.isArray(res.data) ? res.data : []);
    console.log("my-schedule:", res.data);
  };

  useEffect(() => {
    load();
  }, []);

  const events = useMemo(() => {
    return rows
      .filter((r) => r.leaveStatus !== "approved")
      .map((r, index) => {
        const start = parseDateTime(r.startTime);
        const end = parseDateTime(r.endTime);
        if (!start || !end) return null; // ข้ามรายการที่ parse ไม่ได้
        return {
          title: `#${index + 1} : ${r.startTime
            .split(" : ")[1]
            .slice(0, 5)}-${r.endTime.split(" : ")[1].slice(0, 5)}`,
          start,
          end,
          resource: r, // เก็บข้อมูลดิบไว้ใช้ตอนเปิด modal
        };
      })
      .filter(Boolean);
  }, [rows]);

  const onSelectEvent = (ev) => {
    const r = ev?.resource;
    if (!r) return;
    if ((r.leaveStatus ?? "").toLowerCase() === "pending") {
      setPendingMsg("คุณได้ขอการอนุมัติลาไปแล้ว");
      return;
    }
    setLeaveFor(r);
  };

  return (
    <div className="space-y-4">
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <div className="flex items-center space-x-4 justify-between">
            <div className="text-2xl font-semibold ">ตารางเวรของฉัน</div>
            <div className="flex flex-row">
              <div className="flex gap-4 mt-2 mx-4">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded bg-blue-500 border border-blue-700"></span>
                  <span className="text-sm">เวรปกติ</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded bg-yellow-400 border border-yellow-600"></span>
                  <span className="text-sm">รอการอนุมัติลา</span>
                </div>
              </div>
              <button className="btn btn-info btn-sm text-white" onClick={load}>
                รีเฟรช
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="h-[84vh] card bg-base-100 shadow p-2">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          onSelectEvent={onSelectEvent}
          eventPropGetter={(event) => {
            const status = event.resource?.leaveStatus;
            if (status === "pending") {
              return {
                style: {
                  backgroundColor: "#facc15",
                  borderColor: "#eab308",
                  color: "#111827",
                },
              }; // เหลืองเมื่อสถานะเป็น Pending
            }
            return {};
          }}
          date={date}
          onNavigate={(newDate) => setDate(newDate)}
          view={view}
          onView={(newView) => setView(newView)}
          // ถ้าต้องการภาษาไทย:
          culture="th-TH"
        />
      </div>
      {pendingMsg && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 z-50 alert alert-warning shadow-lg">
          <span>{pendingMsg}</span>
          <button className="btn btn-sm ml-2" onClick={() => setPendingMsg("")}>
            ปิด
          </button>
        </div>
      )}

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
