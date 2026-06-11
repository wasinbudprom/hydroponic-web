import React, { useState } from "react";
import { Activity, Play, Square } from "lucide-react";
import CustomButton from "./CustomButton";
import { ref, set } from "firebase/database";
import { db } from "../firebase";

const SensorItem = ({ icon: Icon, label, value, unit, color, progress }) => (
  <div className="sensor-card group">
    <div className="flex items-start justify-between mb-4">
      <div className={`sensor-icon-box ${color}`}>
        <Icon size={24} />
      </div>
      <div className="text-right">
        <p className="sensor-label">{label}</p>
        <div className="flex items-baseline justify-end gap-1 mt-1">
          <span className="sensor-value">{value}</span>
          <span className="text-sm font-bold text-slate-400">{unit}</span>
        </div>
      </div>
    </div>
  </div>
);

const Dashboard = ({
  sensors,
  isFogging,
  setIsFogging,
  isLight,
  setIsLight,
  onOpenSetting,
  onNotify,
  isAutoMode,
  onMixNutrient,
}) => {
  // ← ย้าย useState เข้ามาอยู่ใน component
  const [growthStage, setGrowthStage] = useState("seedling");

  // ← ย้ายฟังก์ชันเข้ามาอยู่ใน component
  const handleSetGrowthStage = async (stage) => {
    const ecValue = stage === "seedling" ? 950 : 1250;
    try {
      await set(ref(db, "/device/esp32_01/auto_config/ec_limit"), ecValue);
      setGrowthStage(stage);
      onNotify(
        stage === "seedling"
          ? "🌱 ตั้งค่าต้นอ่อน EC 950"
          : "🥔 ตั้งค่าต้นโต EC 1250",
      );
    } catch (err) {
      onNotify("เกิดข้อผิดพลาด");
    }
  };

  const handleSetup = async () => {
    const confirmed = window.confirm(
      "⚠️ ระบบจะเปิด ปั้มน้ำเล็ก 4 ตัว ค้างไว้ 20 วินาที\nต้องการเริ่ม Setup หรือไม่?",
    );
    if (!confirmed) return;

    try {
      await set(ref(db, "/device/esp32_01/setup/start"), true);
      onNotify("🔧 เริ่ม Setup...");
    } catch (err) {
      onNotify("เกิดข้อผิดพลาด");
    }
  };

  const notify = onNotify || (() => {});
  const manualDisabled =
    isAutoMode; /*ถ้าเปิดโหมด Auto ไว้ ปุ่มกดมือ (Manual) ทั้งหมดจะถูกปิดใช้งานทันที*/
  const settingDisabled =
    !isAutoMode; /*ถ้าเปิดโหมด Auto ไว้ ปุ่มตั้งค่าต่างๆ จะถูกปิดใช้งานทันที*/
  return (
    <div className="lg:col-span-8 space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sensors.map((s, i) => (
          <SensorItem key={i} {...s} />
        ))}
      </div>

      <button
        onClick={handleSetup}
        className="w-full py-3 rounded-2xl bg-red-500 text-white font-bold hover:bg-red-600 transition"
      >
        🔧 Setup ระบบ
      </button>

      {/* Growth Stage Selector */}
      <div className="action-panel">
        <div className="panel-glow"></div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Activity size={20} className="text-emerald-400" />
              เลือกระยะการเจริญเติบโต เพื่อปรับค่า EC ของปุ๋ยอัตโนมัติ
            </h3>

            <div className="status-tag bg-white/10 text-slate-400">
              {growthStage === "seedling" ? "🌱 ต้นอ่อน" : "🌿 โตเต็มวัย"}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CustomButton
              variant={growthStage === "seedling" ? "primary" : "secondary"}
              className="w-full"
              onClick={() => handleSetGrowthStage("seedling")}
            >
              🌱 ต้นอ่อน
              <div className="text-xs opacity-80 mt-1">EC 950</div>
            </CustomButton>

            <CustomButton
              variant={growthStage === "mature" ? "primary" : "secondary"}
              className="w-full"
              onClick={() => handleSetGrowthStage("mature")}
            >
              🌿 โตเต็มวัย
              <div className="text-xs opacity-80 mt-1">EC 1250</div>
            </CustomButton>
          </div>
        </div>
      </div>

      <div className="action-panel">
        <div className="panel-glow"></div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Activity size={20} className="text-emerald-400" />
              ผสมน้ำปุ๋ย
            </h3>

            <div className="status-tag bg-white/10 text-slate-400">
              น้ำ 4 ลิตร
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CustomButton
              variant="secondary"
              className="w-full"
              onClick={() => {
                const confirmed = window.confirm(
                  "⚠️ ก่อนผสมปุ๋ย กรุณาตรวจสอบว่ามีน้ำเปล่า 3-4 ลิตรอยู่ในถังหลัก\n\nต้องการเริ่มผสมปุ๋ยสำหรับต้นอ่อนหรือไม่?",
                );

                if (!confirmed) {
                  notify("ยกเลิกการผสมปุ๋ย");
                  return;
                }

                notify("เริ่มผสมปุ๋ย...");
                onMixNutrient(1);
              }}
            >
              🌱 ต้นอ่อน
            </CustomButton>

            <CustomButton
              variant="secondary"
              className="w-full"
              onClick={() => {
                const confirmed = window.confirm(
                  "⚠️ ก่อนผสมปุ๋ย กรุณาตรวจสอบว่ามีน้ำเปล่า 3-4 ลิตรอยู่ในถังหลัก\n\nต้องการเริ่มผสมปุ๋ยสำหรับต้นโตเต็มวัยหรือไม่?",
                );

                if (!confirmed) {
                  notify("ยกเลิกการผสมปุ๋ย");
                  return;
                }

                notify("เริ่มผสมปุ๋ย...");
                onMixNutrient(2);
              }}
            >
              🌿 โตเต็มวัย
            </CustomButton>
          </div>
        </div>
      </div>
      <div className="action-panel">
        <div className="panel-glow"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Activity size={20} className="text-emerald-400" />{" "}
              ควบคุมระบบพ่นน้ำ
            </h3>
            <div
              className={`status-tag ${isFogging ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-slate-400"}`}
            >
              {isFogging ? "กำลังพ่นน้ำ..." : "ระบบสแตนด์บาย"}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CustomButton
              variant={isFogging ? "danger" : "primary"}
              onClick={() => !manualDisabled && setIsFogging(!isFogging)}
              disabled={manualDisabled}
              className={`w-full ${manualDisabled ? "opacity-50 cursor-not-allowed " : ""}`}
            >
              {isFogging ? "หยุดพ่นน้ำ" : "เริ่มพ่นน้ำ"}
            </CustomButton>

            <CustomButton
              variant="secondary"
              className={`btn-glass w-full ${
                settingDisabled ? "opacity-50 cursor-not-allowed " : ""
              }`}
              disabled={settingDisabled}
              onClick={() => {
                if (settingDisabled) {
                  notify("โหมด MANUAL ไม่สามารถตั้งเวลาได้");
                  return;
                }
                onOpenSetting("fog");
                notify("เปิดหน้าตั้งเวลาพ่นน้ำ");
              }}
            >
              ตั้งค่าเวลาพ่นน้ำ
            </CustomButton>
          </div>
        </div>
      </div>

      <div className="action-panel">
        <div className="panel-glow"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Activity size={20} className="text-emerald-400" /> ควบคุมไฟ LED
              Glow Light
            </h3>
            <div
              className={`status-tag ${isLight ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-slate-400"}`}
            >
              {isLight ? "เปิดไฟอยู่..." : "ระบบสแตนด์บาย"}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CustomButton
              variant={isLight ? "danger" : "primary"}
              onClick={() => !manualDisabled && setIsLight(!isLight)}
              disabled={manualDisabled}
              className={`w-full ${manualDisabled ? "opacity-50 cursor-not-allowed " : ""}`}
            >
              {isLight ? "ปิดไฟ LED" : "เปิดไฟ LED"}
            </CustomButton>
            <CustomButton
              variant="secondary"
              className={`btn-glass w-full ${settingDisabled ? "opacity-50 cursor-not-allowed " : ""}`}
              disabled={settingDisabled}
              onClick={() => {
                if (settingDisabled) {
                  notify("โหมด MANUAL ไม่สามารถตั้งเวลาได้");
                  return;
                }
                onOpenSetting("light");
                notify("เปิดหน้าตั้งเวลาไฟ");
              }}
            >
              ตั้งเวลาเปิด-ปิดไฟ
            </CustomButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
