import React, { useState } from 'react';
import { X, Clock, Plus, Trash2 } from 'lucide-react';
import CustomButton from './CustomButton';
import { ref, update } from "firebase/database";
import { db } from "../firebase"; // ปรับ path ให้ตรงโปรเจกต์คุณ


const TimerModal = ({ isOpen, onClose, mode = 'fog', onNotify }) => {
  const [schedules, setSchedules] = useState(['13:00', '17:00', '21:00']);
  const [newTime, setNewTime] = useState('');
  const [lightStart, setLightStart] = useState("");
const [lightEnd, setLightEnd] = useState("");

  if (!isOpen) return null;

  const addTime = () => {
    if (newTime && !schedules.includes(newTime)) {
      setSchedules([...schedules, newTime].sort());
      setNewTime('');
    }
  };

  const removeTime = (time) => {
    setSchedules(schedules.filter((t) => t !== time));
  };

  const isLightMode = mode === 'light';
  const notify = onNotify || (() => {});

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-xl overflow-hidden">
        <div className="p-6 bg-emerald-600 text-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Clock size={20} />
            <h3 className="font-bold">
              {isLightMode ? "ตั้งเวลาเปิด-ปิดไฟ" : "ตั้งเวลาพ่นอัตโนมัติ"}
            </h3>
          </div>
          <button onClick={onClose}>
            <X />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {!isLightMode && (
            <>
              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ">
                  เพิ่มเวลา (24 ชั่วโมง)
                </p>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-3">
                  {/* ชั่วโมง */}
                  <select
                    value={newTime.split(":")[0] || ""}
                    onChange={(e) =>
                      setNewTime(
                        `${e.target.value}:${newTime.split(":")[1] || "00"}`,
                      )
                    }
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">ชั่วโมง</option>
                    {[...Array(24)].map((_, h) => {
                      const hour = String(h).padStart(2, "0");
                      return (
                        <option key={hour} value={hour}>
                          {hour}
                        </option>
                      );
                    })}
                  </select>

                  <span className="font-bold text-slate-400">:</span>

                  {/* นาที */}
                  <select
                    value={newTime.split(":")[1] || "00"}
                    onChange={(e) =>
                      setNewTime(
                        `${newTime.split(":")[0] || "00"}:${e.target.value}`,
                      )
                    }
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {["00", "15", "30", "45"].map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>

                  {/* ปุ่มเพิ่ม */}
                  <button
                    onClick={addTime}
                    disabled={!newTime || newTime.length !== 5}
                    className="p-3 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 transition"
                    title="เพิ่มเวลา"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>

              <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  รายการเวลาทำงาน
                </p>
                {schedules.map((time) => (
                  <div
                    key={time}
                    className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100"
                  >
                    <span className="text-xl font-mono font-bold text-slate-700">
                      {time} น.
                    </span>
                    <button
                      onClick={() => removeTime(time)}
                      className="text-rose-400 hover:text-rose-600"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {isLightMode && (
            <div className="space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                ตั้งเวลาเปิดไฟ (24 ชั่วโมง)
              </p>

              {/* เวลาเริ่ม */}
              <div className="space-y-1">
                <span className="text-sm font-medium text-slate-600">
                  เริ่มเปิดไฟ
                </span>
                <div className="flex items-center gap-2">
                  <select
                    value={lightStart.split(":")[0] || ""}
                    onChange={(e) =>
                      setLightStart(
                        `${e.target.value}:${lightStart.split(":")[1] || "00"}`,
                      )
                    }
                    className="time-input flex-1"
                  >
                    <option value="">ชั่วโมง</option>
                    {[...Array(24)].map((_, h) => {
                      const hour = String(h).padStart(2, "0");
                      return (
                        <option key={hour} value={hour}>
                          {hour}
                        </option>
                      );
                    })}
                  </select>

                  <span className="font-bold text-slate-400">:</span>

                  <select
                    value={lightStart.split(":")[1] || "00"}
                    onChange={(e) =>
                      setLightStart(
                        `${lightStart.split(":")[0] || "00"}:${e.target.value}`,
                      )
                    }
                    className="time-input flex-1"
                  >
                    {["00", "15", "30", "45"].map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* เวลาสิ้นสุด */}
              <div className="space-y-1">
                <span className="text-sm font-medium text-slate-600">
                  ปิดไฟ
                </span>
                <div className="flex items-center gap-2">
                  <select
                    value={lightEnd.split(":")[0] || ""}
                    onChange={(e) =>
                      setLightEnd(
                        `${e.target.value}:${lightEnd.split(":")[1] || "00"}`,
                      )
                    }
                    className="time-input flex-1"
                  >
                    <option value="">ชั่วโมง</option>
                    {[...Array(24)].map((_, h) => {
                      const hour = String(h).padStart(2, "0");
                      return (
                        <option key={hour} value={hour}>
                          {hour}
                        </option>
                      );
                    })}
                  </select>

                  <span className="font-bold text-slate-400">:</span>

                  <select
                    value={lightEnd.split(":")[1] || "00"}
                    onChange={(e) =>
                      setLightEnd(
                        `${lightEnd.split(":")[0] || "00"}:${e.target.value}`,
                      )
                    }
                    className="time-input flex-1"
                  >
                    {["00", "15", "30", "45"].map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <p className="text-xs text-slate-400">
                ระบบจะเปิดไฟตั้งแต่ <b>{lightStart || "--:--"}</b> ถึง{" "}
                <b>{lightEnd || "--:--"}</b>
              </p>
            </div>
          )}

          <div className="pt-4 flex gap-3">
            <CustomButton
              onClick={async () => {
                try {
                  if (isLightMode) {
                    if (!lightStart || !lightEnd) {
                      notify("กรุณาเลือกเวลาเปิด และ ปิดไฟ");
                      return;
                    }

                    await update(ref(db, "device/esp32_01/auto_config/light"), {
                      start: lightStart,
                      end: lightEnd,
                    });

                    notify("บันทึกเวลาไฟเรียบร้อยแล้ว");
                  } else {
                    await update(ref(db, "device/esp32_01/auto_config/fog"), {
                      times: schedules,
                      duration_sec: 30,
                    });

                    notify("บันทึกตารางเวลาพ่นเรียบร้อยแล้ว");
                  }

                  onClose();
                } catch (err) {
                  console.error(err);
                  notify("เกิดข้อผิดพลาดในการบันทึก");
                }
              }}
              className="flex-1"
            >
              บันทึก
            </CustomButton>

            <CustomButton
              onClick={onClose}
              variant="secondary"
              className="flex-1"
            >
              ปิด
            </CustomButton>
          </div>

          <CustomButton
            className="w-full"
            variant="warning"
            onClick={async () => {
              try {
                if (isLightMode) {
                  const defaultStart = "18:00";
                  const defaultEnd = "06:00";

                  // 1️⃣ อัปเดต Firebase
                  await update(ref(db, "device/esp32_01/auto_config/light"), {
                    start: defaultStart,
                    end: defaultEnd,
                  });

                  // 2️⃣ อัปเดต state ใน modal
                  setLightStart(defaultStart);
                  setLightEnd(defaultEnd);

                  notify("คืนค่าไฟเป็นค่าเริ่มต้นแล้ว");
                } else {
                  const defaultTimes = ["13:00", "17:00", "21:00"];
                  const defaultDuration = 30;

                  await update(ref(db, "device/esp32_01/auto_config/fog"), {
                    times: defaultTimes,
                    duration_sec: defaultDuration,
                  });

                  setSchedules(defaultTimes);
                  setDuration(defaultDuration);

                  notify("คืนค่าพ่นน้ำเป็นค่าเริ่มต้นแล้ว");
                }
              } catch (err) {
                console.error(err);
                notify("รีเซ็ตไม่สำเร็จ");
              }
            }}
          >
            คืนค่าเริ่มต้น
          </CustomButton>
        </div>
      </div>
    </div>
  );
};

export default TimerModal;
