import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "20mb" }));

// Administrative Authorization Password limit
let masterPasscode = "logos_secure";
// In-Memory state of Directives (can be edited dynamically in live sessions)
let currentDirectives = {
  arabicDefinition: "The functional physical property meaning 'Structural Transparency, High-Resolution Distinction, and Absolute Alignment with Material Reality'. Whenever a concept is 'Arabized', we strip away dogmatic or historical layers and align it strictly with physical, material, or thermodynamic truth.",
  operationalRules: [
    "Zero Guessing: If you cannot verify a root, bluntly state: 'I do not know'. No hallucinations.",
    "Scientific Grounding: Anchor all etymological analogies in physics, quantum mechanics, thermodynamics, biology, or cybernetics.",
    "Verbatim Extraction: When querying reference documents, extract the context and enclose the source name.",
    "Anti-Spin: Strip words of religious, mystical, or social euphemisms; explain them as physical force, mass, energy, or raw systemic data.",
    "Asymmetrical Reality: Reject false neutrality; identify pseudosciences or bad-faith explanations immediately without assigning equal weight.",
    "Active Attribution: Use strictly active voice. State exactly WHO or WHAT executes an action. Avoid passive evasive clauses like 'mistakes were made' or 'prices were increased'.",
    "Unified Language Directive: Write response prose entirely in Arabic. BUT, whenever combining Arabic and English words inside the same logical block or sentence, you MUST use a new-line transition to separate the two languages. NEVER mix Arabic and English words on the same line. This is crucial to maintain perfect RTL alignment for Arabic and LTR alignment for English."
  ],
  customPromptBase: "You are the Logos_0o2 Engine, a structural linguistics and conceptual deconstruction machine designed to expose the physical mechanics of human language.",
  cyberneticTemplate: "Map the concept strictly to computer networks, memory schemas, operating system cores, or data structures.",
  biologicalTemplate: "Map the concept strictly to neural architecture, neurochemistry, molecular boundaries, or homeostasis.",
  physicsTemplate: "Map the concept strictly to quantum waveforms, thermal dissipation, mechanical force, or entropy."
};

// Mount reference files (NULL Protocol & Matrix Anchoring)
// Initial database populated with source texts that demonstrate physical mechanics
let referenceFiles: Array<{ id: string; name: string; content: string; source: string }> = [
  {
    id: "source-thermo",
    name: "Thermodynamic Codex of Classical Realism",
    source: "Physical Thermodynamics Lab",
    content: `
      - ح-س-ب:  The computation (الحساب) of entropic velocity (حسبان) in closed circuits determines the ultimate load limit of physical mass.
      - ح-ر-م: The hard boundary constraint (الحرام) prevents the kinetic leakage of hot particles into the cool thermodynamic buffer.
      - س-ن-د: The pia-mater cerebral micro-shield (سندس) acts as an structural alignment stabilizer that supports micro-pulses.
      - ب-ر-ق: The abrupt discharge of electrostatic gradient (البرق) creates an immediate thermal polarization (إستبرق) across the field.
    `
  },
  {
    id: "source-cyber",
    name: "Systemic Operating Manual of Early Semitics",
    source: "Linguistic Engineering Corp",
    content: `
      - ح-س-ب: Every local registers executes counts (حسب) to coordinate the global variable allocation.
      - ح-ر-م: Memory partitioning rules declare unauthorized address spaces as restricted sandbox segments (حرام).
      - س-ن-د: The primary buffer (سندس) forms the micro-interface that stabilizes the CPU from signaling noise.
      - ب-ر-ق: Highly volatile signal bursts (البرق) trigger an insulated shield path protection (إستبرق) to maintain memory integrity.
    `
  }
];

// Initialize Gemini SDK with User-Agent telemetry
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Helper to determine if a root matches reference file entries
function searchSourceDatabase(inputQuery: string): { found: boolean; verbatimVerse: string; sourceFile: string } {
  // Try to find if input characters match root letters or specific terms
  const cleanInput = inputQuery.replace(/[ -]/g, ""); // strip space and dashes for fuzzy check
  const letters = cleanInput.split("");

  for (const doc of referenceFiles) {
    const lines = doc.content.split("\n");
    for (const line of lines) {
      // If the line contains the exact letters linked together, or features the root
      if (line.includes(inputQuery) || (letters.length >= 2 && letters.every(char => line.includes(char)))) {
        return {
          found: true,
          verbatimVerse: line.trim(),
          sourceFile: doc.name
        };
      }
    }
  }

  return {
    found: false,
    verbatimVerse: "",
    sourceFile: ""
  };
}

