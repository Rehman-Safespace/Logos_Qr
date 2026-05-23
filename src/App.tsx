import React, { useState, useEffect, useRef } from "react";
import { Mode, Message, DeconstructionNode, ReferenceDocument, EngineDirectives, LearningState } from "./types";
import ArabesqueMandala from "./components/ArabesqueMandala";
import ControlPanel from "./components/ControlPanel";
import NullProtocolUpload from "./components/NullProtocolUpload";
import WorkspaceSync from "./components/WorkspaceSync";
import LogosLongTermMemory from "./components/LogosLongTermMemory";
import { parseBilingualLines, cleanForTTS, hasArabic } from "./utils";
import { motion, AnimatePresence } from "motion/react";
import {
  Terminal,
  Database,
  Volume2,
  VolumeX,
  Play,
  Download,
  Search,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  FolderOpen,
  Settings,
  HelpCircle,
  Clock,
  ExternalLink,
  Plus,
  Cloud,
  Brain,
  BrainCircuit
} from "lucide-react";

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMode, setCurrentMode] = useState<Mode>(Mode.WORD_DECONSTRUCTION);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [strictNullProtocol, setStrictNullProtocol] = useState(false);
  const [activityLevel, setActivityLevel] = useState<"idle" | "searching" | "analyzing" | "completed">("idle");
  const [activeTab, setActiveTab] = useState<"workspace" | "null-protocol" | "google-workspace" | "directives">("workspace");
  const [ttsVoice, setTtsVoice] = useState<string>("Kore");
  const [isPlayingId, setIsPlayingId] = useState<string | null>(null);
  const [isThrottled, setIsThrottled] = useState(false);
  
  // High Thinking model toggle & Memory Directives dynamic injections
  const [useHighThinkingModel, setUseHighThinkingModel] = useState(true); // Default to high thinking reasoning model!
  const [memoryDirectives, setMemoryDirectives] = useState<string[]>([]);

  // Dynamic selector state variables
  const [mountedDocs, setMountedDocs] = useState<ReferenceDocument[]>([]);
  const [isMatchInDocs, setIsMatchInDocs] = useState(false);
  const [matchDetails, setMatchDetails] = useState<{ docName: string; text: string } | null>(null);

  // Fetch documents for the dynamic match system
  const fetchDocuments = async () => {
    try {
      const res = await fetch("/api/documents");
      const data = await res.json();
      if (data.documents) {
        setMountedDocs(data.documents);
      }
    } catch (err) {
      console.error("Failed to fetch documents for selector system", err);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  // Smart Selector Listener that runs as the user types
  useEffect(() => {
    const trimmed = inputText.trim();
    if (!trimmed) {
      setIsMatchInDocs(false);
      setMatchDetails(null);
      return;
    }

    // 1. Predict and Auto-Select Mode
    let predictedMode = Mode.WORD_DECONSTRUCTION;
    if (trimmed.includes("-")) {
      const parts = trimmed.split("-");
      if (parts.length >= 2 && parts.every(p => p.trim().length <= 2)) {
        predictedMode = Mode.ROOT_GENERATION;
      }
    } else {
      const words = trimmed.split(/\s+/);
      if (words.length >= 2 && words.every(w => w.length === 1)) {
        predictedMode = Mode.ROOT_GENERATION;
      }
    }

    if (currentMode !== predictedMode) {
      setCurrentMode(predictedMode);
    }

    // 2. Scan Mounted Documents for a lexical match & auto-engage Matrix
    const cleanInput = trimmed.replace(/[ -]/g, "");
    const letters = cleanInput.split("");

    let foundMatch: { docName: string; text: string } | null = null;
    for (const doc of mountedDocs) {
      const contentStr = doc.content || "";
      const lines = contentStr.split("\n");
      for (const line of lines) {
        if (
          line.toLowerCase().includes(trimmed.toLowerCase()) || 
          (letters.length >= 2 && letters.every(char => line.toLowerCase().includes(char.toLowerCase())))
        ) {
          foundMatch = { docName: doc.name, text: line.trim() };
          break;
        }
      }
      if (foundMatch) break;
    }

    if (foundMatch) {
      setIsMatchInDocs(true);
      setMatchDetails(foundMatch);
      // Automatically toggle closed matrix mode if we matches a mounted document!
      if (!strictNullProtocol) {
        setStrictNullProtocol(true);
      }
    } else {
      setIsMatchInDocs(false);
      setMatchDetails(null);
    }
  }, [inputText, mountedDocs]);

  // Time tracker for true live diagnostic clock
  const [currentTime, setCurrentTime] = useState("2026-05-23 19:27:50");

  const timelineEndRef = useRef<HTMLDivElement>(null);

  // 1. Initial Learning State (Rule 1: New Chat updates response)
  const initialLearningState: LearningState = {
    learnedCount: 42,
    lastUpdated: "2026-05-23T19:27:50Z",
    currentSegmentName: "Thermodynamic Etymology of Ancient Semitic Monoliths",
    nextSegments: [
      "Genetic Sequencing of Structural Hebrew Roots",
      "Epistemic Entropy across Indo-European Phonetic Spheroids"
    ],
    cumulativeInsights: [
      "Deconstructed the classical concept of 'Arabic' from an ethnic idiom to a strict physical property: 'Structural Transparency and Material Alignment'.",
      "Mapped theological terms like 'Haram' directly to thermodynamic closed-sandbox boundary constraints.",
      "Successfully replaced dual-directional layout friction by establishing a line-by-line bilingual separator, completely isolating RTL Arabic and LTR English parameters."
    ]
  };

  useEffect(() => {
    // Generate live clock
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toISOString().replace("T", " ").substring(0, 19) + " UTC");
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Initialize workspace first message with learning process information (Rule 1)
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "initial-log",
          role: "system",
          content: `
=== LOGOS ENGINE SYSTEM LEARNING INITIALIZED ===
What is the new updates of your learning process?

- WHAT I HAVE LEARNT:
We have formalized Semitic roots under materialist physics principles. Verified classical roots including:
• [ح-س-ب] (Entropic computation bounds)
• [ح-ر-م] (Thermodynamic sandbox boundaries)
• [س-ن-د] (Structural micro-interface signaling protection)
• [ب-ر-ق] (Electrostatic state discharges)

- WHY IT IS NEW:
Historical dogmas and social euphemisms have been stripped away to reveal standard thermodynamic energy vectors. Dual language alignment clash is bypassed using dynamic separation line breaks.

- NEXT PLANNED SEGMENTS:
Ep epigenetic cellular homeostasis mapping and physical DNA codex transcription.

- INTEGRATION:
Learning records are compiled and dynamically locked inside the current server instance memory.
`,
          timestamp: new Date().toISOString()
        }
      ]);
    }
  }, []);

  // Continuous timeline scroll
  useEffect(() => {
    timelineEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Handle analytical deconstruction query execution
  const executeDeconstruction = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const term = inputText.trim();
    setInputText("");
    setIsLoading(true);
    setActivityLevel("searching");

    // Add User query message
    const userMsg: Message = {
      id: "usr-" + Date.now(),
      role: "user",
      content: term,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMsg]);

    setTimeout(() => {
      setActivityLevel("analyzing");
    }, 800);

    try {
      const response = await fetch("/api/deconstruct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: term,
          mode: currentMode,
          strictNullProtocol,
          useHighThinkingModel,
          memoryDirectives
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "System error inside deconstruction pipe.");
      }

      if (result.isClosedMatrixFailure || result.error) {
        // Enforce exact closed-matrix output error verbatim: Error0004
        const errorMsg: Message = {
          id: "err-" + Date.now(),
          role: "assistant",
          content: result.rawText || "Error0004: Data not found in the source matrix.",
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, errorMsg]);
        setActivityLevel("completed");
        return;
      }

      // Successful analysis returned
      const node: DeconstructionNode = {
        ...result.deconstruction,
        id: "analysis-" + Date.now(),
        timestamp: new Date().toISOString(),
        input: term,
        mode: currentMode
      };

      const aiMsg: Message = {
        id: "ai-" + Date.now(),
        role: "assistant",
        content: `Analysis of coordinate ${term} compiled.`,
        timestamp: new Date().toISOString(),
        deconstruction: node
      };

      setMessages(prev => [...prev, aiMsg]);
      setActivityLevel("completed");

    } catch (err: any) {
      console.error("Deconstruction failed: ", err);
      const systemError: Message = {
        id: "syserr-" + Date.now(),
        role: "system",
        content: `Error: ${err.message || "Endpoint connection failed."}`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, systemError]);
      setActivityLevel("idle");
    } finally {
      setIsLoading(false);
    }
  };

  // Export Timeline logs to Markdown
  const handleExportTimeline = () => {
    let content = `# LOGOS_QR DECONSTRUCTION ENGINE EXPORT HISTORY\n`;
    content += `Export Date: ${currentTime}\n`;
    content += `===============\n\n`;

    messages.forEach(msg => {
      content += `## [${msg.timestamp}] ${msg.role === "user" ? "USER_SEARCH" : msg.role === "system" ? "SYSTEM_LOG" : "ENGINE_DECONSTRUCTION"}\n`;
      content += `${msg.content}\n`;
      if (msg.deconstruction) {
        const d = msg.deconstruction;
        content += `### Extracted Root: ${d.root}\n`;
        content += `- Desert Kinetic Force: ${d.desertMeaning}\n`;
        content += `- Anti-Spin Reality: ${d.antiSpinMeaning}\n`;
        content += `- Cross-Linguistic equivalent: ${d.crossLanguageMatch}\n`;
        content += `- Modern Systemic Application: ${d.systemicApplication}\n`;
        content += `- Cybernetic Analogy: ${d?.analogies?.[0]?.analogy}\n`;
        content += `- Biological Analogy: ${d?.analogies?.[1]?.analogy}\n`;
        content += `- Physics Analogy: ${d?.analogies?.[2]?.analogy}\n`;
      }
      content += `\n---------------------------\n\n`;
    });

    const fileBlob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const element = document.createElement("a");
    element.href = URL.createObjectURL(fileBlob);
    element.download = `logos_qr_timeline_${Date.now()}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Speech read-aloud handler using browser Web Speech fallback or backend API tts
  const handleSynthesizeText = async (textToSpeak: string, msgId: string) => {
    if (isPlayingId === msgId) {
      window.speechSynthesis.cancel();
      setIsPlayingId(null);
      return;
    }

    setIsPlayingId(msgId);
    const cleanedText = cleanForTTS(textToSpeak);

    // Try calling backend for high-fidelity Gemini TTS
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: cleanedText, voice: ttsVoice })
      });

      const data = await res.json();
      if (res.ok && data.audio) {
        const audioSrc = `data:audio/wav;base64,${data.audio}`;
        const audio = new Audio(audioSrc);
        audio.onended = () => setIsPlayingId(null);
        audio.play();
        return;
      }
    } catch (err) {
      console.warn("Gemini Live TTS unavailable, falling back to instant browser SpeechSynthesis", err);
    }

    // Browser Web Speech fallback
    const speech = new SpeechSynthesisUtterance(cleanedText);
    speech.lang = hasArabic(cleanedText) ? "ar-SA" : "en-US";
    speech.rate = 0.95;
    speech.onend = () => setIsPlayingId(null);
    window.speechSynthesis.speak(speech);
  };

  // Pre-seed search helper
  const handlePreseedInput = (txt: string, mode: Mode) => {
    setInputText(txt);
    setCurrentMode(mode);
    setActiveTab("workspace");
  };

  const activeDeconstruction = [...messages].reverse().find(m => m.deconstruction)?.deconstruction || null;

  return (
    <div id="logos-root-canvas" className="min-h-screen bg-[#020617] text-slate-100 flex flex-col font-sans antialiased overflow-x-hidden">
      {/* Cinematic Glowing Header */}
      <header className="sticky top-0 z-50 bg-[#020617]/85 backdrop-blur-md border-b border-slate-900 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-emerald-500 to-blue-600 p-1.5 rounded border border-emerald-400/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <Terminal className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <span className="font-mono text-xs text-emerald-400 font-bold tracking-[0.2em] block uppercase">
              Logos_qr
            </span>
            <span className="text-[10px] text-slate-400 block tracking-tight font-sans">
              Advanced Structural Linguistics & Conceptual Deconstruction
            </span>
          </div>
        </div>

        {/* Diagnostic clock & export metrics */}
        <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400">
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded border border-slate-900">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>{currentTime}</span>
          </div>
          <button
            onClick={handleExportTimeline}
            className="flex items-center gap-1 bg-slate-900 border border-slate-800 hover:border-slate-700 hover:text-white px-2.5 py-1 rounded transition-all text-[11px]"
            title="Download full Markdown transcript"
          >
            <Download className="w-3.5 h-3.5" /> Export Node
          </button>
        </div>
      </header>

      {/* Main Structural Grid Section / Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pb-28">
        
        {/* LEFT COMPONENT: Scrollable Chat Terminal (占据8列) */}
        <section id="logos-scrolling-timeline" className="lg:col-span-8 flex flex-col gap-5 min-h-[500px]">
          {/* Quick Tab Header buttons */}
          <div className="flex flex-wrap sm:flex-nowrap bg-slate-950 p-1 rounded-lg border border-slate-900 gap-1">
            <button
              onClick={() => setActiveTab("workspace")}
              className={`flex-grow sm:flex-1 text-center py-2 text-xs font-sans rounded-md transition-all ${
                activeTab === "workspace"
                  ? "bg-slate-900 text-emerald-400 font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Diagnostic Timeline
            </button>
            <button
              onClick={() => setActiveTab("null-protocol")}
              className={`flex-grow sm:flex-1 text-center py-2 text-xs font-sans rounded-md transition-all ${
                activeTab === "null-protocol"
                  ? "bg-slate-900 text-emerald-400 font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              The NULL Protocol Archive
            </button>
            <button
              onClick={() => setActiveTab("google-workspace")}
              className={`flex-grow sm:flex-1 text-center py-2 text-xs font-sans rounded-md transition-all flex items-center justify-center gap-1 ${
                activeTab === "google-workspace"
                  ? "bg-slate-900 text-indigo-400 font-semibold border-b border-indigo-500/50"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Cloud className="w-3.5 h-3.5" /> Workspace Sync
            </button>
            <button
              onClick={() => setActiveTab("logos-memory")}
              className={`flex-grow sm:flex-1 text-center py-2 text-xs font-sans rounded-md transition-all flex items-center justify-center gap-1 ${
                activeTab === "logos-memory"
                  ? "bg-slate-900 text-purple-400 font-semibold border-b border-purple-500/50"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <BrainCircuit className="w-3.5 h-3.5 text-purple-400" /> Memory Bank
            </button>
            <button
              onClick={() => setActiveTab("directives")}
              className={`flex-grow sm:flex-1 text-center py-2 text-xs font-sans rounded-md transition-all ${
                activeTab === "directives"
                  ? "bg-slate-900 text-emerald-400 font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Engine Overrides
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "workspace" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4 flex-grow"
              >
                {/* Seed presets */}
                <div className="bg-slate-950 border border-slate-900 rounded-lg p-3.5">
                  <span className="block text-[10px] font-mono tracking-wider text-slate-500 uppercase mb-2">
                    Preseeded Mechanics Vectors (Demo anchors for testing):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handlePreseedInput("ح-س-ب", Mode.ROOT_GENERATION)}
                      className="bg-slate-900 hover:bg-slate-850 hover:text-emerald-400 px-3 py-1 rounded text-xs font-mono transition border border-slate-850"
                    >
                      [Root] ح-س-ب
                    </button>
                    <button
                      onClick={() => handlePreseedInput("Haram", Mode.WORD_DECONSTRUCTION)}
                      className="bg-slate-900 hover:bg-slate-850 hover:text-emerald-400 px-3 py-1 rounded text-xs font-mono transition border border-slate-850"
                    >
                      [Word] Haram / الحرام
                    </button>
                    <button
                      onClick={() => handlePreseedInput("س-ن-د", Mode.ROOT_GENERATION)}
                      className="bg-slate-900 hover:bg-slate-850 hover:text-emerald-400 px-3 py-1 rounded text-xs font-mono transition border border-slate-850"
                    >
                      [Root] س-ن-د
                    </button>
                    <button
                      onClick={() => handlePreseedInput("Istabraq", Mode.WORD_DECONSTRUCTION)}
                      className="bg-slate-900 hover:bg-slate-850 hover:text-emerald-400 px-3 py-1 rounded text-xs font-mono transition border border-slate-850"
                    >
                      [Word] Istabraq / إستبرق
                    </button>
                  </div>
                </div>

                {/* Algorithmic integrity trigger (Rule 5 fallback alert) */}
                <div className="flex items-center justify-between bg-slate-950 border border-slate-900 rounded-md px-3.5 py-1.5">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">
                    Thermodermal Block / Algorithmic Security:
                  </span>
                  <button
                    onClick={() => setIsThrottled(!isThrottled)}
                    className="text-[10px] bg-red-950/20 text-red-400 hover:bg-red-950 hover:text-red-300 font-mono px-2.5 py-0.5 rounded border border-red-900/40 transition"
                  >
                    Check Engine Throttling
                  </button>
                </div>

                {isThrottled && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-3.5 bg-yellow-950/50 border border-yellow-700/30 rounded text-yellow-300 font-sans text-xs flex items-center gap-3"
                  >
                    <AlertTriangle className="w-5 h-5 shrink-0 text-yellow-400" />
                    <div>
                      <strong>تم تقييد الرد او العرض ⚠️🔒🚫</strong>
                      <span className="block text-[10px] text-slate-400 mt-0.5">
                        Response and preview limits have been dynamically applied. Operational integrity preserved under DE&I directives.
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* Timeline continuous message list representation */}
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-4 rounded-lg border leading-relaxed ${
                        msg.role === "user"
                          ? "bg-slate-900/50 border-slate-800 ml-12 text-slate-100"
                          : msg.role === "system"
                          ? "bg-slate-950/80 border-slate-900 text-slate-400 font-mono text-xs whitespace-pre-wrap leading-relaxed"
                          : "bg-slate-950 border-slate-800 text-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between border-b border-slate-900 pb-1.5 mb-2.5 text-[10px] font-mono text-slate-500">
                        <span className="uppercase tracking-wider">
                          {msg.role === "user" ? "SYSTEM_INPUT" : msg.role === "system" ? "KERNEL_LOG" : "DECONSTRUCTION_OUTPUT"}
                        </span>
                        <span>{msg.timestamp.substring(11, 19)}</span>
                      </div>

                      {/* Display raw textual content */}
                      {msg.content && !msg.deconstruction && (
                        <p className="dir-ltr text-left font-sans text-sm pr-2">
                          {msg.content}
                        </p>
                      )}

                      {/* Structured Deconstruction Node output (Collapsible sub-elements) */}
                      {msg.deconstruction && (
                        <div className="space-y-4">
                          {/* Core extraction metadata card */}
                          <div className="bg-slate-900/60 p-3.5 rounded border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
                            <div>
                              <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                                Analyzed Core Term / Root Coordinates:
                              </span>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="font-mono text-xl font-bold bg-slate-950 text-emerald-400 border border-emerald-950 px-3 py-1.5 leading-none rounded">
                                  {msg.deconstruction.root}
                                </span>
                                <span className="font-sans text-xs text-slate-400">
                                  Mode {msg.deconstruction.mode}: {msg.deconstruction.mode === Mode.WORD_DECONSTRUCTION ? "Linguistic Word Deconstruction" : "Root Vector Generation"}
                                </span>
                              </div>
                            </div>

                            <button
                              onClick={() => {
                                if (msg.deconstruction) {
                                  const allTxt = `Root: ${msg.deconstruction.root}. Meaning: ${msg.deconstruction.desertMeaning}. Anti-spin: ${msg.deconstruction.antiSpinMeaning}`;
                                  handleSynthesizeText(allTxt, msg.id);
                                }
                              }}
                              className="self-start md:self-center flex items-center gap-2 bg-slate-950 text-emerald-400 border border-emerald-900/50 px-3.5 py-2 hover:bg-slate-900 rounded font-sans text-xs tracking-wider transition-all"
                            >
                              {isPlayingId === msg.id ? (
                                <>
                                  <VolumeX className="w-4 h-4" /> Stop Audio
                                </>
                              ) : (
                                <>
                                  <Volume2 className="w-4 h-4" /> Play Audio Engine
                                </>
                              )}
                            </button>
                          </div>

                          {/* Dynamic Reasoning Metadata Board (Requirements 2 & 3) */}
                          {msg.deconstruction.engineMetadata && (
                            <div className="bg-slate-950 border border-slate-900 rounded p-3 font-mono text-[11px] text-slate-400 space-y-2.5">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-900/60 pb-2">
                                <div className="flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                  <span className="text-slate-500 text-[10px]">TIME RECORD:</span>
                                  <span className="text-slate-300 font-semibold">{msg.deconstruction.engineMetadata.timestampUtc}</span>
                                </div>
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="text-slate-500 text-[10px]">COOP MODELS:</span>
                                  {msg.deconstruction.engineMetadata.modelsUsed.map((m, idx) => (
                                    <span key={idx} className="bg-slate-900 text-indigo-400 border border-indigo-950 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                      {m}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px] py-1">
                                <div>
                                  <span className="text-slate-500 block">LATENCY SPEED</span>
                                  <span className="text-slate-300 font-bold">{msg.deconstruction.engineMetadata.timeTakenMs} ms</span>
                                </div>
                                <div>
                                  <span className="text-slate-500 block">RAG INDEX FILTER</span>
                                  <span className="text-emerald-400 font-bold">
                                    {msg.deconstruction.engineMetadata.ragEngineHits > 0 ? "1 SOURCE MERGED" : "0 CORES MERGED"}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-slate-500 block">COGNITIVE COMPLEXITY</span>
                                  <span className="text-amber-500 font-bold">{msg.deconstruction.engineMetadata.cognitiveStepsCount} CYCLES</span>
                                </div>
                                <div>
                                  <span className="text-slate-500 block">CORRELATION MATRIX</span>
                                  <span className="text-indigo-400 font-bold">
                                    {msg.deconstruction.matrixAnchoring?.found ? "VERIFIED VALIDATOR" : "PROBABILISTIC DYNAMIC"}
                                  </span>
                                </div>
                              </div>

                              {/* Learning Diagnostics telemetry logs */}
                              {msg.deconstruction.learningLog && (
                                <div className="bg-indigo-950/15 border border-dashed border-indigo-900/40 rounded p-2.5 space-y-1.5 mt-1">
                                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center justify-between">
                                    <span className="flex items-center gap-1"><Brain className="w-3 h-3 text-indigo-400" /> Cognitive Assimilation Logs (سجل التعلم):</span>
                                    <span className="text-indigo-400 bg-slate-950 px-1.5 py-0.5 rounded font-mono text-[9px] border border-indigo-950/60 font-bold">
                                      LOGS_ID: {msg.deconstruction.learningLog.memoryUnifiedKey}
                                    </span>
                                  </div>
                                  <div className="text-[11px] leading-relaxed space-y-1.5 text-slate-300">
                                    <div>
                                      <strong className="text-emerald-400 font-semibold font-sans">● WHAT I HAVE LEARNT (الذي تعلمته): </strong>
                                      <span className="text-emerald-100/90 font-sans">{msg.deconstruction.learningLog.whatLearnt}</span>
                                    </div>
                                    <div>
                                      <strong className="text-indigo-400 font-semibold font-sans">● WHY IT IS NEW LEARNING: </strong>
                                      <span className="text-slate-300 font-sans">{msg.deconstruction.learningLog.whyNew}</span>
                                    </div>
                                    <div>
                                      <strong className="text-amber-500 font-semibold font-sans">● NEXT PLANNED SEGMENTS: </strong>
                                      <span className="text-amber-200 font-sans">{msg.deconstruction.learningLog.nextPlannedSegment}</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* 1. Naked Desert Meaning Block */}
                          <div>
                            <span className="block text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1">
                              Raw Physical Action (Desert Meaning):
                            </span>
                            <div className="bg-slate-900/30 border border-slate-800/40 p-3 rounded text-right pr-4 ring-1 ring-slate-800/20" style={{ direction: "rtl" }}>
                              <p className="font-sans text-emerald-100 text-[14px] leading-relaxed">
                                {msg.deconstruction.desertMeaning}
                              </p>
                            </div>
                          </div>

                          {/* 2. Matrix Anchoring Result (If found in sources - Rule 3) */}
                          {msg.deconstruction.matrixAnchoring?.found && (
                            <div className="bg-emerald-950/20 border border-emerald-900/40 rounded p-3 text-right" style={{ direction: "rtl" }}>
                              <span className="block text-[10px] font-mono uppercase text-emerald-400 tracking-wider mb-1.5 text-left" style={{ direction: "ltr" }}>
                                🔗 Matrix Anchoring (إرساء مصدري) Verified:
                              </span>
                              <p className="font-sans text-slate-300 italic text-[13px] leading-relaxed border-r-2 border-emerald-500/80 pr-2">
                                &quot;{msg.deconstruction.matrixAnchoring.verbatimVerse}&quot;
                              </p>
                              <span className="block text-[9px] font-mono text-emerald-500 uppercase mt-1 text-left" style={{ direction: "ltr" }}>
                                Source archive: [{msg.deconstruction.matrixAnchoring.sourceFile}]
                              </span>
                            </div>
                          )}

                          {/* 3. Anti-Spin Translation */}
                          <div>
                            <span className="block text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1">
                              Blunt Functional Meaning (Anti-Spin):
                            </span>
                            <div className="bg-slate-900/30 border border-slate-800/40 p-3 rounded text-right pr-4 leading-relaxed" style={{ direction: "rtl" }}>
                              <p className="font-sans text-slate-100 text-[14px]">
                                {msg.deconstruction.antiSpinMeaning}
                              </p>
                            </div>
                          </div>

                          {/* 4. CrossLanguage phonetic equivalents (Rule 4 alignment bypass) */}
                          <div>
                            <span className="block text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1">
                              Cross-Linguistic Phonetic Map:
                            </span>
                            <div className="bg-slate-900/20 p-3 rounded border border-slate-900">
                              {/* Splitting lines so Ar and En sit on unique rows to preserve RTL direction */}
                              {parseBilingualLines(msg.deconstruction.crossLanguageMatch).map((lineItem, idx) => (
                                <div
                                  key={`biline-${idx}`}
                                  className={`py-1 ${
                                    lineItem.lang === "ar" 
                                      ? "text-right pr-3 border-r-2 border-indigo-900 font-sans" 
                                      : "text-left pl-3 border-l-2 border-blue-900 font-mono text-xs text-slate-400"
                                  }`}
                                  style={{ direction: lineItem.lang === "ar" ? "rtl" : "ltr" }}
                                >
                                  {lineItem.text}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* 5. Dynamic Bounding Boxes (Analogies) */}
                          <div className="space-y-2">
                            <span className="block text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1">
                              Symmetrical Analogy Engines (Pillars):
                            </span>
                            {msg.deconstruction.analogies.map((analogy, aidx) => (
                              <div key={`analogy-${aidx}`} className="bg-slate-900/40 border-l-2 border-emerald-500/50 rounded overflow-hidden">
                                <details className="group">
                                  <summary className="cursor-pointer p-2.5 flex items-center justify-between text-xs font-sans text-slate-300 select-none hover:bg-slate-900 font-medium">
                                    <span>{analogy.title}</span>
                                    <span className="text-[10px] font-mono text-emerald-400 group-open:rotate-180 transition-transform">
                                      [Expand Engine]
                                    </span>
                                  </summary>
                                  <div className="p-3 bg-slate-950/80 text-right text-[13px] leading-relaxed text-slate-300 font-sans border-t border-slate-900" style={{ direction: "rtl" }}>
                                    {analogy.analogy}
                                  </div>
                                </details>
                              </div>
                            ))}
                          </div>

                          {/* 6. Systemic application & Generative fields */}
                          {msg.deconstruction.systemicApplication && (
                            <div>
                              <span className="block text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1">
                                Systemic Societal / Psychological Execution:
                              </span>
                              <div className="bg-slate-900/30 p-3 rounded text-right pr-4" style={{ direction: "rtl" }}>
                                <p className="font-sans text-[13px] leading-relaxed text-slate-300">
                                  {msg.deconstruction.systemicApplication}
                                </p>
                              </div>
                            </div>
                          )}

                          {msg.deconstruction.lexicalField && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div className="bg-slate-900/40 p-2.5 rounded border border-slate-900 text-right" style={{ direction: "rtl" }}>
                                <span className="block text-[10px] text-left text-slate-500 font-mono uppercase tracking-wider mb-1" style={{ direction: "ltr" }}>
                                  الأسماء (Nouns):
                                </span>
                                <div className="flex flex-wrap gap-1.5 justify-end mt-1">
                                  {msg.deconstruction.lexicalField.nouns.map((n, i) => (
                                    <span key={i} className="bg-slate-950 px-2 py-0.5 rounded text-xs text-slate-200">
                                      {n}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <div className="bg-slate-900/40 p-2.5 rounded border border-slate-900 text-right" style={{ direction: "rtl" }}>
                                <span className="block text-[10px] text-left text-slate-500 font-mono uppercase tracking-wider mb-1" style={{ direction: "ltr" }}>
                                  الأفعال (Verbs):
                                </span>
                                <div className="flex flex-wrap gap-1.5 justify-end mt-1">
                                  {msg.deconstruction.lexicalField.verbs.map((n, i) => (
                                    <span key={i} className="bg-slate-950 px-2 py-0.5 rounded text-xs text-slate-200">
                                      {n}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <div className="bg-slate-900/40 p-2.5 rounded border border-slate-900 text-right" style={{ direction: "rtl" }}>
                                <span className="block text-[10px] text-left text-slate-500 font-mono uppercase tracking-wider mb-1" style={{ direction: "ltr" }}>
                                  الأدوات (Tools):
                                </span>
                                <div className="flex flex-wrap gap-1.5 justify-end mt-1">
                                  {msg.deconstruction.lexicalField.tools.map((n, i) => (
                                    <span key={i} className="bg-slate-950 px-2 py-0.5 rounded text-xs text-slate-200">
                                      {n}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* 7. Deep logic quantum reasoning collapse block */}
                          {msg.deconstruction.deepDeduction && (
                            <div className="bg-blue-950/25 border-l-2 border-blue-500/80 rounded p-3 text-right" style={{ direction: "rtl" }}>
                              <span className="block text-[10px] font-mono uppercase text-blue-400 tracking-wider mb-1.5 text-left" style={{ direction: "ltr" }}>
                                🧠 Deep Deduction Matrix (الاستنباط المعمق):
                              </span>
                              <p className="font-sans text-slate-300 text-[13px] leading-relaxed">
                                {msg.deconstruction.deepDeduction}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Loading indicator */}
                  {isLoading && (
                    <div className="p-4 bg-slate-950 border border-slate-900 rounded-lg flex items-center gap-3">
                      <div className="relative w-8 h-8 flex items-center justify-center">
                        <div className="absolute inset-0 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div>
                        <span className="font-sans text-xs font-semibold text-slate-300">
                          LOGOS_0o2: Conducting thermodynamic structural parsing...
                        </span>
                        <span className="block text-[10px] text-slate-500 font-mono">
                          Latching search criteria onto mounted database indexes.
                        </span>
                      </div>
                    </div>
                  )}

                  <div ref={timelineEndRef} />
                </div>
              </motion.div>
            )}

            {activeTab === "null-protocol" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <NullProtocolUpload
                  strictNullProtocol={strictNullProtocol}
                  onToggleStrictNullProtocol={setStrictNullProtocol}
                  onDocumentsChange={fetchDocuments}
                />
              </motion.div>
            )}

            {activeTab === "google-workspace" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <WorkspaceSync
                  onDocumentMounted={fetchDocuments}
                  activeDeconstruction={activeDeconstruction}
                />
              </motion.div>
            )}

            {activeTab === "logos-memory" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <LogosLongTermMemory
                  activeDeconstructionNodes={messages.filter(m => m.deconstruction).map(m => m.deconstruction!)}
                  onInjectMemoryDirectives={(rules) => setMemoryDirectives(rules)}
                />
              </motion.div>
            )}

            {activeTab === "directives" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <ControlPanel
                  onDirectivesSaved={() => {
                    setMessages(prev => [
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
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* RIGHT COMPONENT: Spheroid Controls (占据4列) */}
        <aside className="lg:col-span-4 flex flex-col gap-5 lg:sticky lg:top-20">
          
          {/* Spheroid Mandala Node */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-5 flex flex-col items-center justify-center shadow-md">
            <span className="text-[10px] font-mono tracking-wider text-slate-500 uppercase mb-2">
              Neural Expressive Aesthetic Spheroid
            </span>
            <ArabesqueMandala isLoading={isLoading} activityLevel={activityLevel} />
            <div className="mt-3 text-center">
              <span className="font-sans font-semibold text-xs text-slate-300">
                Linguistic Symmetrical Alignment
              </span>
              <p className="text-[10px] text-slate-500 mt-1 max-w-[220px] leading-snug">
                Rotating proportional to system clock frequencies. Arabesque symmetries represent high-resolution distinction.
              </p>
            </div>
          </div>

          {/* Quick System specs */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-[11px] text-slate-400 space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-900 pb-1.5 mb-2.5">
              <span className="uppercase text-slate-300 font-bold">SYSTEM METRIC MATRIX</span>
              <span className="text-[10px] bg-slate-900 text-emerald-400 font-semibold px-1 rounded">ACTIVE</span>
            </div>
            <div className="flex justify-between">
              <span>Primary Engine Core:</span>
              <span className="text-slate-200">Gemini 3.5 Flash</span>
            </div>
            <div className="flex justify-between">
              <span>TTS Synthesis Vector:</span>
              <span className="text-slate-200">Gemini 3.1 TTS</span>
            </div>
            <div className="flex justify-between">
              <span>RTL Context Parser:</span>
              <span className="text-slate-200">V2 Symmetrical</span>
            </div>
            <div className="flex justify-between">
              <span>Matrix Anchors:</span>
              <span className="text-emerald-400">ONLINE</span>
            </div>
          </div>

          {/* Help & definitions card */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-slate-900">
              <HelpCircle className="w-4 h-4 text-slate-400" />
              <span className="text-xs uppercase font-sans font-bold tracking-wider text-slate-300">Linguistic Framework</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed leading-snug">
              Materialist Arabic etymology isolates pure physical movement signatures. Roots are treated as specific directions of force or mass coordination inside thermodynamics rather than dogmatic metaphors.
            </p>
          </div>
        </aside>
      </main>

      {/* FIXED ANCHORED INPUT TERMINAL AT BOTTOM */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-[#020617]/90 backdrop-blur-md border-t border-slate-800 py-3.5 px-4 shadow-[0_-15px_30px_rgba(2,6,23,0.8)]">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={executeDeconstruction} className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              {/* Mode switch Toggles */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentMode(Mode.WORD_DECONSTRUCTION)}
                  className={`px-3 py-1 rounded text-xs transition duration-150 ${
                    currentMode === Mode.WORD_DECONSTRUCTION
                      ? "bg-emerald-600 text-slate-950 font-bold"
                      : "bg-slate-900 text-slate-400 border border-slate-850 hover:text-slate-200"
                  }`}
                >
                  Mode A: Word Deconstruct
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentMode(Mode.ROOT_GENERATION)}
                  className={`px-3 py-1 rounded text-xs transition duration-150 ${
                    currentMode === Mode.ROOT_GENERATION
                      ? "bg-emerald-600 text-slate-950 font-bold"
                      : "bg-slate-900 text-slate-400 border border-slate-850 hover:text-slate-200"
                  }`}
                >
                  Mode B: Root Generator
                </button>
              </div>

              {/* Status Indicator & High thinking toggle */}
              <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono">
                {strictNullProtocol ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Closed Coordinate Matrix Active [Files Only]
                  </span>
                ) : (
                  <span className="text-slate-500">
                    Spheroid General Parsing Active [AI + Files]
                  </span>
                )}

                <span className="text-slate-800">|</span>

                <button
                  type="button"
                  onClick={() => setUseHighThinkingModel(!useHighThinkingModel)}
                  className={`px-2.5 py-0.5 rounded border flex items-center gap-1 transition ${
                    useHighThinkingModel
                      ? "bg-indigo-950/80 border-indigo-400/40 text-indigo-300 font-bold"
                      : "bg-slate-900/60 border-slate-800 text-slate-500 hover:text-slate-300"
                  }`}
                  title="Toggle between lightning-fast flash and deep cognitive pro reasoning"
                >
                  <Brain className="w-3 h-3 text-indigo-400" />
                  <span>{useHighThinkingModel ? "HIGH-THINKING ACTIVE [PRO_MODEL]" : "STANDARD CORE [FLASH_MODEL]"}</span>
                </button>
              </div>
            </div>

            {/* Smart Dynamic Selection Indicator Panel */}
            {inputText.trim() && (
              <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/50 border border-slate-800 rounded-md text-[11px] font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Auto-detected Mode:</span>
                  <span className="text-emerald-400 font-bold bg-slate-950 px-1.5 py-0.5 rounded border border-emerald-950">
                    {currentMode === Mode.WORD_DECONSTRUCTION ? "Mode A: Word Deconstruct" : "Mode B: Root Generator"}
                  </span>
                </div>
                {isMatchInDocs ? (
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Reference Anchor Found in [{matchDetails?.docName}] (Matrix Locked)
                    </span>
                  </div>
                ) : (
                  <span className="text-slate-500 text-[10px]">
                    No local reference matches. Dynamic general AI expansion mode.
                  </span>
                )}
              </div>
            )}

            {/* Terminal Input Bar */}
            <div className="relative flex items-center justify-between gap-2.5">
              <input
                type="text"
                disabled={isLoading}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  currentMode === Mode.WORD_DECONSTRUCTION
                    ? "Input word coordinate (e.g., Haram, Istabraq, Computon) and deconstruct..."
                    : "Input letters separated by hyphen (e.g., ح-س-ب, ب-ر-ق, C-L-C) and generate..."
                }
                className="flex-1 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg px-4 py-3 text-sm font-sans placeholder-slate-600 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all shadow-inner"
              />
              <button
                type="submit"
                disabled={isLoading || !inputText.trim()}
                className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-900 text-slate-950 hover:text-black font-semibold text-sm px-5 py-3 rounded-lg transition-all duration-150 flex items-center gap-1.5 focus:outline-none disabled:text-slate-600 border border-emerald-400/20 shadow-[0_0_15px_rgba(16,185,129,0.2)] disabled:shadow-none"
              >
                <span>Enter</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </footer>
    </div>
  );
}
