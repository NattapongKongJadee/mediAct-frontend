// src/components/LeaveModal.jsx
import { useState } from "react";
import api from "../api";

export default function LeaveModal({
  assignmentId,
  date,
  start,
  end,
  onClose,
  onSuccess,
}) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    try {
      setLoading(true);
      await api.post(
        "/leave-requests",
        new URLSearchParams({
          shiftAssignmentId: String(assignmentId),
          reason,
        }),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );
      onSuccess?.();
    } catch (e) {
      console.error(e);
      alert("ส่งคำขอลาไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <dialog className="modal modal-open">
      <div className="modal-box">
        <div className="flex justify-start items-center space-x-2">
          <h3 className="font-bold text-lg flex items-center">
            ลา :
            <span className="badge badge-primary mx-2">
              {date} ({start} -{end})
            </span>
          </h3>
        </div>
        <div className="flex mt-4">
          <textarea
            className="textarea textarea-bordered w-full "
            placeholder="เหตุผล (ถ้ามี)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        <div className="flex  justify-start">
          <p className="my-2 text-sm opacity-60 font-thin  ">
            หมายเหตุ: คำขอจะผูกกับเวรนี้
          </p>
        </div>
        <div className="modal-action">
          <button className="btn" onClick={onClose} disabled={loading}>
            ยกเลิก
          </button>
          <button
            className="btn btn-primary"
            onClick={submit}
            disabled={loading}
          >
            {loading ? "กำลังส่ง..." : "ยืนยัน"}
          </button>
        </div>
      </div>
    </dialog>
  );
}