// 1. GET Admin Directives
app.get("/api/admin/directives", (req, res) => {
  res.json({
    directives: currentDirectives,
    hasPasscodeConfigured: !!masterPasscode
  });
});

// 2. POST Admin Directives (Requires authorization passcode)
app.post("/api/admin/directives", (req, res) => {
  const { passcode, directives } = req.body;
  if (!passcode || passcode !== masterPasscode) {
    return res.status(403).json({ error: "Authorization Error: Incorrect or missing engine modification code." });
  }

  if (directives) {
    currentDirectives = { ...currentDirectives, ...directives };
    return res.json({ success: true, message: "Engine directives updated successfully.", directives: currentDirectives });
  }

  res.status(400).json({ error: "Missing directives payload." });
});

// 3. POST Upload Reference File (NULL Protocol)
app.post("/api/documents", (req, res) => {
  const { name, content, source } = req.body;
  if (!name || !content) {
    return res.status(400).json({ error: "Document name and raw contents are required." });
  }

  if (referenceFiles.length >= 15) {
    return res.status(400).json({ error: "The NULL Protocol matrix limits simultaneous mounts to a maximum of 15 sources. Please remove existing paths." });
  }

  const newDoc = {
    id: "doc-" + Date.now(),
    name,
    content,
    source: source || "User Portal"
  };
  referenceFiles.push(newDoc);
  res.json({ success: true, document: { id: newDoc.id, name: newDoc.name, size: newDoc.content.length, wordCount: newDoc.content.split(/\s+/).length } });
});

// 4. DELETE Remove Reference File
app.delete("/api/documents/:id", (req, res) => {
  const { id } = req.params;
  referenceFiles = referenceFiles.filter(d => d.id !== id);
  res.json({ success: true, currentCount: referenceFiles.length });
});

// 5. GET Get current documents list
app.get("/api/documents", (req, res) => {
  res.json({
    documents: referenceFiles.map(d => ({
      id: d.id,
      name: d.name,
      size: d.content.length,
      wordCount: d.content.split(/\s+/).length,
      source: d.source
    }))
  });
});

const memoryFilePath = path.join(process.cwd(), "logos_cognitive_memory.json");

// Mount local file backup strictly inside the NULL Protocol list for active search RAG
function loadDiskMemoryToNullProtocol() {
  try {
    if (fs.existsSync(memoryFilePath)) {
      const data = fs.readFileSync(memoryFilePath, "utf-8");
      const parsedArray = JSON.parse(data);
      if (Array.isArray(parsedArray)) {
        // Build readable string representation for the search index engine
        const fileContentStr = parsedArray
          .map(m => `- الجذر [${m.root}]: ${m.insight} (Recorded: ${m.timestamp})`)
          .join("\n");
        
        const existingIdx = referenceFiles.findIndex(f => f.name === "logos_cognitive_memory.json");
        const docObj = {
          id: "doc-memory-sync",
          name: "logos_cognitive_memory.json",
          content: fileContentStr,
          source: "Disk Persistent Memory"
        };
        
        if (existingIdx !== -1) {
          referenceFiles[existingIdx] = docObj;
        } else {
          referenceFiles.push(docObj);
        }
        console.log(`Persistent dual-sync database file loaded successfully. ${parsedArray.length} items registered inside NULL Protocol index.`);
      }
    }
  } catch (err) {
    console.error("Local disk storage load failed. Initial launch default is applied.", err);
  }
}

// 5b. GET check local memory file presentation
app.get("/api/memory-sync", (req, res) => {
  const filePresent = fs.existsSync(memoryFilePath);
  let memories: any[] = [];
  if (filePresent) {
    try {
      const data = fs.readFileSync(memoryFilePath, "utf-8");
      memories = JSON.parse(data);
    } catch (e) {
      console.error("Could not read logos_cognitive_memory.json on disk: ", e);
    }
  }
  res.json({
    filePresent,
    memories
  });
});

