import { useEffect, useState } from "react";
import { getDatabase, ref, onValue, set } from "firebase/database";

const CameraView = () => {
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    const db = getDatabase();
    const imageRef = ref(db, "device/esp32_01/camera/lastImage");

    const unsubscribe = onValue(imageRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setImageUrl(data);
      }
    });

    return () => unsubscribe();
  }, []);

  const captureImage = async () => {
    const db = getDatabase();

    try {
      await set(ref(db, "device/esp32_01/camera/capture"), true);
      console.log("Capture set to true");
    } catch (error) {
      console.error("Firebase write error:", error);
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
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded cursor-pointer"
        onClick={captureImage}
      >
        📸 ถ่ายภาพ
      </button>
    </>
  );
};

export default CameraView;
