import { useEffect, useState } from "react";
import { db } from "../firebase";
import { ref, onValue, set, get } from "firebase/database";
import DailyStats from "./DailyStats";

export default function DailyStatsContainer({ lastUpdate }) {
  const [dailyStats, setDailyStats] = useState(null);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toLocaleDateString("sv-SE"),
  );

  // =========================
  // เขียน min/max
  // =========================
  useEffect(() => {
    const sensorRef = ref(db, "/device/esp32_01/sensor");

    let lastWriteTime = 0; // ✅ เปลี่ยนชื่อ

    const unsub = onValue(sensorRef, async (snap) => {
      const v = snap.val();
      if (!v) return;

      // throttle
      if (Date.now() - lastWriteTime < 60000) return;
      lastWriteTime = Date.now();

      const today = new Date().toLocaleDateString("sv-SE");

      const statsRef = ref(db, `/device/esp32_01/daily_stats/${today}`);
      const statsSnap = await get(statsRef);
      const old = statsSnap.val() || {};

      const updateStat = (key, value) => {
        if (value == null) return old?.[key] || { min: "-", max: "-" };

        const min = old?.[key]?.min ?? value;
        const max = old?.[key]?.max ?? value;

        return {
          min: Math.min(min, value),
          max: Math.max(max, value),
        };
      };

      const newStats = {
        temp: updateStat("temp", v.temp),
        humidity: updateStat("humidity", v.humidity),
        ec: updateStat("ec", v.ec),
        ph: updateStat("ph", v.ph),
      };

      set(statsRef, newStats);
    });

    return () => unsub();
  }, []);

  // =========================
  // โหลดมาแสดง
  // =========================
  useEffect(() => {
    const statsRef = ref(db, `/device/esp32_01/daily_stats/${selectedDate}`);

    return onValue(statsRef, (snap) => {
      setDailyStats(snap.val());
    });
  }, [selectedDate]);

  // =========================
  // UI
  // =========================
  return (
    <>
      {/* 🔥 เลือกวัน */}
      <div className="mb-3 flex items-center gap-2">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          max={new Date().toLocaleDateString("sv-SE")}
          className="border rounded-lg px-3 py-1 text-sm"
        />

        <button
          onClick={() =>
            setSelectedDate(new Date().toLocaleDateString("sv-SE"))
          }
          className="text-xs text-emerald-600"
        >
        </button>
      </div>

      <DailyStats
        data={dailyStats}
        lastUpdate={lastUpdate}
        selectedDate={selectedDate} // ✅ ส่งไป
      />
    </>
  );
}
