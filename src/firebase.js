import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyA_B6ncvGWcjM1jgAqHWQmD1KGUexK99WM",
  authDomain: "hydroponic-ddc5e.firebaseapp.com",
  databaseURL:
    "https://hydroponic-ddc5e-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "hydroponic-ddc5e",
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
