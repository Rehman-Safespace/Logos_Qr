import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User 
} from "firebase/auth";
import { 
  initializeFirestore, 
  doc, 
  getDocFromServer,
  collection,
  getDocs,
  setDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  onSnapshot
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const dbId = (firebaseConfig as any).firestoreDatabaseId;
export const db = dbId
  ? initializeFirestore(app, { experimentalForceLongPolling: true }, dbId)
  : initializeFirestore(app, { experimentalForceLongPolling: true });
export const auth = getAuth(app);

// Operational helper types for zero-trust error telemetry
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test Connection on load as strictly mandated by Firebase integration skill with initial delay and retry handling
async function testConnection(retriesLeft = 3, delayMs = 1500) {
  // Give the browser network stack a moment of grace on first boot
  if (retriesLeft === 3) {
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  try {
    await getDocFromServer(doc(db, "test", "connection"));
    console.log("Firebase connection response successfully validated and secured.");
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      if (retriesLeft > 0) {
        console.warn(`Firebase detected offline state on startup. Retrying connection in ${delayMs}ms... (${retriesLeft} retries left)`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        return testConnection(retriesLeft - 1, delayMs * 1.5);
      }
      console.warn("Firebase starts in simulated offline mode. To activate live persistent database capabilities, please run the Firebase setup wizard integration tool. Status: " + error.message);
    } else {
      console.warn("Firebase connection test signature warning (this is expected if default /test/connection path is write-only or restricted). Error: " + (error instanceof Error ? error.message : String(error)));
    }
  }
}
testConnection();
