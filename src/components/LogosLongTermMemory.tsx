import React, { useState, useEffect } from "react";
import { 
  Database, 
  Download, 
  Upload, 
  RefreshCw, 
  CheckCircle, 
  Shield, 
  BookOpen, 
  FileJson,
  Plus,
  Trash2,
  AlertTriangle,
  BrainCircuit,
  CloudLightning,
  ExternalLink
} from "lucide-react";
import { DeconstructionNode } from "../types";
import { auth, db, handleFirestoreError, OperationType } from "../lib/firebase";
import { signInAnonymously } from "firebase/auth";
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc } from "firebase/firestore";

interface MemoryNode {
  key: string;
  root: string;
  insight: string;
  timestamp: string;
  ownerId?: string;
}

interface LogosLongTermMemoryProps {
  activeDeconstructionNodes: DeconstructionNode[];
  onInjectMemoryDirectives: (customRules: string[]) => void;
}

export default function LogosLongTermMemory({ activeDeconstructionNodes, onInjectMemoryDirectives }: LogosLongTermMemoryProps) {
  const [memories, setMemories] = useState<MemoryNode[]>([]);
  const [newRoot, setNewRoot] = useState("");
  const [newInsight, setNewInsight] = useState("");
  const [gdriveToken, setGdriveToken] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error" | "warning"; text: string } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLocalFilePresent, setIsLocalFilePresent] = useState<boolean | null>(null);

  // Initialize memories from localStorage and confirm server disk presentation
  useEffect(() => {
    const local = localStorage.getItem("logos_longterm_memory");
    let initialMems: MemoryNode[] = [];
    if (local) {
      try {
        initialMems = JSON.parse(local);
      } catch (e) {
        console.error("Failed to parse local memories ledger", e);
      }
    } else {
      // Auto pre-populate memory with foundational physical linguistic anchors
      initialMems = [
        {
          key: "mem-01",
          root: "ح-س-ب",
          insight: "The structural limit calculations (الحساب) must map fully onto physical energy-loss bounds inside active silicon or carbon networks.",
          timestamp: new Date().toISOString()
        },
        {
          key: "mem-02",
          root: "ح-ر-م",
          insight: "Forbidden address sandboxing constraints preventing cognitive degradation and data contamination from theological interpretations.",
          timestamp: new Date().toISOString()
        }
      ];
    }

    setMemories(initialMems);
    localStorage.setItem("logos_longterm_memory", JSON.stringify(initialMems));

    const verifyDatabaseDiskState = async () => {
      try {
        if (!auth.currentUser) {
           await signInAnonymously(auth);
        }
      } catch (e) {
         console.warn("Failed anonymous auth for memory sync", e);
      }
      
      auth.onAuthStateChanged((user) => {
         if (user) {
            const memRef = collection(db, "memories");
            const q = query(memRef, where("ownerId", "==", user.uid));
            onSnapshot(q, (snapshot) => {
               const latest: MemoryNode[] = [];
               snapshot.forEach(doc => latest.push({ key: doc.id, ...doc.data() } as MemoryNode));
               
               setIsLocalFilePresent(true); // indicates connected
               
               if (latest.length > 0) {
                 // Merge with local defaults
                 const merged = [...initialMems];
                 latest.forEach(serverMem => {
                   if (!merged.find(m => m.root.trim() === serverMem.root.trim())) {
                     merged.push(serverMem);
                   }
                 });
                 setMemories(merged);
                 localStorage.setItem("logos_longterm_memory", JSON.stringify(merged));
                 
                 const dynamicDirectives = merged.map(m => `Physical memory anchor for root [${m.root}]: "${m.insight}"`);
                 onInjectMemoryDirectives(dynamicDirectives);
               }
            });
         }
      });
    };

    verifyDatabaseDiskState();

    // Check Google Drive sync token in session storage
    const token = sessionStorage.getItem("logos_gworkspace_token");
    if (token) {
      setGdriveToken(token);
    }
  }, []);

  // Sync token checks periodically from window session storage
  useEffect(() => {
    const checkTokenInterval = setInterval(() => {
      const token = sessionStorage.getItem("logos_gworkspace_token");
      if (token !== gdriveToken) {
        setGdriveToken(token);
      }
    }, 2000);
    return () => clearInterval(checkTokenInterval);
  }, [gdriveToken]);

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoot.trim() || !newInsight.trim()) return;

    if (!auth.currentUser) {
      setStatusMsg({ type: "error", text: "Firebase Authentication required to compile." });
      return;
    }

    const key = "mem-" + Date.now();
    const nNode: MemoryNode = {
      key,
      root: newRoot.trim(),
      insight: newInsight.trim(),
      timestamp: new Date().toISOString(),
      ownerId: auth.currentUser.uid
    };
    
    try {
      await setDoc(doc(db, "memories", key), nNode);
      setNewRoot("");
      setNewInsight("");
      setStatusMsg({ type: "success", text: `Memory token for '${nNode.root}' merged into cognitive memory bank.` });
    } catch(err) {
      setStatusMsg({ type: "error", text: "Failed to persist to Firestore." });
      handleFirestoreError(err, OperationType.CREATE, `memories/${key}`);
    }
  };

  const handleDelete = async (key: string) => {
    try {
       await deleteDoc(doc(db, "memories", key));
    } catch(err) {
       setStatusMsg({ type: "error", text: "Failed to delete target." });
       handleFirestoreError(err, OperationType.DELETE, `memories/${key}`);
    }
  };

  // Compile active search history into persistent long-term memory
  const handleAutoAssimilateHistory = async () => {
    if (activeDeconstructionNodes.length === 0) {
      setStatusMsg({ type: "error", text: "Search chronological query history is empty. Deconstruct roots first." });
      return;
    }
    
    if (!auth.currentUser) return;

    let joinedCount = 0;

    for (const node of activeDeconstructionNodes) {
      const exists = memories.find(m => m.root === node.root);
      if (!exists && node.learningLog) {
        const key = "mem-auto-" + Date.now() + Math.random().toString(36).substring(2, 5);
        const mem: MemoryNode = {
          key,
          root: node.root,
          insight: `${node.desertMeaning} - ${node.learningLog.whatLearnt}`,
          timestamp: new Date().toISOString(),
          ownerId: auth.currentUser.uid
        };
        try {
           await setDoc(doc(db, "memories", key), mem);
           joinedCount++;
        } catch(e) {
           console.error("Auto assimilation sync failed", e);
        }
      }
    }

    if (joinedCount > 0) {
      setStatusMsg({ type: "success", text: `${joinedCount} new cognitive insights compiled and permanently locked in memory.` });
    } else {
      setStatusMsg({ type: "success", text: "All analyzed structures are already fully synchronized inside memory ledger." });
    }
  };

  // Export memory to a physical JSON backup file for user download
  const saveAndApplyMemories = async (mems: MemoryNode[]) => {
    if (!auth.currentUser) return;
    try {
      for (const m of mems) {
        m.ownerId = auth.currentUser.uid;
        await setDoc(doc(db, "memories", m.key), m);
      }
      setMemories(mems);
      localStorage.setItem("logos_longterm_memory", JSON.stringify(mems));
    } catch(e) {
      console.error("Bulk memory sync error", e);
    }
  };

  const handleDownloadJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(memories, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "logos_cognitive_memory.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setStatusMsg({ type: "success", text: "Logos Memory Database exported successfully as JSON." });
  };

  // Upload an existing backup and safely merge
  const handleUploadJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const reader = new FileReader();
    const file = e.target.files?.[0];
    if (!file) return;

    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          // Merge logic
          const merged = [...memories];
          let mergedCount = 0;
          parsed.forEach((item: any) => {
            if (item.root && item.insight) {
              const exists = merged.find(m => m.root === item.root);
              if (!exists) {
                merged.push({
                  key: item.key || "mem-" + Date.now() + mergedCount,
                  root: item.root,
                  insight: item.insight,
                  timestamp: item.timestamp || new Date().toISOString()
                });
                mergedCount++;
              }
            }
          });
          saveAndApplyMemories(merged);
          setStatusMsg({ type: "success", text: `Memory backup merged. Successfully ingested ${mergedCount} new root schemas.` });
        } else {
          throw new Error("JSON structure does not contain a valid memory list schema.");
        }
      } catch (err: any) {
        setStatusMsg({ type: "error", text: `Import failed: ${err.message}` });
      }
    };
    reader.readAsText(file);
  };

  // GDrive Synergy Sync: Automatically save 'logos_memory.json' to Google Drive
  const handleExportToGoogleDrive = async () => {
    if (!gdriveToken) {
      setStatusMsg({ type: "error", text: "Google account not link-synced. Connect Workspace tab first." });
      return;
    }

    setIsSyncing(true);
    setStatusMsg(null);

    try {
      // 1. Check if a pre-existing logos_memory.json config exists in user GDrive to update it
      const query = "name = 'logos_memory.json' and trashed = false";
      const searchResp = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id)`, {
        headers: { Authorization: `Bearer ${gdriveToken}` }
      });

      const searchData = await searchResp.json();
      const files = searchData.files || [];
      const memoryContent = JSON.stringify(memories, null, 2);

      let resp;
      if (files.length > 0) {
        // File exists, let's update it (patch)
        const fileId = files[0].id;
        resp = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${gdriveToken}`,
            "Content-Type": "application/json"
          },
          body: memoryContent
        });
      } else {
        // File does not exist, let's create a new metadata + media representation
        const metadata = {
          name: "logos_memory.json",
          mimeType: "application/json"
        };
        
        // Multi-part formulation simply for creation
        const form = new FormData();
        form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
        form.append("file", new Blob([memoryContent], { type: "application/json" }));

        resp = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
          method: "POST",
          headers: { Authorization: `Bearer ${gdriveToken}` },
          body: form
        });
      }

      if (!resp.ok) throw new Error("Could not push to Google Drive cloud.");
      setStatusMsg({ type: "success", text: "Successfully backed up and synchronized long-term memory inside Google Drive!" });
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message || "Failed Drive export connection." });
    } finally {
      setIsSyncing(false);
    }
  };

  // GDrive Synergy Sync: Fetch and load 'logos_memory.json' from GDrive to restore state
  const handleImportFromGoogleDrive = async () => {
    if (!gdriveToken) {
      setStatusMsg({ type: "error", text: "Google account not link-synced. Connect Workspace tab first." });
      return;
    }

    setIsSyncing(true);
    setStatusMsg(null);

    try {
      const query = "name = 'logos_memory.json' and trashed = false";
      const searchResp = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id)`, {
        headers: { Authorization: `Bearer ${gdriveToken}` }
      });

      const searchData = await searchResp.json();
      const files = searchData.files || [];

      if (files.length === 0) {
        throw new Error("No existing 'logos_memory.json' backup database found in the root of your Google Drive folder.");
      }

      const fileId = files[0].id;
      // Fetch item payload
      const fileResp = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: { Authorization: `Bearer ${gdriveToken}` }
      });

      if (!fileResp.ok) throw new Error("Could not retrieve file media payload from Drive.");
      const remoteMemories = await fileResp.json();

      if (Array.isArray(remoteMemories)) {
        saveAndApplyMemories(remoteMemories);
        setStatusMsg({ type: "success", text: `Successfully pulled and applied ${remoteMemories.length} memory records from Google Drive!` });
      } else {
        throw new Error("File content inside Drive does not match valid JSON array format.");
      }
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message || "Failed Drive import." });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-lg p-5 shadow-2xl transition-all">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <BrainCircuit className="w-5 h-5 text-indigo-400" />
          <h2 className="font-sans font-semibold text-sm text-slate-200 uppercase tracking-widest">
            Logos Long-Term Cognitive Memory Bank
          </h2>
        </div>
        <span className="font-mono text-[10px] bg-indigo-950/40 border border-indigo-900/50 text-indigo-400 px-2.5 py-0.5 rounded">
          Active Injection Enabled
        </span>
      </div>

      {statusMsg && (
        <div className={`p-3 rounded mb-4 text-xs font-mono border ${
          statusMsg.type === "success" 
            ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-400" 
            : "bg-red-950/40 border-red-500/30 text-red-400"
        }`}>
          {statusMsg.text}
        </div>
      )}

      <div className="space-y-4">
        <p className="text-xs text-slate-400 leading-relaxed">
          The <strong>Long-Term Memory Bank</strong> solves system volatility by persisting deconstruction records. 
          Its semantic payloads are <strong>linked, injected, and dynamically passed as core context</strong> back to the etymology engine's future generations.
        </p>

        {/* Persistent Sync Verification Warning Banner */}
        {isLocalFilePresent === false && (
          <div className="bg-amber-950/40 border border-amber-500/30 rounded p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <span className="block text-xs font-semibold text-amber-200">
                  Persistent Sync File "logos_cognitive_memory.json" NOT detected!
                </span>
                <span className="block text-[10px] text-amber-400/80 mt-0.5">
                  The local dual-sync database file is not present in the workspace. Please link an existing <code>logos_memory.json</code> file from Drive, import a JSON backup, or click save to write your current memories as the new persistent master copy.
                </span>
              </div>
            </div>
            <button
              onClick={() => saveAndApplyMemories([...memories])}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-3 py-1 text-[11px] rounded transition self-end sm:self-auto shrink-0"
            >
              Re-Save Master Copy
            </button>
          </div>
        )}

        {/* Sync Controls Header */}
        <div className="bg-slate-900/45 border border-slate-800 rounded-lg p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3.5">
          <div className="flex items-center gap-2 text-xs font-mono">
            <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-slate-300">Memory Database Scope:</span>
            <span className="text-emerald-400 bg-slate-950 px-2.5 py-0.5 rounded border border-slate-850 font-bold">
              {memories.length} Registered Nodes
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleAutoAssimilateHistory}
              title="Assimilate history"
              className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-[11px] font-sans font-extrabold px-3 py-1.5 rounded transition"
            >
              Assimilate Search History
            </button>
            <button
              onClick={handleDownloadJSON}
              className="bg-slate-950 hover:bg-slate-900 text-slate-300 border border-slate-800 px-3 py-1.5 rounded text-[11px] font-mono flex items-center gap-1"
            >
              <Download className="w-3 h-3" /> Dump JSON
            </button>
            <label className="bg-slate-950 hover:bg-slate-900 text-slate-300 border border-slate-800 px-3 py-1.5 rounded text-[11px] font-mono flex items-center gap-1 cursor-pointer">
              <Upload className="w-3 h-3" />
              <span>Restore JSON</span>
              <input type="file" onChange={handleUploadJSON} accept=".json" className="hidden" />
            </label>
          </div>
        </div>

        {/* Google Workspace Cloud-Auto back-up and restore (Requirement 4 Dynamic Export/Import) */}
        <div className="bg-gradient-to-r from-blue-950/20 to-indigo-950/20 border border-indigo-900/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-indigo-400 font-mono font-bold flex items-center gap-1.5">
              <CloudLightning className="w-3.5 h-3.5" /> Google Drive Memory Auto-Exchange Sync (RAG Connection)
            </span>
            {gdriveToken ? (
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/50 px-2 rounded-full border border-emerald-900/40">
                Connected
              </span>
            ) : (
              <span className="text-[10px] font-mono text-slate-500">
                Unlinked
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
            Directly connect your active Workspace token and execute complete imports/exports of etymology structures into <code>logos_memory.json</code> on your Google Drive root. Keep your deconstruction schemas uniform across devices!
          </p>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleExportToGoogleDrive}
              disabled={isSyncing || !gdriveToken}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-[11px] px-3.5 py-1.5 rounded font-sans transition flex items-center gap-1 font-semibold"
            >
              {isSyncing ? "Syncing..." : "Auto-Export to Google Drive"}
            </button>

            <button
              onClick={handleImportFromGoogleDrive}
              disabled={isSyncing || !gdriveToken}
              className="bg-slate-900 border border-indigo-950 hover:bg-slate-850 disabled:opacity-50 text-indigo-300 text-[11px] px-3.5 py-1.5 rounded font-sans transition flex items-center gap-1"
            >
              Auto-Import from Google Drive
            </button>

            {!gdriveToken && (
              <span className="text-[9px] font-mono text-amber-500 self-center">
                * Please sign in via the Workspace tab first to unlock Cloud Sync
              </span>
            )}
          </div>
        </div>

        {/* List of active memory anchors */}
        <div className="bg-slate-900 border border-slate-850 rounded">
          <div className="px-3.5 py-2 border-b border-slate-850 text-slate-500 font-mono text-[10px] uppercase tracking-wider">
            Active Memory Ledger Space
          </div>

          <div className="divide-y divide-slate-850/60 max-h-[220px] overflow-y-auto pr-1">
            {memories.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 font-mono">
                Memory ledger is completely blank. Assimilate deconstructions to write telemetry logs.
              </div>
            ) : (
              memories.map(m => (
                <div key={m.key} className="p-3 font-mono text-xs flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 font-bold bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 text-[11px]">
                        {m.root}
                      </span>
                      <span className="text-[9px] text-slate-500">{m.timestamp.substring(0, 10)}</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed font-sans">{m.insight}</p>
                  </div>

                  <button
                    onClick={() => handleDelete(m.key)}
                    className="text-slate-600 hover:text-red-400 p-1.5 transition rounded-full hover:bg-slate-950"
                    title="Evict schema from system memory"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Inline form to manually override or commit insights */}
        <form onSubmit={handleManualAdd} className="bg-slate-900/20 border border-slate-900 rounded p-4.5 space-y-3">
          <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider">
            Manually Inject Core Memory Anchor
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-1">
              <input
                type="text"
                required
                placeholder="Root letters (e.g. ح-س-ب)"
                value={newRoot}
                onChange={(e) => setNewRoot(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded px-2.5 py-2 font-mono text-xs text-white"
              />
            </div>
            <div className="sm:col-span-3 flex gap-2">
              <input
                type="text"
                required
                placeholder="Core physical action / kinetic insight deconstruction..."
                value={newInsight}
                onChange={(e) => setNewInsight(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded px-2.5 py-2 font-sans text-xs text-white"
              />
              <button
                type="submit"
                className="bg-slate-900 hover:bg-slate-850 hover:text-white text-slate-300 px-3 py-2 rounded text-xs font-mono font-semibold border border-slate-800 transition"
              >
                Inject
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
}
