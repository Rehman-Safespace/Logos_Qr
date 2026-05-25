import React, { useState } from "react";
import { X, Activity, Server, BrainCircuit, Cloud, FolderOpen, ChevronDown, ChevronUp, Globe, FileText, Sliders, Lock, HelpCircle } from "lucide-react";
import ControlPanel from "./ControlPanel";
import LogosLongTermMemory from "./LogosLongTermMemory";
import WorkspaceSync from "./WorkspaceSync";
import NullProtocolUpload from "./NullProtocolUpload";

interface EngineSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: "system" | "memory" | "workspace" | "null-protocol";
  setCategory: (category: "system" | "memory" | "workspace" | "null-protocol") => void;
  // Diagnostics
  runEngineDiagnostics: () => void;
  isDiagnosing: boolean;
  diagnosticReport: any;
  setMessages: any;
  quotaRpm: number;
  setQuotaRpm: (v: number) => void;
  currentLoadCount: number;
  // Null protocol
  strictNullProtocol: boolean;
  setStrictNullProtocol: (val: boolean) => void;
  fetchDocuments: () => void;
  // Google workspace
  activeDeconstruction: any;
  // Memory
  messages: any;
  setMemoryDirectives: (rules: string[]) => void;
}

export default function EngineSettingsModal({
  isOpen,
  onClose,
  category,
  setCategory,
  runEngineDiagnostics,
  isDiagnosing,
  diagnosticReport,
  setMessages,
  quotaRpm,
  setQuotaRpm,
  currentLoadCount,
  strictNullProtocol,
  setStrictNullProtocol,
  fetchDocuments,
  activeDeconstruction,
  messages,
  setMemoryDirectives
}: EngineSettingsModalProps) {
  const [isDiagnosticsCollapsed, setIsDiagnosticsCollapsed] = useState(false);
  const [isGuideCollapsed, setIsGuideCollapsed] = useState(false);
  const [isKernelLogsCollapsed, setIsKernelLogsCollapsed] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-[#020617]/95 backdrop-blur-md flex">
      {/* Sidebar */}
      <div className="w-64 border-r border-slate-800 bg-[#020617] p-4 flex flex-col">
        <div className="flex items-center justify-between mb-8">
          <span className="font-mono text-xs text-emerald-400 font-bold tracking-[0.2em] uppercase">Engine Settings</span>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 bg-slate-900 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <nav className="flex flex-col gap-2">
          <button
            onClick={() => setCategory("system")}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-sans rounded-md transition-all ${
              category === "system" ? "bg-slate-900 text-emerald-400 font-semibold" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Server className="w-4 h-4" /> System & Overrides
          </button>
          
          <button
            onClick={() => setCategory("memory")}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-sans rounded-md transition-all ${
              category === "memory" ? "bg-slate-900 text-purple-400 font-semibold" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <BrainCircuit className="w-4 h-4" /> Memory Bank
          </button>
          
          <button
            onClick={() => setCategory("workspace")}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-sans rounded-md transition-all ${
              category === "workspace" ? "bg-slate-900 text-indigo-400 font-semibold" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Cloud className="w-4 h-4" /> Workspace Sync
          </button>
          
          <button
            onClick={() => setCategory("null-protocol")}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-sans rounded-md transition-all ${
              category === "null-protocol" ? "bg-slate-900 text-sky-400 font-semibold" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <FolderOpen className="w-4 h-4" /> Null Protocol Files
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8 relative">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {category === "system" && (
            <div className="space-y-6">
              
              {/* DIAGNOSTICS */}
              <div className="bg-slate-950 border border-slate-900 rounded-lg p-5">
                <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                  <h3 className="text-emerald-400 font-mono text-sm tracking-wider uppercase flex items-center gap-2">
                    <Activity className="w-4 h-4" /> Engine Diagnostic Focus
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={runEngineDiagnostics}
                      disabled={isDiagnosing}
                      className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-900 text-slate-950 px-3 py-1.5 rounded text-[10px] font-mono font-bold transition shadow-[0_0_12px_rgba(16,185,129,0.15)] disabled:text-slate-500"
                    >
                      {isDiagnosing ? "SCRUTINIZING SYSTEM..." : "RUN FULL DIAGNOSTICS"}
                    </button>
                    <button
                      onClick={() => setIsDiagnosticsCollapsed(!isDiagnosticsCollapsed)}
                      className="text-[10px] text-emerald-400 hover:text-emerald-300 font-mono flex items-center gap-1 bg-slate-900 hover:bg-slate-850 px-2.5 py-1.5 rounded border border-slate-800 transition shadow-sm"
                    >
                      {isDiagnosticsCollapsed ? <ChevronDown className="w-3 h-3 text-slate-400" /> : <ChevronUp className="w-3 h-3 text-slate-400" />}
                      <span>{isDiagnosticsCollapsed ? "Show Diagnostic Report" : "Hide Diagnostic Report"}</span>
                    </button>
                  </div>
                </div>

                {!isDiagnosticsCollapsed && (
                  <div className="space-y-3.5 pt-1">
                    {diagnosticReport ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px] font-mono text-slate-300">
                        
                        {/* Card 1: Vitals */}
                        <div className="bg-[#020617] border border-slate-900 p-4 rounded-lg space-y-3 flex flex-col justify-between">
                          <div className="space-y-3">
                            <div className="text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-900 pb-1.5 flex items-center gap-1.5">
                              <Globe className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                              📡 Core Engine Vitals
                            </div>
                            <div className="flex justify-between">
                              <span>Health Status:</span>
                              <span className="text-emerald-400 font-bold">{diagnosticReport.overallEngineHealth}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Symmetries:</span>
                              <span className="text-cyan-300">{diagnosticReport.logosAlignmentSymmetries}</span>
                            </div>
                          </div>
                          <div className="text-[9px] text-slate-500 pt-1.5 border-t border-slate-900">
                            Node: {diagnosticReport.systemMetrics?.nodeRuntime}
                          </div>
                        </div>

                        {/* Card 2: Quota RPM Configurator */}
                        <div className="bg-[#020617] border border-slate-900 p-4 rounded-lg space-y-3">
                          <div className="text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-900 pb-1.5 flex items-center gap-1.5">
                            <Sliders className="w-3.5 h-3.5 text-sky-400" />
                            Quota Limits
                          </div>
                          
                          <div className="space-y-1.5 bg-slate-950/60 p-2.5 rounded border border-slate-900">
                            <div className="flex justify-between text-[10px]">
                              <span className="text-slate-400 font-semibold uppercase">Calibrate Safe Peak Limit:</span>
                              <span className="text-sky-400 font-mono font-bold">{quotaRpm} RPM</span>
                            </div>
                            <input
                              type="range"
                              min="5"
                              max="120"
                              step="5"
                              value={quotaRpm}
                              onChange={(e) => setQuotaRpm(Number(e.target.value))}
                              className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-sky-500 hover:accent-sky-400 transition"
                            />
                          </div>

                          <div className="bg-slate-950/40 p-2.5 rounded border border-slate-900 space-y-2">
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="text-slate-400 font-sans uppercase">Window Load:</span>
                              <span className="text-emerald-400">{currentLoadCount * 5} RPM / {quotaRpm} RPM</span>
                            </div>
                          </div>

                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-500 font-mono text-center py-2">
                        Click the "RUN FULL DIAGNOSTICS" button to initiate checks.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* GUIDE */}
              <div className="bg-slate-950 border border-slate-900 rounded-lg p-5">
                <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                  <h3 className="text-cyan-400 font-mono text-sm tracking-wider uppercase flex items-center gap-2">
                    <HelpCircle className="w-4 h-4" /> Language Symmetries & Output Decoder
                  </h3>
                  <button
                    onClick={() => setIsGuideCollapsed(!isGuideCollapsed)}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1 bg-slate-900 px-2.5 py-1.5 rounded border border-slate-800 transition shadow-sm"
                  >
                    {isGuideCollapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                    <span>{isGuideCollapsed ? "Show Output Decoders" : "Hide Output Decoders"}</span>
                  </button>
                </div>
                
                {!isGuideCollapsed && (
                  <div className="text-xs text-slate-400 space-y-4 font-sans">
                    <p><strong>432.0 Hz:</strong> Representing universal harmonic equilibrium. This calibration signifies complete structural consensus.</p>
                    <p><strong>942.8 Hz:</strong> Elevated bandwidth cognitive processing.</p>
                    <p className="text-[10px] text-slate-500 font-mono mt-4 uppercase">Structural Output Block Symbols:</p>
                    <ul className="list-disc pl-4 space-y-2">
                      <li><strong>🏜️ Desert meaning:</strong> Primordial material movement signature.</li>
                      <li><strong>🌀 Anti-spin translation:</strong> Literal modern equivalents stripped of theological filters.</li>
                      <li><strong>🧠 Analogy engines:</strong> Cybernetic, biological, and physical translation frameworks.</li>
                    </ul>
                  </div>
                )}
              </div>

              {/* KERNEL LOGS */}
              <div className="bg-slate-950 border border-slate-900 rounded-lg p-5">
                <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                  <h3 className="text-indigo-400 font-mono text-sm tracking-wider uppercase flex items-center gap-2">
                    <Server className="w-4 h-4" /> Kernel Boot Logs & System Errors
                  </h3>
                  <button
                    onClick={() => setIsKernelLogsCollapsed(!isKernelLogsCollapsed)}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 font-mono flex items-center gap-1 bg-slate-900 px-2.5 py-1.5 rounded border border-slate-800 transition shadow-sm"
                  >
                    {isKernelLogsCollapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                    <span>{isKernelLogsCollapsed ? "View System Logs" : "Hide System Logs"}</span>
                  </button>
                </div>

                {!isKernelLogsCollapsed && (
                  <div className="space-y-4 font-mono text-[10px] text-slate-400 max-h-64 overflow-y-auto pr-2">
                    {messages.filter((m: any) => m.role === "system").length === 0 ? (
                      <p className="text-slate-500 py-4 text-center">No system log outputs detected.</p>
                    ) : (
                      messages.filter((m: any) => m.role === "system").map((msg: any) => (
                        <div key={msg.id} className="bg-[#020617] border border-slate-900 p-3 rounded">
                          <div className="flex items-center justify-between text-slate-500 mb-2 border-b border-slate-800 pb-1">
                            <span className="uppercase text-indigo-500 font-bold">KERNEL_LOG</span>
                            <span>{msg.timestamp.substring(11, 19)}</span>
                          </div>
                          <div className="whitespace-pre-wrap text-slate-300 leading-relaxed font-sans text-xs">
                            {msg.content}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* OVERRIDES */}
              <ControlPanel
                onDirectivesSaved={() => {
                  setMessages((prev: any) => [
                    ...prev,
                    {
                      id: "sys-prompt-reload-" + Date.now(),
                      role: "system",
                      content: "CORE CONFIGURATION: Instantly recompiled system instructions to utilize refreshed rulesets.",
                      timestamp: new Date().toISOString()
                    }
                  ]);
                }}
              />
            </div>
          )}

          {category === "memory" && (
            <LogosLongTermMemory
              activeDeconstructionNodes={messages.filter((m: any) => m.deconstruction).map((m: any) => m.deconstruction)}
              onInjectMemoryDirectives={(rules) => setMemoryDirectives(rules)}
            />
          )}

          {category === "workspace" && (
            <WorkspaceSync
              onDocumentMounted={fetchDocuments}
              activeDeconstruction={activeDeconstruction}
            />
          )}

          {category === "null-protocol" && (
            <NullProtocolUpload
              strictNullProtocol={strictNullProtocol}
              onToggleStrictNullProtocol={setStrictNullProtocol}
              onDocumentsChange={fetchDocuments}
            />
          )}
        </div>
      </div>
    </div>
  );
}
