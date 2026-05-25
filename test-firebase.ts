import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from "fs";

async function main() {
  const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));
  const app = initializeApp(config);
  const db = getFirestore(app);
  
  const snap = await getDocs(collection(db, "test"));
  console.log("Firebase client sdk works in node!", snap.size);
}
main().catch(console.error);
