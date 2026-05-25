import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from "fs";

async function main() {
  const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));
  const app = initializeApp({ projectId: config.projectId });
  const db = getFirestore(app);
  
  const snap = await db.collection("test").get();
  console.log("Firebase admin sdk works in node!", snap.size);
}
main().catch(console.error);
