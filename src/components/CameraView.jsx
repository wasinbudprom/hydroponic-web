import { useEffect, useState, useRef } from "react";
import { getDatabase, ref, onValue, set } from "firebase/database";

const CameraView = () => {
  const [imageUrl, setImageUrl] = useState("");
  const [isCapturing, setIsCapturing] = useState(false);
  const timeoutRef = useRef(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const db = getDatabase();
    const imageRef = ref(db, "device/esp32_01/camera/lastImage");

    const unsubscribe = onValue(imageRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setImageUrl(data);
        setIsCapturing(false);
        setError("");

        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      }
    });

    return () => unsubscribe();
  }, []);

  const captureImage = async () => {
    const db = getDatabase();

    try {
      setIsCapturing(true);
      setError(""); // เคลียร์ error ก่อน

      await set(ref(db, "device/esp32_01/camera/capture"), true);

      // ⏱ timeout 10 วิ
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      timeoutRef.current = setTimeout(() => {
        setIsCapturing(false);
        setError("❌ ไม่พบภาพจากกล้อง");
      }, 10000);
    } catch (error) {
      console.error("Firebase write error:", error);
      setIsCapturing(false);
      setError("❌ เกิดข้อผิดพลาด");
    }
  };

  return (
    <>
      <div className="camera-card">
        <div className="p-5 border-b">
          <h3 className="font-bold text-slate-700">Live Snapshot</h3>
        </div>

        <div className="video-frame">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt="Garden"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="p-10 text-center">ยังไม่มีภาพ</div>
          )}
        </div>
      </div>

      <button
        disabled={isCapturing}
        className={`font-bold py-2 px-4 rounded transition ${
          isCapturing
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-500 hover:bg-blue-700 text-white"
        }`}
        onClick={captureImage}
      >
        {isCapturing ? "⏳ กำลังถ่ายภาพ..." : "📸 ถ่ายภาพ"}
      </button>
      {error && (
        <p className="text-red-500 text-sm mt-2 text-center">{error}</p>
      )}
    </>
  );
};

export default CameraView;
