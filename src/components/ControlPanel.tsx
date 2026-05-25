import React, { useState, useEffect } from "react";
import { EngineDirectives } from "../types";
import { KeyRound, ShieldCheck, RefreshCw, Save, Plus, Trash2, HelpCircle, LogIn, Lock } from "lucide-react";
import { auth } from "../lib/firebase";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";

interface ControlPanelProps {
  onDirectivesSaved: (newDirectives: EngineDirectives) => void;
}

export default function ControlPanel({ onDirectivesSaved }: ControlPanelProps) {
  const [passcode, setPasscode] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Handle Google OAuth Admin Clearance
  const handleGoogleAuth = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Auto-unlock if user email matches developer or admin access (e.g. safespace.ch@gmail.com)
      if (user && user.email === "safespace.ch@gmail.com") {
        setPasscode("LOGOS-9"); // Set fallback payload passcode for server compatibility
        setIsAuthenticated(true);
        setFeedback({ 
          type: "success", 
          message: `Zero-Trust Admin Verified: Licensed to safespace.ch@gmail.com! Clearance level 0o2 Granted.` 
        });
      } else {
        setFeedback({ 
          type: "error", 
          message: `Authorization Access Denied: External identity [${user?.email || "unknown"}] is not on the admin security list.` 
        });
      }
    } catch (err: any) {
      setFeedback({ 
        type: "error", 
        message: `Google Popup auth failed: ${err.message || "Ensure browser popups are allowed."}` 
      });
    }
  };

  // In-progress edited state
  const [directives, setDirectives] = useState<EngineDirectives>({
    arabicDefinition: "",
    operationalRules: [],
    customPromptBase: "",
    cyberneticTemplate: "",
    biologicalTemplate: "",
    physicsTemplate: ""
  });

  // Load backend directives
  const fetchDirectives = async () => {
    try {
      const resp = await fetch("/api/admin/directives");
      const data = await resp.json();
      if (data.directives) {
        setDirectives(data.directives);
      }
    } catch (err) {
      console.error("Failed to load engine directives", err);
    }
  };

  useEffect(() => {
    fetchDirectives();
  }, []);

  // Handle Passcode Unlock Challenge
  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.trim() === "LOGOS-9") {
      setIsAuthenticated(true);
      setFeedback({ type: "success", message: "System Security Clearance level 0o2 Granted." });
      setTimeout(() => setFeedback(null), 3000);
    } else {
      setFeedback({ type: "error", message: "Error0109: Security signature invalid or denied." });
      setIsAuthenticated(false);
    }
  };

  // Modify individual fields
  const handleFieldChange = (key: keyof EngineDirectives, value: any) => {
    setDirectives(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Rule additions / deletions
  const handleAddRule = () => {
    setDirectives(prev => ({
      ...prev,
      operationalRules: [...prev.operationalRules, "New specified operational guideline."]
    }));
  };

  const handleUpdateRule = (index: number, val: string) => {
    setDirectives(prev => {
      const copy = [...prev.operationalRules];
      copy[index] = val;
      return { ...prev, operationalRules: copy };
    });
  };

  const handleRemoveRule = (index: number) => {
    setDirectives(prev => {
      const copy = prev.operationalRules.filter((_, i) => i !== index);
      return { ...prev, operationalRules: copy };
    });
  };

  // Submit Admin Updates to Backend
  const handleSaveDirectives = async () => {
    setIsSaving(true);
    setFeedback(null);
    try {
      const response = await fetch("/api/admin/directives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          passcode,
          directives
        })
      });

      const result = await response.json();
      if (response.ok && result.success) {
        setFeedback({ type: "success", message: "Core engine instructions compiled and saved successfully." });
        onDirectivesSaved(directives);
      } else {
        setFeedback({ type: "error", message: result.error || "Failed to commit directive changes." });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Endpoint connection failed." });
    } finally {
      setIsSaving(false);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-lg p-5 shadow-2xl transition-all">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-3">
          <KeyRound className="w-5 h-5 text-amber-500" />
          <h2 className="font-sans font-semibold text-sm text-slate-200 uppercase tracking-widest">
            Engine Directives Overrides (System-Settings)
          </h2>
        </div>
        <span className="font-mono text-[10px] bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded">
          Clearance Level: {isAuthenticated ? "ADMIN_0o2" : "UNAUTHORIZED"}
        </span>
      </div>

      {feedback && (
        <div className={`p-3 rounded mb-4 text-xs font-mono border ${
          feedback.type === "success" 
            ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-400" 
            : "bg-red-950/40 border-red-500/30 text-red-400"
        }`}>
          {feedback.message}
        </div>
      )}

      {/* Security Challenge Gate */}
      {!isAuthenticated ? (
        <form onSubmit={handleUnlock} className="flex flex-col gap-3.5 max-w-xl">
          <p className="text-slate-400 text-xs leading-relaxed">
            To edit, overwrite, or add operational logic elements inside this container, authenticate with the system master passcode (Default: <strong className="text-amber-500">LOGOS-9</strong>), or instantly verify using your Google Workspace Admin account:
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 flex gap-2">
              <input
                type="password"
                placeholder="Enter system passcode..."
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-1.5 font-mono text-xs text-white focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-sans text-xs px-4 py-1.5 rounded font-bold transition-all shrink-0"
              >
                Sign In
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500 font-mono font-semibold uppercase sm:px-2">OR</span>
              <button
                type="button"
                onClick={handleGoogleAuth}
                className="flex items-center justify-center gap-1.5 bg-indigo-950/85 hover:bg-indigo-900 border border-indigo-700/50 hover:border-indigo-500 text-indigo-300 font-sans text-xs px-4 py-2 rounded font-semibold transition-all w-full sm:w-auto shrink-0"
              >
                <LogIn className="w-3.5 h-3.5 text-indigo-400" />
                <span>Verify Admin Identity</span>
              </button>
            </div>
          </div>

          <div className="mt-4 bg-[#0a0f24] border border-slate-900 rounded-md p-4 space-y-3">
            <span className="text-xs font-bold text-amber-500 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <span>How can I add authentication for information & directives? (Security Blueprint)</span>
            </span>
            <div className="text-[11px] text-slate-400 space-y-2 leading-relaxed font-sans">
              <p>
                To secure linguistic instruction matrices and directive sets from unauthorized overrides in production, make sure to apply these key design patterns:
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-slate-300 pl-1">
                <li>
                  <strong className="text-slate-100">Server Environment Secret Verification:</strong> Instead of hardcoding keys, configure a secure production variable on Google Cloud Run (e.g., <code className="text-emerald-400">process.env.ADMIN_SECURE_PASSCODE</code>) and retrieve it inside <code className="text-slate-300">server.ts</code> dynamically.
                </li>
                <li>
                  <strong className="text-slate-100">Secure JWT Authentication:</strong> Decrypt session tokens (or Firebase ID tokens) on production endpoints using <code className="text-indigo-400">firebase-admin</code>, verifying if the user email claims match <code className="text-emerald-400">safespace.ch@gmail.com</code>.
                </li>
                <li>
                  <strong className="text-slate-100">Database Role-Based Locks:</strong> Protect directories in Cloud Firestore by enforcing secure rules restricts:
                  <pre className="text-[10px] text-indigo-300 bg-slate-950 p-1.5 rounded border border-slate-900 mt-1 overflow-x-auto leading-normal">
                    {"allow write: if request.auth.token.email == 'safespace.ch@gmail.com';"}
                  </pre>
                </li>
              </ul>
            </div>
          </div>
        </form>
      ) : (
        /* Authorized Form */
        <div className="space-y-4">
          {/* Base System instruction */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Engine Description & System Base:
            </label>
            <textarea
              value={directives.customPromptBase}
              onChange={(e) => handleFieldChange("customPromptBase", e.target.value)}
              className="w-full h-16 bg-slate-900/60 border border-slate-800 rounded px-3 py-1.5 font-mono text-xs text-slate-300 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Operational Arabic Definition */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Definition of &quot;Arabic&quot; Property:
            </label>
            <textarea
              value={directives.arabicDefinition}
              onChange={(e) => handleFieldChange("arabicDefinition", e.target.value)}
              className="w-full h-20 bg-slate-900/60 border border-slate-800 rounded px-3 py-1.5 font-mono text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Symmetrical Operational Rules */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Operational Rules:
              </label>
              <button
                type="button"
                onClick={handleAddRule}
                className="flex items-center gap-1 text-[10px] bg-slate-900 text-slate-300 hover:text-emerald-400 px-2 py-0.5 rounded border border-slate-800 hover:border-emerald-900 transition-all"
              >
                <Plus className="w-3 h-3" /> Add Rule
              </button>
            </div>
            
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1 border border-slate-900/40 rounded p-1">
              {directives.operationalRules.map((rule, idx) => (
                <div key={`rule-edit-${idx}`} className="flex gap-2">
                  <span className="font-mono text-xs text-slate-500 self-center">{idx + 1}.</span>
                  <input
                    type="text"
                    value={rule}
                    onChange={(e) => handleUpdateRule(idx, e.target.value)}
                    className="flex-1 bg-slate-900/40 border border-slate-800 rounded px-2.5 py-1 font-sans text-xs text-slate-300 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveRule(idx)}
                    className="text-slate-500 hover:text-red-400 self-center"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Analogy Engine Blueprints */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
                Cybernetic Engine Map:
              </label>
              <textarea
                value={directives.cyberneticTemplate}
                onChange={(e) => handleFieldChange("cyberneticTemplate", e.target.value)}
                className="w-full h-14 bg-slate-900/60 border border-slate-800 rounded px-2 py-1 font-mono text-[11px] text-slate-400"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
                Neuro/Biological Map:
              </label>
              <textarea
                value={directives.biologicalTemplate}
                onChange={(e) => handleFieldChange("biologicalTemplate", e.target.value)}
                className="w-full h-14 bg-slate-900/60 border border-slate-800 rounded px-2 py-1 font-mono text-[11px] text-slate-400"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
                Open Physics/Thermodermal Map:
              </label>
              <textarea
                value={directives.physicsTemplate}
                onChange={(e) => handleFieldChange("physicsTemplate", e.target.value)}
                className="w-full h-14 bg-slate-900/60 border border-slate-800 rounded px-2 py-1 font-mono text-[11px] text-slate-400"
              />
            </div>
          </div>

          {/* Action Trigger Node */}
          <div className="flex items-center justify-between border-t border-slate-900 pt-3 mt-4">
            <button
              type="button"
              onClick={() => setIsAuthenticated(false)}
              className="text-xs text-slate-500 hover:text-slate-300 transition-all"
            >
              Secure and Lock Settings
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={fetchDirectives}
                className="flex items-center gap-1.5 font-sans text-xs bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-850 px-3 py-1.5 rounded transition"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Reset
              </button>
              <button
                type="button"
                onClick={handleSaveDirectives}
                disabled={isSaving}
                className="flex items-center gap-1.5 font-sans text-xs bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded font-semibold transition"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Committing...
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" /> Save Directives
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
