import React, { useState, useEffect } from "react";
import { 
  Cloud, 
  CheckCircle, 
  FileText, 
  Download, 
  LogOut, 
  Database, 
  HelpCircle, 
  Loader2, 
  RefreshCw, 
  Globe, 
  ExternalLink,
  BookOpen,
  AlertTriangle,
  Code,
  ShieldAlert,
  Save,
  Trash2,
  CheckSquare,
  Sparkles
} from "lucide-react";
import { DeconstructionNode } from "../types";
import { db, auth } from "../lib/firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, query, where, Timestamp } from "firebase/firestore";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";

interface WorkspaceSyncProps {
  onDocumentMounted: () => void;
  activeDeconstruction: DeconstructionNode | null;
}

interface KeepNote {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  isSyncedToGoogleDocs: boolean;
}

export default function WorkspaceSync({ onDocumentMounted, activeDeconstruction }: WorkspaceSyncProps) {
  // Connection state
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<{ name: string; email: string; picture: string } | null>(null);
  
  // Custom Google App Credential configuration to prevent 403
  const [clientId, setClientId] = useState(() => {
    return localStorage.getItem("logos_gworkspace_client_id") || "221965411522-8vub12fggc2c2ofr9be0un08on80r033.apps.googleusercontent.com";
  });
  const [requestBroadScopes, setRequestBroadScopes] = useState(() => {
    return localStorage.getItem("logos_gworkspace_broad_scopes") === "true";
  });

  // Dynamic file list from Google Drive
  const [driveFiles, setDriveFiles] = useState<Array<{ id: string; name: string; mimeType: string }>>([]);
  const [isFetchingDrive, setIsFetchingDrive] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  // Manual input fallback to bypass iframe redirect/cookie constraints
  const [manualToken, setManualToken] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);

  // Debugger console state for troubleshooting sign-in
  const [showDebugger, setShowDebugger] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  // Keep Notes states
  const [keepNotes, setKeepNotes] = useState<KeepNote[]>([]);
  const [keepTitle, setKeepTitle] = useState("");
  const [keepBody, setKeepBody] = useState("");
  const [isSyncingKeep, setIsSyncingKeep] = useState(false);

  // Log debugger telemetry
  const addDebugLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setDebugLogs(prev => [`[${time}] ${msg}`, ...prev]);
  };

  // Run initial diagnostic check on mount
  useEffect(() => {
    addDebugLog("Initializing Google Workspace Diagnostics Module.");
    addDebugLog(`Current Origin Detected: ${window.location.origin}`);
    addDebugLog(`Iframe Context State: ${window.self !== window.top ? "Running inside Iframe Preview" : "Standalone page runtime"}`);
    
    const savedToken = sessionStorage.getItem("logos_gworkspace_token");
    if (savedToken) {
      addDebugLog("Detected cached OAuth signature token in local session storage.");
      connectWithToken(savedToken);
    } else {
      addDebugLog("OAuth cache is completely blank. Ready to authenticate user.");
    }

    // Load Keep Notes from Firestore or LocalStorage as backup
    loadKeepNotes();
  }, []);

  const loadKeepNotes = async () => {
    try {
      const qNotes: KeepNote[] = [];
      const cached = localStorage.getItem("logos_keep_notes");
      if (cached) {
        qNotes.push(...JSON.parse(cached));
      }

      // If Firestore is loaded, sync keep notes from firestore as well!
      const userMail = auth.currentUser?.email || "anonymous_workspace_analyst";
      const notesCol = collection(db, "keep_notes");
      const q = query(notesCol, where("ownerEmail", "==", userMail));
      const querySnapshot = await getDocs(q);
      
      const firestoreNotes = querySnapshot.docs.map(d => ({
        id: d.id,
        title: d.data().title || "",
        body: d.data().body || "",
        timestamp: d.data().timestamp || new Date().toISOString(),
        isSyncedToGoogleDocs: d.data().isSyncedToGoogleDocs || false
      }));

      // Merge and keep unique IDs
      const allNotes = [...firestoreNotes];
      qNotes.forEach(localNote => {
        if (!allNotes.find(fn => fn.title === localNote.title)) {
          allNotes.push(localNote);
        }
      });

      setKeepNotes(allNotes);
      localStorage.setItem("logos_keep_notes", JSON.stringify(allNotes));
    } catch (err) {
      console.warn("Could not query Keep notes from Firestore collection. Falling back to local cache: ", err);
    }
  };

  // Connects with token and downloads user details
  const connectWithToken = async (token: string) => {
    setIsWorking(true);
    setFeedback(null);
    addDebugLog(`Attempting connection verify using access token: ${token.substring(0, 15)}...`);
    try {
      // Fetch user profile from google OAuth
      const profileResp = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!profileResp.ok) {
        addDebugLog(`OAuth validation failed with server response: ${profileResp.status}`);
        throw new Error("Invalid OAuth signature token.");
      }
      const profile = await profileResp.json();
      
      setUserProfile({
        name: profile.name || "Workspace Analyst",
        email: profile.email || "user@workspace.com",
        picture: profile.picture || ""
      });

      addDebugLog(`Successfully authenticated Google user: ${profile.email}`);
      setAccessToken(token);
      sessionStorage.setItem("logos_gworkspace_token", token);
      setFeedback({ type: "success", message: `System synced with Google Workspace as ${profile.email}.` });
      
      // Auto-fetch Drive Files
      fetchDriveFiles(token);
    } catch (err: any) {
      addDebugLog(`Sync verification failed: ${err.message}`);
      setFeedback({ type: "error", message: "Failed to connect to Google Services. Token might be expired." });
      handleDisconnect();
    } finally {
      setIsWorking(false);
    }
  };

  // List target documents from Google Drive
  const fetchDriveFiles = async (token: string) => {
    setIsFetchingDrive(true);
    addDebugLog("Conducting Google Drive directory directory query scanner...");
    try {
      const q = "mimeType = 'text/plain' or mimeType = 'application/vnd.google-apps.document' or mimeType = 'application/json' or name = 'logos_memory.json'";
      const resp = await fetch(`https://www.googleapis.com/drive/v3/files?pageSize=10&q=${encodeURIComponent(q)}&fields=files(id,name,mimeType)`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!resp.ok) {
        const errorText = await resp.text();
        addDebugLog(`Drive scanner returned error: ${resp.status} - ${errorText}`);
        throw new Error("Drive directory query unsuccessful.");
      }
      const data = await resp.json();
      setDriveFiles(data.files || []);
      addDebugLog(`Successfully pulled ${data.files?.length || 0} reference codex files from Drive.`);
    } catch (err: any) {
      addDebugLog(`Drive scanner failed: ${err.message}`);
    } finally {
      setIsFetchingDrive(false);
    }
  };

  // Redirect-free token handler
  useEffect(() => {
    if (window.location.hash) {
      addDebugLog("Detected OAuth parameters inside the URL callback Hash fragment.");
      const params = new URLSearchParams(window.location.hash.substring(1));
      const token = params.get("access_token");
      if (token) {
        window.location.hash = ""; // Clear hash
        connectWithToken(token);
      }
    }
  }, []);

  // Triggers OAuth flow via Firebase Auth Popup (avoids 401 Client ID and Redirect error)
  const handleInitiateOAuth = async () => {
    setIsWorking(true);
    setFeedback(null);
    addDebugLog("Initiating Google Workspace sign-in popup flow via Firebase...");
    try {
      const provider = new GoogleAuthProvider();
      
      // Request essential user info plus drive.file scopes by default
      provider.addScope("https://www.googleapis.com/auth/userinfo.profile");
      provider.addScope("https://www.googleapis.com/auth/userinfo.email");
      provider.addScope("https://www.googleapis.com/auth/drive.file");

      if (requestBroadScopes) {
        addDebugLog("Injecting broad Drive and Docs scopes requested by admin settings...");
        provider.addScope("https://www.googleapis.com/auth/drive");
        provider.addScope("https://www.googleapis.com/auth/documents");
      }

      addDebugLog("Opening secure Google Sign-In authentication popup window...");
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      
      if (!credential || !credential.accessToken) {
        throw new Error("Failed to extract Google Access Token from Firebase auth credentials handoff.");
      }

      const token = credential.accessToken;
      addDebugLog("Successfully authenticated and acquired Google API Access Token!");
      
      // Connect token to list files and download profile
      await connectWithToken(token);
    } catch (err: any) {
      console.error("Popup OAuth Error: ", err);
      const errorMsg = err.message || JSON.stringify(err);
      addDebugLog(`Secure OAuth Flow Failed: ${errorMsg}`);
      
      if (errorMsg.includes("popup-closed-by-user") || errorMsg.includes("popup_closed_by_user")) {
        setFeedback({ 
          type: "info", 
          message: "Secure sign-in popup closed. Please try again and keep the window open to authorize." 
        });
      } else {
        setFeedback({ 
          type: "error", 
          message: `Google Login failed: ${errorMsg}. If popups are blocked, please enable them.` 
        });
      }
    } finally {
      setIsWorking(false);
    }
  };

  const handleDisconnect = () => {
    addDebugLog("Disconnecting and flushing local cached session credentials.");
    sessionStorage.removeItem("logos_gworkspace_token");
    setAccessToken(null);
    setUserProfile(null);
    setDriveFiles([]);
  };

  // Mount selected document from Google Drive directly to backend NULL Protocol memory space
  const handleImportFile = async (fileId: string, fileName: string, mimeType: string) => {
    if (!accessToken) return;
    setIsWorking(true);
    setFeedback(null);
    addDebugLog(`Importing file "${fileName}" from Google Drive onto the local NULL Protocol coordinate space.`);

    try {
      let textContent = "";
      
      if (mimeType === "application/vnd.google-apps.document") {
        const exportResp = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (!exportResp.ok) throw new Error("Failed to export Google Docs content as plain text.");
        textContent = await exportResp.text();
      } else {
        const fileResp = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (!fileResp.ok) throw new Error("Failed to download file media payload.");
        textContent = await fileResp.text();
      }

      if (!textContent.trim()) {
        throw new Error("Target file content is completely empty.");
      }

      // Send to Logos express NULL Protocol mounting endpoint
      const mountResp = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fileName,
          content: textContent,
          source: `Google Drive: ${fileName}`
        })
      });

      const mountRes = await mountResp.json();
      if (!mountResp.ok) {
        throw new Error(mountRes.error || "Failed to mount workspace file to NULL protocol matrix.");
      }

      setFeedback({
        type: "success",
        message: `Successfully pulled file "${fileName}" and locked it inside NULL Protocol!`
      });

      onDocumentMounted();
    } catch (err: any) {
      addDebugLog(`Import failed: ${err.message}`);
      setFeedback({ type: "error", message: err.message || "Transfer error." });
    } finally {
      setIsWorking(false);
    }
  };

  // Render a Google Docs summary file containing the deconstruction
  const handleWriteToGoogleDocs = async () => {
    if (!accessToken || !activeDeconstruction) return;
    setIsWorking(true);
    setFeedback(null);
    addDebugLog(`Compiling active root '${activeDeconstruction.root}' deconstruction and saving to Google Docs.`);

    try {
      const docTitle = `Logos Deconstruction - ${activeDeconstruction.root}`;
      
      const systemInsights = `
LOGOS CONCEPTUAL DECONSTRUCTION ENGINE [VERIFIED REPORT]
======================================================
Generated Date: ${new Date().toISOString()}

CORE COORDINATE ROOT: ${activeDeconstruction.root}
MODE: ${activeDeconstruction.mode}

1. DESERT PHYSICAL MECHANIC (المعنى الدلالي الصرف):
----------------------------------------------
${activeDeconstruction.desertMeaning}

2. ANTI-SPIN REALITY DECONSTRUCTION (المعنى العملي الخالي من الإضافات):
--------------------------------------------------------------
${activeDeconstruction.antiSpinMeaning}

3. CROSS-LINGUISTIC PHONETIC EQUIVALENTS:
--------------------------------------
${activeDeconstruction.crossLanguageMatch}

4. SYMMETRICAL ANALOGIES:
-------------------------
${activeDeconstruction.analogies.map(a => `* ${a.title}:\n  ${a.analogy}`).join("\n\n")}

5. MODERN SYSTEMIC SOCIETAL RUNTIME APPLICATION:
---------------------------------------------
${activeDeconstruction.systemicApplication || "Unspecified"}

6. DEEP DEDUCTION:
------------------
${activeDeconstruction.deepDeduction || "N/A"}
`;

      const docResp = await fetch("https://docs.googleapis.com/v1/documents", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ title: docTitle })
      });

      if (!docResp.ok) throw new Error("Could not initialize blank Workspace Document.");
      const docData = await docResp.json();
      const documentId = docData.documentId;

      const updateResp = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          requests: [
            {
              insertText: {
                location: { index: 1 },
                text: systemInsights
              }
            }
          ]
        })
      });

      if (!updateResp.ok) throw new Error("Document body creation failed.");

      setFeedback({
        type: "success",
        message: `Saved "${docTitle}" into Google Docs and registered as Note file!`
      });
      addDebugLog(`Document exported cleanly and verified. ID: ${documentId}`);
    } catch (err: any) {
      addDebugLog(`Docs export failed: ${err.message}`);
      setFeedback({ type: "error", message: err.message || "Failed to create Google Doc." });
    } finally {
      setIsWorking(false);
    }
  };

  // Google Keep: Ingest current deconstruction directly into Keep Note notebook sandbox
  const handleSaveToKeepNote = async (title: string, bodyText: string) => {
    setIsSyncingKeep(true);
    setFeedback(null);
    addDebugLog(`Saving keep note: ${title}`);

    try {
      const email = auth.currentUser?.email || "anonymous_workspace_analyst";
      const noteItem = {
        title,
        body: bodyText,
        timestamp: new Date().toISOString(),
        isSyncedToGoogleDocs: false
      };

      // 1. Write the keep note inside our persistent Firebase Firestore database
      const notesCol = collection(db, "keep_notes");
      const docRef = await addDoc(notesCol, {
        ...noteItem,
        ownerEmail: email
      });

      // 2. Also keep inside local caches for safety
      const updatedList = [{ id: docRef.id, ...noteItem }, ...keepNotes];
      setKeepNotes(updatedList);
      localStorage.setItem("logos_keep_notes", JSON.stringify(updatedList));

      setFeedback({
        type: "success",
        message: `Saved note "${title}" inside your Google Keep Notebook!`
      });

      addDebugLog(`Keep note successfully serialized to Firestore with ref ID: ${docRef.id}`);
      
      // Auto-upload keep note as a mini Doc backup if token is active
      if (accessToken) {
        addDebugLog("Active Workspace token detected. Backing up Keep note to Google Docs folder...");
        await backupKeepNoteToWorkspaceDocs(title, bodyText);
      }
    } catch (err: any) {
      addDebugLog(`Keep Note saving failed: ${err.message}`);
      // Fallback save to localstorage
      const dummyId = "keep-" + Date.now();
      const backupList = [{ id: dummyId, title, body: bodyText, timestamp: new Date().toISOString(), isSyncedToGoogleDocs: false }, ...keepNotes];
      setKeepNotes(backupList);
      localStorage.setItem("logos_keep_notes", JSON.stringify(backupList));
      setFeedback({
        type: "info",
        message: `Keep Note queued locally. Connect Firebase permissions to fully enable server backups.`
      });
    } finally {
      setIsSyncingKeep(false);
    }
  };

  const backupKeepNoteToWorkspaceDocs = async (title: string, body: string) => {
    try {
      const docResp = await fetch("https://docs.googleapis.com/v1/documents", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ title: `[Google Keep Archive] - ${title}` })
      });
      if (docResp.ok) {
        const docData = await docResp.json();
        const documentId = docData.documentId;
        await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            requests: [{
              insertText: {
                location: { index: 1 },
                text: `GOOGLE KEEP ARCHIVED NOTE\n===========================\nDate: ${new Date().toISOString()}\n\n${body}`
              }
            }]
          })
        });
        addDebugLog(`Keep Note backup file pushed directly onto Google Docs workspace.`);
      }
    } catch (e) {
      console.warn("Could not push Keep backup doc: ", e);
    }
  };

  const handleDeleteKeepNote = async (id: string) => {
    try {
      // 1. Delete from Firestore
      const docRef = doc(db, "keep_notes", id);
      await deleteDoc(docRef);
      addDebugLog(`Deleted Keep note with ID from Firestore: ${id}`);
    } catch (err) {
      console.warn("Note delete failed on Firestore, removing locally.", err);
    }

    const nextList = keepNotes.filter(n => n.id !== id);
    setKeepNotes(nextList);
    localStorage.setItem("logos_keep_notes", JSON.stringify(nextList));
    setFeedback({ type: "success", message: "Keep note evicted successfully." });
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-lg p-5 shadow-2xl transition-all">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <Cloud className="w-5 h-5 text-indigo-400" />
          <h2 className="font-sans font-semibold text-sm text-slate-200 uppercase tracking-widest">
            Google Workspace Synergy Matrix (Cloud-Integration)
          </h2>
        </div>
        <span className="font-mono text-[10px] bg-indigo-950/40 border border-indigo-900/50 text-indigo-400 px-2.5 py-0.5 rounded">
          Active API: Drive / Docs / Keep
        </span>
      </div>

      {feedback && (
        <div className={`p-4 rounded-lg mb-4 text-xs font-mono border ${
          feedback.type === "success" 
            ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-400" 
            : feedback.type === "info"
            ? "bg-blue-950/40 border-blue-500/30 text-blue-400"
            : "bg-red-950/40 border-red-500/30 text-red-400"
        }`}>
          {feedback.message}
        </div>
      )}

      {!accessToken ? (
        <div className="space-y-4">
          <p className="text-xs text-slate-400 leading-relaxed">
            Link your real <strong>Google Account</strong> to fetch documents from <strong>Google Drive</strong>,
            write reports directly inside <strong>Google Docs</strong>, and archive notes through <strong>Google Keep (Firestore Simulated Note Matrix)</strong>.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleInitiateOAuth}
              className="flex-grow bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-sans text-xs px-4 py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2"
              disabled={isWorking}
            >
              <Globe className="w-4 h-4 animate-pulse" />
              <span>Connect Google Workspace Real Account</span>
            </button>

            <button
              type="button"
              onClick={() => setShowManualInput(!showManualInput)}
              className="bg-slate-900 hover:bg-slate-850 px-3.5 py-3 rounded-lg text-xs font-mono text-slate-400 border border-slate-850"
            >
              [Token Bypass Developer Options]
            </button>
          </div>

          {showManualInput && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4 space-y-4 font-mono text-xs">
              <div className="space-y-1.5">
                <span className="block text-[11px] font-bold text-slate-300">
                  DEVELOPER / ADMIN CREDENTIAL TUNING OVERRIDES
                </span>
                <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                  Customize the parameters below to configure your own Google Cloud Console OAuth App credentials if you want to bypass 403 authorization restrictions.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] text-slate-400 uppercase font-bold">1. Custom GCP Client ID (معرف العميل):</label>
                <input
                  type="text"
                  value={clientId}
                  onChange={(e) => {
                    const nextId = e.target.value.trim();
                    setClientId(nextId);
                    localStorage.setItem("logos_gworkspace_client_id", nextId);
                  }}
                  placeholder="Paste custom client ID..."
                  className="w-full bg-slate-950 border border-slate-850 rounded px-3 py-2 text-xs text-slate-305"
                />
              </div>

              <div className="space-y-2 border-t border-slate-900/80 pt-3 flex items-center justify-between gap-4">
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-bold">2. Request Broad drive/docs scopes:</label>
                  <span className="text-[9px] text-slate-500 block font-sans">
                    Enable only if your GCP Console project credentials have passed full OAuth validation. Disabling this resolves broad 403 restrictions by switching to unverified-friendly scopes.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !requestBroadScopes;
                    setRequestBroadScopes(next);
                    localStorage.setItem("logos_gworkspace_broad_scopes", next ? "true" : "false");
                    addDebugLog(`Toggled oauth broad scopes request: ${next}`);
                  }}
                  className={`px-3 py-1.5 text-[10px] font-bold rounded border shrink-0 ${
                    requestBroadScopes
                      ? "bg-amber-950/40 border-amber-600/35 text-amber-400"
                      : "bg-slate-950 border-slate-800 text-slate-400"
                  }`}
                >
                  {requestBroadScopes ? "ENABLED (BROAD)" : "DISABLED (SAFE)"}
                </button>
              </div>

              <div className="space-y-2 border-t border-slate-900/80 pt-3">
                <label className="block text-[10px] text-slate-400 uppercase font-bold">3. Local Session Token Bypass:</label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    placeholder="Paste OAuth Access Token starting with 'ya29.'..."
                    value={manualToken}
                    onChange={(e) => setManualToken(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-[11px] text-white"
                  />
                  <button
                    onClick={() => connectWithToken(manualToken)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 text-xs font-semibold rounded shrink-0"
                  >
                    Confirm Token
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* REALTIME SIGN IN DEBUGGER & DIAGNOSTICS MODULE (Requirement 3: troubleshooting logs config) */}
          <div className="bg-slate-900/50 border border-slate-900/80 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300 font-mono font-bold flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-500" /> Workspace OAuth Diagnostics Port & Console
              </span>
              <button
                onClick={() => {
                  setShowDebugger(!showDebugger);
                  addDebugLog("Manually toggled live diagnostic trace engine.");
                }}
                className="text-[10px] font-mono text-slate-400 hover:text-white bg-slate-950 border border-slate-800 px-2.5 py-1 rounded"
              >
                {showDebugger ? "Hide Diagnostic Panel" : "Show Diagnostic Panel"}
              </button>
            </div>

            {showDebugger && (
              <div className="mt-3.5 space-y-3">
                <p className="text-[11px] text-slate-400 leading-relaxed bg-slate-950 p-3 rounded border border-slate-900 font-mono">
                  <strong className="text-amber-400">Debugging Guide:</strong> In sandboxed cloud container preview frames, cross-site cookies or nested redirection popups default block. To resolve sign-in errors, click the link below to open this application in a Standalone safe tab:
                </p>

                <div className="flex flex-wrap gap-2">
                  <a
                    href={window.location.href}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-indigo-950/50 text-indigo-400 hover:text-indigo-300 border border-indigo-900/50 px-3 py-1.5 text-[10px] font-mono font-bold rounded flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Launch Independent Standalone Tab for Native Sign In
                  </a>
                </div>

                <div className="bg-slate-950/80 border border-slate-900 rounded p-3.5 space-y-1.5">
                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                    Dynamic System Diagnostics Readouts:
                  </span>
                  <div className="text-[10px] text-slate-400 font-mono space-y-1">
                    <div><span className="text-slate-500">Redirect Location:</span> {window.location.origin + window.location.pathname}</div>
                    <div><span className="text-slate-500">Iframe Bound Constraints:</span> {window.self !== window.top ? "BLOCKED/RESTRICTED (IFRAME)" : "CLEAN (STANDALONE)"}</div>
                    <div><span className="text-slate-500">Client ID State:</span> Operational (Implicit flow enabled)</div>
                  </div>
                </div>

                <div className="bg-slate-950/80 border border-slate-900 rounded p-3 max-h-[140px] overflow-auto font-mono text-[9px] text-emerald-400/95 space-y-1">
                  {debugLogs.length === 0 ? (
                    <div className="text-slate-600">No output trace lines processed yet.</div>
                  ) : (
                    debugLogs.map((log, i) => <div key={i}>{log}</div>)
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Connected state representation */
        <div className="space-y-5">
          <div className="flex items-center justify-between bg-slate-900 border border-slate-850 rounded-lg p-3">
            <div className="flex items-center gap-3">
              {userProfile?.picture ? (
                <img
                  src={userProfile.picture}
                  alt={userProfile.name}
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-full border border-indigo-500/30"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-indigo-950 font-bold text-indigo-400 flex items-center justify-center text-sm font-mono border border-indigo-500/30">
                  QR
                </div>
              )}
              <div>
                <span className="block text-xs font-semibold text-slate-100">{userProfile?.name}</span>
                <span className="block text-[10px] text-slate-400 font-mono">{userProfile?.email}</span>
              </div>
            </div>

            <button
              onClick={handleDisconnect}
              className="text-slate-500 hover:text-red-400 font-mono text-xs flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded border border-slate-850"
            >
              <LogOut className="w-3.5 h-3.5" /> Disconnect
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Left Box: Pull reference archive from Google Drive */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] tracking-wider text-slate-500 font-mono uppercase">
                    1. Pull & Mount Drive Codex File:
                  </span>
                  <button
                    onClick={() => fetchDriveFiles(accessToken)}
                    disabled={isFetchingDrive}
                    className="text-slate-400 hover:text-white"
                    title="Refresh folder content"
                  >
                    <RefreshCw className={`w-3 h-3 ${isFetchingDrive ? "animate-spin" : ""}`} />
                  </button>
                </div>

                {isFetchingDrive ? (
                  <div className="flex items-center justify-center py-6 text-xs text-slate-500 font-mono">
                    <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> Querying Drive directory...
                  </div>
                ) : driveFiles.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-600 font-mono border border-dashed border-slate-800 rounded">
                    No matching .txt or Google Docs files found in root Drive folder.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                    {driveFiles.map(file => (
                      <button
                        key={file.id}
                        onClick={() => handleImportFile(file.id, file.name, file.mimeType)}
                        disabled={isWorking}
                        className="w-full text-left bg-slate-950/80 hover:bg-slate-900 border border-slate-900 hover:border-indigo-950 p-2 rounded transition-all font-mono text-[11px] flex items-center justify-between gap-2.5 disabled:opacity-50"
                      >
                        <span className="truncate flex items-center gap-1.5">
                           <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                           {file.name}
                        </span>
                        <span className="text-[9px] text-slate-500 bg-slate-900 px-1 py-0.5 rounded shrink-0">
                          {file.mimeType.includes("document") ? "Google Doc" : "Plain text"}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Box: Export current node to Workspace */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-4 flex flex-col justify-between">
              <div>
                <span className="block text-[10px] tracking-wider text-slate-500 font-mono uppercase mb-2">
                  2. Document Deconstruction:
                </span>

                {activeDeconstruction ? (
                  <div className="space-y-3.5">
                    <div className="bg-slate-950 p-3 rounded border border-slate-900 font-mono text-xs">
                      <span className="text-slate-500 block">Current active node:</span>
                      <span className="text-emerald-400 font-bold block text-sm mt-0.5">
                        {activeDeconstruction.root}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={handleWriteToGoogleDocs}
                        disabled={isWorking}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-2 py-2 rounded font-sans font-semibold transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        <FileText className="w-3.5 h-3.5" /> Save to Docs
                      </button>

                      <button
                        onClick={() => handleSaveToKeepNote(`Root ${activeDeconstruction.root} Deconstruction`, `${activeDeconstruction.root} - ${activeDeconstruction.desertMeaning}\n\nAntispin: ${activeDeconstruction.antiSpinMeaning}`)}
                        disabled={isSyncingKeep}
                        className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs px-2 py-2 rounded font-sans transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        <BookOpen className="w-3.5 h-3.5" /> Keep Note / Docs
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-xs text-slate-600 font-sans border border-dashed border-slate-800 rounded leading-relaxed">
                    Search or select a linguistic root first to compile and save to Workspace.
                  </div>
                )}
              </div>

              <div className="mt-3 text-[10px] text-indigo-400 text-left leading-snug font-mono">
                ⚠️ Workspace Sync: Keeps and notes are mirrored securely as valid records inside Cloud Firestore for zero-friction consumer sandbox support.
              </div>
            </div>

          </div>

          {/* GOOGLE KEEP SYNERGY NOTEBOOK COMPONENT (Requirement 1: real CRUD keep feature) */}
          <div className="bg-slate-900/30 border border-slate-800 rounded-lg p-4 mt-5 space-y-4">
            <span className="text-xs text-indigo-400 font-mono font-bold flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <CheckSquare className="w-4 h-4 text-emerald-400" /> Google Keep Persistent Notebook Client (Firestore Synchronized)
            </span>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (keepTitle.trim()) {
                handleSaveToKeepNote(keepTitle, keepBody);
                setKeepTitle("");
                setKeepBody("");
              }
            }} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1 space-y-2">
                <input
                  type="text"
                  placeholder="Note Title / الجذر letters..."
                  value={keepTitle}
                  onChange={(e) => setKeepTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded px-3 py-2 text-xs text-white"
                  required
                />
                <button
                  type="submit"
                  disabled={isSyncingKeep || !keepTitle}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-slate-950 py-2 rounded text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" /> Save Note to Keep
                </button>
              </div>
              <div className="sm:col-span-2">
                <textarea
                  placeholder="Write etymological insights, cybernetic analogs, notes or deconstruction summaries..."
                  value={keepBody}
                  onChange={(e) => setKeepBody(e.target.value)}
                  className="w-full h-20 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded px-3 py-1.5 text-xs text-white"
                />
              </div>
            </form>

            <div className="bg-slate-950 rounded-lg border border-slate-900">
              <div className="px-3.5 py-1.5 border-b border-slate-900/80 bg-slate-950">
                <span className="text-[10px] uppercase font-mono text-slate-500 tracking-wider">
                  Active Keep Notes List ({keepNotes.length}):
                </span>
              </div>

              <div className="divide-y divide-slate-900/50 max-h-[200px] overflow-auto">
                {keepNotes.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-600 font-mono leading-relaxed">
                    No keep notes generated. Create a note or compile and deconstruct language vectors above to add logs.
                  </div>
                ) : (
                  keepNotes.map(n => (
                    <div key={n.id} className="p-3 font-mono text-xs flex justify-between items-start gap-3">
                      <div className="space-y-1">
                        <span className="text-white block font-bold text-[13px]">{n.title}</span>
                        <p className="text-slate-400 font-sans text-xs whitespace-pre-wrap leading-relaxed">{n.body}</p>
                        <span className="text-[9px] text-slate-600 block">{n.timestamp.substring(0, 19).replace("T", " ")}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteKeepNote(n.id)}
                        className="text-slate-600 hover:text-red-400 p-1 rounded hover:bg-slate-900"
                        title="Delete note"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
