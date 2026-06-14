import { useState, useRef, useEffect } from 'react';
import { Settings2, Activity, Thermometer, Droplets, Zap, Wind } from 'lucide-react';
import './App.css';
import { auth, db } from "./firebase";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { ref, onValue, set,update  } from "firebase/database";
import DailyStatsContainer from "./components/DailyStatsContainer";



import Dashboard from './components/Dashboard';
import CameraView from './components/CameraView';
import TimerModal from './components/TimerModal';

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState('');

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

  const handleMixNutrient = async (mlPerLiter) => {
  try {
    await update(
      ref(db, "/device/esp32_01/mix"),
      {
        start: true,
        ml_per_liter: mlPerLiter,
      }
    );

    console.log("ส่งคำสั่งสำเร็จ");
    console.log("กด", mlPerLiter);
  } catch (error) {
    console.error(error);
  }
};

  useEffect(() => {
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
  }, []);

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
    if (!user) return;

    // ===== Light = ch6 =====
    const lightRef = ref(db, `${BASE}/ch6`);
    const unsubLight = onValue(lightRef, (snap) => {
      setIsLight(snap.val() === true);
    });

    // ===== Fog = ch5 =====
    const fogRef = ref(db, `${BASE}/ch5`);
    const unsubFog = onValue(fogRef, (snap) => {
      setIsFogging(snap.val() === true);
    });

    return () => {
      unsubLight();
      unsubFog();
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const modeRef = ref(db, MODE_PATH);
    return onValue(modeRef, (snap) => {
      const mode = snap.val();
      setIsAutoMode(mode === "auto");
    });
  }, [user]);

  useEffect(() => {
    if (isReportOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [isReportOpen]);

  useEffect(() => {
    if (!user) return;

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
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const configRef = ref(db, "/device/esp32_01/auto_config");

    return onValue(configRef, (snap) => {
      const data = snap.val();
      if (!data) return;

      setConfig({
        light: data.light || { start: "-", end: "-" },
        fog: data.fog || { times: [], duration_sec: 0 },
      });
    });
  }, [user]);

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

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    setIsSigningIn(true);

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      showToast("เข้าสู่ระบบสำเร็จ");
      setPassword('');
    } catch {
      setAuthError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    showToast("ออกจากระบบแล้ว");
  };

  const [stats, setStats] = useState({
    temp: null,
    humidity: null,
    ec: null,
    ph: null,
    lastUpdate: "-",
  });

  const sensorData = [
    { icon: Thermometer, label: 'อุณหภูมิ', value: stats.temp ?? 0, unit: '°C', color: 'text-red-500 bg-red-50'},
    { icon: Zap, label: 'ค่า EC (ปุ๋ย)', value: stats.ec ?? 0, unit: 'ppm', color: 'text-yellow-500 bg-yellow-100'},
    { icon: Wind, label: 'ค่า pH', value: stats.ph ?? 0, unit: 'pH', color: 'text-purple-500 bg-purple-50'},
    { icon: Droplets, label: 'ความชื้น', value: stats.humidity ?? 0, unit: '%', color: 'text-blue-500 bg-blue-50'},
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 grid place-items-center px-4">
        <p className="text-slate-500 font-medium">กำลังตรวจสอบสถานะผู้ใช้...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-linear-to-br from-emerald-50 via-white to-cyan-50 grid place-items-center px-4">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-md bg-white border border-emerald-100 rounded-2xl shadow-xl shadow-emerald-100/40 p-6 space-y-4"
        >
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-slate-900">Aeroponic Login</h1>
            <p className="text-sm text-slate-500">เข้าสู่ระบบ</p>
          </div>

          <label className="block text-sm font-semibold text-slate-700">
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-300"
              placeholder="you@example.com"
              required
            />
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-300"
              placeholder="••••••••"
              required
            />
          </label>

          {authError && (
            <p className="rounded-lg bg-red-50 text-red-600 text-sm font-medium px-3 py-2">{authError}</p>
          )}

          <button
            type="submit"
            disabled={isSigningIn}
            className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-semibold py-2.5 transition"
          >
            {isSigningIn ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>
      </div>
    );
  }

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
            <span className="hidden md:inline text-xs font-semibold text-slate-500">
              {user.email}
            </span>
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
            <button
              onClick={handleLogout}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
            >
              ออกจากระบบ
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
            onMixNutrient={handleMixNutrient} 
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