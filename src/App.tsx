import React, { useState, useEffect, useRef } from "react";
import { Mode, Message, DeconstructionNode, ReferenceDocument, EngineDirectives, LearningState } from "./types";
import ArabesqueMandala from "./components/ArabesqueMandala";
import EngineSettingsModal from "./components/EngineSettingsModal";
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
  BrainCircuit,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Minimize2,
  Maximize2,
  Mic,
  MicOff,
  Activity,
  GitBranch,
  Globe,
  FileText,
  Sliders,
  Server,
  Lock
} from "lucide-react";
import RootRelationshipGraph from "./components/RootRelationshipGraph";

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeGraphDeconstruction, setActiveGraphDeconstruction] = useState<any>(null);
  const [currentMode, setCurrentMode] = useState<Mode>(Mode.WORD_DECONSTRUCTION);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [strictNullProtocol, setStrictNullProtocol] = useState<boolean>(() => {
    const saved = localStorage.getItem("logos_strict_null_protocol");
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [quotaRpm, setQuotaRpm] = useState<number>(60);
  const [currentLoadCount, setCurrentLoadCount] = useState<number>(0);

  useEffect(() => {
    localStorage.setItem("logos_strict_null_protocol", JSON.stringify(strictNullProtocol));
  }, [strictNullProtocol]);

  const [activityLevel, setActivityLevel] = useState<"idle" | "searching" | "analyzing" | "completed">("idle");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsCategory, setSettingsCategory] = useState<"system" | "memory" | "workspace" | "null-protocol">("system");
  const [ttsVoice, setTtsVoice] = useState<string>("Kore");
  const [isPlayingId, setIsPlayingId] = useState<string | null>(null);
  const [autoVocalize, setAutoVocalize] = useState<boolean>(() => {
    const saved = localStorage.getItem("logos_auto_vocalize");
    return saved !== null ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem("logos_auto_vocalize", JSON.stringify(autoVocalize));
  }, [autoVocalize]);

  const [speechRate, setSpeechRate] = useState<number>(() => {
    const saved = localStorage.getItem("logos_speech_rate");
    return saved !== null ? JSON.parse(saved) : 0.95;
  });

  useEffect(() => {
    localStorage.setItem("logos_speech_rate", JSON.stringify(speechRate));
  }, [speechRate]);

  // High Thinking model toggle & Memory Directives dynamic injections
  const [useHighThinkingModel, setUseHighThinkingModel] = useState(true); // Default to high thinking reasoning model!
  const [forceEnglish, setForceEnglish] = useState<boolean>(() => {
    const saved = localStorage.getItem("logos_force_english");
    return saved !== null ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem("logos_force_english", JSON.stringify(forceEnglish));
  }, [forceEnglish]);

  const [memoryDirectives, setMemoryDirectives] = useState<string[]>(() => {
    const saved = localStorage.getItem("logos_longterm_memory");
    if (saved) {
      try {
        const mems = JSON.parse(saved);
        if (Array.isArray(mems) && mems.length > 0) {
          return mems.map((m: any) => `Physical memory anchor for root [${m.root}]: "${m.insight}"`);
        }
      } catch (e) {
        // error parsing
      }
    }
    return [
       `Physical memory anchor for root [ح-س-ب]: "The structural limit calculations (الحساب) must map fully onto physical energy-loss bounds inside active silicon or carbon networks."`,
    ];
  });

  // Relaxed mode & Collapsible views
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem("logos_sidebar_collapsed");
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [isGuideCollapsed, setIsGuideCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem("logos_guide_collapsed");
    return saved !== null ? JSON.parse(saved) : true; // Default collapsed to maintain a relaxed environment
  });
  const [isDiagnosticsCollapsed, setIsDiagnosticsCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem("logos_diagnostics_collapsed");
    return saved !== null ? JSON.parse(saved) : true; // Default collapsed to maintain clean layout
  });
  const [isMetricsCollapsed, setIsMetricsCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem("logos_metrics_collapsed");
    return saved !== null ? JSON.parse(saved) : false; // Default visible for pristine status visibility
  });

  useEffect(() => {
    localStorage.setItem("logos_sidebar_collapsed", JSON.stringify(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  useEffect(() => {
    localStorage.setItem("logos_metrics_collapsed", JSON.stringify(isMetricsCollapsed));
  }, [isMetricsCollapsed]);

  useEffect(() => {
    localStorage.setItem("logos_guide_collapsed", JSON.stringify(isGuideCollapsed));
  }, [isGuideCollapsed]);

  useEffect(() => {
    localStorage.setItem("logos_diagnostics_collapsed", JSON.stringify(isDiagnosticsCollapsed));
  }, [isDiagnosticsCollapsed]);

  // Dynamic selector state variables
  const [mountedDocs, setMountedDocs] = useState<ReferenceDocument[]>([]);
  const [isMatchInDocs, setIsMatchInDocs] = useState(false);
  const [matchDetails, setMatchDetails] = useState<{ docName: string; text: string } | null>(null);

  // Browser Voice Typing Speech Recognition System
  const [speechLanguage, setSpeechLanguage] = useState<"ar-SA" | "en-US">("ar-SA");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice speech recognition is currently not supported in your browser. Please try using Chrome, Edge, or Safari.");
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const rec = new SpeechRecognition();
    recognitionRef.current = rec;
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = speechLanguage;

    rec.onstart = () => {
      setIsListening(true);
    };

    rec.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        // Clean out any trailing punctuation if needed
        setInputText(transcript);
      }
    };

    rec.onerror = (err: any) => {
      console.warn("Speech recognition error captured:", err);
      setIsListening(false);
    };

    rec.onend = () => {
      setIsListening(false);
    };

    try {
      rec.start();
    } catch (e) {
      console.error("Failed to start speech recording:", e);
      setIsListening(false);
    }
  };

  // Diagnostics and System Verification states
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagnosticReport, setDiagnosticReport] = useState<any>(null);

  const runEngineDiagnostics = async () => {
    setIsDiagnosing(true);
    setDiagnosticReport(null);
    
    // Detect frontend local timezone settings
    const clientTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    let locationName = "Locale Default";
    
    try {
      // Dynamic location fetch using trusted public IP geocoding service
      const geoRes = await fetch("https://ipapi.co/json/");
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        if (geoData.city && geoData.country_name) {
          locationName = `${geoData.city}, ${geoData.country_name}`;
        }
      }
    } catch (e) {
      console.log("Browser IP coordinates fetched locally. Falls back safely.", e);
    }

    try {
      const res = await fetch("/api/admin/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timezone: clientTimezone,
          locationName: locationName,
          quotaRpm: quotaRpm,
          currentLoad: currentLoadCount
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDiagnosticReport(data.report);
        // Refresh reference list so the newly saved diagnostic report shows up immediately in the Null Protocol Archive!
        fetchDocuments();
      } else {
        alert(data.error || "Failed to execute engine diagnostic check.");
      }
    } catch (err) {
      console.error("Diagnosis endpoint failed:", err);
      alert("Network error executing engine diagnostics.");
    } finally {
      setIsDiagnosing(false);
    }
  };

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

  // Dynamic localized clock and location geocoding tracker
  const [localLocation, setLocalLocation] = useState<string>("Detecting Regional Coordinate...");
  const [localTimezone, setLocalTimezone] = useState<string>(() => {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  });
  const [currentTime, setCurrentTime] = useState("");

  const timelineEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const detectRegionGeo = async () => {
      try {
        const res = await fetch("https://ipapi.co/json/");
        if (res.ok) {
          const data = await res.json();
          if (data.city && data.country_name) {
            setLocalLocation(`${data.city}, ${data.country_name}`);
            if (data.timezone) {
              setLocalTimezone(data.timezone);
            }
          }
        }
      } catch (e) {
        console.warn("Location detection failed, defaulting to browser parameters.", e);
        setLocalLocation("UTC World Clock");
      }
    };
    detectRegionGeo();
  }, []);

  useEffect(() => {
    const updateTime = () => {
      try {
        const str = new Date().toLocaleString("en-US", {
          timeZone: localTimezone,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false
        });
        setCurrentTime(`${str} (${localLocation})`);
      } catch (err) {
        setCurrentTime(new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC");
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [localTimezone, localLocation]);

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

  // Continuous timeline scroll with dynamic layout recalculation safety
  useEffect(() => {
    const scrollToEnd = () => {
      // Use 'auto' instead of 'smooth' so the browser can keep up with rapid text streaming
      // 'smooth' on every character chunk causes extreme jitter and locks up the viewport.
      timelineEndRef.current?.scrollIntoView({ behavior: "auto" });
    };
    scrollToEnd(); // Immediate scroll
    const timer = setTimeout(scrollToEnd, 50); // Delayed scroll
    return () => clearTimeout(timer);
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
    setCurrentLoadCount(prev => prev + 1);

    if (autoVocalize) {
      handleSynthesizeText(term, userMsg.id);
    }

    setTimeout(() => {
      setActivityLevel("analyzing");
    }, 800);

    const tempAiId = "ai-" + Date.now();

    try {
      const response = await fetch("/api/deconstruct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: term,
          mode: currentMode,
          strictNullProtocol,
          useHighThinkingModel,
          memoryDirectives,
          forceEnglish,
          isFirstQuery: messages.length === 0 // Check if this is the first interaction in the session
        })
      });

      if (!response.ok) {
        let errStr = "System error inside deconstruction pipe.";
        try {
          const result = await response.json();
          errStr = result.error || errStr;
        } catch(e) {}
        throw new Error(errStr);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Streaming not supported.");
      const decoder = new TextDecoder("utf-8");

      let streamBuffer = "";
      let engineMetadataCache: any = null;
      let matrixAnchoringCache: any = null;
      
      const aiMsg: Message = {
        id: tempAiId,
        role: "assistant",
        content: `Analyzing coordinate ${term}...`,
        timestamp: new Date().toISOString(),
        rawStream: ""
      };
      setMessages(prev => [...prev, aiMsg]);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunkStr = decoder.decode(value, { stream: true });
        const lines = chunkStr.split("\n\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
             const dataStr = line.substring(6);
             if (dataStr === "[DONE]") break;
             try {
                const data = JSON.parse(dataStr);
                if (data.error || data.isClosedMatrixFailure) {
                    throw new Error(data.error || data.rawText || "Error0004: Data not found in the source matrix.");
                }
                if (data.chunk) {
                   streamBuffer += data.chunk;
                   setMessages(prev => prev.map(m => m.id === tempAiId ? { ...m, rawStream: streamBuffer } : m));
                }
                if (data.metadata) {
                   engineMetadataCache = data.metadata.engineMetadata;
                   matrixAnchoringCache = data.metadata.matrixAnchoring;
                }
             } catch(e) {
                if (e instanceof Error && e.message.includes("Error0004")) throw e;
             }
          }
        }
      }

      // Finalize JSON Parse
      let finalData;
      try {
         let cleanJson = streamBuffer.trim();
         if (cleanJson.startsWith("```json")) cleanJson = cleanJson.substring(7);
         if (cleanJson.startsWith("```")) cleanJson = cleanJson.substring(3);
         if (cleanJson.endsWith("```")) cleanJson = cleanJson.slice(0, -3);
         cleanJson = cleanJson.trim();
         finalData = JSON.parse(cleanJson);
      } catch (parseErr) {
         console.error("JSON parse error:", parseErr, streamBuffer);
         setMessages(prev => prev.map(m => m.id === tempAiId ? {
           ...m,
           content: "Terminal Error: Data stream interrupted or format corrupted. See raw output.",
           rawStream: streamBuffer
         } : m));
         setActivityLevel("idle");
         setIsLoading(false);
         return;
      }

      // Successful analysis returned
      const node: DeconstructionNode = {
        ...finalData,
        id: "analysis-" + Date.now(),
        timestamp: new Date().toISOString(),
        input: term,
        mode: currentMode,
        engineMetadata: engineMetadataCache,
        matrixAnchoring: matrixAnchoringCache
      };

      setMessages(prev => prev.map(m => m.id === tempAiId ? {
        ...m,
        content: `Analysis of coordinate ${term} compiled.`,
        rawStream: undefined,
        deconstruction: node
      } : m));
      setActivityLevel("completed");

      if (autoVocalize) {
        const speakText = `${term} coordinate aligned. English deconstruction: ${node.desertMeaning || node.antiSpinMeaning || ""}. Root is ${node.root || ""}`;
        handleSynthesizeText(speakText, aiMsg.id);
      }

    } catch (err: any) {
      console.error("Deconstruction failed: ", err);
      // Remove the hanging placeholder message and add system error
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== tempAiId);
        return [
          ...filtered,
          {
            id: "syserr-" + Date.now(),
            role: "system",
            content: `Error: ${err.message || "Endpoint connection failed."}`,
            timestamp: new Date().toISOString()
          }
        ];
      });
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
    speech.rate = speechRate;
    speech.onend = () => setIsPlayingId(null);
    window.speechSynthesis.speak(speech);
  };

  // Pre-seed search helper
  const handlePreseedInput = (txt: string, mode: Mode) => {
    setInputText(txt);
    setCurrentMode(mode);
    setIsSettingsOpen(false);
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
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-emerald-400 font-bold tracking-[0.2em] block uppercase">
                Logos_qr
              </span>
              <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-1.5 py-0.5 rounded font-mono uppercase tracking-wider font-semibold">
                Educational Research Edition
              </span>
            </div>
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
        
        {/* Scrollable Chat Terminal / Main Layout */}
        <section 
          id="logos-scrolling-timeline" 
          className="flex flex-col gap-5 min-h-[500px] w-full lg:col-span-12"
        >
          {/* TOP PARAMETER BAR (Above Output) */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 flex flex-col md:flex-row items-center gap-6 shadow-md w-full">
            
            {/* The Neural Expressive Spheroid (Now compact) */}
            <div className="flex items-center gap-4 shrink-0">
              <div className="w-16 h-16 shrink-0">
                <ArabesqueMandala isLoading={isLoading} activityLevel={activityLevel} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-mono tracking-wider text-slate-500 uppercase">
                  Spheroid Node
                </span>
                <span className="font-sans font-semibold text-xs text-slate-300">
                  Linguistic Alignment
                </span>
              </div>
            </div>

            {/* Container for Runtime Toggles - Fill rest of space */}
            <div className="flex-1 flex flex-wrap items-center gap-x-6 gap-y-3 justify-end md:pl-6 md:border-l md:border-slate-800">
              
              {/* Matrix Filter */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-mono tracking-tight cursor-pointer" onClick={() => setStrictNullProtocol(!strictNullProtocol)}>
                  {strictNullProtocol ? "🔒 Matrix Filter" : "🌐 Spheroid Parse"}
                </span>
                <button
                  type="button"
                  onClick={() => setStrictNullProtocol(!strictNullProtocol)}
                  className="relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out bg-slate-800"
                  style={{ backgroundColor: strictNullProtocol ? '#10b981' : '#334155' }}
                >
                  <span
                    className="pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow transition duration-200 ease-in-out"
                    style={{ transform: strictNullProtocol ? 'translateX(12px)' : 'translateX(0px)' }}
                  />
                </button>
              </div>

              {/* Engine Core */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-indigo-400 font-mono tracking-tight cursor-pointer" onClick={() => setUseHighThinkingModel(!useHighThinkingModel)}>
                  {useHighThinkingModel ? "🧠 Pro Core" : "⚡ Flash Core"}
                </span>
                <button
                  type="button"
                  onClick={() => setUseHighThinkingModel(!useHighThinkingModel)}
                  className="relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out bg-slate-800"
                  style={{ backgroundColor: useHighThinkingModel ? '#6366f1' : '#334155' }}
                >
                  <span
                    className="pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow transition duration-200 ease-in-out"
                    style={{ transform: useHighThinkingModel ? 'translateX(12px)' : 'translateX(0px)' }}
                  />
                </button>
              </div>

              {/* English LTR */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-amber-550 font-mono tracking-tight cursor-pointer" onClick={() => setForceEnglish(!forceEnglish)}>
                  🇺🇸 {forceEnglish ? "English LTR" : "Symmetric AR/EN"}
                </span>
                <button
                  type="button"
                  onClick={() => setForceEnglish(!forceEnglish)}
                  className="relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out bg-slate-800"
                  style={{ backgroundColor: forceEnglish ? '#f59e0b' : '#334155' }}
                >
                  <span
                    className="pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow transition duration-200 ease-in-out"
                    style={{ transform: forceEnglish ? 'translateX(12px)' : 'translateX(0px)' }}
                  />
                </button>
              </div>

              {/* Auto Vocalizer & Speech Rate */}
              <div className="flex items-center gap-4 border border-slate-900 bg-slate-900/50 rounded-md px-2 py-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-sky-400 font-mono tracking-tight cursor-pointer" onClick={() => setAutoVocalize(!autoVocalize)}>
                    {autoVocalize ? "🗣️ Auto Voc" : "🔇 Voc Mute"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setAutoVocalize(!autoVocalize)}
                    className="relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out bg-slate-800"
                    style={{ backgroundColor: autoVocalize ? '#0ea5e9' : '#334155' }}
                  >
                    <span
                      className="pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow transition duration-200 ease-in-out"
                      style={{ transform: autoVocalize ? 'translateX(12px)' : 'translateX(0px)' }}
                    />
                  </button>
                </div>
                
                <div className="h-4 w-px bg-slate-800" />
                
                <div className="flex flex-col w-20">
                  <div className="flex justify-between text-[8px] text-slate-500 mb-0.5">
                    <span>Rate</span>
                    <span>{speechRate}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.05"
                    value={speechRate}
                    onChange={(e) => setSpeechRate(Number(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500 hover:accent-sky-400 transition"
                  />
                </div>
              </div>

              <button
                onClick={() => setIsSettingsOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-md text-[10px] text-slate-300 hover:bg-slate-800 hover:text-white transition"
              >
                <Settings className="w-3.5 h-3.5" /> Engine Settings
              </button>
            </div>
          </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4 flex-grow"
              >
                  <div className="flex-1 flex flex-col items-stretch space-y-4 pb-12">
                    {messages.filter(msg => msg.role !== "system").map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-4 rounded-lg border leading-relaxed ${
                        msg.role === "user"
                          ? "bg-slate-900/50 border-slate-800 ml-12 text-slate-100"
                          : "bg-slate-950 border-slate-800 text-slate-300"
                      }`}
                    >
                        <>
                          <div className="flex items-center justify-between border-b border-slate-900 pb-1.5 mb-2.5 text-[10px] font-mono text-slate-500">
                            <span className="uppercase tracking-wider">
                              {msg.role === "user" ? "SYSTEM_INPUT" : "DECONSTRUCTION_OUTPUT"}
                            </span>
                            <span>{msg.timestamp.substring(11, 19)}</span>
                          </div>

                          {/* Display raw textual content or streaming raw JSON */}
                          {!msg.deconstruction && (
                            <div className="dir-ltr text-left font-sans text-sm pr-2">
                              {msg.content && <p className="mb-2 whitespace-pre-wrap text-slate-300">{msg.content}</p>}
                              {msg.rawStream && (
                                <div className="mt-2 text-[10px] sm:text-xs font-mono text-emerald-500 whitespace-pre-wrap opacity-80 border-t border-emerald-900/30 pt-2 break-all leading-relaxed">
                                  {msg.rawStream}
                                  <span className="w-1.5 h-3 ml-0.5 inline-block bg-emerald-500 animate-pulse align-middle" />
                                </div>
                              )}
                            </div>
                          )}
                        </>

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

                            <div className="self-start md:self-center flex flex-wrap items-center gap-2">
                              <button
                                onClick={() => setActiveGraphDeconstruction(msg.deconstruction)}
                                className="flex items-center gap-1.5 bg-[#020617] text-sky-400 border border-sky-950 hover:border-sky-850 px-3 py-2 hover:bg-slate-900 rounded font-sans text-xs tracking-wider transition-all hover:scale-[1.01] active:scale-[0.99] shadow-sm"
                              >
                                <GitBranch className="w-3.5 h-3.5" /> D3 Map Root
                              </button>

                              <button
                                onClick={() => {
                                  if (msg.deconstruction) {
                                    const allTxt = `Root: ${msg.deconstruction.root}. Meaning: ${msg.deconstruction.desertMeaning}. Anti-spin: ${msg.deconstruction.antiSpinMeaning}`;
                                    handleSynthesizeText(allTxt, msg.id);
                                  }
                                }}
                                className="flex items-center gap-1.5 bg-[#020617] text-emerald-400 border border-emerald-950 hover:border-emerald-850 px-3 py-2 hover:bg-slate-900 rounded font-sans text-xs tracking-wider transition-all hover:scale-[1.01] active:scale-[0.99] shadow-sm"
                              >
                                {isPlayingId === msg.id ? (
                                  <>
                                    <VolumeX className="w-3.5 h-3.5" /> Stop Audio
                                  </>
                                ) : (
                                  <>
                                    <Volume2 className="w-3.5 h-3.5" /> Play Audio Engine
                                  </>
                                )}
                              </button>
                            </div>
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

                          {/* Spheroid RAG & LLM Engine Diagnostic Panel (Explicit display of relevance score and source file title) */}
                          <div className="bg-[#0b1329]/50 border border-slate-800 rounded-lg p-3.5 space-y-3 font-mono">
                            <div className="flex items-center gap-2 border-b border-slate-900 pb-2">
                              <Database className="w-4 h-4 text-cyan-400" />
                              <span className="text-[11px] uppercase font-bold text-slate-300 tracking-wider">Linguistic RAG & LLM Engine diagnostics</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-[11px]">
                              <div className="bg-slate-950 p-2.5 rounded border border-slate-900">
                                <span className="text-slate-500 block text-[9px] uppercase font-bold">RAG Relevance Score</span>
                                <div className="flex items-center gap-2 mt-1">
                                  <div className="flex-1 bg-slate-900 rounded-full h-1.5 overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full ${
                                        msg.deconstruction.matrixAnchoring?.found ? "bg-emerald-500" : "bg-indigo-500"
                                      }`}
                                      style={{ width: `${msg.deconstruction.matrixAnchoring?.found ? (msg.deconstruction.matrixAnchoring.relevanceScore || 100) : 70}%` }}
                                    />
                                  </div>
                                  <span className={`font-bold shrink-0 ${msg.deconstruction.matrixAnchoring?.found ? "text-emerald-400" : "text-slate-400"}`}>
                                    {msg.deconstruction.matrixAnchoring?.found 
                                      ? `${msg.deconstruction.matrixAnchoring.relevanceScore || 100}% [Optimal Match]`
                                      : "70% [Probabilistic General Core]"}
                                  </span>
                                </div>
                              </div>

                              <div className="bg-slate-950 p-2.5 rounded border border-slate-900">
                                <span className="text-slate-500 block text-[9px] uppercase font-bold">Source Matrix Doc Title</span>
                                <span className={`block font-bold mt-1 text-xs truncate ${msg.deconstruction.matrixAnchoring?.found ? "text-cyan-300" : "text-indigo-400"}`}>
                                  {msg.deconstruction.matrixAnchoring?.found 
                                    ? `📄 ${msg.deconstruction.matrixAnchoring.sourceFile}`
                                    : "🧠 Dynamic LLM Generative Context"}
                                </span>
                              </div>
                            </div>
                            {msg.deconstruction.matrixAnchoring?.found && msg.deconstruction.matrixAnchoring.verbatimVerse && (
                              <div className="bg-slate-950 p-2.5 rounded border border-slate-900/60 text-[10px] text-slate-400 leading-relaxed">
                                <span className="text-slate-500 block font-bold uppercase mb-1">Verbatim Anchored Verse:</span>
                                <p className="font-sans italic text-right text-slate-300" style={{ direction: "rtl" }}>
                                  "{msg.deconstruction.matrixAnchoring.verbatimVerse}"
                                </p>
                              </div>
                            )}
                          </div>

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
                              Unified Cross-Linguistic Phonetic Root Map (PIE/Hebrew/Latin):
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
        </section>


      </main>

      {/* FIXED ANCHORED INPUT TERMINAL AT BOTTOM */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-[#020617]/90 backdrop-blur-md border-t border-slate-800 py-3 px-4 shadow-[0_-15px_30px_rgba(2,6,23,0.8)]">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={executeDeconstruction} className="flex flex-col gap-2.5">
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
              {/* Voice recognition language toggle */}
              <button
                type="button"
                onClick={() => setSpeechLanguage(prev => prev === "ar-SA" ? "en-US" : "ar-SA")}
                disabled={isLoading}
                className={`flex items-center justify-center shrink-0 w-[45px] h-[48px] rounded-lg border transition-all text-xs font-mono font-bold ${
                  speechLanguage === "ar-SA" ? "bg-emerald-950/20 text-emerald-400 border-emerald-900/50" : "bg-indigo-950/20 text-indigo-400 border-indigo-900/50"
                } disabled:opacity-50`}
                title="Toggle Voice Input Language"
              >
                {speechLanguage === "ar-SA" ? "AR" : "EN"}
              </button>

              <button
                type="button"
                onClick={startListening}
                disabled={isLoading}
                className={`w-[48px] h-[48px] rounded-lg border transition-all flex items-center justify-center shrink-0 ${
                  isListening
                    ? "bg-red-950/55 border-red-500 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.4)] animate-pulse"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:text-emerald-400 hover:border-slate-700"
                }`}
                title={`Voice input: speak live in ${speechLanguage === "ar-SA" ? "Arabic" : "English"} to fill input field`}
              >
                {isListening ? (
                  <MicOff className="w-5 h-5" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </button>
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

      <AnimatePresence>
        {activeGraphDeconstruction && (
          <RootRelationshipGraph
            deconstruction={activeGraphDeconstruction}
            onClose={() => setActiveGraphDeconstruction(null)}
          />
        )}
      </AnimatePresence>

      <EngineSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        category={settingsCategory}
        setCategory={setSettingsCategory}
        runEngineDiagnostics={runEngineDiagnostics}
        isDiagnosing={isDiagnosing}
        diagnosticReport={diagnosticReport}
        setMessages={setMessages}
        quotaRpm={quotaRpm}
        setQuotaRpm={setQuotaRpm}
        currentLoadCount={currentLoadCount}
        strictNullProtocol={strictNullProtocol}
        setStrictNullProtocol={setStrictNullProtocol}
        fetchDocuments={fetchDocuments}
        activeDeconstruction={activeDeconstruction}
        messages={messages}
        setMemoryDirectives={setMemoryDirectives}
      />
    </div>
  );
}
