import React, { useEffect, useRef, useState, useMemo } from "react";
import * as d3 from "d3";
import { motion, AnimatePresence } from "motion/react";
import { X, ZoomIn, ZoomOut, RefreshCw, Info, Activity, Layers, HelpCircle, Binary, Code, Flame } from "lucide-react";

export interface DialogueAnalogy {
  title: string;
  description: string;
  physicalMapping: string;
}

export interface DialogueDeconstruction {
  root: string;
  mode: string;
  desertMeaning: string;
  antiSpinMeaning: string;
  crossLanguageMatch: string;
  systemicApplication?: string;
  deepDeduction?: string;
  analogies: DialogueAnalogy[];
  lexicalField?: {
    nouns: string[];
    verbs: string[];
    tools: string[];
  };
}

interface RootRelationshipGraphProps {
  deconstruction: DialogueDeconstruction;
  onClose: () => void;
}

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  type: "root" | "category" | "analogy" | "detail" | "lexical";
  description: string;
  val: number;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  label?: string;
}

export default function RootRelationshipGraph({ deconstruction, onClose }: RootRelationshipGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);

  // Parse and build Graph data structure dynamically from the semantic deconstruction
  const { nodes, links } = useMemo(() => {
    const rootLabel = deconstruction.root || "[Root]";
    const rootId = "root-" + rootLabel;

    const gNodes: GraphNode[] = [
      {
        id: rootId,
        label: rootLabel,
        type: "root",
        description: `Central Semitic Core Root coordinates under materialist analysis. Dynamic interactions are resolved outward from this semantic singularity.`,
        val: 32,
      },
    ];

    const gLinks: GraphLink[] = [];

    // Helper to extract a short version for labels
    const truncate = (str: string, max = 34) => {
      if (!str) return "";
      const clean = str.replace(/[\n\r]+/g, " ");
      return clean.length > max ? clean.slice(0, max) + "..." : clean;
    };

    // Category 1: Desert Mechanical Dynamics
    const catDesertId = "cat-desert";
    gNodes.push({
      id: catDesertId,
      label: "Desert Mechanics",
      type: "category",
      description: "The literal physical, material, or outdoor thermodynamic motion of this root (e.g. cutting, moving, temperature state, friction).",
      val: 20,
    });
    gLinks.push({ source: rootId, target: catDesertId, label: "Structural Mechanics" });

    gNodes.push({
      id: "det-desert",
      label: truncate(deconstruction.desertMeaning),
      type: "detail",
      description: deconstruction.desertMeaning,
      val: 12,
    });
    gLinks.push({ source: catDesertId, target: "det-desert", label: "Literal Definition" });

    // Category 2: Blunt Materialist Reality (Anti-Spin)
    const catAntiSpinId = "cat-antispin";
    gNodes.push({
      id: catAntiSpinId,
      label: "Blunt Materialist Reality",
      type: "category",
      description: "Direct cybernetic and material explanation stripped of religious, administrative, or traditional dogmas.",
      val: 20,
    });
    gLinks.push({ source: rootId, target: catAntiSpinId, label: "Conceptual Integrity" });

    gNodes.push({
      id: "det-antispin",
      label: truncate(deconstruction.antiSpinMeaning),
      type: "detail",
      description: deconstruction.antiSpinMeaning,
      val: 12,
    });
    gLinks.push({ source: catAntiSpinId, target: "det-antispin", label: "Objective Fact" });

    // Category 3: Systemic Modern Application
    if (deconstruction.systemicApplication) {
      const catSystemicId = "cat-systemic";
      gNodes.push({
        id: catSystemicId,
        label: "Modern Application",
        type: "category",
        description: "The cybernetic or thermodynamic mapping translated into modern societal mechanisms, psychology, or structure.",
        val: 20,
      });
      gLinks.push({ source: rootId, target: catSystemicId, label: "Cybernetic Drift" });

      gNodes.push({
        id: "det-systemic",
        label: truncate(deconstruction.systemicApplication),
        type: "detail",
        description: deconstruction.systemicApplication,
        val: 12,
      });
      gLinks.push({ source: catSystemicId, target: "det-systemic", label: "Socio-Mechanics" });
    }

    // Category 4: Deep Deductions
    if (deconstruction.deepDeduction) {
      const catDeductionId = "cat-deduction";
      gNodes.push({
        id: catDeductionId,
        label: "Deep Deduction",
        type: "category",
        description: "Scientific multi-step mapping regarding how this concept coordinates physical resources or entropy.",
        val: 20,
      });
      gLinks.push({ source: rootId, target: catDeductionId, label: "Thermodynamics" });

      gNodes.push({
        id: "det-deduction",
        label: truncate(deconstruction.deepDeduction),
        type: "detail",
        description: deconstruction.deepDeduction,
        val: 12,
      });
      gLinks.push({ source: catDeductionId, target: "det-deduction", label: "State Transition" });
    }

    // Node Group: Analogies (Physiosemantic mappings to standard engines)
    if (deconstruction.analogies && deconstruction.analogies.length > 0) {
      deconstruction.analogies.forEach((analogy, idx) => {
        const analogyId = `analogy-${idx}`;
        gNodes.push({
          id: analogyId,
          label: analogy.title,
          type: "analogy",
          description: `**${analogy.title}**\n\n- DESCRIPTION: ${analogy.description}\n\n- PHYSICAL TRANSLATION: ${analogy.physicalMapping}`,
          val: 16,
        });
        gLinks.push({ source: rootId, target: analogyId, label: "Vector Analogy" });
      });
    }

    // Category 5: Lexical Derivatives
    if (
      deconstruction.lexicalField &&
      (deconstruction.lexicalField.nouns.length > 0 ||
        deconstruction.lexicalField.verbs.length > 0 ||
        deconstruction.lexicalField.tools.length > 0)
    ) {
      const catLexicalId = "cat-lexical";
      gNodes.push({
        id: catLexicalId,
        label: "Lexical Derivatives",
        type: "category",
        description: "Direct etymological nouns, verbs, and instruments derived from this central mechanical action matrix.",
        val: 20,
      });
      gLinks.push({ source: rootId, target: catLexicalId, label: "Semantic Derivatives" });

      // Add Nouns
      deconstruction.lexicalField.nouns.forEach((noun, idx) => {
        const nounId = `lex-noun-${idx}`;
        gNodes.push({
          id: nounId,
          label: `(Noun) ${noun}`,
          type: "lexical",
          description: `Derived noun: "${noun}". Materializes the primary vector action as a physical noun/concept.`,
          val: 10,
        });
        gLinks.push({ source: catLexicalId, target: nounId, label: "Noun" });
      });

      // Add Verbs
      deconstruction.lexicalField.verbs.forEach((verb, idx) => {
        const verbId = `lex-verb-${idx}`;
        gNodes.push({
          id: verbId,
          label: `(Verb) ${verb}`,
          type: "lexical",
          description: `Derived verb state: "${verb}". Defines the active, material manipulation mechanics in real-time.`,
          val: 10,
        });
        gLinks.push({ source: catLexicalId, target: verbId, label: "Verb Instance" });
      });

      // Add Tools
      deconstruction.lexicalField.tools.forEach((tool, idx) => {
        const toolId = `lex-tool-${idx}`;
        gNodes.push({
          id: toolId,
          label: `(Tool) ${tool}`,
          type: "lexical",
          description: `Derived tool instrument: "${tool}". The mechanical medium or container utilized to deliver the vector momentum.`,
          val: 10,
        });
        gLinks.push({ source: catLexicalId, target: toolId, label: "Tool Instrument" });
      });
    }

    return { nodes: gNodes, links: gLinks };
  }, [deconstruction]);

  // Handle ResizeObserver for responsive SVG sizing (Desktop-first spacing rule)
  useEffect(() => {
    if (!containerRef.current) return;

    let debounceTimer: any;
    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      
      // Debounce geometry metrics computation
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const entry = entries[0];
        const width = Math.max(400, entry.contentRect.width);
        const height = Math.max(300, entry.contentRect.height);
        setDimensions({ width, height });
      }, 100);
    });

    observer.observe(containerRef.current);
    
    // Set initial size
    const bounds = containerRef.current.getBoundingClientRect();
    setDimensions({
      width: Math.max(500, bounds.width),
      height: Math.max(400, bounds.height),
    });

    return () => {
      observer.disconnect();
      clearTimeout(debounceTimer);
    };
  }, []);

  // Update selected Node to root on launch if nothing is selected yet
  useEffect(() => {
    if (nodes.length > 0 && !selectedNode) {
      setSelectedNode(nodes[0]);
    }
  }, [nodes, selectedNode]);

  // D3 Simulation setup & mounting
  useEffect(() => {
    if (!svgRef.current || !nodes.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous instances

    const { width, height } = dimensions;

    // Create a main group containing all simulation details (for zooming/panning)
    const mainGroup = svg.append("g").attr("class", "graph-viewport");

    // Initialize D3 Zoom
    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.15, 3])
      .on("zoom", (event) => {
        mainGroup.attr("transform", event.transform);
      });

    svg.call(zoomBehavior);

    // Initial positioning to prevent centering overlaps
    nodes.forEach((node) => {
      if (node.x === undefined) node.x = width / 2 + (Math.random() - 0.5) * 100;
      if (node.y === undefined) node.y = height / 2 + (Math.random() - 0.5) * 100;
    });

    // Configure simulation forces (custom spacing and collision bounds)
    const simulation = d3.forceSimulation<GraphNode>(nodes)
      .force(
        "link",
        d3.forceLink<GraphNode, GraphLink>(links)
          .id((d) => d.id)
          .distance((d) => {
            // Root linkages span further, leaf nodes pack tightly
            if (d.source === "root-" + deconstruction.root || (d.source as GraphNode).type === "root" || (d.source as any) === "root-" + deconstruction.root) return 160;
            if ((d.source as GraphNode).type === "category") return 110;
            return 80;
          })
      )
      .force("charge", d3.forceManyBody().strength(-320))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide<GraphNode>().radius((d) => d.val + 24))
      .force("x", d3.forceX(width / 2).strength(0.08))
      .force("y", d3.forceY(height / 2).strength(0.08));

    // Custom glowing definitions filter
    const defs = svg.append("defs");
    const filter = defs.append("filter")
      .attr("id", "emerald-glow")
      .attr("x", "-20%")
      .attr("y", "-20%")
      .attr("width", "140%")
      .attr("height", "140%");

    filter.append("feGaussianBlur")
      .attr("stdDeviation", "4")
      .attr("result", "blur");

    filter.append("feComposite")
      .attr("in", "SourceGraphic")
      .attr("in2", "blur")
      .attr("operator", "over");

    // Reusable line linkages
    const linkSelection = mainGroup.append("g")
      .attr("class", "links")
      .selectAll<SVGLineElement, GraphLink>("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke", "#1e293b")
      .attr("stroke-width", 1.5)
      .attr("stroke-opacity", 0.6)
      .attr("stroke-dasharray", (d: any) => {
        const targetType = (d.target as GraphNode).type;
        return targetType === "lexical" || targetType === "detail" ? "4,4" : "none";
      });

    // Simulation nodes representation
    const nodeSelection = mainGroup.append("g")
      .attr("class", "nodes")
      .selectAll<SVGGElement, GraphNode>("g")
      .data(nodes)
      .enter()
      .append("g")
      .attr("class", "node-element-group")
      .style("cursor", "grab");

    // Node outer background/glow circle
    nodeSelection.append("circle")
      .attr("r", (d: any) => d.val)
      .attr("fill", (d: any) => {
        switch (d.type) {
          case "root":
            return "#059669"; // Emerald solid background
          case "category":
            return "#0284c7"; // Blue/cyan
          case "analogy":
            return "#d97706"; // Amber energy path
          case "lexical":
            return "#312e81"; // Indigo
          default:
            return "#1e293b"; // Slate leaf
        }
      })
      .attr("stroke", (d: any) => {
        switch (d.type) {
          case "root":
            return "#34d399"; // High neon emerald stroke
          case "category":
            return "#38bdf8";
          case "analogy":
            return "#fbbf24";
          case "lexical":
            return "#818cf8";
          default:
            return "#64748b";
        }
      })
      .attr("stroke-width", (d: any) => (d.type === "root" ? 3.5 : 2.0))
      .attr("filter", (d: any) => (d.type === "root" ? "url(#emerald-glow)" : "none"))
      .attr("class", "node-circle transition-all duration-300");

    // Visual indicators inside nodes (tiny design patterns or letters)
    nodeSelection.append("circle")
      .attr("r", (d: any) => Math.max(4, d.val - 8))
      .attr("fill", "#020617")
      .attr("opacity", 0.7);

    // Text Labels on nodes
    nodeSelection.append("text")
      .text((d: any) => d.label)
      .attr("dy", (d: any) => d.val + 16)
      .attr("text-anchor", "middle")
      .attr("fill", (d: any) => {
        if (d.type === "root") return "#34d399";
        if (d.type === "category") return "#e2e8f0";
        if (d.type === "analogy") return "#f59e0b";
        return "#94a3b8";
      })
      .attr("font-size", (d: any) => {
        if (d.type === "root") return "13px";
        if (d.type === "category") return "11px";
        return "9px";
      })
      .attr("font-family", (d: any) => (d.type === "root" || d.type === "lexical" ? "monospace" : "sans-serif"))
      .attr("font-weight", (d: any) => (d.type === "root" || d.type === "category" ? "bold" : "normal"))
      .attr("class", "select-none pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]");

    // Interactive event triggers
    nodeSelection
      .on("mouseover", (event, d: any) => {
        setHoveredNode(d);
        d3.select(event.currentTarget).select(".node-circle")
          .style("transform", "scale(1.15)")
          .attr("stroke-width", d.type === "root" ? 5 : 3.5);
      })
      .on("mouseout", (event, d: any) => {
        setHoveredNode(null);
        d3.select(event.currentTarget).select(".node-circle")
          .style("transform", "scale(1.0)")
          .attr("stroke-width", d.type === "root" ? 3.5 : 2.0);
      })
      .on("click", (event, d: any) => {
        setSelectedNode(d);
        // Direct radial highlight trigger
        nodeSelection.selectAll("circle").attr("opacity", 0.6);
        d3.select(event.currentTarget).selectAll("circle").attr("opacity", 1.0);
      });

    // Mounting standard drag constraints
    nodeSelection.call(
      d3.drag<SVGGElement, GraphNode>()
        .on("start", (event, d: any) => {
          if (!event.active) simulation.alphaTarget(0.25).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event, d: any) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d: any) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
    );

    // Update coordinates on tick
    simulation.on("tick", () => {
      linkSelection
        .attr("x1", (d: any) => d.source.x || 0)
        .attr("y1", (d: any) => d.source.y || 0)
        .attr("x2", (d: any) => d.target.x || 0)
        .attr("y2", (d: any) => d.target.y || 0);

      nodeSelection.attr("transform", (d: any) => `translate(${d.x || 0}, ${d.y || 0})`);
    });

    // Fit to viewport initially
    setTimeout(() => {
      const zoomTransform = d3.zoomIdentity
        .translate(0, 0)
        .scale(0.95);
      svg.transition().duration(600).call(zoomBehavior.transform, zoomTransform);
    }, 150);

    return () => {
      simulation.stop();
    };
  }, [nodes, links, dimensions, deconstruction.root]);

  // Command button triggers for Zoom and Reheat configuration
  const handleZoom = (direction: "in" | "out" | "reset") => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    
    if (direction === "reset") {
      const resetTransform = d3.zoomIdentity.translate(0, 0).scale(1);
      svg.transition().duration(400).call(d3.zoom().transform as any, resetTransform);
      return;
    }

    const currentZoom = d3.zoomTransform(svgRef.current);
    const newScale = direction === "in" ? currentZoom.k * 1.3 : currentZoom.k / 1.3;
    const centerTransform = d3.zoomIdentity
      .translate(dimensions.width / 2 * (1 - newScale), dimensions.height / 2 * (1 - newScale))
      .scale(newScale);

    svg.transition().duration(400).call(d3.zoom().transform as any, centerTransform);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[#020617]/98 backdrop-blur-md flex flex-col md:flex-row text-slate-100"
    >
      {/* LEFT GRAPH VISALIZER WORKSPACE */}
      <div className="flex-1 flex flex-col relative border-b md:border-b-0 md:border-r border-slate-900" ref={containerRef}>
        
        {/* Upper Dashboard header with dynamic indicators */}
        <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
          <div className="bg-slate-950/80 border border-slate-900 px-4 py-2.5 rounded-lg backdrop-blur flex items-center gap-3 shadow-2xl pointer-events-auto">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <div className="font-mono text-[10px] tracking-wide">
              <span className="text-slate-500">MAPPED MATRIX GRAPH RAG AT:</span>{" "}
              <span className="text-emerald-400 font-bold">{deconstruction.root}</span>
            </div>
          </div>

          {/* Core Controls Console */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-900 p-1 rounded-lg backdrop-blur shadow-2xl pointer-events-auto">
            <button
              onClick={() => handleZoom("in")}
              title="Zoom In"
              className="p-1.5 hover:bg-slate-900 text-slate-400 hover:text-white rounded transition"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleZoom("out")}
              title="Zoom Out"
              className="p-1.5 hover:bg-slate-900 text-slate-400 hover:text-white rounded transition"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleZoom("reset")}
              title="Recenter Camera"
              className="p-1.5 hover:bg-slate-900 text-slate-400 hover:text-white rounded transition"
            >
              <Layers className="w-4 h-4" />
            </button>
            <div className="h-4 w-px bg-slate-800 mx-1" />
            <button
              onClick={() => {
                // Direct interactive refresh event to recenter and reheat
                const svg = d3.select(svgRef.current);
                const transform = d3.zoomIdentity.translate(0, 0).scale(0.9);
                svg.transition().duration(500).call(d3.zoom().transform as any, transform);
              }}
              title="Recenter and Re-heat Layout"
              className="p-1.5 hover:bg-slate-900 text-emerald-400 hover:text-emerald-300 rounded transition"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Hover/Click visual feedback mini banner */}
        {hoveredNode && (
          <div className="absolute bottom-4 left-4 z-10 max-w-sm pointer-events-none">
            <div className="bg-slate-950/90 border border-slate-800 px-3.5 py-2.5 rounded shadow-2xl backdrop-blur text-[11px] font-mono leading-relaxed">
              <span className="text-emerald-400 uppercase font-bold text-[9px] block mb-1">
                📌 OVERFLYING VECTOR NODE: {hoveredNode.type.toUpperCase()}
              </span>
              <span className="text-slate-300 text-xs font-bold font-sans block truncate mb-1">
                {hoveredNode.label}
              </span>
              <span className="text-slate-400 font-sans line-clamp-2 leading-relaxed">
                {hoveredNode.description.replace(/\*\*/g, "")}
              </span>
            </div>
          </div>
        )}

        {/* D3 SVG rendering canvas container */}
        <div className="flex-1 w-full h-full bg-[#030712] relative overflow-hidden">
          {/* Futuristic radar grid mesh background */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />
          <svg
            ref={svgRef}
            className="w-full h-full block focus:outline-none"
            style={{ minHeight: "350px" }}
          />
        </div>
      </div>

      {/* RIGHT DIAGNOSIS INSPECTOR PANEL */}
      <div className="w-full md:w-[380px] bg-slate-950 border-t md:border-t-0 md:border-l border-slate-900 flex flex-col justify-between shadow-2xl">
        
        {/* Header Segment */}
        <div className="p-4 border-b border-slate-900 flex items-center justify-between bg-slate-900/10">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-500/10 p-1.5 rounded text-emerald-400">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                Vector Segment Inspector
              </h2>
              <span className="text-[9px] text-slate-500 block">
                THERMODYNAMIC CLASH DECONSTRUCTION
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-900 text-slate-400 hover:text-white rounded-md border border-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Inspector Body content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-[11px] leading-relaxed custom-scrollbar">
          
          <AnimatePresence mode="wait">
            {selectedNode ? (
              <motion.div
                key={selectedNode.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Selected Node Header */}
                <div className="bg-slate-900/50 p-3.5 border border-slate-900 rounded space-y-1.5">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block">
                    ACTIVE MAPPED COMPONENT:
                  </span>
                  
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold bg-[#020617] border border-slate-800 px-2.5 py-1 text-emerald-400 rounded leading-none shrink-0">
                      {selectedNode.label}
                    </span>
                    <span className="text-[9px] bg-slate-950 px-2 py-0.5 rounded border border-slate-900 tracking-wider">
                      {selectedNode.type.toUpperCase()}_NODE
                    </span>
                  </div>
                </div>

                {/* Main Node Description */}
                <div className="space-y-2">
                  <span className="text-[10px] text-indigo-400 uppercase font-bold tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" /> Core Cybernetic Physics Mapping:
                  </span>
                  <div className="bg-slate-900/40 border border-slate-900 p-3.5 rounded text-xs text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
                    {/* Convert markdown-like syntax for nicer visual structure */}
                    {selectedNode.description.split("\n\n").map((chunk, cidx) => {
                      if (chunk.startsWith("- ")) {
                        return (
                          <div key={cidx} className="pl-3.5 border-l-2 border-emerald-500/50 my-1 font-sans text-slate-300">
                            {chunk.replace("- ", "")}
                          </div>
                        );
                      }
                      if (chunk.startsWith("**") && chunk.endsWith("**")) {
                        return (
                          <h4 key={cidx} className="font-bold text-slate-200 uppercase text-xs tracking-wide">
                            {chunk.replace(/\*\*/g, "")}
                          </h4>
                        );
                      }
                      return <p key={cidx} className="mb-2 leading-relaxed text-slate-300">{chunk}</p>;
                    })}
                  </div>
                </div>

                {/* Dynamic Hint regarding interactions */}
                <div className="bg-emerald-950/20 border border-emerald-900/40 p-3 rounded font-sans text-[10.5px] text-emerald-400/80 space-y-1.5">
                  <div className="font-bold uppercase tracking-wide flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-emerald-400" /> Interaction Instruction
                  </div>
                  <p className="leading-relaxed">
                    You can click on any surrounding nodes directly in the graph workspace to focus its individual etymological definition or mechanical analogy details. Feel free to drag them to observe momentum.
                  </p>
                </div>
              </motion.div>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center text-slate-500 gap-2">
                <HelpCircle className="w-8 h-8 text-indigo-950/40 animate-pulse" />
                <p className="text-center font-sans">
                  Select any node in the relationship graph to populate technical parameters here.
                </p>
              </div>
            )}
          </AnimatePresence>

          {/* Sourced Context Overview */}
          <div className="bg-slate-900/20 p-3 border border-slate-900 rounded space-y-1.5 font-sans mt-4">
            <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-widest block">
              📊 Structural Graph Legend:
            </span>
            <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Core Root Letter Node</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-500" />
                <span>Linguistic Mechanics Cat</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Engine Path Analogy</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                <span>Derived Lexicals (Word/Tool)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info brand */}
        <div className="p-4 border-t border-slate-900 bg-slate-900/20 text-[9px] text-slate-600 font-mono text-center flex items-center justify-center gap-1.5">
          <Binary className="w-3.5 h-3.5 text-indigo-950" />
          <span>SIMULATION CALIBRATED TO COGNITIVE MODEL LEVEL ALPHA</span>
        </div>
      </div>
    </motion.div>
  );
}
