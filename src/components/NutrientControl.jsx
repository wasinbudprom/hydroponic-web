import { useState } from "react";
import { ref, update } from "firebase/database";
import { db } from "../firebase"; // import db ของคุณ

function NutrientControl() {
  const [stage, setStage] = useState("seedling");

  const handleMix = async () => {
    try {
      await update(
        ref(db, "/device/esp32_01/nutrient"),
        {
          start: true,
          stage: stage,
        }
      );

      alert(`สั่งผสมปุ๋ยแบบ ${stage} สำเร็จ`);
    } catch (error) {
      console.error(error);
      alert("สั่งงานไม่สำเร็จ");
    }
  };

  return (
    <div>
      <h2>ผสมน้ำปุ๋ย</h2>

      <select
        value={stage}
        onChange={(e) => setStage(e.target.value)}
      >
        <option value="seedling">ต้นอ่อน (2.5 mL/L)</option>
        <option value="mature">โตเต็มวัย (5 mL/L)</option>
      </select>

      <button onClick={handleMix}>
        ผสมปุ๋ย
      </button>
    </div>
  );
}

export default NutrientControl;