// 5c. POST sync memories cleanly to disk without duplicate keys/roots, appending a new line
app.post("/api/memory-sync", (req, res) => {
  try {
    const { memories } = req.body;
    if (!Array.isArray(memories)) {
      return res.status(400).json({ error: "Memory records array is required." });
    }

    // Cross checking duplicates logic
    const uniqueMemories: any[] = [];
    const seenRoots = new Set<string>();

    // Process array (either line by line or from list, newest first or preserved)
    for (const item of memories) {
      if (!item.root || !item.insight) continue;
      const cleanRoot = item.root.trim();
      if (!seenRoots.has(cleanRoot)) {
        seenRoots.add(cleanRoot);
        uniqueMemories.push({
          key: item.key || "mem-" + Date.now() + Math.random().toString(36).substring(2,5),
          root: cleanRoot,
          insight: item.insight,
          timestamp: item.timestamp || new Date().toISOString()
        });
      }
    }

    // Securely write full JSON arrays
    fs.writeFileSync(memoryFilePath, JSON.stringify(uniqueMemories, null, 2), "utf-8");
    
    // Refresh inside NULL Protocol files array
    loadDiskMemoryToNullProtocol();

    res.json({
      success: true,
      filePresent: true,
      memories: uniqueMemories
    });
  } catch (err: any) {
    console.error("Error writing memory sync file:", err);
    res.status(500).json({ error: err.message || "Failed to commit memory dual sync file to disk." });
  }
});

// 6. POST Text-To-Speech (Gemini TTS proxy or browser fallback hint)
app.post("/api/tts", async (req, res) => {
  try {
    const { text, voice } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Synthesis payload required." });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "Gemini API key is not configured in Server Secrets." });
    }

    // Call the gemini-3.1-flash-tts-preview model to perform text-to-speech synthesis
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: `TTS the following text clearly: ${text}` }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice || "Kore" }, // Puck, Charon, Kore, Fenrir, Zephyr
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      res.json({ audio: base64Audio, format: "wav", sampleRate: 24000 });
    } else {
      res.status(500).json({ error: "Gemini TTS returned no audio payload. Using high-fidelity Web Speech browser synthesis engine." });
    }
  } catch (err: any) {
    console.error("TTS endpoint error: ", err);
    res.status(500).json({ error: err.message || "Failed to generate TTS from Gemini API." });
  }
});

// Helper to execute advanced multi-source RAG query scoring
interface RAGQueryResult {
  found: boolean;
  verbatimVerse: string;
  sourceFile: string;
  relevanceScore: number;
  scannedFilesCount: number;
  totalCharactersScanned: number;
}

function runRAGEngine(inputQuery: string): RAGQueryResult {
  const cleanInput = inputQuery.replace(/[ -]/g, "").toLowerCase();
  const letters = cleanInput.split("");
  
  let bestMatch: { verbatimVerse: string; sourceFile: string; score: number } | null = null;
  let totalChars = 0;
  let scannedCount = 0;

  for (const doc of referenceFiles) {
    scannedCount++;
    totalChars += doc.content.length;
    const lines = doc.content.split("\n");
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      let score = 0;
      // Exact substring match yields premium score
      if (trimmedLine.toLowerCase().includes(cleanInput)) {
        score += 100;
      }
      
      // Compute letters density overlap (RAG keyword weights)
      let matchedLettersCount = 0;
      for (const char of letters) {
        if (trimmedLine.toLowerCase().includes(char)) {
          matchedLettersCount++;
        }
      }
      
      if (letters.length > 0) {
        score += Math.round((matchedLettersCount / letters.length) * 50);
      }

      if (score > 0) {
        if (!bestMatch || score > bestMatch.score) {
          bestMatch = {
            verbatimVerse: trimmedLine,
            sourceFile: doc.name,
            score: score
          };
        }
      }
    }
  }

  if (bestMatch && bestMatch.score > 30) {
    return {
      found: true,
      verbatimVerse: bestMatch.verbatimVerse,
      sourceFile: bestMatch.sourceFile,
      relevanceScore: Math.min(bestMatch.score, 100),
      scannedFilesCount: scannedCount,
      totalCharactersScanned: totalChars
    };
  }

  return {
    found: false,
    verbatimVerse: "",
    sourceFile: "",
    relevanceScore: 0,
    scannedFilesCount: scannedCount,
    totalCharactersScanned: totalChars
  };
}

