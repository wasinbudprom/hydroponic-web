import { useState, useRef, useEffect, use } from 'react';
import { Settings2, Activity, Thermometer, Droplets, Zap, Wind } from 'lucide-react';
import './App.css';
import { db } from "./firebase";
import { ref, onValue, set ,get } from "firebase/database";
import DailyStatsContainer from "./components/DailyStatsContainer";


import Dashboard from './components/Dashboard';
import CameraView from './components/CameraView';
import TimerModal from './components/TimerModal';

export default function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [modalMode, setModalMode] = useState('fog'); // 'fog' | 'light'
  const [isFogging, setIsFogging] = useState(false);
  const [isLight, setIsLight] = useState(false);
  const [isAutoMode, setIsAutoMode] = useState(true);
  const [toast, setToast] = useState('');
  const toastTimerRef = useRef(null);

  const BASE = "/device/esp32_01/relay_manual";
  const MODE_PATH = "/device/esp32_01/mode";

  const setMode = (auto) => {
    setIsAutoMode(auto);
    set(ref(db, "/device/esp32_01/mode"), auto ? "AUTO" : "MANUAL");
    showToast(auto ? "เปลี่ยนเป็นโหมด AUTO" : "เปลี่ยนเป็นโหมด MANUAL");
    set(ref(db, "/device/esp32_01/auto_config/light"), {
      start: lightStart,
      end: lightEnd,
    });
    set(ref(db, "/device/esp32_01/auto_config/fog"), {
      times: schedules,
      duration_sec: 30,
    });
    
  };

  const toggleMode = () => {
    const newMode = isAutoMode ? "manual" : "auto";
    set(ref(db, MODE_PATH), newMode);
    setIsAutoMode(!isAutoMode);
  };
  
  const [config, setConfig] = useState({
    light: { start: "-", end: "-" },
    fog: { times: [], duration_sec: 0 }
  });

  useEffect(() => {
    // ===== Light = ch6 =====
    const lightRef = ref(db, `${BASE}/ch6`);
    onValue(lightRef, (snap) => {
      setIsLight(snap.val() === true);
    });

    // ===== Fog = ch5 =====
    const fogRef = ref(db, `${BASE}/ch5`);
    onValue(fogRef, (snap) => {
      setIsFogging(snap.val() === true);
    });
  }, []);

  useEffect(() => {
    const modeRef = ref(db, MODE_PATH);
    return onValue(modeRef, (snap) => {
      const mode = snap.val();
      setIsAutoMode(mode === "auto");
    });
  }, []);

  useEffect(() => {
    if (isReportOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [isReportOpen]);

  useEffect(() => {
    const sensorRef = ref(db, "/device/esp32_01/sensor");
    const unsub = onValue(sensorRef, (snap) => {
      const v = snap.val();
      if (!v) return;

      setStats({
        temp: v.temp ?? null,
        humidity: v.humidity ?? null,
        ec: v.ec ?? null,
        ph: v.ph ?? null,
        lastUpdate: new Date().toLocaleTimeString("th-TH"),
      });
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    const configRef = ref(db, "/device/esp32_01/auto_config");

    return onValue(configRef, (snap) => {
      const data = snap.val();
      if (!data) return;

      setConfig({
        light: data.light || { start: "-", end: "-" },
        fog: data.fog || { times: [], duration_sec: 0 },
      });
    });
  }, []);

  const setFog = (value) => {
    set(ref(db, `${BASE}/ch5`), value);
    showToast(value ? "เริ่มพ่นหมอก" : "หยุดพ่นหมอก");
  };

  const setLightRelay = (value) => {
    set(ref(db, `${BASE}/ch6`), value);
    showToast(value ? "เปิดไฟ" : "ปิดไฟ");
  };

  const onOpenSetting = (mode = 'fog') => {
    setModalMode(mode);
    setIsModalOpen(true);
  };

  const showToast = ((message) => {
    setToast(message);
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = setTimeout(() => setToast(''), 2500);
  });

  const [stats, setStats] = useState({
    temp: null,
    humidity: null,
    ec: null,
    ph: null,
    lastUpdate: "-",
  });

  const sensorData = [
    { icon: Thermometer, label: 'อุณหภูมิ', value: stats.temp ?? 0, unit: '°C', color: 'text-red-500 bg-red-50'},
    { icon: Zap, label: 'ค่า EC (ปุ๋ย)', value: stats.ec ?? 0, unit: 'mS/cm', color: 'text-yellow-500 bg-yellow-100'},
    { icon: Wind, label: 'ค่า pH', value: stats.ph ?? 0, unit: 'pH', color: 'text-purple-500 bg-purple-50'},
    { icon: Droplets, label: 'ความชื้น', value: stats.humidity ?? 0, unit: '%', color: 'text-blue-500 bg-blue-50'},
  ];

  return (
    <>
      <div
        className={`main-layout ${isModalOpen ? "pointer-events-none select-none blur-[1px]" : ""}`}
      >
        <header className="max-w-7xl mx-auto flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-black">
              Aeroponic{" "}
              <span className="text-emerald-600 underline decoration-emerald-200">
                potato planter
              </span>
            </h1>
            <p className="text-slate-500 font-medium">
              ระบบควบคุมการปลูกมันฝรั่งแบบ Aeroponics
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full ${isAutoMode ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}
            >
              {isAutoMode ? "AUTO" : "MANUAL"}
            </span>
            {/* <button
              onClick={() => setMode(!isAutoMode)}
              className={`p-3 rounded-2xl shadow-sm border transition-colors ${
                isAutoMode
                  ? "bg-emerald-600 border-emerald-500 text-white"
                  : "bg-white border-slate-100 text-slate-400"
              }`}
            >
              <Settings2 />
            </button> */}
            <button onClick={toggleMode}>
              <Settings2 />
            </button>
          </div>
        </header>

        <div className="dashboard-grid">
          <div className="lg:hidden flex justify-end">
            <button
              onClick={() => setIsReportOpen(true)}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-500 text-white hover:bg-emerald-600 transition"
            >
              📊 สรุปรายงาน
            </button>
          </div>
          <Dashboard
            sensors={sensorData}
            isFogging={isFogging}
            setIsFogging={setFog}
            isLight={isLight}
            setIsLight={setLightRelay}
            onOpenSetting={onOpenSetting}
            onNotify={showToast}
            isAutoMode={isAutoMode}
          />

          <div className="lg:col-span-4 space-y-8">
            <div className="hidden lg:flex justify-end mb-4">
              <button
                onClick={() => setIsReportOpen(true)}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-500 text-white"
              >
                📊 สรุปรายงาน
              </button>
            </div>
            <CameraView />

            <div className="report-card mt-8">
              <h4 className="font-black text-slate-800 mb-4">
                ตั้งค่าปัจจุบัน (Auto)
              </h4>

              <div className="space-y-2 text-sm font-medium text-slate-600">
                <p>
                  🕒 Light: {config.light.start} - {config.light.end}
                </p>

                <p>
                  💧 Fog:{" "}
                  {config.fog.times.length > 0
                    ? config.fog.times.join(" / ")
                    : "-"}
                </p>

                <p>⏱ Fog duration: {config.fog.duration_sec} วิ</p>
              </div>
            </div>
          </div>
        </div>
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-slate-900 text-white px-4 py-3 shadow-lg shadow-slate-200 text-sm font-semibold">
            {toast}
          </div>
        )}
      </div>

      {isReportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* 🔥 Overlay */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsReportOpen(false)}
          />

          {/* 🔥 Modal Box */}
          <div className="relative bg-white rounded-2xl shadow-xl w-[95%] h-[90%] p-6 overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">
                <Activity size={18} className="text-emerald-500 inline" />{" "}
                &nbsp; รายงานย้อนหลัง
              </h3>
              <button
                onClick={() => setIsReportOpen(false)}
                className="text-slate-400 hover:text-red-500"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <DailyStatsContainer lastUpdate={stats.lastUpdate} />
          </div>
        </div>
      )}

      <TimerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode={modalMode}
        onNotify={showToast}
      />
    </>
  );
}
