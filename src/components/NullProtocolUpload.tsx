import React, { useState, useEffect, useRef } from "react";
import { ReferenceDocument } from "../types";
import { Upload, Database, Eye, Trash2, ShieldAlert, ToggleLeft, ToggleRight, FileText } from "lucide-react";

interface NullProtocolUploadProps {
  strictNullProtocol: boolean;
  onToggleStrictNullProtocol: (val: boolean) => void;
  onDocumentsChange?: () => void;
}

export default function NullProtocolUpload({
  strictNullProtocol,
  onToggleStrictNullProtocol,
  onDocumentsChange
}: NullProtocolUploadProps) {
  const [documents, setDocuments] = useState<ReferenceDocument[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<ReferenceDocument | null>(null);
  const [customName, setCustomName] = useState("");
  const [customContent, setCustomContent] = useState("");
  const [customSource, setCustomSource] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load documents on boot
  const loadDocuments = async () => {
    try {
      const res = await fetch("/api/documents");
      const data = await res.json();
      if (data.documents) {
        setDocuments(data.documents);
      }
    } catch (err) {
      console.error("Null Protocol failed to download documents: ", err);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const [editedContent, setEditedContent] = useState("");

  // Sync back to parent when list changes
  const handleDocChange = () => {
    loadDocuments();
    if (onDocumentsChange) {
      onDocumentsChange();
    }
  };

  // Submit manual doc
  const handleAddManualDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim() || !customContent.trim()) {
      setErrorMsg("File name and content are required.");
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: customName,
          content: customContent,
          source: customSource || "User Text Input"
        })
      });

      const result = await res.json();
      if (res.ok) {
        setCustomName("");
        setCustomContent("");
        setCustomSource("");
        handleDocChange();
      } else {
        setErrorMsg(result.error || "Failed to mount referential source.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Endpoint error.");
    } finally {
      setIsLoading(false);
    }
  };

  // Delete/unmount reference file
  const handleUnmountDoc = async (id: string) => {
    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        if (selectedDoc?.id === id) {
          setSelectedDoc(null);
        }
        handleDocChange();
      }
    } catch (err) {
      console.error("Failed to unmount file ID: ", id);
    }
  };

  // Save edits to reference file
  const handleSaveEdit = async () => {
    if (!selectedDoc) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/documents/${selectedDoc.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editedContent })
      });
      if (res.ok) {
        const result = await res.json();
        // Update the local state
        const updatedDoc = { ...selectedDoc, content: editedContent, size: result.document.size, wordCount: result.document.wordCount };
        setSelectedDoc(updatedDoc);
        setDocuments(documents.map(d => d.id === selectedDoc.id ? updatedDoc : d));
      } else {
        const data = await res.json();
        setErrorMsg(data.error || "Failed to update document.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to sync update.");
    } finally {
      setIsLoading(false);
    }
  };

  // Process uploaded files
  const processUploadedFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result;
      if (typeof text === "string") {
        setIsLoading(true);
        try {
          const res = await fetch("/api/documents", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: file.name,
              content: text,
              source: `Local File: ${file.name}`
            })
          });
          if (res.ok) {
            handleDocChange();
          } else {
            const data = await res.json();
            setErrorMsg(data.error || "Limit reached.");
          }
        } catch (err: any) {
          setErrorMsg(err.message || "Failed to sync file.");
        } finally {
          setIsLoading(false);
        }
      }
    };
    reader.readAsText(file);
  };

  // Local File picker click handler
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processUploadedFile(e.target.files[0]);
    }
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-lg p-5 shadow-2xl">
      {/* Title block */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-emerald-400" />
          <h2 className="font-sans font-semibold text-sm text-slate-200 uppercase tracking-widest">
            The NULL Protocol (Closed Coordinate Matrix)
          </h2>
        </div>
        <span className="font-mono text-xs text-slate-400">
          Mounts: {documents.length} / 15
        </span>
      </div>

      {/* Strict Closed Matrix Toggle */}
      <div className="bg-slate-900/60 border border-slate-800 rounded p-3 mb-4 flex items-center justify-between">
        <div className="flex items-start gap-2.5 max-w-md">
          <ShieldAlert className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
          <div>
            <span className="block text-xs font-semibold text-slate-200">
              Strict Closed Coordinate Matrix Mode
            </span>
            <span className="block text-[10px] text-slate-400">
              If enabled, searches are restricted purely to mounted reference files. If input lacks active lexical entries in files, outputs verbatim: <strong className="text-red-400 font-mono">"Error0004: Data not found in the source matrix."</strong>
            </span>
          </div>
        </div>
        <button
          onClick={() => onToggleStrictNullProtocol(!strictNullProtocol)}
          className="text-slate-300 hover:text-white transition-all focus:outline-none"
        >
          {strictNullProtocol ? (
            <ToggleRight className="w-9 h-9 text-emerald-400" />
          ) : (
            <ToggleLeft className="w-9 h-9 text-slate-600" />
          )}
        </button>
      </div>

      {errorMsg && (
        <div className="p-3.5 bg-red-950/40 border border-red-500/30 rounded text-xs font-mono text-red-400 mb-4">
          {errorMsg}
        </div>
      )}

      {/* Drag & Drop Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Upload Column */}
        <div className="flex flex-col gap-3">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
              dragActive 
                ? "border-emerald-500 bg-emerald-950/20" 
                : "border-slate-800 hover:border-slate-700 bg-slate-900/10"
            }`}
          >
            <Upload className="w-6 h-6 text-slate-500 mb-2" />
            <span className="text-xs font-sans text-slate-300">
              Drag & Drop reference file here
            </span>
            <span className="text-[10px] text-slate-500 mt-1">
              Supports .txt, .md, .json etymological archives
            </span>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              className="hidden"
              accept=".txt,.md,.json,.csv"
            />
          </div>

          <form onSubmit={handleAddManualDoc} className="space-y-2.5 bg-slate-900/40 border border-slate-900 rounded p-3">
            <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Or manually write reference vector:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Codex/File name..."
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-slate-600"
              />
              <input
                type="text"
                placeholder="Database source..."
                value={customSource}
                onChange={(e) => setCustomSource(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-slate-600"
              />
            </div>
            <textarea
              placeholder="e.g. - ح-س-ب: physical entropic mechanism..."
              value={customContent}
              onChange={(e) => setCustomContent(e.target.value)}
              className="w-full h-16 bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-slate-600 font-mono"
            />
            <button
              type="submit"
              disabled={isLoading || documents.length >= 15}
              className="w-full bg-slate-850 hover:bg-slate-800 text-slate-300 text-xs px-3 py-1 rounded border border-slate-800 transition-all font-sans font-semibold"
            >
              Mount Custom Vector
            </button>
          </form>
        </div>

        {/* Mounted Lists Column */}
        <div className="flex flex-col">
          <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            Currently Mounted Reference Spheroids:
          </span>
          <div className="space-y-1.5 flex-1 max-h-[290px] overflow-y-auto pr-1">
            {documents.length === 0 ? (
              <div className="text-center py-8 border border-slate-900 rounded p-4 text-xs text-slate-600 font-mono">
                No reference documents mounted. Strictly empty matrix bounds.
              </div>
            ) : (
              documents.map(doc => (
                <div
                  key={doc.id}
                  className="bg-slate-900/40 border border-slate-900 rounded px-3 py-2 flex items-center justify-between hover:border-slate-800 transition-all"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
                    <div className="min-w-0">
                      <span className="block text-xs font-semibold text-slate-300 truncate">
                        {doc.name}
                      </span>
                      <span className="block text-[9px] text-slate-500 font-mono uppercase">
                        {doc.size} bytes • {doc.wordCount} words
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2.5">
                    <button
                      type="button"
                      onClick={async () => {
                        if (selectedDoc?.id === doc.id) {
                          setSelectedDoc(null);
                        } else {
                          try {
                            const res = await fetch(`/api/documents/${doc.id}`);
                            if (res.ok) {
                              const data = await res.json();
                              setSelectedDoc(data.document);
                              setEditedContent(data.document.content || "");
                            }
                          } catch (e) {
                            console.error("Failed to load document content", e);
                          }
                        }
                      }}
                      className="text-slate-400 hover:text-white transition"
                      title="View contents"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUnmountDoc(doc.id)}
                      className="text-slate-500 hover:text-red-400 transition"
                      title="Unmount source"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Embedded Document content viewer */}
      {selectedDoc && (
        <div className="mt-4 bg-slate-950 border border-slate-900 rounded p-3">
          <div className="flex justify-between items-center mb-2 pb-1 border-b border-slate-900">
            <span className="text-[10px] uppercase font-bold text-emerald-400 font-mono">
              Vector Code Explorer: {selectedDoc.name}
            </span>
            <div className="flex gap-2 items-center">
              {selectedDoc.id !== "doc-memory-sync" && (
                <button
                  onClick={handleSaveEdit}
                  disabled={isLoading || editedContent === selectedDoc.content}
                  className={`text-[10px] px-2 py-0.5 rounded border transition-all ${
                    editedContent !== selectedDoc.content
                      ? "bg-emerald-950/40 text-emerald-400 border-emerald-800 hover:bg-emerald-900/60"
                      : "bg-slate-900 text-slate-500 border-slate-800 cursor-not-allowed"
                  }`}
                >
                  {isLoading ? "Saving..." : "Save Changes"}
                </button>
              )}
              <button
                onClick={() => setSelectedDoc(null)}
                className="text-slate-500 hover:text-slate-300 text-[10px]"
              >
                [Hide]
              </button>
            </div>
          </div>
          <textarea 
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            readOnly={selectedDoc.id === "doc-memory-sync"}
            className="w-full text-[10px] text-slate-400 font-mono overflow-auto h-48 whitespace-pre-wrap leading-relaxed py-1 bg-transparent border-none focus:outline-none resize-y"
          />
        </div>
      )}
    </div>
  );
}