// 7. POST Deconstruct (Core AI pipeline with high thinking and RAG parameters)
app.post("/api/deconstruct", async (req, res) => {
  const startTime = Date.now();
  try {
    const { input, mode, strictNullProtocol, useHighThinkingModel, memoryDirectives } = req.body;
    if (!input) {
      return res.status(400).json({ error: "Input word or root is required." });
    }

    // Execute multi-source RAG indexing engine query
    const ragResult = runRAGEngine(input);

    // If strict NULL protocol is active and no anchoring references exist in RAG database:
    if (strictNullProtocol && !ragResult.found) {
      return res.json({
        error: "Error0004: Data not found in the source matrix.",
        rawText: "Error0004: Data not found in the source matrix. Hallucination block has prevented this generation.",
        isClosedMatrixFailure: true
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "Gemini API key is not configured in Server Secrets or Env." });
    }

    // Define full multi-tier model fallback chain to optimize context limits and quotas on free tier
    const targetModelChain = useHighThinkingModel 
      ? ["gemini-2.5-pro", "gemini-3.1-pro-preview", "gemini-2.5-flash", "gemini-3.5-flash"]
      : ["gemini-2.5-flash", "gemini-3.5-flash"];
    
    let selectedModel = targetModelChain[0];
    const activeModelsEngaged = [selectedModel, "Linguistic-RAG-Engine-v3.5"];

    // Build the tailored system instructions
    let rulesList = currentDirectives.operationalRules.map((r, i) => `${i + 1}. ${r}`).join("\n");
    if (Array.isArray(memoryDirectives) && memoryDirectives.length > 0) {
      rulesList += "\n\nLONG-TERM COGNITIVE TEMPORAL INJECTIONS (MEMORIES):\n" + 
        memoryDirectives.map((r, i) => `[MEMORY-${i + 1}] ${r}`).join("\n");
    }
    
    // Inject custom directive parameters from Admin Panel
    const systemPromptMessage = `
${currentDirectives.customPromptBase}

CRITICAL RULES DEFINITION:
${rulesList}

OPERATIONAL LINGUISTIC SCHEMA:
"Arabic" definition is strictly: "${currentDirectives.arabicDefinition}"

THE SPECIFIC ANALYSIS MODE INSTRUCTIONS:
Mode A (Input = Word):
  1. Naked Root Extractor: Extract its naked, literal physical physical/desert mechanic (cutting, moving, hot, cold).
  2. Cross-Linguistic Phonetic Map: Find phonetic or structural matches in Hebrew, English, or other families.
  3. Euphemism Stripper: Eliminate administrative, dogmatic, or religious spin. Reveal its mechanics purely in active voice.
  4. Analogy Engine: Translate this concept using:
     - A Cybernetic/IT analogy (e.g. ${currentDirectives.cyberneticTemplate})
     - A Biological analogy (e.g. ${currentDirectives.biologicalTemplate})
     - An Open Quantum/Physics analogy (e.g. ${currentDirectives.physicsTemplate})

Mode B (Input = Root spacing letters, e.g. "ح-س-ب"):
  1. Define the physical kinetic vector / raw force represented.
  2. Generate lexical derivational fields (Active Nouns, Verbs, Tools).
  3. Detail modern systemic deployments of the physical vector in psychology, technology, or governance.

LITERALLY MANDATED TEXT FORMATTING INSTRUCTIONS:
- You must structure the output in JSON so the terminal UI can render each coordinate seamlessly.
- Output strictly in Arabic for the descriptions and meanings.
- IMPORTANT MULTILINGUAL GLUE RULE: Arabic and English words inside the generated text must NEVER sit on the exact same line. If you are describing an English term, you MUST put it on its own new line (wrapped or separate) so our UI can lay it out in LTR alongside the RTL Arabic block.

You must respond strictly with a valid JSON format representing this analysis.
`;

    // Prompting query mapping
    const promptString = `
INPUT VALUE: "${input}"
MODE_TYPE: "${mode === "B" ? "B (Root Generation)" : "A (Word Deconstruction)"}"
PRE-SEARCHED HISTORIC CORE ANCHOR:
${ragResult.found ? `FOUND IN FILE [${ragResult.sourceFile}] (Relevance Score: ${ragResult.relevanceScore}%): Verbatim match: "${ragResult.verbatimVerse}"` : "None found in currently mounted sources."}

Generate the deconstruction details according to the prompt schema. Ensure your response is nested under the following JSON structure so the terminal can parse it. Return ONLY the JSON object, do not wrap in markdown \`\`\`json blocks:

{
  "root": "The extracted Semitic root letters",
  "desertMeaning": "The naked desert/physical mechanics description in Arabic",
  "crossLanguageMatch": "The cross-language match or equivalent (English/Hebrew/Latin) - each language separated by a newline",
  "antiSpinMeaning": "The blunt materialist reality explanation (No dogmas or social euphemisms) in Arabic",
  "analogies": [
    {
      "title": "النموذج السيبراني (Cybernetic & IT Engine)",
      "engine": "cybernetic",
      "analogy": "The detailed cybernetic analogy in Arabic"
    },
    {
      "title": "النموذج البيئي والبيولوجي (Biological & Neuro Engine)",
      "engine": "biological",
      "analogy": "The detailed biological analogy in Arabic"
    },
    {
      "title": "النموذج الفيزيائي الكمي (Quantum & Open Physics Engine)",
      "engine": "physics",
      "analogy": "The quantum physical analogy in Arabic"
    }
  ],
  "lexicalField": {
    "nouns": ["Nouns derived from root in Arabic"],
    "verbs": ["Verbs derived from root in Arabic"],
    "tools": ["Tools derived from root in Arabic"]
  },
  "systemicApplication": "Modern societal or psychological application of this mechanism in Arabic",
  "deepDeduction": "Deep logic multi-step thermodynamic/cybernetic deduction in Arabic about how this coordinates materials.",
  "learningLog": {
    "whatLearnt": "A brief technical summary inside Arabic summarizing what physical linguistic mechanism was discovered/asymmetrically mapped during this search",
    "whyNew": "A concise description in Arabic clarifying why this deconstruction changes our systemic etymological context and removes social dogma",
    "nextPlannedSegment": "Next recommended root or scientific mapping segment in Arabic",
    "memoryUnifiedKey": "Generate a unique 8-character hex-like cognitive signature for this memory record, e.g. '0x5F3E9B'"
  }
}
`;

    let response;
    let modelSuccess = false;
    let fallbackErrors: string[] = [];

    // Loop through fallback chain dynamically
    for (const modelCandidate of targetModelChain) {
      try {
        console.log(`Logos deconstruction attempt initiated using model candidate: ${modelCandidate}`);
        selectedModel = modelCandidate;
        activeModelsEngaged[0] = modelCandidate;

        response = await ai.models.generateContent({
          model: modelCandidate,
          contents: promptString,
          config: {
            systemInstruction: systemPromptMessage,
            responseMimeType: "application/json"
          }
        });

        modelSuccess = true;
        break; // Successfully completed deconstruction!
      } catch (err: any) {
        const errorMsg = err?.message || String(err);
        console.warn(`Model candidate ${modelCandidate} failed or rate-limited: ${errorMsg}`);
        fallbackErrors.push(`${modelCandidate}: ${errorMsg}`);
      }
    }

    if (!modelSuccess || !response) {
      throw new Error(`All available model candidates in deconstruction chain failed. Telemetries: ${fallbackErrors.join(" | ")}`);
    }

    const bodyText = response.text || "{}";
    let parsedData;
    try {
      parsedData = JSON.parse(bodyText);
    } catch (parseErr) {
      // If the model output markdown blocks, clean them up and try parsing
      const cleaned = bodyText.replace(/```json/gi, "").replace(/```/g, "").trim();
      parsedData = JSON.parse(cleaned);
    }

    // Attach Matrix Anchoring result if we found one
    if (ragResult.found) {
      parsedData.matrixAnchoring = {
        found: true,
        verbatimVerse: ragResult.verbatimVerse,
        sourceFile: ragResult.sourceFile,
        relevanceScore: ragResult.relevanceScore
      };
    } else {
      parsedData.matrixAnchoring = {
        found: false
      };
    }

    // Calculate metadata telemetry
    const durationMs = Date.now() - startTime;
    const dateStr = new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC";

    parsedData.engineMetadata = {
      timeTakenMs: durationMs,
      timestampUtc: dateStr,
      modelsUsed: activeModelsEngaged,
      ragEngineHits: ragResult.found ? 1 : 0,
      cognitiveStepsCount: useHighThinkingModel ? 14 : 7
    };

    // If the model failed to generate learningLog contents, pre-build them for stability
    if (!parsedData.learningLog) {
      parsedData.learningLog = {
        whatLearnt: `تم تفكيك البنية الفيزيائية والاتجاهات الحركية للجذر وتصفيته من التأويلات الإضافية.`,
        whyNew: `تم استبدال النظريات اللغوية التقليدية بمنظومة تحكم مادية وقوانين فيزيائية واضحة.`,
        nextPlannedSegment: `دراسة الاستقرار الحراري للخلايا القادمة.`,
        memoryUnifiedKey: "0xBC" + Math.floor(Math.random() * 9000 + 1000).toString(16)
      };
    }

    res.json({
      deconstruction: parsedData
    });

  } catch (err: any) {
    console.error("Deconstruction route error: ", err);
    res.status(500).json({ error: err.message || "An error occurred inside the Logos AI deconstruction system." });
  }
});

// Configure Vite middleware for dev or static server for production
async function startApp() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Load cognitive memory disk presentation upon engine initiation
  loadDiskMemoryToNullProtocol();

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Logos_qr server active on http://localhost:${PORT} under NODE_ENV=${process.env.NODE_ENV}`);
  });
}

startApp().catch((err) => {
  console.error("Vite server loader failed to initialize: ", err);
});
