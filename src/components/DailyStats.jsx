import React from "react";
import { Activity } from "lucide-react";

export default function DailyStats({ data, lastUpdate, selectedDate }) {
  if (!data) {
    return (
      <div className="report-card">
        <h4 className="font-black text-slate-800 mb-4">📊 สถิติวันนี้</h4>
        <p className="text-slate-400 text-sm">ยังไม่มีข้อมูล</p>
      </div>
    );
  }

  const Row = ({ label, min, max, unit, icon }) => (
    <div className="py-3 border-b border-slate-50 last:border-0">
      <div className="flex justify-between items-center mb-1">
        <span className="text-slate-500 text-sm font-medium">
          {icon} {label}
        </span>
      </div>

      <div className="flex gap-2">
        <div className="flex-1 bg-blue-50 text-blue-600 rounded-xl p-2 text-center">
          <div className="text-xs">ต่ำสุด</div>
          <div className="font-bold">
            {min ?? "-"} {unit}
          </div>
        </div>

        <div className="flex-1 bg-red-50 text-red-600 rounded-xl p-2 text-center">
          <div className="text-xs">สูงสุด</div>
          <div className="font-bold">
            {max ?? "-"} {unit}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="report-card">
      <h4 className="font-black text-slate-800 mb-6 flex items-center gap-2">
        วันที่{" "}
        {selectedDate}
      </h4>

      <div className="space-y-1">
        <Row
          label="อุณหภูมิ"
          min={data.temp?.min}
          max={data.temp?.max}
          unit="°C"
          icon="🌡"
        />
        <Row
          label="ความชื้น"
          min={data.humidity?.min}
          max={data.humidity?.max}
          unit="%"
          icon="💧"
        />
        <Row
          label="EC"
          min={data.ec?.min}
          max={data.ec?.max}
          unit="mS/cm"
          icon="⚡"
        />
        <Row
          label="pH"
          min={data.ph?.min}
          max={data.ph?.max}
          unit=""
          icon="🧪"
        />
      </div>
      <p className="text-[10px] text-center text-slate-300 mt-6">
        อัปเดตล่าสุดเมื่อ {lastUpdate || "-"}
      </p>
    </div>
  );
}